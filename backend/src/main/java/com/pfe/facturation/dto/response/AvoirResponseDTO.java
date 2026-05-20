package com.pfe.facturation.dto.response;

import com.pfe.facturation.enums.StatutAvoir;
import com.pfe.facturation.enums.TypeAvoir;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Data
public class AvoirResponseDTO {
    private Long id;
    private String numAvoir;
    private LocalDate dateCreation;
    private StatutAvoir statut;
    private TypeAvoir type;

    // reference vers la facture qui a genere cet avoir
    private Long factureSourceId;
    private String factureSourceNum;

    private Long vendeurId;
    private String nomVendeur;
    private Long acheteurId;
    private String nomAcheteur;

    private String emailAcheteur;
    private String emailVendeur;

    private String motif;
    private BigDecimal totalHT;
    private BigDecimal montantTVA;
    private BigDecimal totalTTC;
    private List<LigneAvoirResponseDTO> lignes;
}