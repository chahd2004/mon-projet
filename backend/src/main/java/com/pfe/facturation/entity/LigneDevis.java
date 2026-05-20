package com.pfe.facturation.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.math.BigDecimal;

/**
 * Ligne d'un devis.
 * Meme structure que LigneFacture.
 * Le montantHT est calcule depuis quantite * prixUnitaire du produit.
 */
@Entity
@Table(name = "ligne_devis")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class LigneDevis {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // quantite proposee dans le devis
    @NotNull
    @Positive
    private Integer quantite;

    // prix unitaire copie depuis le produit au moment de la creation du devis
    // conserve meme si le prix du produit change apres
    @Column(precision = 15, scale = 3)
    private BigDecimal prixUnitaire;

    // montantHT = quantite * prixUnitaire
    @Column(precision = 15, scale = 2)
    private BigDecimal montantHT;

    // lien vers le devis parent
    @ManyToOne
    @JoinColumn(name = "devis_id", nullable = false)
    private Devis devis;

    // produit concerne par cette ligne
    @ManyToOne
    @JoinColumn(name = "produit_id", nullable = false)
    private Produit produit;

    // calcule le montantHT depuis quantite et prixUnitaire
    public void calculerMontant() {
        if (prixUnitaire != null && quantite != null) {
            this.montantHT = prixUnitaire.multiply(BigDecimal.valueOf(quantite));
        }
    }
}