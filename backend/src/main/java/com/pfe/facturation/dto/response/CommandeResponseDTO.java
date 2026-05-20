package com.pfe.facturation.dto.response;

import com.pfe.facturation.enums.ModePaiement;
import com.pfe.facturation.enums.StatutCommande;
import com.pfe.facturation.enums.EntityType;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Data
public class CommandeResponseDTO {

    private Long id;
    private String numCommande;
    private LocalDate dateCreation;

    // acheteur
    private Long acheteurId;
    private String acheteurNom;
    private EntityType typeAcheteur;

    // vendeur
    private Long vendeurId;
    private String vendeurNom;

    private StatutCommande statut;
    private ModePaiement modePaiement;

    // notes libres
    private String notes;

    // raison d'annulation si statut = CANCELLED
    private String cancellationReason;

    // reference du document source pour la tracabilite
    private String sourceDocumentRef;

    // reference du document cree apres cloture
    private String documentConvertiRef;

    private BigDecimal totalHT;
    private BigDecimal montantTVA;
    private BigDecimal totalTTC;
    private String montantEnLettres;
    private List<LigneCommandeResponseDTO> lignes;
}