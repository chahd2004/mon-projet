package com.pfe.facturation.dto.response;

import com.pfe.facturation.enums.StatutFacture;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PublicFactureResponseDTO {
    private Long id;
    private String numFact;
    private LocalDate dateEmission;
    private LocalDate datePaiement;
    private String acheteurNom;
    private String vendeurNom;
    private StatutFacture statut;
    private BigDecimal totalTTC;
}
