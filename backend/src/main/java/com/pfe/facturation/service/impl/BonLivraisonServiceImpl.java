package com.pfe.facturation.service.impl;

import com.pfe.facturation.dto.request.ConversionRequestDTO;
import com.pfe.facturation.enums.ModePaiement;

import com.pfe.facturation.dto.mapper.BonLivraisonMapper;
import com.pfe.facturation.dto.request.BonLivraisonRequestDTO;
import com.pfe.facturation.dto.request.SignatureRequestDTO;
import com.pfe.facturation.dto.response.BonLivraisonResponseDTO;
import com.pfe.facturation.entity.*;
import com.pfe.facturation.enums.StatutBonLivraison;
import com.pfe.facturation.enums.StatutCommande;
import com.pfe.facturation.enums.UserRole;
import com.pfe.facturation.exception.ResourceNotFoundException;
import com.pfe.facturation.repository.*;
import com.pfe.facturation.service.BonLivraisonService;
import com.pfe.facturation.service.ConversionService;
import com.pfe.facturation.service.DocumentEmailService;
import org.springframework.context.annotation.Lazy;
import com.pfe.facturation.xml.AcheteurXML;
import com.pfe.facturation.xml.BonLivraisonXML;
import com.pfe.facturation.xml.LigneLivraisonXML;
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
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@Transactional
public class BonLivraisonServiceImpl implements BonLivraisonService {

    private final BonLivraisonRepository bonLivraisonRepository;
    private final CommandeRepository commandeRepository;
    private final ProduitRepository produitRepository;
    private final ClientRepository clientRepository;
    private final EmetteurRepository emetteurRepository;
    private final BonLivraisonMapper bonLivraisonMapper;
    private final DocumentEmailService documentEmailService;
    private final ConversionService conversionService;

    public BonLivraisonServiceImpl(
            BonLivraisonRepository bonLivraisonRepository,
            CommandeRepository commandeRepository,
            ProduitRepository produitRepository,
            ClientRepository clientRepository,
            EmetteurRepository emetteurRepository,
            BonLivraisonMapper bonLivraisonMapper,
            DocumentEmailService documentEmailService,
            @Lazy ConversionService conversionService) {
        this.bonLivraisonRepository = bonLivraisonRepository;
        this.commandeRepository = commandeRepository;
        this.produitRepository = produitRepository;
        this.clientRepository = clientRepository;
        this.emetteurRepository = emetteurRepository;
        this.bonLivraisonMapper = bonLivraisonMapper;
        this.documentEmailService = documentEmailService;
        this.conversionService = conversionService;
    }

    // ===== CRUD =====

    @Override
    public BonLivraisonResponseDTO create(BonLivraisonRequestDTO dto) {
        BonLivraison bl = bonLivraisonMapper.toEntity(dto);

        if (bl.getLignes() != null) {
            bl.getLignes().forEach(ligne -> ligne.setBonLivraison(bl));
        }

        if (dto.getTypeAcheteur() == com.pfe.facturation.enums.EntityType.CLIENT) {
            Client client = clientRepository.findById(dto.getAcheteurId())
                    .orElseThrow(() -> new ResourceNotFoundException("Client non trouve: " + dto.getAcheteurId()));
            bl.setAcheteurClient(client);
        } else {
            Emetteur acheteur = emetteurRepository.findById(dto.getAcheteurId())
                    .orElseThrow(() -> new ResourceNotFoundException("Emetteur non trouve: " + dto.getAcheteurId()));
            bl.setAcheteurEmetteur(acheteur);
        }

        Emetteur vendeur = emetteurRepository.findById(dto.getVendeurId())
                .orElseThrow(() -> new ResourceNotFoundException("Vendeur non trouve: " + dto.getVendeurId()));
        bl.setVendeur(vendeur);

        bl.remplirInfosAcheteur();
        bl.remplirInfosVendeur();

        chargerProduitsDansLignes(bl);

        bl.setStatut(StatutBonLivraison.DRAFT);
        bl.setNumBonLivraison(genererNumeroBonLivraison());

        return bonLivraisonMapper.toDTO(bonLivraisonRepository.save(bl));
    }

    @Override
    public BonLivraisonResponseDTO getByNumBonLivraison(String numBonLivraison) {
        return bonLivraisonRepository.findByNumBonLivraison(numBonLivraison)
                .map(bonLivraisonMapper::toDTO)
                .orElseThrow(() -> new ResourceNotFoundException("Bon de livraison non trouve avec numero: " + numBonLivraison));
    }

    @Override
    public BonLivraisonResponseDTO getById(Long id) {
        return bonLivraisonMapper.toDTO(trouverBonLivraison(id));
    }

    @Override
    public List<BonLivraisonResponseDTO> getAll() {
        return bonLivraisonRepository.findAll().stream()
                .map(bonLivraisonMapper::toDTO)
                .collect(Collectors.toList());
    }

    @Override
    public void delete(Long id) {
        BonLivraison bl = trouverBonLivraison(id);
        if (bl.getStatut() != StatutBonLivraison.DRAFT) {
            throw new RuntimeException("Seul un bon de livraison en DRAFT peut etre supprime");
        }
        bonLivraisonRepository.deleteById(id);
    }

    // ===== TRANSITIONS DU CYCLE DE VIE =====

    @Override
    public BonLivraisonResponseDTO marquerLivre(Long id) {
        BonLivraison bl = trouverBonLivraison(id);
        if (bl.getStatut() != StatutBonLivraison.DRAFT) {
            throw new RuntimeException("Seul un bon de livraison en DRAFT peut etre marque livre");
        }
        bl.setDateLivraison(LocalDate.now());
        bl.setStatut(StatutBonLivraison.DELIVERED);
        BonLivraison saved = bonLivraisonRepository.save(bl);

        String emailClient = bl.getAcheteurClient() != null
                ? bl.getAcheteurClient().getEmail()
                : bl.getAcheteurEmetteur().getEmail();

        String numeroCommande = "N/A";
        documentEmailService.sendBonLivraisonEmail(
                emailClient,
                bl.getNomAcheteur(),
                bl.getNumBonLivraison(),
                numeroCommande);

        return bonLivraisonMapper.toDTO(saved);
    }

    // =============================================
    // SIGNATURE CLIENT AVEC UPLOAD .p12
    // =============================================
    @Override
    public BonLivraisonResponseDTO signerParClient(SignatureRequestDTO request) {

        Long bonLivraisonId = request.getFactureId();
        BonLivraison bl = trouverBonLivraison(bonLivraisonId);

        if (bl.getStatut() != StatutBonLivraison.DELIVERED &&
                bl.getStatut() != StatutBonLivraison.DISPUTE) {
            throw new RuntimeException("La signature est possible uniquement depuis DELIVERED ou DISPUTE");
        }

        try {
            byte[] p12Bytes = request.getP12File().getBytes();
            Pkcs12SignatureToken token = new Pkcs12SignatureToken(
                    p12Bytes,
                    new KeyStore.PasswordProtection(request.getPassword().toCharArray()));

            String xmlOriginal = construireXMLBonLivraison(bl);
            String xmlSigne = signerXML(xmlOriginal, token);
            bl.setXmlSigne(xmlSigne);
            bl.setStatut(StatutBonLivraison.SIGNED_CLIENT);

            bonLivraisonRepository.save(bl);

            // Mettre a jour la commande parente si elle existe
            mettreAJourCommandeStatut(bl.getCommandeSourceRef(), StatutCommande.DELIVERED);

            return bonLivraisonMapper.toDTO(bl);

        } catch (Exception e) {
            throw new RuntimeException("Erreur lors de la signature: " + e.getMessage(), e);
        }
    }

    @Override
    public String genererXml(Long id) throws Exception {
        BonLivraison bl = trouverBonLivraison(id);
        if (bl.getStatut() != StatutBonLivraison.DELIVERED &&
                bl.getStatut() != StatutBonLivraison.DISPUTE) {
            throw new RuntimeException("Seul un bon de livraison DELIVERED ou DISPUTE peut etre signe");
        }
        return construireXMLBonLivraison(bl);
    }

    @Override
    public BonLivraisonResponseDTO sauvegarderXmlSigne(Long id, String xmlSigne) {
        BonLivraison bl = trouverBonLivraison(id);
        if (bl.getStatut() != StatutBonLivraison.DELIVERED &&
                bl.getStatut() != StatutBonLivraison.DISPUTE) {
            throw new RuntimeException("Seul un bon de livraison DELIVERED ou DISPUTE peut etre signe");
        }
        bl.setXmlSigne(xmlSigne);
        bl.setStatut(StatutBonLivraison.SIGNED_CLIENT);
        BonLivraison saved = bonLivraisonRepository.save(bl);

        // Mettre a jour la commande parente si elle existe
        mettreAJourCommandeStatut(saved.getCommandeSourceRef(), StatutCommande.DELIVERED);

        return bonLivraisonMapper.toDTO(saved);
    }

    private void mettreAJourCommandeStatut(String commandeRef, StatutCommande nouveauStatut) {
        if (commandeRef == null || commandeRef.isBlank()) return;
        commandeRepository.findByNumCommande(commandeRef).ifPresent(cmd -> {
            cmd.setStatut(nouveauStatut);
            commandeRepository.save(cmd);
        });
    }

    @Override
    public BonLivraisonResponseDTO signalerLitige(Long id, String motif) {
        BonLivraison bl = trouverBonLivraison(id);
        if (bl.getStatut() != StatutBonLivraison.DELIVERED) {
            throw new RuntimeException("Un litige ne peut etre signale que depuis DELIVERED. Statut actuel: " + bl.getStatut());
        }
        if (motif == null || motif.isBlank()) {
            throw new RuntimeException("Le motif du litige est obligatoire");
        }
        bl.setStatut(StatutBonLivraison.DISPUTE);
        bl.setDisputeReason(motif);
        return bonLivraisonMapper.toDTO(bonLivraisonRepository.save(bl));
    }

    @Override
    public BonLivraisonResponseDTO resoudreLitige(Long id) {
        BonLivraison bl = trouverBonLivraison(id);
        if (bl.getStatut() != StatutBonLivraison.DISPUTE) {
            throw new RuntimeException("Seul un bon de livraison en DISPUTE peut etre resolu");
        }
        bl.setStatut(StatutBonLivraison.DELIVERED);
        bl.setDisputeReason(null);
        return bonLivraisonMapper.toDTO(bonLivraisonRepository.save(bl));
    }

    @Override
    public BonLivraisonResponseDTO annuler(Long id, String raison) {
        BonLivraison bl = trouverBonLivraison(id);
        if (bl.getStatut() != StatutBonLivraison.DRAFT &&
                bl.getStatut() != StatutBonLivraison.DELIVERED &&
                bl.getStatut() != StatutBonLivraison.SIGNED_CLIENT &&
                bl.getStatut() != StatutBonLivraison.DISPUTE) {
            throw new RuntimeException("L'annulation est possible depuis DRAFT, DELIVERED, SIGNED_CLIENT ou DISPUTE");
        }
        if (raison == null || raison.isBlank()) {
            throw new RuntimeException("Le motif d'annulation est obligatoire");
        }
        bl.setStatut(StatutBonLivraison.CANCELLED);
        bl.setCancellationReason(raison);
        return bonLivraisonMapper.toDTO(bonLivraisonRepository.save(bl));
    }

    @Override
    public BonLivraisonResponseDTO cloturer(Long id, String factureRef) {
        BonLivraison bl = trouverBonLivraison(id);
        if (bl.getStatut() == StatutBonLivraison.CLOSED) {
            if (factureRef != null && !factureRef.isBlank()) {
                bl.setFactureRef(factureRef);
                bonLivraisonRepository.save(bl);
            }
            return bonLivraisonMapper.toDTO(bl);
        }

        if (bl.getStatut() != StatutBonLivraison.SIGNED_CLIENT) {
            throw new RuntimeException("Seul un bon de livraison SIGNED_CLIENT peut etre cloture");
        }

        bl.setStatut(StatutBonLivraison.CLOSED);
        if (factureRef != null && !factureRef.isBlank()) {
            bl.setFactureRef(factureRef);
        }

        BonLivraison savedBl = bonLivraisonRepository.save(bl);

        verifierEtCloturerCommande(savedBl.getCommandeSourceRef());

        return bonLivraisonMapper.toDTO(savedBl);
    }

    // ===== RECHERCHE =====

    @Override
    public List<BonLivraisonResponseDTO> getByVendeur(Long vendeurId) {
        return bonLivraisonRepository.findByVendeurId(vendeurId).stream()
                .map(bonLivraisonMapper::toDTO)
                .collect(Collectors.toList());
    }

    @Override
    public List<BonLivraisonResponseDTO> getByAcheteurClient(Long clientId) {
        return bonLivraisonRepository.findByAcheteurClientId(clientId).stream()
                .map(bonLivraisonMapper::toDTO)
                .collect(Collectors.toList());
    }

    @Override
    public List<BonLivraisonResponseDTO> getByAcheteurEmetteur(Long emetteurId) {
        return bonLivraisonRepository.findByAcheteurEmetteurId(emetteurId).stream()
                .map(bonLivraisonMapper::toDTO)
                .collect(Collectors.toList());
    }

    @Override
    public List<BonLivraisonResponseDTO> getBonLivraisonsByUser(User user) {
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
        return bonLivraisonRepository.count();
    }

    // ===== METHODES PRIVEES EXISTANTES =====

    private void chargerProduitsDansLignes(BonLivraison bl) {
        if (bl.getLignes() == null)
            return;
        for (LigneBonLivraison ligne : bl.getLignes()) {
            if (ligne.getProduit() != null && ligne.getProduit().getId() != null) {
                Produit produit = produitRepository.findById(ligne.getProduit().getId())
                        .orElseThrow(() -> new ResourceNotFoundException(
                                "Produit non trouve: " + ligne.getProduit().getId()));
                ligne.setProduit(produit);
            }
        }
    }

    private void verifierEtCloturerCommande(String commandeRef) {
        if (commandeRef != null && !commandeRef.isBlank()) {
            List<BonLivraison> allBls = bonLivraisonRepository.findByCommandeSourceRef(commandeRef);
            boolean allClosed = allBls.stream().allMatch(b -> b.getStatut() == StatutBonLivraison.CLOSED);
            if (allClosed) {
                commandeRepository.findByNumCommande(commandeRef).ifPresent(commande -> {
                    if (commande.getStatut() != StatutCommande.CANCELLED
                            && commande.getStatut() != StatutCommande.DELIVERED) {
                        commande.setStatut(StatutCommande.DELIVERED);
                        commandeRepository.save(commande);
                    }
                });
            }
        }
    }

    private String genererNumeroBonLivraison() {
        int annee = LocalDate.now().getYear();
        String prefix = "BL-" + annee + "-";
        Optional<BonLivraison> last = bonLivraisonRepository
                .findTopByNumBonLivraisonStartingWithOrderByNumBonLivraisonDesc(prefix);
        int next = last.map(bl -> Integer.parseInt(bl.getNumBonLivraison().split("-")[2]) + 1).orElse(1);
        return prefix + String.format("%04d", next);
    }

    private BonLivraison trouverBonLivraison(Long id) {
        return bonLivraisonRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Bon de livraison non trouve: " + id));
    }

    // ===== METHODES POUR LA SIGNATURE =====

    private String construireXMLBonLivraison(BonLivraison bl) throws Exception {

        BonLivraisonXML blXML = new BonLivraisonXML();

        // Informations générales
        blXML.setNumeroBonLivraison(bl.getNumBonLivraison());
        blXML.setDateLivraison(bl.getDateLivraison() != null ? bl.getDateLivraison().toString() : "");
        blXML.setReferenceCommande(bl.getCommandeSourceRef() != null ? bl.getCommandeSourceRef() : "");
        blXML.setStatut(bl.getStatut().toString());

        // VENDEUR
        VendeurXML vendeurXML = new VendeurXML();
        if (bl.getVendeur() != null) {
            vendeurXML.setRaisonSociale(bl.getVendeur().getRaisonSociale());
            vendeurXML.setAdresse(bl.getVendeur().getAdresseComplete());
            vendeurXML.setEmail(bl.getVendeur().getEmail());
            vendeurXML.setTelephone(bl.getVendeur().getTelephone());
        } else {
            vendeurXML.setRaisonSociale(bl.getNomVendeur());
            vendeurXML.setEmail(bl.getEmailVendeur());
            vendeurXML.setTelephone(bl.getTelephoneVendeur());
        }
        blXML.setVendeur(vendeurXML);

        // ACHETEUR
        AcheteurXML acheteurXML = new AcheteurXML();
        if (bl.getAcheteurClient() != null) {
            acheteurXML.setRaisonSociale(bl.getAcheteurClient().getRaisonSociale());
            acheteurXML.setAdresse(bl.getAcheteurClient().getAdresseComplete());
            acheteurXML.setEmail(bl.getAcheteurClient().getEmail());
            acheteurXML.setTelephone(bl.getAcheteurClient().getTelephone());
        } else if (bl.getAcheteurEmetteur() != null) {
            acheteurXML.setRaisonSociale(bl.getAcheteurEmetteur().getRaisonSociale());
            acheteurXML.setAdresse(bl.getAcheteurEmetteur().getAdresseComplete());
            acheteurXML.setEmail(bl.getAcheteurEmetteur().getEmail());
            acheteurXML.setTelephone(bl.getAcheteurEmetteur().getTelephone());
        } else {
            acheteurXML.setRaisonSociale(bl.getNomAcheteur());
            acheteurXML.setAdresse(bl.getAdresseLivraison());
            acheteurXML.setEmail(bl.getEmailAcheteur());
            acheteurXML.setTelephone(bl.getTelephoneAcheteur());
        }
        blXML.setAcheteur(acheteurXML);

        // ARTICLES
        List<LigneLivraisonXML> articlesXML = new ArrayList<>();
        if (bl.getLignes() != null) {
            for (LigneBonLivraison ligne : bl.getLignes()) {
                LigneLivraisonXML articleXML = new LigneLivraisonXML();

                if (ligne.getProduit() != null) {
                    articleXML.setDesignation(ligne.getProduit().getDesignation());
                    articleXML.setReference(ligne.getProduit().getReference());
                    articleXML.setPrixUnitaire(ligne.getProduit().getPrixUnitaire());
                }

                articleXML.setQuantiteCommandee(ligne.getQuantite());
                articleXML.setQuantiteLivree(ligne.getQuantite());

                if (ligne.getProduit() != null && ligne.getProduit().getPrixUnitaire() != null && ligne.getQuantite() != null) {
                    BigDecimal montantHT = ligne.getProduit().getPrixUnitaire()
                            .multiply(BigDecimal.valueOf(ligne.getQuantite()));
                    articleXML.setMontantHT(montantHT);
                } else {
                    articleXML.setMontantHT(BigDecimal.ZERO);
                }

                articlesXML.add(articleXML);
            }
        }
        blXML.setArticles(articlesXML);

        // Conversion JAXB
        JAXBContext context = JAXBContext.newInstance(BonLivraisonXML.class);
        Marshaller marshaller = context.createMarshaller();
        marshaller.setProperty(Marshaller.JAXB_FORMATTED_OUTPUT, Boolean.TRUE);
        marshaller.setProperty(Marshaller.JAXB_ENCODING, "UTF-8");

        StringWriter sw = new StringWriter();
        marshaller.marshal(blXML, sw);

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
                "bon_livraison.xml");

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