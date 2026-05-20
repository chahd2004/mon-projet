package com.pfe.facturation.xml;

import jakarta.xml.bind.annotation.XmlAccessType;
import jakarta.xml.bind.annotation.XmlAccessorType;
import jakarta.xml.bind.annotation.XmlElement;
import jakarta.xml.bind.annotation.XmlElementWrapper;
import jakarta.xml.bind.annotation.XmlRootElement;

import java.math.BigDecimal;
import java.util.List;

/**
 * Representation XML complete d'une facture.
 * Structure conforme au diagramme avec Vendeur et Acheteur imbriques.
 */
@XmlRootElement(name = "Facture")
@XmlAccessorType(XmlAccessType.FIELD)
public class FactureXML {

    @XmlElement(name = "NumeroFacture")
    private String numeroFacture;

    @XmlElement(name = "DateEmission")
    private String dateEmission;

    @XmlElement(name = "DatePaiement")
    private String datePaiement;

    // mode de paiement : VIREMENT, CHEQUE, ESPECES, etc.
    @XmlElement(name = "ModePaiement")
    private String modePaiement;

    // montant en lettres : "Mille cent quatre-vingt-dix dinars"
    @XmlElement(name = "MontantEnLettres")
    private String montantEnLettres;

    // vendeur avec structure imbriquee
    @XmlElement(name = "Vendeur")
    private VendeurXML vendeur;

    // acheteur avec structure imbriquee
    @XmlElement(name = "Acheteur")
    private AcheteurXML acheteur;

    // lignes de la facture
    @XmlElementWrapper(name = "Lignes")
    @XmlElement(name = "Ligne")
    private List<LigneFactureXML> lignes;

    @XmlElement(name = "TotalHT")
    private BigDecimal totalHT;

    @XmlElement(name = "MontantTVA")
    private BigDecimal montantTVA;

    @XmlElement(name = "TotalTTC")
    private BigDecimal totalTTC;

    // constructeur vide obligatoire pour JAXB
    public FactureXML() {}

    public String getNumeroFacture() { return numeroFacture; }
    public void setNumeroFacture(String numeroFacture) { this.numeroFacture = numeroFacture; }

    public String getDateEmission() { return dateEmission; }
    public void setDateEmission(String dateEmission) { this.dateEmission = dateEmission; }

    public String getDatePaiement() { return datePaiement; }
    public void setDatePaiement(String datePaiement) { this.datePaiement = datePaiement; }

    public String getModePaiement() { return modePaiement; }
    public void setModePaiement(String modePaiement) { this.modePaiement = modePaiement; }

    public String getMontantEnLettres() { return montantEnLettres; }
    public void setMontantEnLettres(String montantEnLettres) { this.montantEnLettres = montantEnLettres; }

    public VendeurXML getVendeur() { return vendeur; }
    public void setVendeur(VendeurXML vendeur) { this.vendeur = vendeur; }

    public AcheteurXML getAcheteur() { return acheteur; }
    public void setAcheteur(AcheteurXML acheteur) { this.acheteur = acheteur; }

    public List<LigneFactureXML> getLignes() { return lignes; }
    public void setLignes(List<LigneFactureXML> lignes) { this.lignes = lignes; }

    public BigDecimal getTotalHT() { return totalHT; }
    public void setTotalHT(BigDecimal totalHT) { this.totalHT = totalHT; }

    public BigDecimal getMontantTVA() { return montantTVA; }
    public void setMontantTVA(BigDecimal montantTVA) { this.montantTVA = montantTVA; }

    public BigDecimal getTotalTTC() { return totalTTC; }
    public void setTotalTTC(BigDecimal totalTTC) { this.totalTTC = totalTTC; }
}