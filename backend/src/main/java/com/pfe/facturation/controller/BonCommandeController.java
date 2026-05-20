package com.pfe.facturation.controller;

import com.pfe.facturation.dto.request.BonCommandeRequestDTO;
import com.pfe.facturation.dto.request.SignatureRequestDTO;
import com.pfe.facturation.dto.response.BonCommandeResponseDTO;
import com.pfe.facturation.entity.User;
import com.pfe.facturation.enums.UserRole;
import com.pfe.facturation.service.BonCommandeService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/bon-commandes")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:4200")
public class BonCommandeController {

    private final BonCommandeService bonCommandeService;





    @GetMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ENTREPRISE_ADMIN', 'ENTREPRISE_MANAGER', 'ENTREPRISE_VIEWER')")
    public ResponseEntity<List<BonCommandeResponseDTO>> getAll(
            @AuthenticationPrincipal User user) {

        if (user.getRole() == UserRole.SUPER_ADMIN) {
            return ResponseEntity.ok(bonCommandeService.getAll());
        }

        if (user.getEntreprise() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Aucune entreprise associee");
        }

        return ResponseEntity.ok(bonCommandeService.getByVendeur(user.getEntreprise().getId()));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ENTREPRISE_ADMIN', 'ENTREPRISE_MANAGER', 'ENTREPRISE_VIEWER')")
    public ResponseEntity<BonCommandeResponseDTO> getById(@PathVariable Long id) {
        return ResponseEntity.ok(bonCommandeService.getById(id));
    }

    @GetMapping("/mes-bons-commandes")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<BonCommandeResponseDTO>> getMesBonsCommandes(
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(bonCommandeService.getBonCommandesByUser(user));
    }




    @PostMapping
    @PreAuthorize("hasAnyRole('ENTREPRISE_ADMIN', 'ENTREPRISE_MANAGER')")
    public ResponseEntity<BonCommandeResponseDTO> create(
            @Valid @RequestBody BonCommandeRequestDTO dto,
            @AuthenticationPrincipal User user) {

        if (user.getEntreprise() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Aucune entreprise associee");
        }
        dto.setVendeurId(user.getEntreprise().getId());

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(bonCommandeService.create(dto));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ENTREPRISE_ADMIN', 'ENTREPRISE_MANAGER')")
    public ResponseEntity<BonCommandeResponseDTO> update(
            @PathVariable Long id,
            @Valid @RequestBody BonCommandeRequestDTO dto,
            @AuthenticationPrincipal User user) {

        verifierDroitVendeur(id, user);
        dto.setVendeurId(user.getEntreprise().getId());

        return ResponseEntity.ok(bonCommandeService.update(id, dto));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ENTREPRISE_ADMIN', 'ENTREPRISE_MANAGER')")
    public ResponseEntity<Void> delete(
            @PathVariable Long id,
            @AuthenticationPrincipal User user) {

        verifierDroitVendeur(id, user);

        bonCommandeService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{id}/envoyer")
    @PreAuthorize("hasAnyRole('ENTREPRISE_ADMIN', 'ENTREPRISE_MANAGER')")
    public ResponseEntity<BonCommandeResponseDTO> envoyer(
            @PathVariable Long id,
            @AuthenticationPrincipal User user) {

        verifierDroitVendeur(id, user);

        return ResponseEntity.ok(bonCommandeService.envoyer(id));
    }

    // =============================================
    // SIGNATURE CLIENT (avec upload .p12)
    // =============================================

    @PostMapping(value = "/signer-client", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<BonCommandeResponseDTO> signerParClient(
            @RequestPart("p12File") MultipartFile p12File,
            @RequestParam("password") String password,
            @RequestParam("bonCommandeId") Long bonCommandeId) {

        SignatureRequestDTO request = new SignatureRequestDTO();
        request.setP12File(p12File);
        request.setPassword(password);
        request.setFactureId(bonCommandeId);

        return ResponseEntity.ok(bonCommandeService.signerParClient(request));
    }

    @GetMapping(value = "/{id}/xml-brut", produces = MediaType.APPLICATION_XML_VALUE)
    public ResponseEntity<String> getXmlBrut(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(bonCommandeService.genererXml(id));
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Erreur génération XML", e);
        }
    }

    @PostMapping(value = "/{id}/xml-signe")
    public ResponseEntity<BonCommandeResponseDTO> sauvegarderXmlSigne(
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {
        String xmlSigne = body.get("xmlSigne");
        if (xmlSigne == null || xmlSigne.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "XML signé manquant");
        }
        return ResponseEntity.ok(bonCommandeService.sauvegarderXmlSigne(id, xmlSigne));
    }

    @PutMapping("/{id}/confirmer")
    @PreAuthorize("hasAnyRole('ENTREPRISE_ADMIN', 'ENTREPRISE_MANAGER')")
    public ResponseEntity<BonCommandeResponseDTO> confirmer(
            @PathVariable Long id,
            @AuthenticationPrincipal User user) {

        verifierDroitVendeur(id, user);

        return ResponseEntity.ok(bonCommandeService.confirmer(id));
    }

    @PutMapping("/{id}/annuler")
    @PreAuthorize("hasAnyRole('ENTREPRISE_ADMIN', 'ENTREPRISE_MANAGER')")
    public ResponseEntity<BonCommandeResponseDTO> annuler(
            @PathVariable Long id,
            @RequestBody Map<String, String> body,
            @AuthenticationPrincipal User user) {

        String raison = body.get("raison");
        if (raison == null || raison.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "La raison d'annulation est obligatoire");
        }

        verifierDroitVendeur(id, user);

        return ResponseEntity.ok(bonCommandeService.annuler(id, raison));
    }


    // METHODES PRIVEES


    private void verifierDroitVendeur(Long bcId, User user) {
        if (user.getEntreprise() == null) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Aucune entreprise associee");
        }
        BonCommandeResponseDTO bc = bonCommandeService.getById(bcId);
        if (!bc.getVendeurId().equals(user.getEntreprise().getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "Vous n'etes pas le vendeur de ce bon de commande");
        }
    }
}