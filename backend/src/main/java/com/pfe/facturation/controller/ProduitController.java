package com.pfe.facturation.controller;

import com.pfe.facturation.dto.request.ProduitRequestDTO;
import com.pfe.facturation.dto.response.ProduitResponseDTO;
import com.pfe.facturation.entity.User;
import com.pfe.facturation.enums.UserRole;
import com.pfe.facturation.service.ProduitService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/api/produits")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:4200")
public class ProduitController {

    private final ProduitService service;

    // ==================== CRUD COMPLET ====================

    /**
     * POST /produits - Créer un produit
     */
    @PostMapping
    @PreAuthorize("hasAnyRole('ENTREPRISE_ADMIN', 'ENTREPRISE_MANAGER')")
    public ResponseEntity<ProduitResponseDTO> create(
            @Valid @RequestBody ProduitRequestDTO request,
            @AuthenticationPrincipal User user) {

        if (user.getEntreprise() == null) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "Vous n'êtes pas associé à une entreprise");
        }
        request.setEntrepriseId(user.getEntreprise().getId());
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(request));
    }


    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ENTREPRISE_ADMIN', 'ENTREPRISE_MANAGER')")
    public ResponseEntity<ProduitResponseDTO> update(
            @PathVariable Long id,
            @Valid @RequestBody ProduitRequestDTO request,
            @AuthenticationPrincipal User user) {

        if (user.getEntreprise() == null) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "Vous n'êtes pas associé à une entreprise");
        }
        if (!service.isOwner(id, user.getEntreprise().getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "Ce produit ne vous appartient pas");
        }
        return ResponseEntity.ok(service.update(id, request));
    }


    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ENTREPRISE_ADMIN', 'ENTREPRISE_MANAGER')")
    public ResponseEntity<Void> delete(
            @PathVariable Long id,
            @AuthenticationPrincipal User user) {

        if (user.getEntreprise() == null) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "Vous n'êtes pas associé à une entreprise");
        }
        if (!service.isOwner(id, user.getEntreprise().getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "Ce produit ne vous appartient pas");
        }
        service.delete(id);
        return ResponseEntity.noContent().build();
    }

    // ==================== GESTION DE STOCK ====================

    @PutMapping("/{id}/stock")
    @PreAuthorize("hasAnyRole('ENTREPRISE_ADMIN', 'ENTREPRISE_MANAGER')")
    public ResponseEntity<ProduitResponseDTO> updateStock(
            @PathVariable Long id,
            @RequestParam Integer nouvelleQuantite,
            @AuthenticationPrincipal User user) {

        if (user.getEntreprise() == null) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "Vous n'êtes pas associé à une entreprise");
        }
        if (!service.isOwner(id, user.getEntreprise().getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "Ce produit ne vous appartient pas");
        }
        return ResponseEntity.ok(service.updateStock(id, nouvelleQuantite));
    }

    // ==================== LECTURE SEULE ====================

    @GetMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ENTREPRISE_ADMIN', 'ENTREPRISE_MANAGER', 'ENTREPRISE_VIEWER')")
    public ResponseEntity<List<ProduitResponseDTO>> getAll(
            @AuthenticationPrincipal User user) {

        if (user.getRole() == UserRole.SUPER_ADMIN) {
            return ResponseEntity.ok(service.findAll());
        }

        if (user.getEntreprise() == null) {
            return ResponseEntity.ok(List.of());
        }

        return ResponseEntity.ok(service.getProduitsByEmetteur(user.getEntreprise().getId()));
    }

    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ProduitResponseDTO> getById(@PathVariable Long id) {
        return ResponseEntity.ok(service.findById(id));
    }

    @GetMapping("/{id}/disponibilite")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Boolean> checkDisponibilite(
            @PathVariable Long id,
            @RequestParam int quantite) {
        return ResponseEntity.ok(service.checkDisponibilite(id, quantite));
    }

    @GetMapping("/stock-faible")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ENTREPRISE_ADMIN', 'ENTREPRISE_MANAGER', 'ENTREPRISE_VIEWER')")
    public ResponseEntity<List<ProduitResponseDTO>> getProduitsStockFaible(
            @AuthenticationPrincipal User user) {

        if (user.getRole() == UserRole.SUPER_ADMIN) {
            return ResponseEntity.ok(service.findAll());
        }

        if (user.getEntreprise() == null) {
            return ResponseEntity.ok(List.of());
        }

        return ResponseEntity.ok(service.getProduitsStockFaible(user.getEntreprise().getId()));
    }

    @GetMapping("/rupture-stock")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ENTREPRISE_ADMIN', 'ENTREPRISE_MANAGER', 'ENTREPRISE_VIEWER')")
    public ResponseEntity<List<ProduitResponseDTO>> getProduitsRuptureStock(
            @AuthenticationPrincipal User user) {

        if (user.getRole() == UserRole.SUPER_ADMIN) {
            return ResponseEntity.ok(service.findAll());
        }

        if (user.getEntreprise() == null) {
            return ResponseEntity.ok(List.of());
        }

        return ResponseEntity.ok(service.getProduitsRuptureStock(user.getEntreprise().getId()));
    }

    @GetMapping("/entreprise/{entrepriseId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<ProduitResponseDTO>> getByEntreprise(
            @PathVariable Long entrepriseId) {
        return ResponseEntity.ok(service.getProduitsByEmetteur(entrepriseId));
    }

    @GetMapping("/mes-produits")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ENTREPRISE_ADMIN', 'ENTREPRISE_MANAGER', 'ENTREPRISE_VIEWER')")
    public ResponseEntity<List<ProduitResponseDTO>> getMesProduits(
            @AuthenticationPrincipal User user) {

        if (user.getRole() == UserRole.SUPER_ADMIN) {
            return ResponseEntity.ok(service.findAll());
        }

        if (user.getEntreprise() == null) {
            return ResponseEntity.ok(List.of());
        }

        return ResponseEntity.ok(service.getProduitsByEmetteur(user.getEntreprise().getId()));
    }
}