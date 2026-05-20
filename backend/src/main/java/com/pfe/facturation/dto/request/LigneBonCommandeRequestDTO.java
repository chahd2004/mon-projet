package com.pfe.facturation.dto.request;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Data;

/**
 * DTO pour une ligne de bon de commande.
 */
@Data
public class LigneBonCommandeRequestDTO {

    @NotNull(message = "Le produit est obligatoire")
    @Positive
    private Long produitId;

    @NotNull
    @Positive(message = "La quantite doit etre superieure a 0")
    private Integer quantite;
}