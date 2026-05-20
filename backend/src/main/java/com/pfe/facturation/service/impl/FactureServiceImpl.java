package com.pfe.facturation.service.impl;

import com.pfe.facturation.dto.mapper.FactureMapper;
import com.pfe.facturation.dto.mapper.LigneFactureMapper;
import com.pfe.facturation.dto.request.FactureRequestDTO;
import com.pfe.facturation.dto.request.LigneFactureRequestDTO;
import com.pfe.facturation.dto.response.FactureResponseDTO;
import com.pfe.facturation.entity.*;
import com.pfe.facturation.enums.StatutFacture;
import com.pfe.facturation.enums.UserRole;
import com.pfe.facturation.exception.ResourceNotFoundException;
import com.pfe.facturation.repository.*;
import com.pfe.facturation.service.AvoirService;
import com.pfe.facturation.service.FactureService;
import com.pfe.facturation.service.FactureXmlService;
import com.pfe.facturation.service.ProduitService;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@Transactional
public class FactureServiceImpl implements FactureService {

    private final FactureRepository factureRepository;
    private final ProduitRepository produitRepository;
    private final ClientRepository clientRepository;
    private final EmetteurRepository emetteurRepository;
    private final UserRepository userRepository;
    private final FactureMapper factureMapper;
    private final LigneFactureMapper ligneFactureMapper;
    private final ProduitService produitService;
    private final AvoirService avoirService;
    private final FactureXmlService factureXmlService;

    public FactureServiceImpl(
            FactureRepository factureRepository,
            ProduitRepository produitRepository,
            ClientRepository clientRepository,
            EmetteurRepository emetteurRepository,
            UserRepository userRepository,
            FactureMapper factureMapper,
            LigneFactureMapper ligneFactureMapper,
            ProduitService produitService,
            AvoirService avoirService,
            FactureXmlService factureXmlService) {
        this.factureRepository = factureRepository;
        this.produitRepository = produitRepository;
        this.clientRepository = clientRepository;
        this.emetteurRepository = emetteurRepository;
        this.userRepository = userRepository;
        this.factureMapper = factureMapper;
        this.ligneFactureMapper = ligneFactureMapper;
        this.produitService = produitService;
        this.avoirService = avoirService;
        this.factureXmlService = factureXmlService;
    }

    // ===== CRUD =====

    @Override
    public FactureResponseDTO create(FactureRequestDTO dto) {
        // verification stock avant toute creation
        verifierStockAvantFacture(dto);

        Facture facture = factureMapper.toEntity(dto);

        // lier chaque ligne a la facture parente
        if (facture.getLignes() != null) {
            facture.getLignes().forEach(ligne -> ligne.setFacture(facture));
        }

        // definir l'acheteur selon son type
        if (dto.getTypeAcheteur() == com.pfe.facturation.enums.EntityType.CLIENT) {
            Client client = clientRepository.findById(dto.getAcheteurId())
                    .orElseThrow(() -> new RuntimeException("Client non trouve"));
            facture.setAcheteurClient(client);
        } else {
            Emetteur acheteur = emetteurRepository.findById(dto.getAcheteurId())
                    .orElseThrow(() -> new RuntimeException("Emetteur acheteur non trouve"));
            facture.setAcheteurEmetteur(acheteur);
        }

        // definir le vendeur
        Emetteur vendeur = emetteurRepository.findById(dto.getVendeurId())
                .orElseThrow(() -> new RuntimeException("Emetteur vendeur non trouve"));
        facture.setVendeur(vendeur);

        // remplir les champs denormalises
        facture.remplirInfosAcheteur();
        facture.remplirInfosVendeur();

        // charger les produits complets depuis la base
        chargerProduitsDansLignes(facture);

        // toute nouvelle facture commence en DRAFT
        facture.setStatut(StatutFacture.DRAFT);

        // generation du numero avec tri par ID pour eviter les doublons
        facture.setNumFact(genererNumeroFacture());

        // conserver la reference du document source si la facture vient d'une
        // conversion
        if (dto.getSourceDocumentRef() != null) {
            facture.setSourceDocumentRef(dto.getSourceDocumentRef());
        }
        facture.calculerTotaux();

        Facture savedFacture = factureRepository.save(facture);

        // diminuer le stock apres sauvegarde
        for (LigneFacture ligne : savedFacture.getLignes()) {
            Produit produit = ligne.getProduit();
            produit.diminuerStock(ligne.getQuantite());
            produitRepository.save(produit);
        }

        return factureMapper.toDTO(savedFacture);
    }

    @Override
    public List<FactureResponseDTO> getAll() {
        return factureRepository.findAll()
                .stream()
                .map(factureMapper::toDTO)
                .collect(Collectors.toList());
    }

    @Override
    public FactureResponseDTO getById(Long id) {
        Facture facture = factureRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Facture non trouvee: " + id));
        return factureMapper.toDTO(facture);
    }

    @Override
    public FactureResponseDTO update(Long id, FactureRequestDTO dto) {
        Facture facture = factureRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Facture non trouvee: " + id));

        // seule une facture en DRAFT peut etre modifiee
        if (facture.getStatut() != StatutFacture.DRAFT) {
            throw new RuntimeException("Seule une facture en DRAFT peut etre modifiee");
        }

        facture.setDateEmission(dto.getDateEmission());
        facture.setDatePaiement(dto.getDatePaiement());
        facture.setModePaiement(dto.getModePaiement());

        facture.getLignes().clear();
        for (LigneFactureRequestDTO ligneDto : dto.getLignes()) {
            LigneFacture ligne = ligneFactureMapper.toEntity(ligneDto);
            ligne.setFacture(facture);
            facture.getLignes().add(ligne);
        }
        chargerProduitsDansLignes(facture);
        facture.calculerTotaux();

        return factureMapper.toDTO(factureRepository.save(facture));
    }

    @Override
    public void delete(Long id) {
        Facture facture = factureRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Facture non trouvee: " + id));

        // seule une facture en DRAFT peut etre supprimee
        if (facture.getStatut() != StatutFacture.DRAFT) {
            throw new RuntimeException("Seule une facture en DRAFT peut etre supprimee");
        }

        // remettre le stock avant suppression
        for (LigneFacture ligne : facture.getLignes()) {
            Produit produit = ligne.getProduit();
            if (produit != null && !produit.isStockIllimite()) {
                produit.augmenterStock(ligne.getQuantite());
                produitRepository.save(produit);
            }
        }

        factureRepository.deleteById(id);
    }

    // ===== TRANSITIONS DU CYCLE DE VIE =====

    @Override
    public FactureResponseDTO signer(Long id) {
        Facture facture = factureRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Facture non trouvee: " + id));

        if (facture.getStatut() != StatutFacture.DRAFT) {
            throw new RuntimeException("Seule une facture en DRAFT peut etre signee");
        }

        facture.setPreviousStatut(StatutFacture.DRAFT);
        facture.setStatut(StatutFacture.SIGNED);
        facture.calculerTotaux();

        String xmlContent = factureXmlService.generateXmlFromFacture(facture);
        facture.setXmlContent(xmlContent);

        return factureMapper.toDTO(factureRepository.save(facture));
    }

    @Override
    public FactureResponseDTO envoyer(Long id) {
        Facture facture = factureRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Facture non trouvee: " + id));

        if (facture.getStatut() != StatutFacture.SIGNED) {
            throw new RuntimeException("Seule une facture SIGNED peut etre envoyee");
        }

        facture.setPreviousStatut(StatutFacture.SIGNED);
        facture.setStatut(StatutFacture.SENT);
        facture.calculerTotaux();
        return factureMapper.toDTO(factureRepository.save(facture));
    }

    @Override
    public FactureResponseDTO marquerPayee(Long id) {
        Facture facture = factureRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Facture non trouvee: " + id));

        if (facture.getStatut() != StatutFacture.SENT && facture.getStatut() != StatutFacture.SIGNED) {
            throw new RuntimeException("Seule une facture SENT ou SIGNED peut etre marquee comme payee");
        }

        facture.setPreviousStatut(facture.getStatut());
        facture.setStatut(StatutFacture.PAID);
        facture.calculerTotaux();
        return factureMapper.toDTO(factureRepository.save(facture));
    }

    @Override
    public FactureResponseDTO rejeter(Long id, String raison) {
        Facture facture = factureRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Facture non trouvee: " + id));

        if (facture.getStatut() != StatutFacture.SIGNED &&
                facture.getStatut() != StatutFacture.SENT) {
            throw new RuntimeException("Le rejet est possible uniquement depuis SIGNED ou SENT");
        }

        if (raison == null || raison.isBlank()) {
            throw new RuntimeException("La raison du rejet est obligatoire");
        }

        facture.setPreviousStatut(facture.getStatut());
        facture.setStatut(StatutFacture.REJECTED);
        facture.setRejectionReason(raison);
        return factureMapper.toDTO(factureRepository.save(facture));
    }

    @Override
    public FactureResponseDTO retourEnBrouillon(Long id) {
        Facture facture = factureRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Facture non trouvee: " + id));

        if (facture.getStatut() != StatutFacture.REJECTED) {
            throw new RuntimeException("La facture n'est pas en statut REJECTED");
        }

        facture.setStatut(StatutFacture.DRAFT);
        facture.setPreviousStatut(StatutFacture.REJECTED);
        facture.setRejectionReason(null);
        facture.setXmlContent(null);

        return factureMapper.toDTO(factureRepository.save(facture));
    }

    @Override
    public FactureResponseDTO annuler(Long id) {
        Facture facture = factureRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Facture non trouvee: " + id));

        if (facture.getStatut() != StatutFacture.SIGNED &&
                facture.getStatut() != StatutFacture.SENT) {
            throw new RuntimeException("L'annulation est possible uniquement depuis SIGNED ou SENT");
        }

        for (LigneFacture ligne : facture.getLignes()) {
            Produit produit = ligne.getProduit();
            if (produit != null && !produit.isStockIllimite()) {
                produit.augmenterStock(ligne.getQuantite());
                produitRepository.save(produit);
            }
        }

        facture.setPreviousStatut(facture.getStatut());
        facture.setStatut(StatutFacture.CANCELLED);
        factureRepository.save(facture);

        avoirService.creerDepuisFacture(facture);

        return factureMapper.toDTO(facture);
    }

    // ===== STOCK =====

    @Override
    public void verifierStockAvantFacture(FactureRequestDTO dto) {
        for (LigneFactureRequestDTO ligneDto : dto.getLignes()) {
            if (!produitService.checkDisponibilite(ligneDto.getProduitId(), ligneDto.getQuantite())) {
                Produit produit = produitRepository.findById(ligneDto.getProduitId()).orElse(null);
                String nomProduit = (produit != null) ? produit.getDesignation() : "ID: " + ligneDto.getProduitId();
                throw new RuntimeException(
                        String.format("Stock insuffisant pour '%s' (quantite demandee: %d)",
                                nomProduit, ligneDto.getQuantite()));
            }
        }
    }

    // ===== RECHERCHE =====

    @Override
    public boolean isConcerned(Long factureId, User user) {
        Facture facture = factureRepository.findById(factureId).orElse(null);
        if (facture == null)
            return false;

        if (user.getRole() == UserRole.ENTREPRISE_ADMIN || user.getRole() == UserRole.ENTREPRISE_MANAGER) {
            if (user.getEntreprise() == null)
                return false;
            if (facture.getAcheteurEmetteur() != null &&
                    facture.getAcheteurEmetteur().getId().equals(user.getEntreprise().getId()))
                return true;
            if (facture.getVendeur() != null &&
                    facture.getVendeur().getId().equals(user.getEntreprise().getId()))
                return true;
        }

        if (user.getRole() == UserRole.ENTREPRISE_VIEWER) {
            if (user.getEntreprise() == null)
                return false;
            if (facture.getAcheteurEmetteur() != null &&
                    facture.getAcheteurEmetteur().getId().equals(user.getEntreprise().getId()))
                return true;
            if (facture.getVendeur() != null &&
                    facture.getVendeur().getId().equals(user.getEntreprise().getId()))
                return true;
        }

        return false;
    }

    @Override
    public List<FactureResponseDTO> getFacturesByAcheteurClient(Long clientId) {
        return factureRepository.findByAcheteurClientId(clientId)
                .stream().map(factureMapper::toDTO).collect(Collectors.toList());
    }

    @Override
    public List<FactureResponseDTO> getFacturesByAcheteurEmetteur(Long emetteurId) {
        return factureRepository.findByAcheteurEmetteurId(emetteurId)
                .stream().map(factureMapper::toDTO).collect(Collectors.toList());
    }

    @Override
    public List<FactureResponseDTO> getFacturesByVendeur(Long emetteurId) {
        return factureRepository.findByVendeurId(emetteurId)
                .stream().map(factureMapper::toDTO).collect(Collectors.toList());
    }

    @Override
    public List<FactureResponseDTO> getFacturesForCurrentUser(User user) {
        if (user == null)
            return List.of();

        if (user.getRole() == UserRole.ENTREPRISE_ADMIN || user.getRole() == UserRole.ENTREPRISE_MANAGER
                || user.getRole() == UserRole.ENTREPRISE_VIEWER) {
            if (user.getEntreprise() != null) {
                List<FactureResponseDTO> ventes = getFacturesByVendeur(user.getEntreprise().getId());
                List<FactureResponseDTO> achats = getFacturesByAcheteurEmetteur(user.getEntreprise().getId());
                ventes.addAll(achats);
                return ventes;
            }
        }

        return List.of();
    }

    // ===== XML =====

    @Override
    public FactureResponseDTO genererXml(Long id) {
        Facture facture = factureRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Facture non trouvee: " + id));

        if (facture.getStatut() != StatutFacture.SIGNED && facture.getStatut() != StatutFacture.SENT) {
            throw new RuntimeException("Le XML peut etre genere pour une facture SIGNED ou SENT");
        }

        String xmlContent = factureXmlService.generateXmlFromFacture(facture);
        facture.setXmlContent(xmlContent);
        factureRepository.save(facture);

        return factureMapper.toDTO(facture);
    }

    @Override
    public String getXml(Long id) {
        Facture facture = factureRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Facture non trouvee: " + id));

        if (facture.getXmlContent() == null || facture.getXmlContent().isBlank()) {
            throw new RuntimeException(
                    "Aucun XML genere pour cette facture. Appelez d'abord /api/factures/" + id + "/generer-xml");
        }

        return facture.getXmlContent();
    }

    // ===== METHODES PRIVEES =====

    private void chargerProduitsDansLignes(Facture facture) {
        if (facture.getLignes() == null)
            return;
        for (LigneFacture ligne : facture.getLignes()) {
            if (ligne.getProduit() != null && ligne.getProduit().getId() != null) {
                Produit produit = produitRepository.findById(ligne.getProduit().getId())
                        .orElseThrow(() -> new RuntimeException("Produit non trouve: " + ligne.getProduit().getId()));
                ligne.setProduit(produit);
            }
        }
    }

    //  Tri par ID pour eviter les doublons (tri alphabetique sur num_fact causait
    // FACT-0010 < FACT-0009)
    private String genererNumeroFacture() {
        int annee = LocalDate.now().getYear();
        String prefix = "FACT-" + annee + "-";

        Optional<Facture> last = factureRepository
                .findTopByNumFactStartingWithOrderByIdDesc(prefix);

        int next = last.map(f -> {
            String[] parts = f.getNumFact().split("-");
            return Integer.parseInt(parts[2]) + 1;
        }).orElse(1);

        return prefix + String.format("%04d", next);
    }

    @Override
    public long count() {
        return factureRepository.count();
    }
}