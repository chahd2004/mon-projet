package com.pfe.facturation.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

/**
 * Entité intermédiaire pour la relation ManyToMany
 * entre Facture et Produit.
 * Les montants sont calculés dans FactureService.
 */
@Entity
@Table(name = "ligne_facture")
public class LigneFacture {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotNull
    @Positive
    private Integer quantite;

    @ManyToOne
    @JoinColumn(name = "facture_id", nullable = false)
    private Facture facture;

    /**
     * Relation vers le produit
     */
    @ManyToOne
    @JoinColumn(name = "produit_id", nullable = false)
    private Produit produit;

    // GETTERS & SETTERS
    public Long getId() {return id;}
    public Integer getQuantite() {return quantite;}
    public Facture getFacture() {return facture;}
    public Produit getProduit() {return produit;}

    public void setId(Long id) {this.id = id;}
    public void setQuantite(Integer quantite) {this.quantite = quantite;}
    public void setFacture(Facture facture) {this.facture = facture;}
    public void setProduit(Produit produit) {this.produit = produit;}
}
