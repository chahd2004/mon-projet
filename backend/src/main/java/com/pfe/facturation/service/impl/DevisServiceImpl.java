package com.pfe.facturation.service.impl;

import com.pfe.facturation.dto.mapper.DevisMapper;
import com.pfe.facturation.dto.request.DevisRequestDTO;
import com.pfe.facturation.dto.request.LigneDevisRequestDTO;
import com.pfe.facturation.dto.response.DevisResponseDTO;
import com.pfe.facturation.entity.*;
import com.pfe.facturation.enums.StatutDevis;
import com.pfe.facturation.enums.UserRole;
import com.pfe.facturation.exception.ResourceNotFoundException;
import com.pfe.facturation.repository.*;
import com.pfe.facturation.service.DevisService;
import com.pfe.facturation.service.DocumentEmailService;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@Transactional
public class DevisServiceImpl implements DevisService {

    private final DevisRepository devisRepository;
    private final ProduitRepository produitRepository;
    private final ClientRepository clientRepository;
    private final EmetteurRepository emetteurRepository;
    private final DevisMapper devisMapper;
    private final DocumentEmailService documentEmailService;

    public DevisServiceImpl(
            DevisRepository devisRepository,
            ProduitRepository produitRepository,
            ClientRepository clientRepository,
            EmetteurRepository emetteurRepository,
            DevisMapper devisMapper,
            DocumentEmailService documentEmailService) {
        this.devisRepository = devisRepository;
        this.produitRepository = produitRepository;
        this.clientRepository = clientRepository;
        this.emetteurRepository = emetteurRepository;
        this.devisMapper = devisMapper;
        this.documentEmailService = documentEmailService;
    }

    // ===== CRUD =====

    @Override
    public DevisResponseDTO create(DevisRequestDTO dto) {
        Devis devis = devisMapper.toEntity(dto);

        if (devis.getLignes() != null) {
            devis.getLignes().forEach(ligne -> ligne.setDevis(devis));
        }

        if (dto.getTypeAcheteur() == com.pfe.facturation.enums.EntityType.CLIENT) {
            Client client = clientRepository.findById(dto.getAcheteurId())
                    .orElseThrow(() -> new ResourceNotFoundException("Client non trouve: " + dto.getAcheteurId()));
            devis.setAcheteurClient(client);
        } else {
            Emetteur acheteur = emetteurRepository.findById(dto.getAcheteurId())
                    .orElseThrow(() -> new ResourceNotFoundException("Emetteur non trouve: " + dto.getAcheteurId()));
            devis.setAcheteurEmetteur(acheteur);
        }

        Emetteur vendeur = emetteurRepository.findById(dto.getVendeurId())
                .orElseThrow(() -> new ResourceNotFoundException("Vendeur non trouve: " + dto.getVendeurId()));
        devis.setVendeur(vendeur);

        devis.remplirInfosAcheteur();
        devis.remplirInfosVendeur();

        chargerProduitsEtCalculerLignes(devis);

        devis.setStatut(StatutDevis.DRAFT);
        devis.setNumDevis(genererNumeroDevis());
        devis.calculerTotaux();

        return devisMapper.toDTO(devisRepository.save(devis));
    }

    @Override
    public DevisResponseDTO getById(Long id) {
        return devisMapper.toDTO(trouverDevis(id));
    }

    @Override
    public DevisResponseDTO getByNumDevis(String numDevis) {
        return devisRepository.findByNumDevis(numDevis)
                .map(devisMapper::toDTO)
                .orElseThrow(() -> new ResourceNotFoundException("Devis non trouve avec numero: " + numDevis));
    }

    @Override
    public List<DevisResponseDTO> getAll() {
        return devisRepository.findAll().stream()
                .map(devisMapper::toDTO)
                .collect(Collectors.toList());
    }

    @Override
    public DevisResponseDTO update(Long id, DevisRequestDTO dto) {
        Devis devis = trouverDevis(id);

        if (devis.getStatut() != StatutDevis.DRAFT) {
            throw new RuntimeException("Seul un devis en DRAFT peut etre modifie");
        }

        devis.setDateCreation(dto.getDateCreation());

        devis.setNotes(dto.getNotes());

        devis.getLignes().clear();
        for (LigneDevisRequestDTO ligneDto : dto.getLignes()) {
            LigneDevis ligne = new LigneDevis();
            ligne.setDevis(devis);
            ligne.setQuantite(ligneDto.getQuantite());
            Produit produit = new Produit();
            produit.setId(ligneDto.getProduitId());
            ligne.setProduit(produit);
            devis.getLignes().add(ligne);
        }

        chargerProduitsEtCalculerLignes(devis);
        devis.calculerTotaux();

        return devisMapper.toDTO(devisRepository.save(devis));
    }

    @Override
    public void delete(Long id) {
        Devis devis = trouverDevis(id);

        if (devis.getStatut() != StatutDevis.DRAFT) {
            throw new RuntimeException("Seul un devis en DRAFT peut etre supprime");
        }

        devisRepository.deleteById(id);
    }

    // ===== TRANSITIONS DU CYCLE DE VIE =====

    // DRAFT --> SENT
    @Override
    public DevisResponseDTO envoyer(Long id) {
        Devis devis = trouverDevis(id);

        if (devis.getStatut() != StatutDevis.DRAFT) {
            throw new RuntimeException("Seul un devis en DRAFT peut etre envoye");
        }

        devis.setStatut(StatutDevis.SENT);
        Devis saved = devisRepository.save(devis);

        // EMAIL 1 : envoyer le devis au client pour acceptation ou rejet
        String emailClient = devis.getAcheteurClient() != null
                ? devis.getAcheteurClient().getEmail()
                : devis.getAcheteurEmetteur().getEmail();

        documentEmailService.sendDevisEmail(
                emailClient,
                devis.getNomAcheteur(),
                devis.getNumDevis(),
                devis.getTotalTTC() + " TND"
        );

        return devisMapper.toDTO(saved);
    }

    // SENT --> ACCEPTED
    @Override
    public DevisResponseDTO accepter(Long id) {
        Devis devis = trouverDevis(id);

        if (devis.getStatut() != StatutDevis.SENT) {
            throw new RuntimeException("Seul un devis SENT peut etre accepte");
        }

        devis.setStatut(StatutDevis.ACCEPTED);
        Devis saved = devisRepository.save(devis);

        // NOTIFICATION EMAIL : informer le vendeur (entreprise)
        if (saved.getVendeur() != null) {
            documentEmailService.sendDevisAcceptedEmail(
                    saved.getVendeur().getEmail(),
                    saved.getVendeur().getRaisonSociale(),
                    saved.getNomAcheteur(),
                    saved.getNumDevis()
            );
        }

        return devisMapper.toDTO(saved);
    }

    // SENT --> REJECTED
    @Override
    public DevisResponseDTO rejeter(Long id, String raison) {
        Devis devis = trouverDevis(id);

        if (devis.getStatut() != StatutDevis.SENT) {
            throw new RuntimeException("Seul un devis SENT peut etre rejete");
        }

        if (raison == null || raison.isBlank()) {
            throw new RuntimeException("La raison du rejet est obligatoire");
        }

        devis.setStatut(StatutDevis.REJECTED);
        devis.setRejectionReason(raison);
        Devis saved = devisRepository.save(devis);

        // NOTIFICATION EMAIL : informer le vendeur (entreprise)
        if (saved.getVendeur() != null) {
            documentEmailService.sendDevisRejectedEmail(
                    saved.getVendeur().getEmail(),
                    saved.getVendeur().getRaisonSociale(),
                    saved.getNomAcheteur(),
                    saved.getNumDevis(),
                    raison
            );
        }

        return devisMapper.toDTO(saved);
    }

    // SENT --> EXPIRED
    @Override
    public DevisResponseDTO marquerExpire(Long id) {
        Devis devis = trouverDevis(id);

        if (devis.getStatut() != StatutDevis.SENT) {
            throw new RuntimeException("Seul un devis SENT peut etre marque expire");
        }

        devis.setStatut(StatutDevis.EXPIRED);
        return devisMapper.toDTO(devisRepository.save(devis));
    }

    // ACCEPTED --> CONVERTED
    @Override
    public DevisResponseDTO marquerConverti(Long id, String documentRef) {
        Devis devis = trouverDevis(id);

        if (devis.getStatut() != StatutDevis.ACCEPTED) {
            throw new RuntimeException("Seul un devis ACCEPTED peut etre converti");
        }

        devis.setStatut(StatutDevis.CONVERTED);
        devis.setDocumentConvertiRef(documentRef);
        return devisMapper.toDTO(devisRepository.save(devis));
    }

    // ===== RECHERCHE =====

    @Override
    public List<DevisResponseDTO> getByVendeur(Long vendeurId) {
        return devisRepository.findByVendeurId(vendeurId).stream()
                .map(devisMapper::toDTO)
                .collect(Collectors.toList());
    }

    @Override
    public List<DevisResponseDTO> getByAcheteurClient(Long clientId) {
        return devisRepository.findByAcheteurClientId(clientId).stream()
                .map(devisMapper::toDTO)
                .collect(Collectors.toList());
    }

    @Override
    public List<DevisResponseDTO> getByAcheteurEmetteur(Long emetteurId) {
        return devisRepository.findByAcheteurEmetteurId(emetteurId).stream()
                .map(devisMapper::toDTO)
                .collect(Collectors.toList());
    }

    @Override
    public List<DevisResponseDTO> getDevisByUser(User user) {
        if (user == null) return List.of();

        if (user.getRole() == UserRole.ENTREPRISE_ADMIN || user.getRole() == UserRole.ENTREPRISE_MANAGER
                || user.getRole() == UserRole.ENTREPRISE_VIEWER) {
            if (user.getEntreprise() != null) {
                return getByVendeur(user.getEntreprise().getId());
            }
        }

        return List.of();
    }

    @Override
    public long count() {
        return devisRepository.count();
    }

    // ===== METHODES PRIVEES =====

    private void chargerProduitsEtCalculerLignes(Devis devis) {
        if (devis.getLignes() == null) return;

        for (LigneDevis ligne : devis.getLignes()) {
            if (ligne.getProduit() != null && ligne.getProduit().getId() != null) {
                Produit produit = produitRepository.findById(ligne.getProduit().getId())
                        .orElseThrow(() -> new ResourceNotFoundException(
                                "Produit non trouve: " + ligne.getProduit().getId()));
                ligne.setProduit(produit);
                ligne.setPrixUnitaire(produit.getPrixUnitaire());
                ligne.calculerMontant();
            }
        }
    }

    private String genererNumeroDevis() {
        int annee = LocalDate.now().getYear();
        String prefix = "DEVIS-" + annee + "-";
        Optional<Devis> last = devisRepository
                .findTopByNumDevisStartingWithOrderByNumDevisDesc(prefix);
        int next = last.map(d -> Integer.parseInt(d.getNumDevis().split("-")[2]) + 1).orElse(1);
        return prefix + String.format("%04d", next);
    }

    private Devis trouverDevis(Long id) {
        return devisRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Devis non trouve: " + id));
    }
}