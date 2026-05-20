package com.pfe.facturation.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

/**
 * Ligne d'un bon de livraison.
 * Represente les articles livres.
 * Pas de prix ici : le prix est sur la facture.
 * Le bon de livraison prouve uniquement la reception des articles.
 */
@Entity
@Table(name = "ligne_bon_livraison")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class LigneBonLivraison {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // quantite livree
    @NotNull
    @Positive
    private Integer quantite;

    // lien vers le bon de livraison parent
    @ManyToOne
    @JoinColumn(name = "bon_livraison_id", nullable = false)
    private BonLivraison bonLivraison;

    // produit livre
    @ManyToOne
    @JoinColumn(name = "produit_id", nullable = false)
    private Produit produit;
}