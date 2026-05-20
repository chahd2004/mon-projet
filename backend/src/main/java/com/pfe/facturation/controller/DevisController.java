package com.pfe.facturation.controller;

import com.pfe.facturation.dto.request.DevisRequestDTO;
import com.pfe.facturation.dto.response.DevisResponseDTO;
import com.pfe.facturation.entity.User;
import com.pfe.facturation.enums.UserRole;
import com.pfe.facturation.service.DevisService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/devis")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:4200")
public class DevisController {

    private final DevisService devisService;

    // ✅ LECTURE : SUPER_ADMIN, ENTREPRISE_ADMIN, EMETTEUR, ENTREPRISE_VIEWER
    @GetMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ENTREPRISE_ADMIN', 'ENTREPRISE_MANAGER', 'ENTREPRISE_VIEWER')")
    public ResponseEntity<List<DevisResponseDTO>> getAll(
            @AuthenticationPrincipal User user) {

        if (user.getRole() == UserRole.SUPER_ADMIN) {
            return ResponseEntity.ok(devisService.getAll());
        }

        if (user.getEntreprise() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Aucune entreprise associee");
        }

        return ResponseEntity.ok(devisService.getByVendeur(user.getEntreprise().getId()));
    }


    @GetMapping("/{id}")
    @PreAuthorize("hasRole('SUPER_ADMIN') or hasRole('ENTREPRISE_ADMIN') or hasRole('ENTREPRISE_MANAGER') or hasRole('ENTREPRISE_VIEWER')")
    public ResponseEntity<DevisResponseDTO> getById(@PathVariable Long id) {
        return ResponseEntity.ok(devisService.getById(id));
    }


    @GetMapping("/mes-devis")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<DevisResponseDTO>> getMesDevis(
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(devisService.getDevisByUser(user));
    }


    @PostMapping
    @PreAuthorize("hasAnyRole('ENTREPRISE_ADMIN', 'ENTREPRISE_MANAGER')")
    public ResponseEntity<DevisResponseDTO> create(
            @Valid @RequestBody DevisRequestDTO dto,
            @AuthenticationPrincipal User user) {

        if (user.getEntreprise() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Aucune entreprise associee");
        }
        dto.setVendeurId(user.getEntreprise().getId());

        return ResponseEntity.status(HttpStatus.CREATED).body(devisService.create(dto));
    }


    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ENTREPRISE_ADMIN', 'ENTREPRISE_MANAGER')")
    public ResponseEntity<DevisResponseDTO> update(
            @PathVariable Long id,
            @Valid @RequestBody DevisRequestDTO dto,
            @AuthenticationPrincipal User user) {

        verifierDroitVendeur(id, user);
        dto.setVendeurId(user.getEntreprise().getId());

        return ResponseEntity.ok(devisService.update(id, dto));
    }


    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ENTREPRISE_ADMIN', 'ENTREPRISE_MANAGER')")
    public ResponseEntity<Void> delete(
            @PathVariable Long id,
            @AuthenticationPrincipal User user) {

        verifierDroitVendeur(id, user);
        devisService.delete(id);
        return ResponseEntity.noContent().build();
    }


    @PutMapping("/{id}/envoyer")
    @PreAuthorize("hasAnyRole('ENTREPRISE_ADMIN', 'ENTREPRISE_MANAGER')")
    public ResponseEntity<DevisResponseDTO> envoyer(
            @PathVariable Long id,
            @AuthenticationPrincipal User user) {

        verifierDroitVendeur(id, user);
        return ResponseEntity.ok(devisService.envoyer(id));
    }


    @PutMapping("/{id}/accepter")
    @PreAuthorize("hasAnyRole('ENTREPRISE_ADMIN', 'ENTREPRISE_MANAGER')")
    public ResponseEntity<DevisResponseDTO> accepter(
            @PathVariable Long id,
            @AuthenticationPrincipal User user) {

        verifierDroitVendeur(id, user);

        return ResponseEntity.ok(devisService.accepter(id));
    }


    @PutMapping("/{id}/rejeter")
    @PreAuthorize("hasAnyRole('ENTREPRISE_ADMIN', 'ENTREPRISE_MANAGER')")
    public ResponseEntity<DevisResponseDTO> rejeter(
            @PathVariable Long id,
            @RequestBody Map<String, String> body,
            @AuthenticationPrincipal User user) {

        String raison = body.get("raison");
        if (raison == null || raison.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La raison du rejet est obligatoire");
        }

        verifierDroitVendeur(id, user);

        return ResponseEntity.ok(devisService.rejeter(id, raison));
    }


    @PutMapping("/{id}/expirer")
    @PreAuthorize("hasAnyRole('ENTREPRISE_ADMIN', 'ENTREPRISE_MANAGER')")
    public ResponseEntity<DevisResponseDTO> marquerExpire(
            @PathVariable Long id,
            @AuthenticationPrincipal User user) {

        verifierDroitVendeur(id, user);

        return ResponseEntity.ok(devisService.marquerExpire(id));
    }

    private void verifierDroitVendeur(Long devisId, User user) {
        if (user.getEntreprise() == null) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Aucune entreprise associee");
        }
        DevisResponseDTO devis = devisService.getById(devisId);
        if (!devis.getVendeurId().equals(user.getEntreprise().getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "Vous n'etes pas le vendeur de ce devis");
        }
    }
}