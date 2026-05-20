package com.pfe.facturation.controller;

import com.pfe.facturation.dto.request.FactureRequestDTO;
import com.pfe.facturation.dto.response.FactureResponseDTO;
import com.pfe.facturation.entity.User;
import com.pfe.facturation.enums.UserRole;
import com.pfe.facturation.service.FactureService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.Collections;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/factures")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:4200")
public class FactureController {

    private final FactureService factureService;


    @GetMapping
    @PreAuthorize("hasRole('SUPER_ADMIN') or hasRole('ENTREPRISE_ADMIN') or hasRole('ENTREPRISE_MANAGER') or hasRole('ENTREPRISE_VIEWER')")
    public ResponseEntity<List<FactureResponseDTO>> getAll(@AuthenticationPrincipal User user) {

        // SUPER_ADMIN voit tout
        if (user.getRole() == UserRole.SUPER_ADMIN) {
            return ResponseEntity.ok(factureService.getAll());
        }


        if (user.getEntreprise() == null) {
            return ResponseEntity.ok(Collections.emptyList());
        }

        return ResponseEntity.ok(factureService.getFacturesByVendeur(user.getEntreprise().getId()));
    }

    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<FactureResponseDTO> getById(
            @PathVariable Long id,
            @AuthenticationPrincipal User user) {

        if (!factureService.isConcerned(id, user) && user.getRole() != UserRole.SUPER_ADMIN) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Accès non autorisé");
        }
        return ResponseEntity.ok(factureService.getById(id));
    }

    @GetMapping("/mes-achats")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<FactureResponseDTO>> getMesAchats(@AuthenticationPrincipal User user) {
        if (user.getEntreprise() != null) {
            return ResponseEntity.ok(factureService.getFacturesByAcheteurEmetteur(user.getEntreprise().getId()));
        }
        return ResponseEntity.ok(Collections.emptyList());
    }

    @GetMapping("/mes-ventes")
    @PreAuthorize("hasAnyRole('ENTREPRISE_ADMIN', 'ENTREPRISE_MANAGER')")
    public ResponseEntity<List<FactureResponseDTO>> getMesVentes(@AuthenticationPrincipal User user) {
        if (user.getEntreprise() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Aucune entreprise associée à cet utilisateur");
        }
        return ResponseEntity.ok(factureService.getFacturesByVendeur(user.getEntreprise().getId()));
    }

    //  ECRITURE : ENTREPRISE_VIEWER interdit
    @PostMapping
    @PreAuthorize("hasAnyRole('ENTREPRISE_ADMIN', 'ENTREPRISE_MANAGER')")
    public ResponseEntity<FactureResponseDTO> create(
            @Valid @RequestBody FactureRequestDTO dto,
            @AuthenticationPrincipal User user) {

        if (user.getEntreprise() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Aucune entreprise associée à cet utilisateur");
        }
        dto.setVendeurId(user.getEntreprise().getId());
        return ResponseEntity.status(HttpStatus.CREATED).body(factureService.create(dto));
    }

    //  ECRITURE : ENTREPRISE_VIEWER interdit
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ENTREPRISE_ADMIN', 'ENTREPRISE_MANAGER')")
    public ResponseEntity<FactureResponseDTO> update(
            @PathVariable Long id,
            @Valid @RequestBody FactureRequestDTO dto,
            @AuthenticationPrincipal User user) {

        verifierDroitVendeur(id, user);
        dto.setVendeurId(user.getEntreprise().getId());
        return ResponseEntity.ok(factureService.update(id, dto));
    }

    //  ECRITURE : ENTREPRISE_VIEWER interdit
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ENTREPRISE_ADMIN', 'ENTREPRISE_MANAGER')")
    public ResponseEntity<Void> delete(
            @PathVariable Long id,
            @AuthenticationPrincipal User user) {

        verifierDroitVendeur(id, user);
        factureService.delete(id);
        return ResponseEntity.noContent().build();
    }

    //  ECRITURE : ENTREPRISE_VIEWER interdit
    /**
     * Signe une facture (Passage de DRAFT à SIGNED).
     * Génère également le contenu XML initial.
     */
    @PutMapping("/{id}/signer")
    @PreAuthorize("hasAnyRole('ENTREPRISE_ADMIN', 'ENTREPRISE_MANAGER')")
    public ResponseEntity<FactureResponseDTO> signer(
            @PathVariable Long id,
            @AuthenticationPrincipal User user) {

        verifierDroitVendeur(id, user);
        return ResponseEntity.ok(factureService.signer(id));
    }

    //  ECRITURE : ENTREPRISE_VIEWER interdit
    /**
     * Envoie la facture au client (Passage de SIGNED à SENT).
     */
    @PutMapping("/{id}/envoyer")
    @PreAuthorize("hasAnyRole('ENTREPRISE_ADMIN', 'ENTREPRISE_MANAGER')")
    public ResponseEntity<FactureResponseDTO> envoyer(
            @PathVariable Long id,
            @AuthenticationPrincipal User user) {

        verifierDroitVendeur(id, user);
        return ResponseEntity.ok(factureService.envoyer(id));
    }

    //  ECRITURE : ENTREPRISE_VIEWER interdit
    /**
     * Marque la facture comme payée (Passage de SENT/SIGNED à PAID).
     */
    @PutMapping("/{id}/payer")
    @PreAuthorize("hasAnyRole('ENTREPRISE_ADMIN', 'ENTREPRISE_MANAGER')")
    public ResponseEntity<FactureResponseDTO> marquerPayee(
            @PathVariable Long id,
            @AuthenticationPrincipal User user) {

        verifierDroitVendeur(id, user);
        return ResponseEntity.ok(factureService.marquerPayee(id));
    }

    //  ECRITURE : ENTREPRISE_VIEWER interdit
    @PutMapping("/{id}/rejeter")
    @PreAuthorize("hasAnyRole('ENTREPRISE_ADMIN', 'ENTREPRISE_MANAGER')")
    public ResponseEntity<FactureResponseDTO> rejeter(
            @PathVariable Long id,
            @RequestBody Map<String, String> body,
            @AuthenticationPrincipal User user) {

        String raison = body.get("raison");
        if (raison == null || raison.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "La raison du rejet est obligatoire");
        }
        verifierDroitVendeur(id, user);
        return ResponseEntity.ok(factureService.rejeter(id, raison));
    }

    //  ECRITURE : ENTREPRISE_VIEWER interdit
    @PutMapping("/{id}/retour-brouillon")
    @PreAuthorize("hasAnyRole('ENTREPRISE_ADMIN', 'ENTREPRISE_MANAGER')")
    public ResponseEntity<FactureResponseDTO> retourEnBrouillon(
            @PathVariable Long id,
            @AuthenticationPrincipal User user) {

        verifierDroitVendeur(id, user);
        return ResponseEntity.ok(factureService.retourEnBrouillon(id));
    }

    //  ECRITURE : ENTREPRISE_VIEWER interdit
    /**
     * Annule la facture (Passage de SIGNED/SENT à CANCELLED).
     * Déclenche automatiquement la création d'un avoir (Credit Note).
     */
    @PutMapping("/{id}/annuler")
    @PreAuthorize("hasAnyRole('ENTREPRISE_ADMIN', 'ENTREPRISE_MANAGER')")
    public ResponseEntity<FactureResponseDTO> annuler(
            @PathVariable Long id,
            @AuthenticationPrincipal User user) {

        verifierDroitVendeur(id, user);
        return ResponseEntity.ok(factureService.annuler(id));
    }

    //  ECRITURE : ENTREPRISE_VIEWER interdit
    @PostMapping("/{id}/generer-xml")
    @PreAuthorize("hasAnyRole('ENTREPRISE_ADMIN', 'ENTREPRISE_MANAGER')")
    public ResponseEntity<FactureResponseDTO> genererXml(
            @PathVariable Long id,
            @AuthenticationPrincipal User user) {

        verifierDroitVendeur(id, user);
        return ResponseEntity.ok(factureService.genererXml(id));
    }

    @GetMapping("/{id}/xml")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<String> getXml(
            @PathVariable Long id,
            @AuthenticationPrincipal User user) {

        if (!factureService.isConcerned(id, user) && user.getRole() != UserRole.SUPER_ADMIN) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Accès non autorisé");
        }
        String xml = factureService.getXml(id);
        return ResponseEntity.ok()
                .header("Content-Type", "application/xml; charset=UTF-8")
                .header("Content-Disposition", "attachment; filename=\"facture-" + id + ".xml\"")
                .body(xml);
    }

    private void verifierDroitVendeur(Long factureId, User user) {
        if (user.getEntreprise() == null) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "Aucune entreprise associée à cet utilisateur");
        }
        FactureResponseDTO facture = factureService.getById(factureId);
        if (!facture.getVendeurId().equals(user.getEntreprise().getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "Vous n'êtes pas le vendeur de cette facture");
        }
    }
}