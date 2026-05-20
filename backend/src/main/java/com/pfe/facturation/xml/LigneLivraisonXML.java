package com.pfe.facturation.xml;

import jakarta.xml.bind.annotation.XmlAccessType;
import jakarta.xml.bind.annotation.XmlAccessorType;
import jakarta.xml.bind.annotation.XmlElement;
import jakarta.xml.bind.annotation.XmlRootElement;

import java.math.BigDecimal;

@XmlRootElement(name = "Article")
@XmlAccessorType(XmlAccessType.FIELD)
public class LigneLivraisonXML {

    @XmlElement(name = "Designation")
    private String designation;

    @XmlElement(name = "Reference")
    private String reference;

    @XmlElement(name = "QuantiteCommandee")
    private Integer quantiteCommandee;

    @XmlElement(name = "QuantiteLivree")
    private Integer quantiteLivree;

    @XmlElement(name = "PrixUnitaire")
    private BigDecimal prixUnitaire;

    @XmlElement(name = "MontantHT")
    private BigDecimal montantHT;

    public LigneLivraisonXML() {}

    // Getters et Setters
    public String getDesignation() { return designation; }
    public void setDesignation(String designation) { this.designation = designation; }

    public String getReference() { return reference; }
    public void setReference(String reference) { this.reference = reference; }

    public Integer getQuantiteCommandee() { return quantiteCommandee; }
    public void setQuantiteCommandee(Integer quantiteCommandee) { this.quantiteCommandee = quantiteCommandee; }

    public Integer getQuantiteLivree() { return quantiteLivree; }
    public void setQuantiteLivree(Integer quantiteLivree) { this.quantiteLivree = quantiteLivree; }

    public BigDecimal getPrixUnitaire() { return prixUnitaire; }
    public void setPrixUnitaire(BigDecimal prixUnitaire) { this.prixUnitaire = prixUnitaire; }

    public BigDecimal getMontantHT() { return montantHT; }
    public void setMontantHT(BigDecimal montantHT) { this.montantHT = montantHT; }
}
