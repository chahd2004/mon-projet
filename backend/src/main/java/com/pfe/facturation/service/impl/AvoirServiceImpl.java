package com.pfe.facturation.service.impl;

import com.pfe.facturation.dto.mapper.AvoirMapper;
import com.pfe.facturation.dto.request.AvoirRequestDTO;
import com.pfe.facturation.dto.request.LigneAvoirRequestDTO;
import com.pfe.facturation.dto.response.AvoirResponseDTO;
import com.pfe.facturation.entity.*;
import com.pfe.facturation.enums.StatutAvoir;
import com.pfe.facturation.enums.TypeAvoir;
import com.pfe.facturation.exception.ResourceNotFoundException;
import com.pfe.facturation.repository.AvoirRepository;
import com.pfe.facturation.repository.ProduitRepository;
import com.pfe.facturation.repository.FactureRepository;
import com.pfe.facturation.service.AvoirService;
import com.pfe.facturation.service.EmailService;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@Transactional
public class AvoirServiceImpl implements AvoirService {

    private final AvoirRepository avoirRepository;
    private final ProduitRepository produitRepository;
    private final FactureRepository factureRepository;
    private final AvoirMapper avoirMapper;
    private final EmailService emailService;

    public AvoirServiceImpl(
            AvoirRepository avoirRepository,
            ProduitRepository produitRepository,
            FactureRepository factureRepository,
            AvoirMapper avoirMapper,
            EmailService emailService) {
        this.avoirRepository = avoirRepository;
        this.produitRepository = produitRepository;
        this.factureRepository = factureRepository;
        this.avoirMapper = avoirMapper;
        this.emailService = emailService;
    }

    /**
     * Cree automatiquement un avoir DRAFT depuis une facture annulee.
     * Appele par FactureServiceImpl.annuler().
     * Copie toutes les lignes de la facture : l'admin pourra ensuite
     * ajuster pour un avoir partiel via update().
     */
    @Override
    public AvoirResponseDTO creerDepuisFacture(Facture facture) {
        Avoir avoir = new Avoir();
        avoir.setNumAvoir(genererNumeroAvoir());
        avoir.setDateCreation(LocalDate.now());
        avoir.setStatut(StatutAvoir.DRAFT);

        // par defaut l'avoir est total, l'admin peut le changer en PARTIEL
        avoir.setType(TypeAvoir.TOTAL);

        // lien vers la facture source
        avoir.setFactureSource(facture);

        // copier le vendeur et l'acheteur depuis la facture
        avoir.setVendeur(facture.getVendeur());
        avoir.setAcheteurClient(facture.getAcheteurClient());
        avoir.setAcheteurEmetteur(facture.getAcheteurEmetteur());

        // copier les infos denormalisees
        avoir.setNomVendeur(facture.getNomVendeur());
        avoir.setNomAcheteur(facture.getNomAcheteur());
        avoir.setEmailAcheteur(facture.getEmailAcheteur());
        avoir.setEmailVendeur(facture.getEmailVendeur());

        // motif par defaut lie a la facture annulee
        avoir.setMotif("Annulation de la facture " + facture.getNumFact());

        // copier et grouper les lignes de la facture dans l'avoir
        java.util.Map<Long, LigneAvoir> lignesGrouped = new java.util.HashMap<>();
        for (LigneFacture ligneFacture : facture.getLignes()) {
            Produit p = ligneFacture.getProduit();
            if (p == null) continue;
            
            LigneAvoir extant = lignesGrouped.get(p.getId());
            if (extant != null) {
                extant.setQuantite(extant.getQuantite() + ligneFacture.getQuantite());
                extant.calculerMontant();
            } else {
                LigneAvoir newLigne = new LigneAvoir();
                newLigne.setAvoir(avoir);
                newLigne.setProduit(p);
                newLigne.setQuantite(ligneFacture.getQuantite());
                newLigne.setPrixUnitaire(p.getPrixUnitaire());
                newLigne.calculerMontant();
                lignesGrouped.put(p.getId(), newLigne);
            }
        }
        avoir.setLignes(new ArrayList<>(lignesGrouped.values()));
        avoir.calculerTotaux();

        return avoirMapper.toDTO(avoirRepository.save(avoir));
    }

    @Override
    public AvoirResponseDTO create(AvoirRequestDTO dto) {
        Facture facture = factureRepository.findById(dto.getFactureSourceId())
                .orElseThrow(() -> new ResourceNotFoundException("Facture non trouvee: " + dto.getFactureSourceId()));

        Avoir avoir = new Avoir();
        avoir.setNumAvoir(genererNumeroAvoir());
        avoir.setDateCreation(LocalDate.now());
        avoir.setStatut(StatutAvoir.DRAFT);
        avoir.setType(dto.getType());
        avoir.setFactureSource(facture);
        avoir.setVendeur(facture.getVendeur());
        avoir.setAcheteurClient(facture.getAcheteurClient());
        avoir.setAcheteurEmetteur(facture.getAcheteurEmetteur());
        avoir.setNomVendeur(facture.getNomVendeur());
        avoir.setNomAcheteur(facture.getNomAcheteur());
        avoir.setEmailAcheteur(facture.getEmailAcheteur());
        avoir.setEmailVendeur(facture.getEmailVendeur());
        avoir.setMotif(dto.getMotif());

        List<LigneAvoir> lignes = new ArrayList<>();
        for (LigneAvoirRequestDTO ldto : dto.getLignes()) {
            Produit p = produitRepository.findById(ldto.getProduitId())
                    .orElseThrow(() -> new ResourceNotFoundException("Produit non trouve: " + ldto.getProduitId()));
            LigneAvoir line = new LigneAvoir();
            line.setAvoir(avoir);
            line.setProduit(p);
            line.setQuantite(ldto.getQuantite());
            line.setPrixUnitaire(p.getPrixUnitaire());
            line.calculerMontant();
            lignes.add(line);
        }
        avoir.setLignes(lignes);
        avoir.calculerTotaux();

        return avoirMapper.toDTO(avoirRepository.save(avoir));
    }

    @Override
    public AvoirResponseDTO createFromCancelledFacture(Long factureId) {
        Facture facture = factureRepository.findById(factureId)
                .orElseThrow(() -> new ResourceNotFoundException("Facture non trouvee: " + factureId));
        return creerDepuisFacture(facture);
    }

    @Override
    public void delete(Long id) {
        Avoir avoir = trouverAvoir(id);
        if (avoir.getStatut() != StatutAvoir.DRAFT) {
            throw new RuntimeException("Seul un avoir en DRAFT peut etre supprime");
        }
        avoirRepository.delete(avoir);
    }

    @Override
    public java.util.Map<String, Object> getStatistiques(User user) {
        List<Avoir> allAvoirs;
        if (user.getRole() == com.pfe.facturation.enums.UserRole.SUPER_ADMIN) {
            allAvoirs = avoirRepository.findAll();
        } else if ((user.getRole() == com.pfe.facturation.enums.UserRole.ENTREPRISE_ADMIN ||
                    user.getRole() == com.pfe.facturation.enums.UserRole.ENTREPRISE_MANAGER ||
                    user.getRole() == com.pfe.facturation.enums.UserRole.ENTREPRISE_VIEWER) && user.getEntreprise() != null) {
            allAvoirs = avoirRepository.findByVendeurId(user.getEntreprise().getId());
        } else {
            allAvoirs = new ArrayList<>();
        }

        java.util.Map<String, Object> stats = new java.util.HashMap<>();
        stats.put("totalAvoirs", allAvoirs.size());
        stats.put("totalAmount", allAvoirs.stream()
                .map(f -> f.getTotalTTC() != null ? f.getTotalTTC() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add));

        java.util.Map<StatutAvoir, Long> byStatus = allAvoirs.stream()
                .collect(Collectors.groupingBy(Avoir::getStatut, Collectors.counting()));
        stats.put("byStatus", byStatus);

        java.util.Map<TypeAvoir, Long> byType = allAvoirs.stream()
                .collect(Collectors.groupingBy(Avoir::getType, Collectors.counting()));
        stats.put("byType", byType);

        return stats;
    }


    // DRAFT --> VALIDATED
    @Override
    public AvoirResponseDTO valider(Long id) {
        Avoir avoir = trouverAvoir(id);

        if (avoir.getStatut() != StatutAvoir.DRAFT) {
            throw new RuntimeException("Seul un avoir en DRAFT peut etre valide");
        }

        avoir.setStatut(StatutAvoir.VALIDATED);
        return avoirMapper.toDTO(avoirRepository.save(avoir));
    }

    // VALIDATED --> SENT
    @Override
    public AvoirResponseDTO envoyer(Long id) {
        Avoir avoir = trouverAvoir(id);

        if (avoir.getStatut() != StatutAvoir.VALIDATED) {
            throw new RuntimeException("Seul un avoir VALIDATED peut etre envoye");
        }

        avoir.setStatut(StatutAvoir.SENT);
        Avoir saved = avoirRepository.save(avoir);
        
        // Envoyer l'email au client
        if (saved.getEmailAcheteur() != null) {
            emailService.sendAvoirEmail(
                    saved.getEmailAcheteur(),
                    saved.getNumAvoir(),
                    saved.getFactureSource().getNumFact(),
                    saved.getTotalTTC().toString(),
                    saved.getType().name(),
                    saved.getNomVendeur()
            );
        }
        
        return avoirMapper.toDTO(saved);
    }

    // SENT --> APPLIED
    @Override
    public AvoirResponseDTO appliquer(Long id) {
        Avoir avoir = trouverAvoir(id);

        if (avoir.getStatut() != StatutAvoir.SENT) {
            throw new RuntimeException("Seul un avoir SENT peut etre applique");
        }

        avoir.setStatut(StatutAvoir.APPLIED);
        return avoirMapper.toDTO(avoirRepository.save(avoir));
    }

    @Override
    public AvoirResponseDTO getById(Long id) {
        return avoirMapper.toDTO(trouverAvoir(id));
    }

    @Override
    public List<AvoirResponseDTO> getAll() {
        return avoirRepository.findAll().stream()
                .map(avoirMapper::toDTO)
                .collect(Collectors.toList());
    }

    @Override
    public List<AvoirResponseDTO> getByFacture(Long factureId) {
        return avoirRepository.findByFactureSourceId(factureId).stream()
                .map(avoirMapper::toDTO)
                .collect(Collectors.toList());
    }

    @Override
    public List<AvoirResponseDTO> getByVendeur(Long vendeurId) {
        return avoirRepository.findByVendeurId(vendeurId).stream()
                .map(avoirMapper::toDTO)
                .collect(Collectors.toList());
    }

    /**
     * Modification d'un avoir uniquement en DRAFT.
     * Permet a l'admin d'ajuster les lignes pour un avoir partiel :
     * supprimer des lignes ou reduire les quantites.
     */
    @Override
    public AvoirResponseDTO update(Long id, AvoirRequestDTO dto) {
        Avoir avoir = trouverAvoir(id);

        if (avoir.getStatut() != StatutAvoir.DRAFT) {
            throw new RuntimeException("Seul un avoir en DRAFT peut etre modifie");
        }

        avoir.setMotif(dto.getMotif());

        // grouper les lignes par produitId pour éviter les doublons
        java.util.Map<Long, Integer> qteByProduit = new java.util.HashMap<>();
        for (LigneAvoirRequestDTO ldto : dto.getLignes()) {
            qteByProduit.put(ldto.getProduitId(), 
                qteByProduit.getOrDefault(ldto.getProduitId(), 0) + ldto.getQuantite());
        }

        // remplacer les lignes par celles groupées
        avoir.getLignes().clear();
        for (java.util.Map.Entry<Long, Integer> entry : qteByProduit.entrySet()) {
            Produit produit = produitRepository.findById(entry.getKey())
                    .orElseThrow(() -> new ResourceNotFoundException(
                            "Produit non trouve: " + entry.getKey()));

            LigneAvoir ligne = new LigneAvoir();
            ligne.setAvoir(avoir);
            ligne.setProduit(produit);
            ligne.setQuantite(entry.getValue());
            ligne.setPrixUnitaire(produit.getPrixUnitaire());
            ligne.calculerMontant();
            avoir.getLignes().add(ligne);
        }

        avoir.calculerTotaux();

        // ✅ Règle métier automatique : Détermine le TYPE selon le montant
        // Si montant avoir == montant facture d'origine -> TOTAL
        // Si montant avoir < montant facture d'origine -> PARTIEL
        BigDecimal totalFacture = avoir.getFactureSource().getTotalTTC();
        if (avoir.getTotalTTC().compareTo(totalFacture) >= 0) {
            avoir.setType(TypeAvoir.TOTAL);
        } else {
            avoir.setType(TypeAvoir.PARTIEL);
        }

        return avoirMapper.toDTO(avoirRepository.save(avoir));
    }

    // ===== METHODES PRIVEES =====

    private Avoir trouverAvoir(Long id) {
        return avoirRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Avoir non trouve: " + id));
    }

    // genere un numero sequentiel : AV-2024-0001
    private String genererNumeroAvoir() {
        int annee = LocalDate.now().getYear();
        String prefix = "AV-" + annee + "-";
        Optional<Avoir> last = avoirRepository
                .findTopByNumAvoirStartingWithOrderByNumAvoirDesc(prefix);
        int next = last.map(a -> Integer.parseInt(a.getNumAvoir().split("-")[2]) + 1).orElse(1);
        return prefix + String.format("%04d", next);
    }
}