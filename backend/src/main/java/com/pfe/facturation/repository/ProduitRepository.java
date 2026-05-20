package com.pfe.facturation.repository;

import com.pfe.facturation.entity.Produit;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

public interface ProduitRepository extends JpaRepository<Produit, Long> {

    List<Produit> findByEmetteurId(Long emetteurId);

    long countByEmetteurId(Long emetteurId);

    // ========== REQUÊTES POUR GESTION DE STOCK ==========

    /**
     * Produits en stock faible (quantité <= seuil d'alerte et non illimité)
     */
    @Query("SELECT p FROM Produit p WHERE p.emetteur.id = :emetteurId " +
            "AND p.stockIllimite = false " +
            "AND p.quantiteStock <= p.seuilAlerteStock " +
            "AND p.quantiteStock > 0")
    List<Produit> findByEmetteurIdAndStockFaible(@Param("emetteurId") Long emetteurId);

    /**
     * Produits en rupture de stock (quantité = 0 et non illimité)
     */
    @Query("SELECT p FROM Produit p WHERE p.emetteur.id = :emetteurId " +
            "AND p.stockIllimite = false " +
            "AND p.quantiteStock = 0")
    List<Produit> findByEmetteurIdAndRuptureStock(@Param("emetteurId") Long emetteurId);

    /**
     * Produits avec stock > 0 ou illimité (disponibles)
     */
    @Query("SELECT p FROM Produit p WHERE p.emetteur.id = :emetteurId " +
            "AND (p.stockIllimite = true OR p.quantiteStock > 0)")
    List<Produit> findProduitsDisponiblesByEmetteur(@Param("emetteurId") Long emetteurId);
}