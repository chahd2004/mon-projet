package com.pfe.facturation.service.impl;

import com.pfe.facturation.dto.request.SignatureRequestDTO;
import com.pfe.facturation.dto.response.SignatureResponseDTO;
import com.pfe.facturation.entity.Facture;
import com.pfe.facturation.enums.StatutFacture;
import com.pfe.facturation.repository.FactureRepository;
import com.pfe.facturation.service.SignatureElectroniqueService;
import com.pfe.facturation.xml.FactureXML;
import com.pfe.facturation.xml.VendeurXML;
import com.pfe.facturation.xml.AcheteurXML;
import com.pfe.facturation.xml.LigneFactureXML;
import eu.europa.esig.dss.enumerations.DigestAlgorithm;
import eu.europa.esig.dss.enumerations.SignatureLevel;
import eu.europa.esig.dss.enumerations.SignaturePackaging;
import eu.europa.esig.dss.model.DSSDocument;
import eu.europa.esig.dss.model.InMemoryDocument;
import eu.europa.esig.dss.model.SignatureValue;
import eu.europa.esig.dss.model.ToBeSigned;
import eu.europa.esig.dss.token.Pkcs12SignatureToken;
import eu.europa.esig.dss.validation.CommonCertificateVerifier;
import eu.europa.esig.dss.xades.XAdESSignatureParameters;
import eu.europa.esig.dss.xades.signature.XAdESService;
import jakarta.annotation.PostConstruct;
import jakarta.xml.bind.JAXBContext;
import jakarta.xml.bind.Marshaller;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.bouncycastle.jce.provider.BouncyCastleProvider;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayOutputStream;
import java.io.StringWriter;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.security.KeyStore;
import java.security.Security;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;

@Service
@Slf4j
@RequiredArgsConstructor
public class SignatureElectroniqueServiceImpl implements SignatureElectroniqueService {

    private final FactureRepository factureRepository;

    // =========================================================
    // 1. INITIALISATION - Enregistrement de BouncyCastle
    // =========================================================
    @PostConstruct
    public void init() {
        if (Security.getProvider(BouncyCastleProvider.PROVIDER_NAME) == null) {
            Security.addProvider(new BouncyCastleProvider());
            log.info("BouncyCastle enregistré");
        }
    }

    // =========================================================
    // 2. MÉTHODE PRINCIPALE - Signer une facture
    // =========================================================
    @Override
    @Transactional
    public SignatureResponseDTO signerFacture(SignatureRequestDTO request) throws Exception {

        // Étape 1 : Récupérer la facture en base
        Facture facture = factureRepository.findById(request.getFactureId())
                .orElseThrow(() -> new RuntimeException("Facture non trouvée"));

        // Étape 2 : Vérifier qu'elle n'est pas déjà signée
        if (StatutFacture.SIGNED.equals(facture.getStatut())) {
            throw new RuntimeException("Facture déjà signée");
        }

        // Étape 3 : Charger le fichier .p12 uploadé par l'admin
        byte[] p12Bytes = request.getP12File().getBytes();
        Pkcs12SignatureToken token = new Pkcs12SignatureToken(p12Bytes,
                new KeyStore.PasswordProtection(request.getPassword().toCharArray()));

        // Étape 4 : Construire le XML de la facture
        String xmlOriginal = buildXML(facture);

        // Étape 5 : Signer le XML avec XAdES-B
        String xmlSigne = sign(xmlOriginal, token);

        // Étape 6 : Fermer le token (nettoyage)
        token.close();

        // Étape 7 : Sauvegarder le XML signé en base
        facture.setXmlContent(xmlSigne);
        facture.setStatut(StatutFacture.SIGNED);
        facture.setDateSignature(LocalDateTime.now());
        factureRepository.save(facture);

        // Étape 8 : Retourner la réponse
        return new SignatureResponseDTO(true, "Facture signée", facture.getId(),
                facture.getNumFact(), LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME), xmlSigne);
    }

    // =========================================================
    // 3. CONSTRUCTION DU XML (JAXB)
    // =========================================================
    private String buildXML(Facture f) throws Exception {

        // Créer l'objet racine
        FactureXML xml = new FactureXML();

        // Informations générales
        xml.setNumeroFacture(f.getNumFact());
        xml.setDateEmission(f.getDateEmission().toString());
        xml.setDatePaiement(f.getDatePaiement().toString());

        // Totaux
        xml.setTotalHT(f.getTotalHT());
        xml.setMontantTVA(f.getMontantTVA());
        xml.setTotalTTC(f.getTotalTTC());

        // Vendeur
        VendeurXML v = new VendeurXML();
        v.setRaisonSociale(f.getNomVendeur());
        v.setAdresse(f.getAdresseVendeur());
        v.setEmail(f.getEmailVendeur());
        v.setTelephone(f.getTelephoneVendeur());
        xml.setVendeur(v);

        // Acheteur
        AcheteurXML a = new AcheteurXML();
        a.setRaisonSociale(f.getNomAcheteur());
        a.setAdresse(f.getAdresseAcheteur());
        a.setEmail(f.getEmailAcheteur());
        a.setTelephone(f.getTelephoneAcheteur());
        xml.setAcheteur(a);

        // Lignes de facture
        xml.setLignes(new ArrayList<>());
        if (f.getLignes() != null) {
            f.getLignes().forEach(ligne -> {
                LigneFactureXML lx = new LigneFactureXML();
                lx.setQuantite(ligne.getQuantite());

                if (ligne.getProduit() != null) {
                    lx.setDesignation(ligne.getProduit().getDesignation());
                    lx.setReference(ligne.getProduit().getReference());
                    lx.setPrixUnitaire(ligne.getProduit().getPrixUnitaire());
                    // Montant HT = prix unitaire x quantité
                    lx.setMontantHT(ligne.getProduit().getPrixUnitaire()
                            .multiply(BigDecimal.valueOf(ligne.getQuantite())));
                }
                xml.getLignes().add(lx);
            });
        }

        // Convertir l'objet en chaîne XML
        StringWriter sw = new StringWriter();
        JAXBContext.newInstance(FactureXML.class).createMarshaller().marshal(xml, sw);
        return sw.toString();
    }

    // =========================================================
    // 4. SIGNATURE CRYPTOGRAPHIQUE (DSS)
    // =========================================================
    private String sign(String xml, Pkcs12SignatureToken token) throws Exception {

        // Paramètres de signature XAdES-B
        XAdESSignatureParameters params = new XAdESSignatureParameters();
        params.setSignatureLevel(SignatureLevel.XAdES_BASELINE_B);  // Niveau de base
        params.setSignaturePackaging(SignaturePackaging.ENVELOPED); // Signature dans le XML
        params.setDigestAlgorithm(DigestAlgorithm.SHA256);          // Algorithme de hachage
        params.setSigningCertificate(token.getKeys().get(0).getCertificate()); // Certificat

        // Service de signature XAdES
        XAdESService service = new XAdESService(new CommonCertificateVerifier());

        // Charger le document à signer
        DSSDocument doc = new InMemoryDocument(xml.getBytes(StandardCharsets.UTF_8), "facture.xml");

        // Étape 1 : Obtenir les données à signer
        ToBeSigned toSign = service.getDataToSign(doc, params);

        // Étape 2 : Signer avec la clé privée du .p12
        SignatureValue signature = token.sign(toSign, params.getDigestAlgorithm(), token.getKeys().get(0));

        // Étape 3 : Appliquer la signature au document
        DSSDocument signed = service.signDocument(doc, params, signature);

        // Retourner le XML signé
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        signed.writeTo(baos);
        return baos.toString(StandardCharsets.UTF_8);
    }
}