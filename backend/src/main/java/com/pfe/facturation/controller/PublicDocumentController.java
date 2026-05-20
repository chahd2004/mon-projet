package com.pfe.facturation.controller;

import com.pfe.facturation.dto.request.SignatureRequestDTO;
import com.pfe.facturation.dto.response.BonCommandeResponseDTO;
import com.pfe.facturation.dto.response.BonLivraisonResponseDTO;
import com.pfe.facturation.dto.response.DevisResponseDTO;
import com.pfe.facturation.service.BonCommandeService;
import com.pfe.facturation.service.BonLivraisonService;
import com.pfe.facturation.service.DevisService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;

@RestController
@RequestMapping("/api/public")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:4200")
public class PublicDocumentController {

    private final DevisService devisService;
    private final BonCommandeService bonCommandeService;
    private final BonLivraisonService bonLivraisonService;

    // =============================================
    // DEVIS
    // =============================================

    @GetMapping("/devis/{ref}")
    public ResponseEntity<DevisResponseDTO> getDevisByRef(@PathVariable String ref) {
        return ResponseEntity.ok(devisService.getByNumDevis(ref));
    }

    @PutMapping("/devis/{id}/accepter")
    public ResponseEntity<DevisResponseDTO> accepterDevis(@PathVariable Long id) {
        return ResponseEntity.ok(devisService.accepter(id));
    }

    @PutMapping("/devis/{id}/rejeter")
    public ResponseEntity<DevisResponseDTO> rejeterDevis(
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {
        String raison = body.get("raison");
        return ResponseEntity.ok(devisService.rejeter(id, raison));
    }

    // =============================================
    // BON DE COMMANDE
    // =============================================

    @GetMapping("/bon-commande/{ref}")
    public ResponseEntity<BonCommandeResponseDTO> getBCByRef(@PathVariable String ref) {
        return ResponseEntity.ok(bonCommandeService.getByNumBonCommande(ref));
    }

    @GetMapping(value = "/bon-commande/{id}/xml-brut", produces = MediaType.APPLICATION_XML_VALUE)
    public ResponseEntity<String> getBCXmlBrut(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(bonCommandeService.genererXml(id));
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Erreur génération XML", e);
        }
    }

    @PostMapping("/bon-commande/{id}/xml-signe")
    public ResponseEntity<BonCommandeResponseDTO> sauvegarderBCXmlSigne(
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {
        String xmlSigne = body.get("xmlSigne");
        return ResponseEntity.ok(bonCommandeService.sauvegarderXmlSigne(id, xmlSigne));
    }

    @PostMapping(value = "/bon-commande/signer-client", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<BonCommandeResponseDTO> signerBCParClient(
            @RequestPart("p12File") MultipartFile p12File,
            @RequestParam("password") String password,
            @RequestParam("bonCommandeId") Long bonCommandeId) {

        SignatureRequestDTO request = new SignatureRequestDTO();
        request.setP12File(p12File);
        request.setPassword(password);
        request.setFactureId(bonCommandeId);

        return ResponseEntity.ok(bonCommandeService.signerParClient(request));
    }

    // =============================================
    // BON DE LIVRAISON
    // =============================================

    @GetMapping("/bon-livraison/{ref}")
    public ResponseEntity<BonLivraisonResponseDTO> getBLByRef(@PathVariable String ref) {
        return ResponseEntity.ok(bonLivraisonService.getByNumBonLivraison(ref));
    }

    @GetMapping(value = "/bon-livraison/{id}/xml-brut", produces = MediaType.APPLICATION_XML_VALUE)
    public ResponseEntity<String> getBLXmlBrut(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(bonLivraisonService.genererXml(id));
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Erreur génération XML", e);
        }
    }

    @PostMapping("/bon-livraison/{id}/xml-signe")
    public ResponseEntity<BonLivraisonResponseDTO> sauvegarderBLXmlSigne(
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {
        String xmlSigne = body.get("xmlSigne");
        return ResponseEntity.ok(bonLivraisonService.sauvegarderXmlSigne(id, xmlSigne));
    }

    @PostMapping(value = "/bon-livraison/signer-client", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<BonLivraisonResponseDTO> signerBLParClient(
            @RequestPart("p12File") MultipartFile p12File,
            @RequestParam("password") String password,
            @RequestParam("bonLivraisonId") Long bonLivraisonId) {

        SignatureRequestDTO request = new SignatureRequestDTO();
        request.setP12File(p12File);
        request.setPassword(password);
        request.setFactureId(bonLivraisonId);

        return ResponseEntity.ok(bonLivraisonService.signerParClient(request));
    }
}
