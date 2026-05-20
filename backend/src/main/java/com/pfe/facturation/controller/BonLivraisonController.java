package com.pfe.facturation.controller;

import com.pfe.facturation.dto.request.BonLivraisonRequestDTO;
import com.pfe.facturation.dto.response.BonLivraisonResponseDTO;
import com.pfe.facturation.entity.User;
import com.pfe.facturation.enums.UserRole;
import com.pfe.facturation.service.BonLivraisonService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.http.MediaType;
import com.pfe.facturation.dto.request.SignatureRequestDTO;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/bon-livraisons")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:4200")
public class BonLivraisonController {

    private final BonLivraisonService bonLivraisonService;


    @GetMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ENTREPRISE_ADMIN', 'ENTREPRISE_MANAGER', 'ENTREPRISE_VIEWER')")
    public ResponseEntity<List<BonLivraisonResponseDTO>> getAll(
            @AuthenticationPrincipal User user) {

        if (user.getRole() == UserRole.SUPER_ADMIN) {
            return ResponseEntity.ok(bonLivraisonService.getAll());
        }

        if (user.getEntreprise() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Aucune entreprise associee");
        }

        return ResponseEntity.ok(bonLivraisonService.getByVendeur(user.getEntreprise().getId()));
    }


    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ENTREPRISE_ADMIN', 'ENTREPRISE_MANAGER', 'ENTREPRISE_VIEWER')")
    public ResponseEntity<BonLivraisonResponseDTO> getById(@PathVariable Long id) {
        return ResponseEntity.ok(bonLivraisonService.getById(id));
    }

    @GetMapping("/mes-livraisons")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<BonLivraisonResponseDTO>> getMesLivraisons(
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(bonLivraisonService.getBonLivraisonsByUser(user));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ENTREPRISE_ADMIN', 'ENTREPRISE_MANAGER')")
    public ResponseEntity<BonLivraisonResponseDTO> create(
            @Valid @RequestBody BonLivraisonRequestDTO dto,
            @AuthenticationPrincipal User user) {

        if (user.getEntreprise() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Aucune entreprise associee");
        }
        dto.setVendeurId(user.getEntreprise().getId());

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(bonLivraisonService.create(dto));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ENTREPRISE_ADMIN', 'ENTREPRISE_MANAGER')")
    public ResponseEntity<Void> delete(
            @PathVariable Long id,
            @AuthenticationPrincipal User user) {

        verifierDroitVendeur(id, user);

        bonLivraisonService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{id}/livrer")
    @PreAuthorize("hasAnyRole('ENTREPRISE_ADMIN', 'ENTREPRISE_MANAGER')")
    public ResponseEntity<BonLivraisonResponseDTO> marquerLivre(
            @PathVariable Long id,
            @AuthenticationPrincipal User user) {

        verifierDroitVendeur(id, user);

        return ResponseEntity.ok(bonLivraisonService.marquerLivre(id));
    }

    @PostMapping(value = "/signer-client", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<BonLivraisonResponseDTO> signerParClient(
            @RequestPart("p12File") MultipartFile p12File,
            @RequestParam("password") String password,
            @RequestParam("bonLivraisonId") Long bonLivraisonId) {

        SignatureRequestDTO request = new SignatureRequestDTO();
        request.setP12File(p12File);
        request.setPassword(password);
        request.setFactureId(bonLivraisonId);

        return ResponseEntity.ok(bonLivraisonService.signerParClient(request));
    }

    @GetMapping(value = "/{id}/xml-brut", produces = MediaType.APPLICATION_XML_VALUE)
    public ResponseEntity<String> getXmlBrut(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(bonLivraisonService.genererXml(id));
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Erreur génération XML", e);
        }
    }

    @PostMapping(value = "/{id}/xml-signe")
    public ResponseEntity<BonLivraisonResponseDTO> sauvegarderXmlSigne(
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {
        String xmlSigne = body.get("xmlSigne");
        if (xmlSigne == null || xmlSigne.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "XML signé manquant");
        }
        return ResponseEntity.ok(bonLivraisonService.sauvegarderXmlSigne(id, xmlSigne));
    }

    @PutMapping("/{id}/litige")
    @PreAuthorize("hasAnyRole('ENTREPRISE_ADMIN', 'ENTREPRISE_MANAGER')")
    public ResponseEntity<BonLivraisonResponseDTO> signalerLitige(
            @PathVariable Long id,
            @RequestBody Map<String, String> body,
            @AuthenticationPrincipal User user) {

        String motif = body.get("motif");
        if (motif == null || motif.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Le motif du litige est obligatoire");
        }

        verifierDroitVendeur(id, user);

        return ResponseEntity.ok(bonLivraisonService.signalerLitige(id, motif));
    }

    @PutMapping("/{id}/resoudre-litige")
    @PreAuthorize("hasAnyRole('ENTREPRISE_ADMIN', 'ENTREPRISE_MANAGER')")
    public ResponseEntity<BonLivraisonResponseDTO> resoudreLitige(
            @PathVariable Long id,
            @AuthenticationPrincipal User user) {

        verifierDroitVendeur(id, user);

        return ResponseEntity.ok(bonLivraisonService.resoudreLitige(id));
    }

    @PutMapping("/{id}/annuler")
    @PreAuthorize("hasAnyRole('ENTREPRISE_ADMIN', 'ENTREPRISE_MANAGER')")
    public ResponseEntity<BonLivraisonResponseDTO> annuler(
            @PathVariable Long id,
            @RequestBody Map<String, String> body,
            @AuthenticationPrincipal User user) {

        String raison = body.get("raison");
        if (raison == null || raison.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Le motif d'annulation est obligatoire");
        }

        verifierDroitVendeur(id, user);

        return ResponseEntity.ok(bonLivraisonService.annuler(id, raison));
    }

    @PutMapping("/{id}/cloturer")
    @PreAuthorize("hasAnyRole('ENTREPRISE_ADMIN', 'ENTREPRISE_MANAGER')")
    public ResponseEntity<BonLivraisonResponseDTO> cloturer(
            @PathVariable Long id,
            @RequestParam(value = "factureRef", defaultValue = "") String factureRef,
            @AuthenticationPrincipal User user) {

        verifierDroitVendeur(id, user);

        return ResponseEntity.ok(bonLivraisonService.cloturer(id, factureRef));
    }

    private void verifierDroitVendeur(Long blId, User user) {
        if (user.getEntreprise() == null) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Aucune entreprise associee");
        }
        BonLivraisonResponseDTO bl = bonLivraisonService.getById(blId);
        if (!bl.getVendeurId().equals(user.getEntreprise().getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "Vous n'etes pas le vendeur de ce bon de livraison");
        }
    }
}