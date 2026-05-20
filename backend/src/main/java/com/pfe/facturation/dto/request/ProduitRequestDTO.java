package com.pfe.facturation.dto.request;

import jakarta.validation.constraints.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.math.BigDecimal;

/**
 * DTO utilisé lors de la création ou mise à jour d’un produit.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ProduitRequestDTO {

    @NotBlank(message = "La référence est obligatoire")
    private String reference;

    @NotBlank(message = "La désignation est obligatoire")
    private String designation;

    @NotNull(message = "Le prix est obligatoire")
    @DecimalMin(value = "0.000", inclusive = false)
    private BigDecimal prixUnitaire;

    @NotNull(message = "Le taux TVA est obligatoire")
    @DecimalMin(value = "0.00")
    @DecimalMax(value = "100.00")
    private BigDecimal tauxTVA;

    // ========== GESTION DE STOCK ==========

    @Min(value = 0, message = "Le stock ne peut pas être négatif")
    private Integer quantiteStock = 0;

    private boolean stockIllimite = false;

    @Min(value = 0, message = "Le seuil d'alerte doit être positif")
    private Integer seuilAlerteStock = 5;

    // Renseigné automatiquement par le contrôleur depuis le JWT
    private Long entrepriseId;
}