package com.pfe.facturation.dto.response;

import com.pfe.facturation.enums.StatutBonLivraison;
import com.pfe.facturation.enums.EntityType;
import lombok.Data;

import java.time.LocalDate;
import java.util.List;

@Data
public class BonLivraisonResponseDTO {

    private Long id;
    private String numBonLivraison;
    private LocalDate dateCreation;
    private LocalDate dateLivraison;

    // acheteur
    private Long acheteurId;
    private String acheteurNom;
    private EntityType typeAcheteur;

    // vendeur
    private Long vendeurId;
    private String vendeurNom;

    // adresse de livraison (adresse de l'acheteur par defaut)
    private String adresseLivraison;

    private StatutBonLivraison statut;

    // motif du litige si statut = DISPUTE
    private String disputeReason;

    // reference de la commande source pour la tracabilite
    private String commandeSourceRef;

    // reference de la facture generee apres cloture
    private String factureRef;

    private List<LigneBonLivraisonResponseDTO> lignes;
}