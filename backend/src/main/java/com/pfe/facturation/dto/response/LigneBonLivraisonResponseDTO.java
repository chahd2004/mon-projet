package com.pfe.facturation.dto.response;

import lombok.Data;

@Data
public class LigneBonLivraisonResponseDTO {
    private Long id;
    private Long produitId;
    private String produitDesignation;
    private Integer quantite;
}