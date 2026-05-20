package com.pfe.facturation.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.math.BigDecimal;

/**
 * Ligne d'un bon de commande.
 * Meme structure que LigneDevis.
 * Le prix est copie depuis le produit au moment de la creation.
 */
@Entity
@Table(name = "ligne_bon_commande")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class LigneBonCommande {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // quantite commandee
    @NotNull
    @Positive
    private Integer quantite;

    // prix unitaire copie depuis le produit au moment de la creation
    @Column(precision = 15, scale = 3)
    private BigDecimal prixUnitaire;

    // montantHT = quantite * prixUnitaire
    @Column(precision = 15, scale = 2)
    private BigDecimal montantHT;

    // lien vers le bon de commande parent
    @ManyToOne
    @JoinColumn(name = "bon_commande_id", nullable = false)
    private BonCommande bonCommande;

    // produit concerne
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