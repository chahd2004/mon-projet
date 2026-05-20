package com.pfe.facturation.dto.response;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.math.BigDecimal;

/**
 * DTO retourné au client API.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ProduitResponseDTO {

    private Long id;
    private String reference;
    private String designation;
    private BigDecimal prixUnitaire;
    private BigDecimal tauxTVA;
    private Long entrepriseId;
    private String entrepriseRaisonSociale;

    // ========== GESTION DE STOCK ==========
    private Integer quantiteStock;
    private boolean stockIllimite;
    private Integer seuilAlerteStock;
    private boolean disponible;      // Calculé
    private boolean stockFaible;     // Calculé
    private boolean ruptureStock;    // Calculé
}