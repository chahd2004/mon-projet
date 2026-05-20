package com.pfe.facturation.service.impl;

import com.pfe.facturation.dto.mapper.CommandeMapper;
import com.pfe.facturation.dto.request.CommandeRequestDTO;
import com.pfe.facturation.dto.request.LigneCommandeRequestDTO;
import com.pfe.facturation.dto.response.CommandeResponseDTO;
import com.pfe.facturation.entity.*;
import com.pfe.facturation.enums.StatutBonLivraison;
import com.pfe.facturation.enums.StatutCommande;
import com.pfe.facturation.enums.UserRole;
import com.pfe.facturation.exception.ResourceNotFoundException;
import com.pfe.facturation.repository.*;
import com.pfe.facturation.service.CommandeService;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@Transactional
public class CommandeServiceImpl implements CommandeService {

    private final CommandeRepository commandeRepository;
    private final ProduitRepository produitRepository;
    private final ClientRepository clientRepository;
    private final EmetteurRepository emetteurRepository;
    private final CommandeMapper commandeMapper;
    private final BonLivraisonRepository bonLivraisonRepository;

    public CommandeServiceImpl(
            CommandeRepository commandeRepository,
            ProduitRepository produitRepository,
            ClientRepository clientRepository,
            EmetteurRepository emetteurRepository,
            CommandeMapper commandeMapper,
            BonLivraisonRepository bonLivraisonRepository) {
        this.commandeRepository = commandeRepository;
        this.produitRepository = produitRepository;
        this.clientRepository = clientRepository;
        this.emetteurRepository = emetteurRepository;
        this.commandeMapper = commandeMapper;
        this.bonLivraisonRepository = bonLivraisonRepository;
    }

    // ===== CRUD =====

    @Override
    public CommandeResponseDTO create(CommandeRequestDTO dto) {
        Commande commande = commandeMapper.toEntity(dto);

        // lier chaque ligne a la commande parente
        if (commande.getLignes() != null) {
            commande.getLignes().forEach(ligne -> ligne.setCommande(commande));
        }

        // definir l'acheteur selon son type
        if (dto.getTypeAcheteur() == com.pfe.facturation.enums.EntityType.CLIENT) {
            Client client = clientRepository.findById(dto.getAcheteurId())
                    .orElseThrow(() -> new ResourceNotFoundException(
                            "Client non trouve: " + dto.getAcheteurId()));
            commande.setAcheteurClient(client);
        } else {
            Emetteur acheteur = emetteurRepository.findById(dto.getAcheteurId())
                    .orElseThrow(() -> new ResourceNotFoundException(
                            "Emetteur non trouve: " + dto.getAcheteurId()));
            commande.setAcheteurEmetteur(acheteur);
        }

        // definir le vendeur
        Emetteur vendeur = emetteurRepository.findById(dto.getVendeurId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Vendeur non trouve: " + dto.getVendeurId()));
        commande.setVendeur(vendeur);

        // remplir les infos denormalisees
        commande.remplirInfosAcheteur();
        commande.remplirInfosVendeur();

        // charger les produits et calculer les montants des lignes
        chargerProduitsEtCalculerLignes(commande);

        // toute nouvelle commande commence en DRAFT
        commande.setStatut(StatutCommande.DRAFT);
        commande.setNumCommande(genererNumeroCommande());
        commande.calculerTotaux();

        return commandeMapper.toDTO(commandeRepository.save(commande));
    }

    @Override
    public CommandeResponseDTO getById(Long id) {
        return commandeMapper.toDTO(trouverCommande(id));
    }

    @Override
    public List<CommandeResponseDTO> getAll() {
        return commandeRepository.findAll().stream()
                .map(commandeMapper::toDTO)
                .collect(Collectors.toList());
    }

    @Override
    public CommandeResponseDTO update(Long id, CommandeRequestDTO dto) {
        Commande commande = trouverCommande(id);

        // seule une commande en DRAFT peut etre modifiee
        if (commande.getStatut() != StatutCommande.DRAFT) {
            throw new RuntimeException("Seule une commande en DRAFT peut etre modifiee");
        }

        commande.setDateCreation(dto.getDateCreation());
        commande.setModePaiement(dto.getModePaiement());
        commande.setNotes(dto.getNotes());

        // remplacer les lignes
        commande.getLignes().clear();
        for (LigneCommandeRequestDTO ligneDto : dto.getLignes()) {
            LigneCommande ligne = new LigneCommande();
            ligne.setCommande(commande);
            ligne.setQuantite(ligneDto.getQuantite());
            Produit produit = new Produit();
            produit.setId(ligneDto.getProduitId());
            ligne.setProduit(produit);
            commande.getLignes().add(ligne);
        }

        chargerProduitsEtCalculerLignes(commande);
        commande.calculerTotaux();

        return commandeMapper.toDTO(commandeRepository.save(commande));
    }

    @Override
    public void delete(Long id) {
        Commande commande = trouverCommande(id);

        // seule une commande en DRAFT peut etre supprimee
        if (commande.getStatut() != StatutCommande.DRAFT) {
            throw new RuntimeException("Seule une commande en DRAFT peut etre supprimee");
        }

        commandeRepository.deleteById(id);
    }

    // ===== TRANSITIONS DU CYCLE DE VIE =====

    // DRAFT --> CONFIRMED
    @Override
    public CommandeResponseDTO confirmer(Long id) {
        Commande commande = trouverCommande(id);

        if (commande.getStatut() != StatutCommande.DRAFT) {
            throw new RuntimeException("Seule une commande en DRAFT peut etre confirmee");
        }

        commande.setStatut(StatutCommande.CONFIRMED);
        return commandeMapper.toDTO(commandeRepository.save(commande));
    }

    // CONFIRMED --> IN_PROGRESS
    @Override
    public CommandeResponseDTO demarrer(Long id) {
        Commande commande = trouverCommande(id);

        if (commande.getStatut() != StatutCommande.CONFIRMED) {
            throw new RuntimeException("Seule une commande CONFIRMED peut etre demarree");
        }

        commande.setStatut(StatutCommande.IN_PROGRESS);
        Commande saved = commandeRepository.save(commande);

        // Auto-génération du Bon de Livraison (DRAFT)
        try {
            BonLivraison bl = new BonLivraison();
            bl.setDateCreation(LocalDate.now());

            if (commande.isAcheteurClient()) {
                bl.setAcheteurClient(commande.getAcheteurClient());
            } else {
                bl.setAcheteurEmetteur(commande.getAcheteurEmetteur());
            }

            bl.setVendeur(commande.getVendeur());
            bl.setCommandeSourceRef(commande.getNumCommande());
            bl.remplirInfosAcheteur();
            bl.remplirInfosVendeur();

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
            bl.setStatut(StatutBonLivraison.DRAFT);
            bl.setNumBonLivraison(genererNumeroBonLivraison());
            bonLivraisonRepository.save(bl);
        } catch (Exception e) {
            System.err.println("Erreur lors de la creation automatique du Bon de Livraison : " + e.getMessage());
        }

        return commandeMapper.toDTO(saved);
    }

    // IN_PROGRESS --> DELIVERED
    @Override
    public CommandeResponseDTO marquerLivree(Long id) {
        Commande commande = trouverCommande(id);

        if (commande.getStatut() != StatutCommande.IN_PROGRESS) {
            throw new RuntimeException("Seule une commande IN_PROGRESS peut etre marquee livree");
        }

        commande.setStatut(StatutCommande.DELIVERED);
        return commandeMapper.toDTO(commandeRepository.save(commande));
    }

    // appele par ConversionService dans la Partie 7
    @Override
    public CommandeResponseDTO cloturer(Long id, String documentRef) {
        Commande commande = trouverCommande(id);

        if (commande.getStatut() != StatutCommande.DELIVERED) {
            throw new RuntimeException("Seule une commande DELIVERED peut etre cloturee");
        }

        // On ne change plus le statut car l'etat CLOSED a ete retire.
        commande.setDocumentConvertiRef(documentRef);
        return commandeMapper.toDTO(commandeRepository.save(commande));
    }

    // IN_PROGRESS --> CANCELLED
    @Override
    public CommandeResponseDTO annuler(Long id, String raison) {
        Commande commande = trouverCommande(id);

        // l'annulation est possible depuis DRAFT, CONFIRMED ou IN_PROGRESS
        if (commande.getStatut() != StatutCommande.DRAFT &&
                commande.getStatut() != StatutCommande.CONFIRMED &&
                commande.getStatut() != StatutCommande.IN_PROGRESS) {
            throw new RuntimeException(
                    "L'annulation est possible depuis DRAFT, CONFIRMED ou IN_PROGRESS");
        }

        if (raison == null || raison.isBlank()) {
            throw new RuntimeException("La raison d'annulation est obligatoire");
        }

        commande.setStatut(StatutCommande.CANCELLED);
        commande.setCancellationReason(raison);
        return commandeMapper.toDTO(commandeRepository.save(commande));
    }

    // ===== RECHERCHE =====

    @Override
    public List<CommandeResponseDTO> getByVendeur(Long vendeurId) {
        return commandeRepository.findByVendeurId(vendeurId).stream()
                .map(commandeMapper::toDTO)
                .collect(Collectors.toList());
    }

    @Override
    public List<CommandeResponseDTO> getByAcheteurClient(Long clientId) {
        return commandeRepository.findByAcheteurClientId(clientId).stream()
                .map(commandeMapper::toDTO)
                .collect(Collectors.toList());
    }

    @Override
    public List<CommandeResponseDTO> getByAcheteurEmetteur(Long emetteurId) {
        return commandeRepository.findByAcheteurEmetteurId(emetteurId).stream()
                .map(commandeMapper::toDTO)
                .collect(Collectors.toList());
    }

    @Override
    public List<CommandeResponseDTO> getCommandesByUser(User user) {
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
        return commandeRepository.count();
    }

    // ===== METHODES PRIVEES =====

    // charge les produits depuis la base et calcule les montants de chaque ligne
    private void chargerProduitsEtCalculerLignes(Commande commande) {
        if (commande.getLignes() == null) return;

        for (LigneCommande ligne : commande.getLignes()) {
            if (ligne.getProduit() != null && ligne.getProduit().getId() != null) {
                Produit produit = produitRepository.findById(ligne.getProduit().getId())
                        .orElseThrow(() -> new ResourceNotFoundException(
                                "Produit non trouve: " + ligne.getProduit().getId()));
                ligne.setProduit(produit);

                // copier le prix unitaire du produit dans la ligne
                ligne.setPrixUnitaire(produit.getPrixUnitaire());
                ligne.calculerMontant();
            }
        }
    }

    // genere un numero sequentiel : CMD-2024-0001
    private String genererNumeroCommande() {
        int annee = LocalDate.now().getYear();
        String prefix = "CMD-" + annee + "-";
        Optional<Commande> last = commandeRepository
                .findTopByNumCommandeStartingWithOrderByNumCommandeDesc(prefix);
        int next = last.map(c ->
                Integer.parseInt(c.getNumCommande().split("-")[2]) + 1).orElse(1);
        return prefix + String.format("%04d", next);
    }

    private String genererNumeroBonLivraison() {
        int annee = LocalDate.now().getYear();
        String prefix = "BL-" + annee + "-";
        Optional<BonLivraison> last = bonLivraisonRepository
                .findTopByNumBonLivraisonStartingWithOrderByNumBonLivraisonDesc(prefix);
        int next = last.map(bl ->
                Integer.parseInt(bl.getNumBonLivraison().split("-")[2]) + 1).orElse(1);
        return prefix + String.format("%04d", next);
    }

    private Commande trouverCommande(Long id) {
        return commandeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Commande non trouvee: " + id));
    }
}