package com.pfe.facturation.service;

import com.pfe.facturation.entity.Facture;
import com.pfe.facturation.entity.LigneFacture;
import com.pfe.facturation.xml.*;
import jakarta.xml.bind.JAXBContext;
import jakarta.xml.bind.JAXBException;
import jakarta.xml.bind.Marshaller;
import org.springframework.stereotype.Service;

import java.io.StringWriter;
import java.math.BigDecimal;
import java.util.stream.Collectors;

@Service
public class FactureXmlService {

    /**
     * Convertit une entite Facture en objet FactureXML.
     * Contient tous les champs requis pour le livrable XAdES.
     */
    public FactureXML convertToXmlObject(Facture facture) {
        FactureXML xml = new FactureXML();

        // champs d'identification de la facture
        xml.setNumeroFacture(facture.getNumFact());
        xml.setDateEmission(facture.getDateEmission().toString());
        if (facture.getDatePaiement() != null) {
            xml.setDatePaiement(facture.getDatePaiement().toString());
        }

        // mode de paiement
        if (facture.getModePaiement() != null) {
            xml.setModePaiement(facture.getModePaiement().name());
        }

        // montant en lettres
        if (facture.getMontantEnLettres() != null) {
            xml.setMontantEnLettres(facture.getMontantEnLettres());
        }

        // vendeur avec structure imbriquee
        VendeurXML vendeur = new VendeurXML();
        vendeur.setRaisonSociale(facture.getNomVendeur());
        vendeur.setAdresse(facture.getAdresseVendeur());
        vendeur.setEmail(facture.getEmailVendeur());
        vendeur.setTelephone(facture.getTelephoneVendeur());

        // matricule fiscal disponible uniquement depuis l'entite vendeur
        if (facture.getVendeur() != null && facture.getVendeur().getMatriculeFiscal() != null) {
            vendeur.setMatriculeFiscal(facture.getVendeur().getMatriculeFiscal());
        }
        xml.setVendeur(vendeur);

        // acheteur avec structure imbriquee
        AcheteurXML acheteur = new AcheteurXML();
        acheteur.setRaisonSociale(facture.getNomAcheteur());
        acheteur.setAdresse(facture.getAdresseAcheteur());
        acheteur.setEmail(facture.getEmailAcheteur());
        acheteur.setTelephone(facture.getTelephoneAcheteur());
        xml.setAcheteur(acheteur);

        // lignes de la facture
        if (facture.getLignes() != null) {
            xml.setLignes(facture.getLignes().stream()
                    .map(this::convertLigneToXml)
                    .collect(Collectors.toList()));
        }

        // totaux
        xml.setTotalHT(facture.getTotalHT());
        xml.setMontantTVA(facture.getMontantTVA());
        xml.setTotalTTC(facture.getTotalTTC());

        return xml;
    }

    /**
     * Convertit une ligne de facture en objet LigneFactureXML.
     */
    private LigneFactureXML convertLigneToXml(LigneFacture ligne) {
        LigneFactureXML ligneXml = new LigneFactureXML();

        if (ligne.getProduit() != null) {
            ligneXml.setDesignation(ligne.getProduit().getDesignation());
            ligneXml.setReference(ligne.getProduit().getReference());
            ligneXml.setPrixUnitaire(ligne.getProduit().getPrixUnitaire());
        }

        ligneXml.setQuantite(ligne.getQuantite());

        // calculer le montantHT de la ligne : quantite * prixUnitaire
        if (ligne.getProduit() != null && ligne.getProduit().getPrixUnitaire() != null) {
            ligneXml.setMontantHT(
                    ligne.getProduit().getPrixUnitaire()
                            .multiply(BigDecimal.valueOf(ligne.getQuantite()))
            );
        }

        return ligneXml;
    }

    /**
     * Transforme un objet FactureXML en chaine XML via JAXB.
     *
     */
    public String marshalToXml(FactureXML factureXML) {
        try {
            JAXBContext context = JAXBContext.newInstance(FactureXML.class);
            Marshaller marshaller = context.createMarshaller();

            // formater le XML avec indentation pour la lisibilite
            marshaller.setProperty(Marshaller.JAXB_FORMATTED_OUTPUT, true);
            marshaller.setProperty(Marshaller.JAXB_ENCODING, "UTF-8");

            StringWriter writer = new StringWriter();
            marshaller.marshal(factureXML, writer);
            return writer.toString();

        } catch (JAXBException e) {
            throw new RuntimeException("Erreur lors de la generation du XML: " + e.getMessage(), e);
        }
    }

    /**
     * Methode combinee : convertit l'entite directement en chaine XML.
     * Appele depuis FactureServiceImpl.signer().
     */
    public String generateXmlFromFacture(Facture facture) {
        FactureXML factureXML = convertToXmlObject(facture);
        return marshalToXml(factureXML);
    }
}