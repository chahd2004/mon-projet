package com.pfe.facturation.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.math.BigDecimal;

/**
 * Ligne d'un avoir.
 * Copiee depuis LigneFacture lors de la creation automatique.
 * Pour un avoir partiel, l'admin peut modifier la quantite ou supprimer des lignes.
 */
@Entity
@Table(name = "ligne_avoir")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class LigneAvoir {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // quantite remboursee, peut etre inferieure a la quantite facturee (avoir partiel)
    @NotNull
    @Positive
    private Integer quantite;

    // prix unitaire copie depuis le produit au moment de la facture
    @Column(precision = 15, scale = 2)
    private BigDecimal prixUnitaire;

    // montant HT de cette ligne : quantite * prixUnitaire
    @Column(precision = 15, scale = 2)
    private BigDecimal montantHT;

    // lien vers l'avoir parent
    @ManyToOne
    @JoinColumn(name = "avoir_id", nullable = false)
    private Avoir avoir;

    // lien vers le produit concerne
    @ManyToOne
    @JoinColumn(name = "produit_id", nullable = false)
    private Produit produit;

    // calcule le montantHT de cette ligne
    public void calculerMontant() {
        if (prixUnitaire != null && quantite != null) {
            this.montantHT = prixUnitaire.multiply(BigDecimal.valueOf(quantite));
        }
    }
}