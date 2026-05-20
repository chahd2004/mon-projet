package com.pfe.facturation.controller;

import com.pfe.facturation.dto.request.SignatureRequestDTO;
import com.pfe.facturation.dto.response.SignatureResponseDTO;
import com.pfe.facturation.entity.Facture;
import com.pfe.facturation.repository.FactureRepository;
import com.pfe.facturation.service.SignatureElectroniqueService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/signature")
@RequiredArgsConstructor
@Slf4j
public class SignatureController {

    private final SignatureElectroniqueService signatureService;
    private final FactureRepository factureRepository;

    @PostMapping(value = "/signer", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAnyRole('ENTREPRISE_ADMIN', 'ENTREPRISE_MANAGER')")
    public ResponseEntity<SignatureResponseDTO> signerFacture(
            @RequestPart("p12File") MultipartFile p12File,
            @RequestParam("password") String password,
            @RequestParam("factureId") Long factureId) {

        if (p12File == null || p12File.isEmpty()) {
            return ResponseEntity.badRequest().body(new SignatureResponseDTO(
                    false, "Le fichier .p12 est requis", factureId, null, null, null));
        }

        if (password == null || password.isBlank()) {
            return ResponseEntity.badRequest().body(new SignatureResponseDTO(
                    false, "Le mot de passe est requis", factureId, null, null, null));
        }

        String filename = p12File.getOriginalFilename();
        if (filename != null && !filename.toLowerCase().endsWith(".p12")
                && !filename.toLowerCase().endsWith(".pfx")) {
            return ResponseEntity.badRequest().body(new SignatureResponseDTO(
                    false, "Le fichier doit être au format .p12 ou .pfx", factureId, null, null, null));
        }

        try {
            SignatureRequestDTO request = new SignatureRequestDTO();
            request.setP12File(p12File);
            request.setPassword(password);
            request.setFactureId(factureId);

            SignatureResponseDTO response = signatureService.signerFacture(request);
            return ResponseEntity.ok(response);

        } catch (RuntimeException e) {
            log.warn("Erreur métier : {}", e.getMessage());
            return ResponseEntity.badRequest().body(new SignatureResponseDTO(
                    false, e.getMessage(), factureId, null, null, null));

        } catch (Exception e) {
            log.error("Erreur technique lors de la signature", e);
            String errorMsg = "Erreur technique : " + e.getMessage();
            if (e.getCause() != null) {
                errorMsg += " (Cause: " + e.getCause().getMessage() + ")";
            }
            return ResponseEntity.internalServerError().body(new SignatureResponseDTO(
                    false, errorMsg,
                    factureId, null, null, null));
        }
    }

    @GetMapping("/xml/{factureId}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ENTREPRISE_ADMIN', 'ENTREPRISE_MANAGER', 'ENTREPRISE_VIEWER')")
    public ResponseEntity<byte[]> telechargerXmlSigne(@PathVariable Long factureId) {

        Facture facture = factureRepository.findById(factureId)
                .orElseThrow(() -> new RuntimeException("Facture non trouvée"));

        if (facture.getXmlContent() == null || facture.getXmlContent().isBlank()) {
            return ResponseEntity.notFound().build();
        }

        byte[] xmlBytes = facture.getXmlContent().getBytes(java.nio.charset.StandardCharsets.UTF_8);
        String filename = "facture_" + facture.getNumFact() + "_signee.xml";

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .contentType(MediaType.APPLICATION_XML)
                .contentLength(xmlBytes.length)
                .body(xmlBytes);
    }

    @GetMapping("/statut/{factureId}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ENTREPRISE_ADMIN', 'ENTREPRISE_MANAGER', 'ENTREPRISE_VIEWER')")
    public ResponseEntity<Map<String, Object>> getStatutSignature(@PathVariable Long factureId) {

        return factureRepository.findById(factureId)
                .map(facture -> {
                    Map<String, Object> response = new HashMap<>();
                    response.put("factureId", facture.getId());
                    response.put("numero", facture.getNumFact());
                    response.put("statut", facture.getStatut());
                    response.put("estSignee", facture.getXmlContent() != null);
                    response.put("dateSignature", facture.getDateSignature());
                    return ResponseEntity.ok(response);
                })
                .orElse(ResponseEntity.notFound().build());
    }
}