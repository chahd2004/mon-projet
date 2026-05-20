package com.pfe.facturation.dto.response;

import com.pfe.facturation.enums.EntityType;
import com.pfe.facturation.enums.ModePaiement;
import com.pfe.facturation.enums.StatutDevis;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Data
public class DevisResponseDTO {

    private Long id;
    private String numDevis;
    private LocalDate dateCreation;
    private LocalDate dateValidite;

    // acheteur
    private Long acheteurId;
    private String acheteurNom;
    private EntityType typeAcheteur;

    // vendeur
    private Long vendeurId;
    private String vendeurNom;

    private StatutDevis statut;

    // notes libres
    private String notes;

    // raison du refus si statut = REJECTED
    private String rejectionReason;

    // reference du document cree apres conversion
    private String documentConvertiRef;

    private BigDecimal totalHT;
    private BigDecimal montantTVA;
    private BigDecimal totalTTC;
    private String montantEnLettres;
    private List<LigneDevisResponseDTO> lignes;
}