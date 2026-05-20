package com.pfe.facturation.dto.request;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Data;

/**
 * DTO pour une ligne de devis envoyee par le client.
 */
@Data
public class LigneDevisRequestDTO {

    @NotNull(message = "Le produit est obligatoire")
    @Positive
    private Long produitId;

    @Positive(message = "La quantite doit etre superieure a 0")
    private Integer quantite;
}