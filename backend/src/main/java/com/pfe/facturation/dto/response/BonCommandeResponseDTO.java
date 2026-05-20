package com.pfe.facturation.dto.response;

import com.pfe.facturation.enums.ModePaiement;
import com.pfe.facturation.enums.StatutBonCommande;
import com.pfe.facturation.enums.EntityType;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Data
public class BonCommandeResponseDTO {

    private Long id;
    private String numBonCommande;
    private LocalDate dateCreation;

    // acheteur
    private Long acheteurId;
    private String acheteurNom;
    private EntityType typeAcheteur;

    // vendeur
    private Long vendeurId;
    private String vendeurNom;

    private StatutBonCommande statut;
    private ModePaiement modePaiement;

    // raison d'annulation si statut = CANCELLED
    private String cancellationReason;

    // reference du devis source pour la tracabilite
    private String devisSourceRef;

    // reference du document cree apres conversion
    private String documentConvertiRef;

    private BigDecimal totalHT;
    private BigDecimal montantTVA;
    private BigDecimal totalTTC;
    private String montantEnLettres;
    private List<LigneBonCommandeResponseDTO> lignes;
}