package com.pfe.facturation.service.impl;

import com.pfe.facturation.dto.mapper.BonCommandeMapper;
import com.pfe.facturation.dto.request.BonCommandeRequestDTO;
import com.pfe.facturation.dto.request.LigneBonCommandeRequestDTO;
import com.pfe.facturation.dto.request.SignatureRequestDTO;
import com.pfe.facturation.dto.response.BonCommandeResponseDTO;
import com.pfe.facturation.entity.*;
import com.pfe.facturation.enums.StatutBonCommande;

import com.pfe.facturation.enums.UserRole;
import com.pfe.facturation.exception.ResourceNotFoundException;
import com.pfe.facturation.repository.*;
import com.pfe.facturation.service.BonCommandeService;
import com.pfe.facturation.service.DocumentEmailService;
import com.pfe.facturation.xml.AcheteurXML;
import com.pfe.facturation.xml.BonCommandeXML;
import com.pfe.facturation.xml.LigneBonCommandeXML;
import com.pfe.facturation.xml.VendeurXML;
import eu.europa.esig.dss.enumerations.DigestAlgorithm;
import eu.europa.esig.dss.enumerations.SignatureLevel;
import eu.europa.esig.dss.enumerations.SignaturePackaging;
import eu.europa.esig.dss.model.DSSDocument;
import eu.europa.esig.dss.model.InMemoryDocument;
import eu.europa.esig.dss.model.SignatureValue;
import eu.europa.esig.dss.model.ToBeSigned;
import eu.europa.esig.dss.token.DSSPrivateKeyEntry;
import eu.europa.esig.dss.token.Pkcs12SignatureToken;
import eu.europa.esig.dss.validation.CommonCertificateVerifier;
import eu.europa.esig.dss.xades.XAdESSignatureParameters;
import eu.europa.esig.dss.xades.signature.XAdESService;
import jakarta.transaction.Transactional;
import jakarta.xml.bind.JAXBContext;
import jakarta.xml.bind.Marshaller;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.StringWriter;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.security.KeyStore;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@Transactional
public class BonCommandeServiceImpl implements BonCommandeService {

    private final BonCommandeRepository bonCommandeRepository;
    private final ProduitRepository produitRepository;
    private final ClientRepository clientRepository;
    private final EmetteurRepository emetteurRepository;
    private final BonCommandeMapper bonCommandeMapper;
    private final DocumentEmailService documentEmailService;

    public BonCommandeServiceImpl(
            BonCommandeRepository bonCommandeRepository,
            ProduitRepository produitRepository,
            ClientRepository clientRepository,
            EmetteurRepository emetteurRepository,
            BonCommandeMapper bonCommandeMapper,
            DocumentEmailService documentEmailService) {
        this.bonCommandeRepository = bonCommandeRepository;
        this.produitRepository = produitRepository;
        this.clientRepository = clientRepository;
        this.emetteurRepository = emetteurRepository;
        this.bonCommandeMapper = bonCommandeMapper;
        this.documentEmailService = documentEmailService;
    }

    // ===== CRUD (inchangé) =====

    @Override
    public BonCommandeResponseDTO create(BonCommandeRequestDTO dto) {
        // ... votre code existant ...
        BonCommande bc = bonCommandeMapper.toEntity(dto);
        if (bc.getLignes() != null) {
            bc.getLignes().forEach(ligne -> ligne.setBonCommande(bc));
        }
        if (dto.getTypeAcheteur() == com.pfe.facturation.enums.EntityType.CLIENT) {
            Client client = clientRepository.findById(dto.getAcheteurId())
                    .orElseThrow(() -> new ResourceNotFoundException("Client non trouve: " + dto.getAcheteurId()));
            bc.setAcheteurClient(client);
        } else {
            Emetteur acheteur = emetteurRepository.findById(dto.getAcheteurId())
                    .orElseThrow(() -> new ResourceNotFoundException("Emetteur non trouve: " + dto.getAcheteurId()));
            bc.setAcheteurEmetteur(acheteur);
        }
        Emetteur vendeur = emetteurRepository.findById(dto.getVendeurId())
                .orElseThrow(() -> new ResourceNotFoundException("Vendeur non trouve: " + dto.getVendeurId()));
        bc.setVendeur(vendeur);
        bc.remplirInfosAcheteur();
        bc.remplirInfosVendeur();
        chargerProduitsEtCalculerLignes(bc);
        bc.setStatut(StatutBonCommande.DRAFT);
        bc.setNumBonCommande(genererNumeroBonCommande());
        bc.calculerTotaux();
        return bonCommandeMapper.toDTO(bonCommandeRepository.save(bc));
    }

    @Override
    public BonCommandeResponseDTO getByNumBonCommande(String numBonCommande) {
        return bonCommandeRepository.findByNumBonCommande(numBonCommande)
                .map(bonCommandeMapper::toDTO)
                .orElseThrow(() -> new ResourceNotFoundException("Bon de commande non trouve avec numero: " + numBonCommande));
    }

    @Override
    public BonCommandeResponseDTO getById(Long id) {
        return bonCommandeMapper.toDTO(trouverBonCommande(id));
    }

    @Override
    public List<BonCommandeResponseDTO> getAll() {
        return bonCommandeRepository.findAll().stream()
                .map(bonCommandeMapper::toDTO)
                .collect(Collectors.toList());
    }

    @Override
    public BonCommandeResponseDTO update(Long id, BonCommandeRequestDTO dto) {
        BonCommande bc = trouverBonCommande(id);
        if (bc.getStatut() != StatutBonCommande.DRAFT) {
            throw new RuntimeException("Seul un bon de commande en DRAFT peut etre modifie");
        }
        bc.setDateCreation(dto.getDateCreation());
        bc.setModePaiement(dto.getModePaiement());
        bc.getLignes().clear();
        for (LigneBonCommandeRequestDTO ligneDto : dto.getLignes()) {
            LigneBonCommande ligne = new LigneBonCommande();
            ligne.setBonCommande(bc);
            ligne.setQuantite(ligneDto.getQuantite());
            Produit produit = new Produit();
            produit.setId(ligneDto.getProduitId());
            ligne.setProduit(produit);
            bc.getLignes().add(ligne);
        }
        chargerProduitsEtCalculerLignes(bc);
        bc.calculerTotaux();
        return bonCommandeMapper.toDTO(bonCommandeRepository.save(bc));
    }

    @Override
    public void delete(Long id) {
        BonCommande bc = trouverBonCommande(id);
        if (bc.getStatut() != StatutBonCommande.DRAFT) {
            throw new RuntimeException("Seul un bon de commande en DRAFT peut etre supprime");
        }
        bonCommandeRepository.deleteById(id);
    }

    // ===== TRANSITIONS DU CYCLE DE VIE =====

    @Override
    public BonCommandeResponseDTO envoyer(Long id) {
        BonCommande bc = trouverBonCommande(id);
        if (bc.getStatut() != StatutBonCommande.DRAFT) {
            throw new RuntimeException("Seul un bon de commande en DRAFT peut etre envoye");
        }
        bc.setStatut(StatutBonCommande.SENT);
        BonCommande saved = bonCommandeRepository.save(bc);
        String emailClient = bc.getAcheteurClient() != null
                ? bc.getAcheteurClient().getEmail()
                : bc.getAcheteurEmetteur().getEmail();
        documentEmailService.sendBonCommandeEmail(
                emailClient,
                bc.getNomAcheteur(),
                bc.getNumBonCommande(),
                bc.getTotalTTC() + " TND"
        );
        return bonCommandeMapper.toDTO(saved);
    }

    // =============================================
    // SIGNATURE CLIENT AVEC UPLOAD .p12 (MODIFIÉE)
    // =============================================
    @Override
    public BonCommandeResponseDTO signerParClient(SignatureRequestDTO request) {

        Long bonCommandeId = request.getFactureId();
        BonCommande bc = trouverBonCommande(bonCommandeId);

        if (bc.getStatut() != StatutBonCommande.SENT) {
            throw new RuntimeException("Seul un bon de commande SENT peut etre signe par le client");
        }

        try {
            // 1. Charger le token .p12 uploadé par le client
            byte[] p12Bytes = request.getP12File().getBytes();
            Pkcs12SignatureToken token = new Pkcs12SignatureToken(
                    p12Bytes,
                    new KeyStore.PasswordProtection(request.getPassword().toCharArray())
            );

            // 2. Construire le XML du bon de commande
            String xmlOriginal = construireXMLBonCommande(bc);

            // 3. Signer le XML
            String xmlSigne = signerXML(xmlOriginal, token);

            // 4. Stocker le XML signé et mettre à jour le statut
            bc.setXmlSigne(xmlSigne);
            bc.setStatut(StatutBonCommande.SIGNED_CLIENT);
            bc.setDateSignature(LocalDateTime.now());
            bonCommandeRepository.save(bc);

            return bonCommandeMapper.toDTO(bc);

        } catch (Exception e) {
            throw new RuntimeException("Erreur lors de la signature: " + e.getMessage(), e);
        }
    }

    @Override
    public String genererXml(Long id) throws Exception {
        BonCommande bc = trouverBonCommande(id);
        if (bc.getStatut() != StatutBonCommande.SENT) {
            throw new RuntimeException("Seul un bon de commande SENT peut etre signe");
        }
        return construireXMLBonCommande(bc);
    }

    @Override
    public BonCommandeResponseDTO sauvegarderXmlSigne(Long id, String xmlSigne) {
        BonCommande bc = trouverBonCommande(id);
        if (bc.getStatut() != StatutBonCommande.SENT) {
            throw new RuntimeException("Seul un bon de commande SENT peut etre signe");
        }
        bc.setXmlSigne(xmlSigne);
        bc.setStatut(StatutBonCommande.SIGNED_CLIENT);
        bc.setDateSignature(LocalDateTime.now());
        return bonCommandeMapper.toDTO(bonCommandeRepository.save(bc));
    }

    @Override
    public BonCommandeResponseDTO confirmer(Long id) {
        BonCommande bc = trouverBonCommande(id);
        if (bc.getStatut() != StatutBonCommande.SIGNED_CLIENT) {
            throw new RuntimeException("Seul un bon de commande SIGNED_CLIENT peut etre confirme");
        }
        bc.setStatut(StatutBonCommande.CONFIRMED);
        return bonCommandeMapper.toDTO(bonCommandeRepository.save(bc));
    }

    @Override
    public BonCommandeResponseDTO annuler(Long id, String raison) {
        BonCommande bc = trouverBonCommande(id);
        if (bc.getStatut() != StatutBonCommande.DRAFT &&
                bc.getStatut() != StatutBonCommande.SENT &&
                bc.getStatut() != StatutBonCommande.SIGNED_CLIENT &&
                bc.getStatut() != StatutBonCommande.CONFIRMED) {
            throw new RuntimeException("L'annulation est possible depuis DRAFT, SENT, SIGNED_CLIENT ou CONFIRMED");
        }
        if (raison == null || raison.isBlank()) {
            throw new RuntimeException("La raison d'annulation est obligatoire");
        }
        bc.setStatut(StatutBonCommande.CANCELLED);
        bc.setCancellationReason(raison);
        return bonCommandeMapper.toDTO(bonCommandeRepository.save(bc));
    }

    @Override
    public BonCommandeResponseDTO marquerConverti(Long id, String documentRef) {
        BonCommande bc = trouverBonCommande(id);
        if (bc.getStatut() != StatutBonCommande.CONFIRMED) {
            throw new RuntimeException("Seul un bon de commande CONFIRMED peut etre converti");
        }
        bc.setStatut(StatutBonCommande.CONVERTED);
        bc.setDocumentConvertiRef(documentRef);
        return bonCommandeMapper.toDTO(bonCommandeRepository.save(bc));
    }

    // ===== RECHERCHE =====

    @Override
    public List<BonCommandeResponseDTO> getByVendeur(Long vendeurId) {
        return bonCommandeRepository.findByVendeurId(vendeurId).stream()
                .map(bonCommandeMapper::toDTO)
                .collect(Collectors.toList());
    }

    @Override
    public List<BonCommandeResponseDTO> getByAcheteurClient(Long clientId) {
        return bonCommandeRepository.findByAcheteurClientId(clientId).stream()
                .map(bonCommandeMapper::toDTO)
                .collect(Collectors.toList());
    }

    @Override
    public List<BonCommandeResponseDTO> getByAcheteurEmetteur(Long emetteurId) {
        return bonCommandeRepository.findByAcheteurEmetteurId(emetteurId).stream()
                .map(bonCommandeMapper::toDTO)
                .collect(Collectors.toList());
    }

    @Override
    public List<BonCommandeResponseDTO> getBonCommandesByUser(User user) {
        if (user == null) return List.of();
        if (user.getRole() == UserRole.ENTREPRISE_ADMIN || user.getRole() == UserRole.ENTREPRISE_MANAGER
                || user.getRole() == UserRole.ENTREPRISE_VIEWER) {
            if (user.getEntreprise() != null) {
                return getByVendeur(user.getEntreprise().getId());
            }
        }
        return List.of();
    }

    @Override
    public long count() {
        return bonCommandeRepository.count();
    }

    // ===== METHODES PRIVEES EXISTANTES =====

    private void chargerProduitsEtCalculerLignes(BonCommande bc) {
        if (bc.getLignes() == null) return;
        for (LigneBonCommande ligne : bc.getLignes()) {
            if (ligne.getProduit() != null && ligne.getProduit().getId() != null) {
                Produit produit = produitRepository.findById(ligne.getProduit().getId())
                        .orElseThrow(() -> new ResourceNotFoundException("Produit non trouve: " + ligne.getProduit().getId()));
                ligne.setProduit(produit);
                ligne.setPrixUnitaire(produit.getPrixUnitaire());
                ligne.calculerMontant();
            }
        }
    }

    private String genererNumeroBonCommande() {
        int annee = LocalDate.now().getYear();
        String prefix = "BC-" + annee + "-";
        Optional<BonCommande> last = bonCommandeRepository
                .findTopByNumBonCommandeStartingWithOrderByNumBonCommandeDesc(prefix);
        int next = last.map(bc -> Integer.parseInt(bc.getNumBonCommande().split("-")[2]) + 1).orElse(1);
        return prefix + String.format("%04d", next);
    }

    private BonCommande trouverBonCommande(Long id) {
        return bonCommandeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Bon de commande non trouve: " + id));
    }

    // ===== NOUVELLES METHODES POUR LA SIGNATURE =====

    private String construireXMLBonCommande(BonCommande bc) throws Exception {

        BonCommandeXML bcXML = new BonCommandeXML();

        // Informations générales
        bcXML.setNumeroBonCommande(bc.getNumBonCommande());
        bcXML.setDateCreation(bc.getDateCreation() != null ? bc.getDateCreation().toString() : "");

        // Mode de paiement
        if (bc.getModePaiement() != null) {
            bcXML.setModePaiement(bc.getModePaiement().toString());
        }

        // Totaux
        bcXML.setTotalHT(bc.getTotalHT() != null ? bc.getTotalHT() : BigDecimal.ZERO);
        bcXML.setMontantTVA(bc.getMontantTVA() != null ? bc.getMontantTVA() : BigDecimal.ZERO);
        bcXML.setTotalTTC(bc.getTotalTTC() != null ? bc.getTotalTTC() : BigDecimal.ZERO);

        // Vendeur
        VendeurXML vendeurXML = new VendeurXML();
        if (bc.getVendeur() != null) {
            vendeurXML.setRaisonSociale(bc.getVendeur().getRaisonSociale());
            vendeurXML.setMatriculeFiscal(bc.getVendeur().getMatriculeFiscal());
            vendeurXML.setAdresse(bc.getVendeur().getAdresseComplete());
            vendeurXML.setEmail(bc.getVendeur().getEmail());
            vendeurXML.setTelephone(bc.getVendeur().getTelephone());
        } else {
            vendeurXML.setRaisonSociale(bc.getNomVendeur());
            vendeurXML.setAdresse(bc.getAdresseVendeur());
            vendeurXML.setEmail(bc.getEmailVendeur());
            vendeurXML.setTelephone(bc.getTelephoneVendeur());
        }
        bcXML.setVendeur(vendeurXML);

        // Acheteur
        AcheteurXML acheteurXML = new AcheteurXML();
        if (bc.getAcheteurClient() != null) {
            acheteurXML.setRaisonSociale(bc.getAcheteurClient().getRaisonSociale());
            acheteurXML.setAdresse(bc.getAcheteurClient().getAdresseComplete());
            acheteurXML.setEmail(bc.getAcheteurClient().getEmail());
            acheteurXML.setTelephone(bc.getAcheteurClient().getTelephone());
        } else if (bc.getAcheteurEmetteur() != null) {
            acheteurXML.setRaisonSociale(bc.getAcheteurEmetteur().getRaisonSociale());
            acheteurXML.setAdresse(bc.getAcheteurEmetteur().getAdresseComplete());
            acheteurXML.setEmail(bc.getAcheteurEmetteur().getEmail());
            acheteurXML.setTelephone(bc.getAcheteurEmetteur().getTelephone());
        } else {
            acheteurXML.setRaisonSociale(bc.getNomAcheteur());
            acheteurXML.setAdresse(bc.getAdresseAcheteur());
            acheteurXML.setEmail(bc.getEmailAcheteur());
            acheteurXML.setTelephone(bc.getTelephoneAcheteur());
        }
        bcXML.setAcheteur(acheteurXML);

        // Lignes
        List<LigneBonCommandeXML> lignesXML = new ArrayList<>();
        if (bc.getLignes() != null) {
            for (LigneBonCommande ligne : bc.getLignes()) {
                LigneBonCommandeXML ligneXML = new LigneBonCommandeXML();
                ligneXML.setQuantite(ligne.getQuantite());
                if (ligne.getProduit() != null) {
                    ligneXML.setDesignation(ligne.getProduit().getDesignation());
                    ligneXML.setReference(ligne.getProduit().getReference());
                    BigDecimal prixUnitaire = ligne.getProduit().getPrixUnitaire() != null ?
                            ligne.getProduit().getPrixUnitaire() : BigDecimal.ZERO;
                    ligneXML.setPrixUnitaire(prixUnitaire);
                    ligneXML.setMontantHT(ligne.getMontantHT());
                }
                lignesXML.add(ligneXML);
            }
        }
        bcXML.setLignes(lignesXML);

        // Conversion en XML avec JAXB
        JAXBContext context = JAXBContext.newInstance(BonCommandeXML.class);
        Marshaller marshaller = context.createMarshaller();
        marshaller.setProperty(Marshaller.JAXB_FORMATTED_OUTPUT, Boolean.TRUE);
        marshaller.setProperty(Marshaller.JAXB_ENCODING, "UTF-8");

        StringWriter sw = new StringWriter();
        marshaller.marshal(bcXML, sw);

        return sw.toString();
    }

    private String signerXML(String xmlContent, Pkcs12SignatureToken token) throws Exception {

        DSSPrivateKeyEntry privateKey = token.getKeys().get(0);

        XAdESSignatureParameters parameters = new XAdESSignatureParameters();
        parameters.setSignatureLevel(SignatureLevel.XAdES_BASELINE_B);
        parameters.setSignaturePackaging(SignaturePackaging.ENVELOPED);
        parameters.setDigestAlgorithm(DigestAlgorithm.SHA256);
        parameters.setSigningCertificate(privateKey.getCertificate());
        parameters.setCertificateChain(privateKey.getCertificateChain());

        DSSDocument documentToSign = new InMemoryDocument(
                xmlContent.getBytes(StandardCharsets.UTF_8),
                "bon_commande.xml"
        );

        CommonCertificateVerifier certificateVerifier = new CommonCertificateVerifier();
        certificateVerifier.setCheckRevocationForUntrustedChains(false);

        XAdESService service = new XAdESService(certificateVerifier);

        ToBeSigned dataToSign = service.getDataToSign(documentToSign, parameters);
        SignatureValue signatureValue = token.sign(dataToSign, parameters.getDigestAlgorithm(), privateKey);
        DSSDocument signedDocument = service.signDocument(documentToSign, parameters, signatureValue);

        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        signedDocument.writeTo(baos);
        return baos.toString(StandardCharsets.UTF_8.name());
    }
}