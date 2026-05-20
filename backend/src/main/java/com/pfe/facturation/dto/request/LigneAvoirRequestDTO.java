package com.pfe.facturation.dto.request;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Data;

/**
 * DTO pour une ligne d'avoir.
 * Utilise lors de la modification d'un avoir partiel en DRAFT.
 */
@Data
public class LigneAvoirRequestDTO {

    @NotNull(message = "Le produit est obligatoire")
    @Positive
    private Long produitId;

    // quantite a rembourser, peut etre inferieure a la quantite facturee
    @Positive(message = "La quantite doit etre superieure a 0")
    private Integer quantite;
}