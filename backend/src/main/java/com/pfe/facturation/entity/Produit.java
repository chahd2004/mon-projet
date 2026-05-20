package com.pfe.facturation.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.math.BigDecimal;
import java.util.List;

/**
 * Entité représentant un produit commercialisé.
 * Chaque produit appartient à un émetteur (vendeur).
 */
@Entity
@Table(name = "produits")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Produit {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * Référence du produit (unique par émetteur)
     */
    @Column(nullable = false, length = 50)
    @NotBlank(message = "La référence est obligatoire")
    @Size(max = 50)
    private String reference;

    /**
     * Désignation / nom du produit
     */
    @Column(nullable = false)
    @NotBlank(message = "La désignation est obligatoire")
    @Size(min = 2, max = 150)
    private String designation;

    /**
     * Prix hors taxe
     */
    @Column(nullable = false, precision = 10, scale = 3)
    @NotNull(message = "Le prix unitaire est obligatoire")
    @DecimalMin(value = "0.000", inclusive = false, message = "Le prix doit être positif")
    private BigDecimal prixUnitaire;

    /**
     * Taux TVA en %
     */
    @Column(nullable = false, precision = 5, scale = 2)
    @NotNull(message = "Le taux TVA est obligatoire")
    @DecimalMin(value = "0.00", message = "TVA invalide")
    @DecimalMax(value = "100.00", message = "TVA invalide")
    private BigDecimal tauxTVA;

    // ========== GESTION DE STOCK ==========

    /**
     * Quantité disponible en stock
     */
    @Column(nullable = false)
    @Min(value = 0, message = "Le stock ne peut pas être négatif")
    private Integer quantiteStock = 0;

    /**
     * Indique si le produit a un stock illimité
     * (utile pour les services ou produits numériques)
     */
    @Column(nullable = false)
    private boolean stockIllimite = false;

    /**
     * Seuil d'alerte pour stock faible
     */
    @Column(nullable = false)
    @Min(value = 0, message = "Le seuil d'alerte doit être positif")
    private Integer seuilAlerteStock = 5;

    /**
     * L'émetteur (vendeur) qui possède ce produit
     */
    @ManyToOne
    @JoinColumn(name = "emetteur_id", nullable = false)
    private Emetteur emetteur;

    /**
     * Lignes de facture associées à ce produit
     */
    @OneToMany(mappedBy = "produit")
    private List<LigneFacture> lignes;

    /**
     * Constructeur pratique sans la liste des lignes
     */
    public Produit(String reference, String designation, BigDecimal prixUnitaire,
                   BigDecimal tauxTVA, Emetteur emetteur) {
        this.reference = reference;
        this.designation = designation;
        this.prixUnitaire = prixUnitaire;
        this.tauxTVA = tauxTVA;
        this.emetteur = emetteur;
        this.quantiteStock = 0;
        this.stockIllimite = false;
        this.seuilAlerteStock = 5;
    }

    // ========== MÉTHODES DE GESTION DE STOCK ==========

    /**
     * Vérifie si le produit est disponible en quantité suffisante
     * @param quantiteDemandee Quantité demandée
     * @return true si disponible
     */
    public boolean isDisponible(int quantiteDemandee) {
        return stockIllimite || (quantiteStock != null && quantiteStock >= quantiteDemandee);
    }

    /**
     * Diminue le stock après une vente
     * @param quantite Quantité vendue
     * @throws RuntimeException si stock insuffisant
     */
    public void diminuerStock(int quantite) {
        if (!stockIllimite && quantiteStock != null) {
            if (quantiteStock < quantite) {
                throw new RuntimeException(
                        String.format("Stock insuffisant pour le produit %s (disponible: %d, demandé: %d)",
                                designation, quantiteStock, quantite)
                );
            }
            this.quantiteStock -= quantite;
        }
    }

    /**
     * Augmente le stock (après annulation ou réapprovisionnement)
     * @param quantite Quantité à ajouter
     */
    public void augmenterStock(int quantite) {
        if (!stockIllimite && quantiteStock != null && quantite > 0) {
            this.quantiteStock += quantite;
        }
    }

    /**
     * Vérifie si le stock est faible (en dessous du seuil d'alerte)
     * @return true si stock faible
     */
    public boolean isStockFaible() {
        return !stockIllimite && quantiteStock != null && quantiteStock <= seuilAlerteStock;
    }

    /**
     * Vérifie si le produit est en rupture de stock
     * @return true si rupture
     */
    public boolean isRuptureStock() {
        return !stockIllimite && quantiteStock != null && quantiteStock <= 0;
    }
}