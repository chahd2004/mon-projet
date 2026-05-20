package com.pfe.facturation.xml;

import jakarta.xml.bind.annotation.XmlAccessType;
import jakarta.xml.bind.annotation.XmlAccessorType;
import jakarta.xml.bind.annotation.XmlElement;
import jakarta.xml.bind.annotation.XmlElementWrapper;
import jakarta.xml.bind.annotation.XmlRootElement;

import java.math.BigDecimal;
import java.util.List;

@XmlRootElement(name = "BonLivraison")
@XmlAccessorType(XmlAccessType.FIELD)
public class BonLivraisonXML {

    @XmlElement(name = "NumeroBonLivraison")
    private String numeroBonLivraison;

    @XmlElement(name = "DateLivraison")
    private String dateLivraison;

    @XmlElement(name = "ReferenceCommande")
    private String referenceCommande;

    @XmlElement(name = "Vendeur")
    private VendeurXML vendeur;

    @XmlElement(name = "Acheteur")
    private AcheteurXML acheteur;

    @XmlElementWrapper(name = "Articles")
    @XmlElement(name = "Article")
    private List<LigneLivraisonXML> articles;

    @XmlElement(name = "Statut")
    private String statut;

    public BonLivraisonXML() {}

    // Getters et Setters
    public String getNumeroBonLivraison() { return numeroBonLivraison; }
    public void setNumeroBonLivraison(String numeroBonLivraison) { this.numeroBonLivraison = numeroBonLivraison; }

    public String getDateLivraison() { return dateLivraison; }
    public void setDateLivraison(String dateLivraison) { this.dateLivraison = dateLivraison; }

    public String getReferenceCommande() { return referenceCommande; }
    public void setReferenceCommande(String referenceCommande) { this.referenceCommande = referenceCommande; }

    public VendeurXML getVendeur() { return vendeur; }
    public void setVendeur(VendeurXML vendeur) { this.vendeur = vendeur; }

    public AcheteurXML getAcheteur() { return acheteur; }
    public void setAcheteur(AcheteurXML acheteur) { this.acheteur = acheteur; }

    public List<LigneLivraisonXML> getArticles() { return articles; }
    public void setArticles(List<LigneLivraisonXML> articles) { this.articles = articles; }

    public String getStatut() { return statut; }
    public void setStatut(String statut) { this.statut = statut; }
}
