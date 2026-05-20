package com.pfe.facturation.controller;

import com.pfe.facturation.dto.request.AvoirRequestDTO;
import com.pfe.facturation.dto.response.AvoirResponseDTO;
import com.pfe.facturation.entity.User;
import com.pfe.facturation.enums.UserRole;
import com.pfe.facturation.service.AvoirService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/avoirs")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:4200")
public class AvoirController {

    private final AvoirService avoirService;

    //  LECTURE : SUPER_ADMIN, ENTREPRISE_ADMIN, ENTREPRISE_VIEWER
    @GetMapping
    @PreAuthorize("hasRole('SUPER_ADMIN') or hasRole('ENTREPRISE_ADMIN') or hasRole('ENTREPRISE_MANAGER') or hasRole('ENTREPRISE_VIEWER')")
    public ResponseEntity<List<AvoirResponseDTO>> getAll(
            @AuthenticationPrincipal User user) {

        if (user.getRole() == UserRole.SUPER_ADMIN) {
            return ResponseEntity.ok(avoirService.getAll());
        }

        // ENTREPRISE_VIEWER / ENTREPRISE_ADMIN : lecture via entreprise
        if (user.getEntreprise() == null) {
            return ResponseEntity.ok(List.of());
        }
        return ResponseEntity.ok(avoirService.getByVendeur(user.getEntreprise().getId()));
    }

    //  LECTURE : SUPER_ADMIN, ENTREPRISE_ADMIN, EMETTEUR, ENTREPRISE_VIEWER
    @GetMapping("/{id}")
    @PreAuthorize("hasRole('SUPER_ADMIN') or hasRole('ENTREPRISE_ADMIN') or hasRole('ENTREPRISE_MANAGER') or hasRole('ENTREPRISE_VIEWER')")
    public ResponseEntity<AvoirResponseDTO> getById(@PathVariable Long id) {
        return ResponseEntity.ok(avoirService.getById(id));
    }

    // LECTURE : SUPER_ADMIN, ENTREPRISE_ADMIN, EMETTEUR, ENTREPRISE_VIEWER
    @GetMapping("/facture/{factureId}")
    @PreAuthorize("hasRole('SUPER_ADMIN') or hasRole('ENTREPRISE_ADMIN') or hasRole('ENTREPRISE_MANAGER') or hasRole('ENTREPRISE_VIEWER')")
    public ResponseEntity<List<AvoirResponseDTO>> getByFacture(
            @PathVariable Long factureId) {
        return ResponseEntity.ok(avoirService.getByFacture(factureId));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ENTREPRISE_ADMIN', 'ENTREPRISE_MANAGER')")
    public ResponseEntity<AvoirResponseDTO> create(
            @Valid @RequestBody AvoirRequestDTO dto) {
        return ResponseEntity.status(org.springframework.http.HttpStatus.CREATED)
                .body(avoirService.create(dto));
    }

    @PostMapping("/from-cancelled-facture/{factureId}")
    @PreAuthorize("hasAnyRole('ENTREPRISE_ADMIN', 'ENTREPRISE_MANAGER')")
    public ResponseEntity<AvoirResponseDTO> createFromCancelled(
            @PathVariable Long factureId) {
        return ResponseEntity.status(org.springframework.http.HttpStatus.CREATED)
                .body(avoirService.createFromCancelledFacture(factureId));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ENTREPRISE_ADMIN', 'ENTREPRISE_MANAGER')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        avoirService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/statistiques")
    @PreAuthorize("hasRole('SUPER_ADMIN') or hasRole('ENTREPRISE_ADMIN') or hasRole('ENTREPRISE_MANAGER') or hasRole('ENTREPRISE_VIEWER')")
    public ResponseEntity<Map<String, Object>> getStats(
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(avoirService.getStatistiques(user));
    }

    //  ECRITURE : ENTREPRISE_VIEWER interdit
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ENTREPRISE_ADMIN', 'ENTREPRISE_MANAGER')")
    public ResponseEntity<AvoirResponseDTO> update(
            @PathVariable Long id,
            @Valid @RequestBody AvoirRequestDTO dto) {
        return ResponseEntity.ok(avoirService.update(id, dto));
    }

    //  ECRITURE : ENTREPRISE_VIEWER interdit
    @PutMapping("/{id}/valider")
    @PreAuthorize("hasAnyRole('ENTREPRISE_ADMIN', 'ENTREPRISE_MANAGER')")
    public ResponseEntity<AvoirResponseDTO> valider(@PathVariable Long id) {
        return ResponseEntity.ok(avoirService.valider(id));
    }

    // ECRITURE : ENTREPRISE_VIEWER interdit
    @PutMapping("/{id}/envoyer")
    @PreAuthorize("hasAnyRole('ENTREPRISE_ADMIN', 'ENTREPRISE_MANAGER')")
    public ResponseEntity<AvoirResponseDTO> envoyer(@PathVariable Long id) {
        return ResponseEntity.ok(avoirService.envoyer(id));
    }

    // ECRITURE : ENTREPRISE_VIEWER interdit
    @PutMapping("/{id}/appliquer")
    @PreAuthorize("hasAnyRole('ENTREPRISE_ADMIN', 'ENTREPRISE_MANAGER')")
    public ResponseEntity<AvoirResponseDTO> appliquer(@PathVariable Long id) {
        return ResponseEntity.ok(avoirService.appliquer(id));
    }
}