package com.pfe.facturation.controller;

import com.pfe.facturation.dto.request.EmetteurRequestDTO;
import com.pfe.facturation.dto.response.EmetteurResponseDTO;
import com.pfe.facturation.entity.User;
import com.pfe.facturation.service.EmetteurService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

/**
 * Contrôleur pour la gestion des Émetteurs (Entreprises).

 */
@RestController
@RequestMapping("/api/emetteurs")
@CrossOrigin(origins = "http://localhost:4200")
@RequiredArgsConstructor
public class EmetteurController {

    private final EmetteurService service;

    // ==================== CRUD ADMIN (SUPER_ADMIN) ====================

    @PostMapping
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<EmetteurResponseDTO> create(
            @Valid @RequestBody EmetteurRequestDTO request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(request));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ENTREPRISE_ADMIN', 'ENTREPRISE_MANAGER', 'ENTREPRISE_VIEWER')")
    public ResponseEntity<List<EmetteurResponseDTO>> getAll() {
        return ResponseEntity.ok(service.findAll());
    }

    // ==================== PROFIL ENTREPRISE (POUR ADMIN/VIEWER CONNECTÉ) ====================

    /**
     * Récupère les informations de l'entreprise associée à l'utilisateur connecté.
     */
    @GetMapping("/my-profile")
    @PreAuthorize("hasAnyRole('ENTREPRISE_ADMIN', 'ENTREPRISE_MANAGER', 'ENTREPRISE_VIEWER')")
    public ResponseEntity<EmetteurResponseDTO> getMyProfile(
            @AuthenticationPrincipal User user) {

        if (user.getEntreprise() == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND,
                    "Aucune entreprise associée à votre compte");
        }

        return ResponseEntity.ok(service.findById(user.getEntreprise().getId()));
    }

    /**
     * Met à jour les informations de l'entreprise (réservé à l'ADMIN de l'entreprise).
     */
    @PutMapping("/my-profile")
    @PreAuthorize("hasAnyRole('ENTREPRISE_ADMIN', 'ENTREPRISE_MANAGER')")
    public ResponseEntity<EmetteurResponseDTO> updateMyProfile(
            @Valid @RequestBody EmetteurRequestDTO request,
            @AuthenticationPrincipal User user) {

        if (user.getEntreprise() == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND,
                    "Aucune entreprise associée à votre compte");
        }

        return ResponseEntity.ok(service.update(user.getEntreprise().getId(), request));
    }

    // ==================== REQUETES PAR ID ====================

    @GetMapping("/{id:\\d+}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ENTREPRISE_ADMIN', 'ENTREPRISE_MANAGER', 'ENTREPRISE_VIEWER')")
    public ResponseEntity<EmetteurResponseDTO> getById(@PathVariable Long id) {
        return ResponseEntity.ok(service.findById(id));
    }

    @PutMapping("/{id:\\d+}")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<EmetteurResponseDTO> update(
            @PathVariable Long id,
            @Valid @RequestBody EmetteurRequestDTO request) {
        return ResponseEntity.ok(service.update(id, request));
    }

    @DeleteMapping("/{id:\\d+}")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}