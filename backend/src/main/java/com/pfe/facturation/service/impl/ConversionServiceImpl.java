package com.pfe.facturation.service.impl;

import com.pfe.facturation.dto.mapper.BonCommandeMapper;
import com.pfe.facturation.dto.mapper.BonLivraisonMapper;
import com.pfe.facturation.dto.mapper.CommandeMapper;
import com.pfe.facturation.dto.request.*;
import com.pfe.facturation.dto.response.*;
import com.pfe.facturation.entity.*;
import com.pfe.facturation.enums.StatutBonCommande;
import com.pfe.facturation.enums.StatutBonLivraison;
import com.pfe.facturation.enums.StatutCommande;
import com.pfe.facturation.enums.StatutDevis;
import com.pfe.facturation.enums.UserRole;
import com.pfe.facturation.exception.ResourceNotFoundException;
import com.pfe.facturation.repository.*;
import com.pfe.facturation.service.*;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class ConversionServiceImpl implements ConversionService {

    private final DevisRepository devisRepository;
    private final BonCommandeRepository bonCommandeRepository;
    private final CommandeRepository commandeRepository;
    private final BonLivraisonRepository bonLivraisonRepository;

    private final DevisService devisService;
    private final BonCommandeService bonCommandeService;
    private final CommandeService commandeService;
    private final BonLivraisonService bonLivraisonService;
    private final FactureService factureService;

    private final BonCommandeMapper bonCommandeMapper;
    private final CommandeMapper commandeMapper;
    private final BonLivraisonMapper bonLivraisonMapper;

    public ConversionServiceImpl(
            DevisRepository devisRepository,
            BonCommandeRepository bonCommandeRepository,
            CommandeRepository commandeRepository,
            BonLivraisonRepository bonLivraisonRepository,
            DevisService devisService,
            BonCommandeService bonCommandeService,
            CommandeService commandeService,
            BonLivraisonService bonLivraisonService,
            FactureService factureService,
            BonCommandeMapper bonCommandeMapper,
            CommandeMapper commandeMapper,
            BonLivraisonMapper bonLivraisonMapper) {
        this.devisRepository = devisRepository;
        this.bonCommandeRepository = bonCommandeRepository;
        this.commandeRepository = commandeRepository;
        this.bonLivraisonRepository = bonLivraisonRepository;
        this.devisService = devisService;
        this.bonCommandeService = bonCommandeService;
        this.commandeService = commandeService;
        this.bonLivraisonService = bonLivraisonService;
        this.factureService = factureService;
        this.bonCommandeMapper = bonCommandeMapper;
        this.commandeMapper = commandeMapper;
        this.bonLivraisonMapper = bonLivraisonMapper;
    }

    // ===== FLUX 2 : Devis --> Facture =====

    @Override
    public FactureResponseDTO devisVersFacture(Long devisId, ConversionRequestDTO dto) {
        Devis devis = trouverDevis(devisId);

        // le devis doit etre ACCEPTED pour etre converti
        if (devis.getStatut() != StatutDevis.ACCEPTED) {
            throw new RuntimeException(
                    "Seul un devis ACCEPTED peut etre converti en facture");
        }

        validerDonneesFacture(dto);

        // construire le DTO de facture depuis le devis
        FactureRequestDTO factureDto = construireFactureDepuisDevis(devis, dto);

        // creer la facture
        FactureResponseDTO facture = factureService.create(factureDto);

        // marquer le devis comme converti avec la reference de la facture
        devisService.marquerConverti(devisId, facture.getNumFact());

        return facture;
    }

    // ===== FLUX 3 ETAPE 1 : Devis --> Bon de Commande =====

    @Override
    public BonCommandeResponseDTO devisVersBonCommande(
            Long devisId, ConversionRequestDTO dto) {

        Devis devis = trouverDevis(devisId);

        if (devis.getStatut() != StatutDevis.ACCEPTED) {
            throw new RuntimeException(
                    "Seul un devis ACCEPTED peut etre converti en bon de commande");
        }

        // creer un nouveau BonCommande et le preparer depuis le devis
        // on n'utilise pas le mapper ici car les lignes sont copiees directement
        BonCommande bc = new BonCommande();
        bc = preparerBonCommande(bc, devis, dto);

        // lier chaque ligne au bon de commande
        if (bc.getLignes() != null) {
            BonCommande finalBc = bc;
            bc.getLignes().forEach(ligne -> ligne.setBonCommande(finalBc));
        }

        BonCommande savedBc = bonCommandeRepository.save(bc);
        BonCommandeResponseDTO bcResponse = bonCommandeMapper.toDTO(savedBc);

        // marquer le devis comme converti avec la reference du BC
        devisService.marquerConverti(devisId, savedBc.getNumBonCommande());

        return bcResponse;
    }

    // ===== FLUX 3 ETAPE 2 : Bon de Commande --> Commande =====

    @Override
    public CommandeResponseDTO bonCommandeVersCommande(
            Long bonCommandeId, ConversionRequestDTO dto) {

        BonCommande bc = trouverBonCommande(bonCommandeId);

        if (bc.getStatut() != StatutBonCommande.CONFIRMED) {
            throw new RuntimeException(
                    "Seul un bon de commande CONFIRMED peut etre converti en commande");
        }

        // construire la commande depuis le bon de commande
        Commande commande = construireCommandeDepuisBonCommande(bc, dto);
        Commande savedCommande = commandeRepository.save(commande);

        CommandeResponseDTO commandeResponse = commandeMapper.toDTO(savedCommande);

        // marquer le bon de commande comme converti
        bonCommandeService.marquerConverti(bonCommandeId, savedCommande.getNumCommande());

        return commandeResponse;
    }

    // ===== FLUX 3 ETAPE 3a : Commande --> Bon de Livraison =====

    @Override
    public BonLivraisonResponseDTO commandeVersBonLivraison(
            Long commandeId, ConversionRequestDTO dto) {

        Commande commande = trouverCommande(commandeId);

        if (commande.getStatut() != StatutCommande.IN_PROGRESS) {
            throw new RuntimeException(
                    "Seule une commande IN_PROGRESS peut etre convertie en bon de livraison");
        }

        // construire le bon de livraison depuis la commande
        BonLivraison bl = construireBonLivraisonDepuisCommande(commande, dto);
        BonLivraison savedBl = bonLivraisonRepository.save(bl);

        BonLivraisonResponseDTO blResponse = bonLivraisonMapper.toDTO(savedBl);

        // on ne cloture plus la commande ici, le cycle de vie du BL la mettra a jour
        // commandeService.cloturer(commandeId, savedBl.getNumBonLivraison());

        return blResponse;
    }

    // ===== FLUX 3 ETAPE 3b : Commande --> Facture directe (sans BL) =====

    @Override
    public FactureResponseDTO commandeVersFacture(
            Long commandeId, ConversionRequestDTO dto) {

        Commande commande = trouverCommande(commandeId);

        if (commande.getStatut() != StatutCommande.DELIVERED) {
            throw new RuntimeException(
                    "Seule une commande DELIVERED peut etre convertie en facture");
        }

        validerDonneesFacture(dto);

        // construire la facture depuis la commande
        FactureRequestDTO factureDto = construireFactureDepuisCommande(commande, dto);
        FactureResponseDTO facture = factureService.create(factureDto);

        // marquer la commande comme cloturee
        commandeService.cloturer(commandeId, facture.getNumFact());

        return facture;
    }

    // ===== FLUX 3 ETAPE 4 : Bon de Livraison --> Facture =====

    @Override
    public FactureResponseDTO bonLivraisonVersFacture(
            Long bonLivraisonId, ConversionRequestDTO dto) {

        BonLivraison bl = trouverBonLivraison(bonLivraisonId);

        // le bon de livraison doit etre SIGNED_CLIENT pour generer la facture
        if (bl.getStatut() != StatutBonLivraison.SIGNED_CLIENT &&
                bl.getStatut() != StatutBonLivraison.CLOSED) {
            throw new RuntimeException(
                    "Seul un bon de livraison SIGNED_CLIENT peut etre converti en facture");
        }

        // si SIGNED_CLIENT, on cloture d'abord automatiquement
        if (bl.getStatut() == StatutBonLivraison.SIGNED_CLIENT) {
            bl.setStatut(StatutBonLivraison.CLOSED);
            bonLivraisonRepository.save(bl);
        }

        validerDonneesFacture(dto);

        // construire la facture depuis le bon de livraison
        FactureRequestDTO factureDto = construireFactureDepuisBonLivraison(bl, dto);
        FactureResponseDTO facture = factureService.create(factureDto);

        // lier la facture au bon de livraison
        bonLivraisonService.cloturer(bonLivraisonId, facture.getNumFact());

        return facture;
    }

    // ===== METHODES DE CONSTRUCTION =====

    /**
     * Construit un FactureRequestDTO depuis un Devis.
     * Copie les lignes, l'acheteur, le vendeur et les infos de base.
     */
    private FactureRequestDTO construireFactureDepuisDevis(
            Devis devis, ConversionRequestDTO dto) {

        FactureRequestDTO factureDto = new FactureRequestDTO();
        factureDto.setDateEmission(dto.getDateDocument());
        factureDto.setDatePaiement(dto.getDatePaiement());
        factureDto.setModePaiement(dto.getModePaiement());

        // copier l'acheteur depuis le devis
        if (devis.isAcheteurClient()) {
            factureDto.setAcheteurId(devis.getAcheteurClient().getId());
            factureDto.setTypeAcheteur(com.pfe.facturation.enums.EntityType.CLIENT);
        } else {
            factureDto.setAcheteurId(devis.getAcheteurEmetteur().getId());
            factureDto.setTypeAcheteur(com.pfe.facturation.enums.EntityType.EMETTEUR);
        }

        factureDto.setVendeurId(devis.getVendeur().getId());

        // reference du devis source pour la tracabilite
        factureDto.setSourceDocumentRef(devis.getNumDevis());

        // copier les lignes depuis le devis
        factureDto.setLignes(copierLignesDevisVersFacture(devis.getLignes()));

        return factureDto;
    }

    /**
     * Construit un FactureRequestDTO depuis une Commande.
     * Copie les lignes, l'acheteur, le vendeur et les infos de base.
     */
    private FactureRequestDTO construireFactureDepuisCommande(
            Commande commande, ConversionRequestDTO dto) {

        FactureRequestDTO factureDto = new FactureRequestDTO();
        factureDto.setDateEmission(dto.getDateDocument());
        factureDto.setDatePaiement(dto.getDatePaiement());
        factureDto.setModePaiement(dto.getModePaiement());

        // copier l'acheteur depuis la commande
        if (commande.isAcheteurClient()) {
            factureDto.setAcheteurId(commande.getAcheteurClient().getId());
            factureDto.setTypeAcheteur(com.pfe.facturation.enums.EntityType.CLIENT);
        } else {
            factureDto.setAcheteurId(commande.getAcheteurEmetteur().getId());
            factureDto.setTypeAcheteur(com.pfe.facturation.enums.EntityType.EMETTEUR);
        }

        factureDto.setVendeurId(commande.getVendeur().getId());
        factureDto.setSourceDocumentRef(commande.getNumCommande());

        // copier les lignes depuis la commande
        factureDto.setLignes(copierLignesCommandeVersFacture(commande.getLignes()));

        return factureDto;
    }

    /**
     * Construit un FactureRequestDTO depuis un Bon de Livraison.
     * Le bon de livraison n'a pas de prix, on recupere les prix depuis les produits.
     */
    private FactureRequestDTO construireFactureDepuisBonLivraison(
            BonLivraison bl, ConversionRequestDTO dto) {

        FactureRequestDTO factureDto = new FactureRequestDTO();
        factureDto.setDateEmission(dto.getDateDocument());
        factureDto.setDatePaiement(dto.getDatePaiement());
        factureDto.setModePaiement(dto.getModePaiement());

        // copier l'acheteur depuis le bon de livraison
        if (bl.isAcheteurClient()) {
            factureDto.setAcheteurId(bl.getAcheteurClient().getId());
            factureDto.setTypeAcheteur(com.pfe.facturation.enums.EntityType.CLIENT);
        } else {
            factureDto.setAcheteurId(bl.getAcheteurEmetteur().getId());
            factureDto.setTypeAcheteur(com.pfe.facturation.enums.EntityType.EMETTEUR);
        }

        factureDto.setVendeurId(bl.getVendeur().getId());
        factureDto.setSourceDocumentRef(bl.getNumBonLivraison());

        // copier les lignes depuis le bon de livraison
        // les prix seront recuperes depuis les produits par FactureService
        factureDto.setLignes(copierLignesBonLivraisonVersFacture(bl.getLignes()));

        return factureDto;
    }

    /**
     * Prepare un BonCommande depuis un Devis.
     * Copie les lignes, l'acheteur, le vendeur et la reference du devis.
     */
    private BonCommande preparerBonCommande(
            BonCommande bc, Devis devis, ConversionRequestDTO dto) {

        bc.setDateCreation(dto.getDateDocument());

        // copier l'acheteur depuis le devis
        if (devis.isAcheteurClient()) {
            bc.setAcheteurClient(devis.getAcheteurClient());
        } else {
            bc.setAcheteurEmetteur(devis.getAcheteurEmetteur());
        }

        bc.setVendeur(devis.getVendeur());


        // conserver la reference du devis pour la tracabilite
        bc.setDevisSourceRef(devis.getNumDevis());

        bc.remplirInfosAcheteur();
        bc.remplirInfosVendeur();

        // copier les lignes depuis le devis
        List<LigneBonCommande> lignes = devis.getLignes().stream()
                .map(ligneDevis -> {
                    LigneBonCommande ligne = new LigneBonCommande();
                    ligne.setBonCommande(bc);
                    ligne.setProduit(ligneDevis.getProduit());
                    ligne.setQuantite(ligneDevis.getQuantite());
                    ligne.setPrixUnitaire(ligneDevis.getPrixUnitaire());
                    ligne.calculerMontant();
                    return ligne;
                })
                .collect(Collectors.toList());

        bc.setLignes(lignes);
        bc.setStatut(com.pfe.facturation.enums.StatutBonCommande.DRAFT);

        // generer le numero via une methode utilitaire du service
        // le numero sera genere dans le repository save
        bc.setNumBonCommande(genererNumeroBonCommande());
        bc.calculerTotaux();

        return bc;
    }

    /**
     * Construit une Commande depuis un Bon de Commande.
     * Copie les lignes, l'acheteur, le vendeur et la reference du BC.
     */
    private Commande construireCommandeDepuisBonCommande(
            BonCommande bc, ConversionRequestDTO dto) {

        Commande commande = new Commande();
        commande.setDateCreation(dto.getDateDocument());

        // copier l'acheteur depuis le bon de commande
        if (bc.isAcheteurClient()) {
            commande.setAcheteurClient(bc.getAcheteurClient());
        } else {
            commande.setAcheteurEmetteur(bc.getAcheteurEmetteur());
        }

        commande.setVendeur(bc.getVendeur());
        commande.setModePaiement(bc.getModePaiement());

        // conserver la reference du BC pour la tracabilite
        commande.setSourceDocumentRef(bc.getNumBonCommande());

        commande.remplirInfosAcheteur();
        commande.remplirInfosVendeur();

        // copier les lignes depuis le bon de commande
        List<LigneCommande> lignes = bc.getLignes().stream()
                .map(ligneBc -> {
                    LigneCommande ligne = new LigneCommande();
                    ligne.setCommande(commande);
                    ligne.setProduit(ligneBc.getProduit());
                    ligne.setQuantite(ligneBc.getQuantite());
                    ligne.setPrixUnitaire(ligneBc.getPrixUnitaire());
                    ligne.calculerMontant();
                    return ligne;
                })
                .collect(Collectors.toList());

        commande.setLignes(lignes);
        commande.setStatut(StatutCommande.DRAFT);
        commande.setNumCommande(genererNumeroCommande());
        commande.calculerTotaux();

        return commande;
    }

    /**
     * Construit un BonLivraison depuis une Commande.
     * Copie les lignes (sans prix) et la reference de la commande.
     */
    private BonLivraison construireBonLivraisonDepuisCommande(
            Commande commande, ConversionRequestDTO dto) {

        BonLivraison bl = new BonLivraison();
        bl.setDateCreation(dto.getDateDocument());

        // copier l'acheteur depuis la commande
        if (commande.isAcheteurClient()) {
            bl.setAcheteurClient(commande.getAcheteurClient());
        } else {
            bl.setAcheteurEmetteur(commande.getAcheteurEmetteur());
        }

        bl.setVendeur(commande.getVendeur());

        // conserver la reference de la commande pour la tracabilite
        bl.setCommandeSourceRef(commande.getNumCommande());

        bl.remplirInfosAcheteur();
        bl.remplirInfosVendeur();

        // copier les lignes depuis la commande (sans prix, BL ne contient pas de prix)
        List<LigneBonLivraison> lignes = commande.getLignes().stream()
                .map(ligneCommande -> {
                    LigneBonLivraison ligne = new LigneBonLivraison();
                    ligne.setBonLivraison(bl);
                    ligne.setProduit(ligneCommande.getProduit());
                    ligne.setQuantite(ligneCommande.getQuantite());
                    return ligne;
                })
                .collect(Collectors.toList());

        bl.setLignes(lignes);
        bl.setStatut(com.pfe.facturation.enums.StatutBonLivraison.DRAFT);
        bl.setNumBonLivraison(genererNumeroBonLivraison());

        return bl;
    }

    // ===== COPIE DES LIGNES =====

    // copie les lignes d'un Devis vers un FactureRequestDTO
    private List<LigneFactureRequestDTO> copierLignesDevisVersFacture(
            List<LigneDevis> lignes) {
        return lignes.stream()
                .map(ligne -> {
                    LigneFactureRequestDTO ligneDto = new LigneFactureRequestDTO();
                    ligneDto.setProduitId(ligne.getProduit().getId());
                    ligneDto.setQuantite(ligne.getQuantite());
                    return ligneDto;
                })
                .collect(Collectors.toList());
    }

    // copie les lignes d'une Commande vers un FactureRequestDTO
    private List<LigneFactureRequestDTO> copierLignesCommandeVersFacture(
            List<LigneCommande> lignes) {
        return lignes.stream()
                .map(ligne -> {
                    LigneFactureRequestDTO ligneDto = new LigneFactureRequestDTO();
                    ligneDto.setProduitId(ligne.getProduit().getId());
                    ligneDto.setQuantite(ligne.getQuantite());
                    return ligneDto;
                })
                .collect(Collectors.toList());
    }

    // copie les lignes d'un BonLivraison vers un FactureRequestDTO
    private List<LigneFactureRequestDTO> copierLignesBonLivraisonVersFacture(
            List<LigneBonLivraison> lignes) {
        return lignes.stream()
                .map(ligne -> {
                    LigneFactureRequestDTO ligneDto = new LigneFactureRequestDTO();
                    ligneDto.setProduitId(ligne.getProduit().getId());
                    ligneDto.setQuantite(ligne.getQuantite());
                    return ligneDto;
                })
                .collect(Collectors.toList());
    }

    // ===== VALIDATION =====

    // verifie que les donnees obligatoires pour creer une facture sont presentes
    private void validerDonneesFacture(ConversionRequestDTO dto) {
        if (dto.getModePaiement() == null) {
            throw new RuntimeException("Le mode de paiement est obligatoire pour creer une facture");
        }
        if (dto.getDatePaiement() == null) {
            throw new RuntimeException("La date de paiement est obligatoire pour creer une facture");
        }
    }

    // ===== GENERATEURS DE NUMEROS =====
    // dupliques ici pour eviter la dependance circulaire entre services

    private String genererNumeroBonCommande() {
        int annee = java.time.LocalDate.now().getYear();
        String prefix = "BC-" + annee + "-";
        java.util.Optional<BonCommande> last = bonCommandeRepository
                .findTopByNumBonCommandeStartingWithOrderByNumBonCommandeDesc(prefix);
        int next = last.map(bc ->
                Integer.parseInt(bc.getNumBonCommande().split("-")[2]) + 1).orElse(1);
        return prefix + String.format("%04d", next);
    }

    private String genererNumeroCommande() {
        int annee = java.time.LocalDate.now().getYear();
        String prefix = "CMD-" + annee + "-";
        java.util.Optional<Commande> last = commandeRepository
                .findTopByNumCommandeStartingWithOrderByNumCommandeDesc(prefix);
        int next = last.map(c ->
                Integer.parseInt(c.getNumCommande().split("-")[2]) + 1).orElse(1);
        return prefix + String.format("%04d", next);
    }

    private String genererNumeroBonLivraison() {
        int annee = java.time.LocalDate.now().getYear();
        String prefix = "BL-" + annee + "-";
        java.util.Optional<BonLivraison> last = bonLivraisonRepository
                .findTopByNumBonLivraisonStartingWithOrderByNumBonLivraisonDesc(prefix);
        int next = last.map(bl ->
                Integer.parseInt(bl.getNumBonLivraison().split("-")[2]) + 1).orElse(1);
        return prefix + String.format("%04d", next);
    }

    // ===== FINDERS =====

    private Devis trouverDevis(Long id) {
        return devisRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Devis non trouve: " + id));
    }

    private BonCommande trouverBonCommande(Long id) {
        return bonCommandeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Bon de commande non trouve: " + id));
    }

    private Commande trouverCommande(Long id) {
        return commandeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Commande non trouvee: " + id));
    }

    private BonLivraison trouverBonLivraison(Long id) {
        return bonLivraisonRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Bon de livraison non trouve: " + id));
    }
}