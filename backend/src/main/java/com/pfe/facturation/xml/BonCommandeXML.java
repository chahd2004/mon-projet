package com.pfe.facturation.xml;

import jakarta.xml.bind.annotation.XmlAccessType;
import jakarta.xml.bind.annotation.XmlAccessorType;
import jakarta.xml.bind.annotation.XmlElement;
import jakarta.xml.bind.annotation.XmlElementWrapper;
import jakarta.xml.bind.annotation.XmlRootElement;

import java.math.BigDecimal;
import java.util.List;

/**
 * Representation XML d'un bon de commande pour signature.
 */
@XmlRootElement(name = "BonCommande")
@XmlAccessorType(XmlAccessType.FIELD)
public class BonCommandeXML {

    @XmlElement(name = "NumeroBonCommande")
    private String numeroBonCommande;

    @XmlElement(name = "DateCreation")
    private String dateCreation;

    @XmlElement(name = "DateValidation")
    private String dateValidation;

    @XmlElement(name = "ModePaiement")
    private String modePaiement;

    @XmlElement(name = "Vendeur")
    private VendeurXML vendeur;

    @XmlElement(name = "Acheteur")
    private AcheteurXML acheteur;

    @XmlElementWrapper(name = "Lignes")
    @XmlElement(name = "Ligne")
    private List<LigneBonCommandeXML> lignes;

    @XmlElement(name = "TotalHT")
    private BigDecimal totalHT;

    @XmlElement(name = "MontantTVA")
    private BigDecimal montantTVA;

    @XmlElement(name = "TotalTTC")
    private BigDecimal totalTTC;

    // Constructeur vide pour JAXB
    public BonCommandeXML() {}

    // Getters et Setters
    public String getNumeroBonCommande() { return numeroBonCommande; }
    public void setNumeroBonCommande(String numeroBonCommande) { this.numeroBonCommande = numeroBonCommande; }

    public String getDateCreation() { return dateCreation; }
    public void setDateCreation(String dateCreation) { this.dateCreation = dateCreation; }

    public String getDateValidation() { return dateValidation; }
    public void setDateValidation(String dateValidation) { this.dateValidation = dateValidation; }

    public String getModePaiement() { return modePaiement; }
    public void setModePaiement(String modePaiement) { this.modePaiement = modePaiement; }

    public VendeurXML getVendeur() { return vendeur; }
    public void setVendeur(VendeurXML vendeur) { this.vendeur = vendeur; }

    public AcheteurXML getAcheteur() { return acheteur; }
    public void setAcheteur(AcheteurXML acheteur) { this.acheteur = acheteur; }

    public List<LigneBonCommandeXML> getLignes() { return lignes; }
    public void setLignes(List<LigneBonCommandeXML> lignes) { this.lignes = lignes; }

    public BigDecimal getTotalHT() { return totalHT; }
    public void setTotalHT(BigDecimal totalHT) { this.totalHT = totalHT; }

    public BigDecimal getMontantTVA() { return montantTVA; }
    public void setMontantTVA(BigDecimal montantTVA) { this.montantTVA = montantTVA; }

    public BigDecimal getTotalTTC() { return totalTTC; }
    public void setTotalTTC(BigDecimal totalTTC) { this.totalTTC = totalTTC; }
}