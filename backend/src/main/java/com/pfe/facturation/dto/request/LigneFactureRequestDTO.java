package com.pfe.facturation.dto.request;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

/**
 * DTO représentant une ligne de facture envoyée par le client.
 */
public class LigneFactureRequestDTO {

    /**
     * Identifiant du produit.
     */
    @NotNull(message = "Le produit est obligatoire")
    @Positive(message = "L'identifiant du produit doit être positif")
    private Long produitId;

    /**
     * Quantité du produit.
     */
    @Positive(message = "La quantité doit être supérieure à 0")
    private int quantite;

    // GETTERS & SETTERS

    public Long getProduitId() {
        return produitId;
    }

    public void setProduitId(Long produitId) {
        this.produitId = produitId;
    }

    public int getQuantite() {
        return quantite;
    }

    public void setQuantite(int quantite) {
        this.quantite = quantite;
    }
}
