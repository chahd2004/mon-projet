package com.pfe.facturation.xml;

import jakarta.xml.bind.annotation.XmlAccessType;
import jakarta.xml.bind.annotation.XmlAccessorType;
import jakarta.xml.bind.annotation.XmlElement;
import jakarta.xml.bind.annotation.XmlRootElement;

import java.math.BigDecimal;

@XmlRootElement(name = "Ligne")
@XmlAccessorType(XmlAccessType.FIELD)
public class LigneBonCommandeXML {

    @XmlElement(name = "Designation")
    private String designation;

    @XmlElement(name = "Reference")
    private String reference;

    @XmlElement(name = "Quantite")
    private Integer quantite;

    @XmlElement(name = "PrixUnitaire")
    private BigDecimal prixUnitaire;

    @XmlElement(name = "MontantHT")
    private BigDecimal montantHT;

    public LigneBonCommandeXML() {}

    // Getters et Setters
    public String getDesignation() { return designation; }
    public void setDesignation(String designation) { this.designation = designation; }

    public String getReference() { return reference; }
    public void setReference(String reference) { this.reference = reference; }

    public Integer getQuantite() { return quantite; }
    public void setQuantite(Integer quantite) { this.quantite = quantite; }

    public BigDecimal getPrixUnitaire() { return prixUnitaire; }
    public void setPrixUnitaire(BigDecimal prixUnitaire) { this.prixUnitaire = prixUnitaire; }

    public BigDecimal getMontantHT() { return montantHT; }
    public void setMontantHT(BigDecimal montantHT) { this.montantHT = montantHT; }
}