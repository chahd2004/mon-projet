package com.pfe.facturation.dto.response;

import lombok.Data;
import java.math.BigDecimal;

@Data
public class LigneCommandeResponseDTO {
    private Long id;
    private Long produitId;
    private String produitDesignation;
    private Integer quantite;
    private BigDecimal prixUnitaire;
    private BigDecimal montantHT;
}