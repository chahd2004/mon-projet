package com.pfe.facturation.dto.response;

public class LigneFactureResponseDTO {
    private Long id;
    private Integer quantite;
    private Long produitId;
    private String produitDesignation;

    // Constructeurs
    public LigneFactureResponseDTO() {}

    // Getters et Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Integer getQuantite() { return quantite; }
    public void setQuantite(Integer quantite) { this.quantite = quantite; }

    public Long getProduitId() { return produitId; }
    public void setProduitId(Long produitId) { this.produitId = produitId; }

    public String getProduitDesignation() { return produitDesignation; }
    public void setProduitDesignation(String produitDesignation) { this.produitDesignation = produitDesignation; }
}