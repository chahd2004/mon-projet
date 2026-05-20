package com.pfe.facturation.xml;

import jakarta.xml.bind.annotation.XmlAccessType;
import jakarta.xml.bind.annotation.XmlAccessorType;
import jakarta.xml.bind.annotation.XmlElement;
import jakarta.xml.bind.annotation.XmlRootElement;

import java.math.BigDecimal;

/**
 * Representation XML d'une ligne de facture.
 * Utilisee par JAXB pour la generation du XML.
 */
@XmlRootElement(name = "Ligne")
@XmlAccessorType(XmlAccessType.FIELD)
public class LigneFactureXML {

    // designation du produit
    @XmlElement(name = "Designation")
    private String designation;

    // reference du produit
    @XmlElement(name = "Reference")
    private String reference;

    // quantite commandee
    @XmlElement(name = "Quantite")
    private Integer quantite;

    // prix unitaire HT
    @XmlElement(name = "PrixUnitaire")
    private BigDecimal prixUnitaire;

    // montant HT de la ligne : quantite * prixUnitaire
    @XmlElement(name = "MontantHT")
    private BigDecimal montantHT;

    // constructeur vide obligatoire pour JAXB
    public LigneFactureXML() {}

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