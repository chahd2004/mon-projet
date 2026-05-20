package com.pfe.facturation.xml;

import jakarta.xml.bind.annotation.XmlAccessType;
import jakarta.xml.bind.annotation.XmlAccessorType;
import jakarta.xml.bind.annotation.XmlElement;

@XmlAccessorType(XmlAccessType.FIELD)
public class VendeurXML {

    @XmlElement(name = "RaisonSociale")
    private String raisonSociale;

    @XmlElement(name = "MatriculeFiscal")
    private String matriculeFiscal;

    @XmlElement(name = "Adresse")
    private String adresse;

    @XmlElement(name = "Email")
    private String email;

    @XmlElement(name = "Telephone")
    private String telephone;

    public VendeurXML() {}

    public String getRaisonSociale() { return raisonSociale; }
    public void setRaisonSociale(String raisonSociale) { this.raisonSociale = raisonSociale; }

    public String getMatriculeFiscal() { return matriculeFiscal; }
    public void setMatriculeFiscal(String matriculeFiscal) { this.matriculeFiscal = matriculeFiscal; }

    public String getAdresse() { return adresse; }
    public void setAdresse(String adresse) { this.adresse = adresse; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getTelephone() { return telephone; }
    public void setTelephone(String telephone) { this.telephone = telephone; }
}