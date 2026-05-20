package com.pfe.facturation.controller;

import com.pfe.facturation.dto.request.CommandeRequestDTO;
import com.pfe.facturation.dto.response.CommandeResponseDTO;
import com.pfe.facturation.entity.User;
import com.pfe.facturation.enums.UserRole;
import com.pfe.facturation.service.CommandeService;
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
@RequestMapping("/api/commandes")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:4200")
public class CommandeController {

    private final CommandeService commandeService;


    @GetMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ENTREPRISE_ADMIN', 'ENTREPRISE_MANAGER', 'ENTREPRISE_VIEWER')")
    public ResponseEntity<List<CommandeResponseDTO>> getAll(
            @AuthenticationPrincipal User user) {

        if (user.getRole() == UserRole.SUPER_ADMIN) {
            return ResponseEntity.ok(commandeService.getAll());
        }

        if (user.getEntreprise() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Aucune entreprise associee");
        }

        return ResponseEntity.ok(commandeService.getByVendeur(user.getEntreprise().getId()));
    }


    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ENTREPRISE_ADMIN', 'ENTREPRISE_MANAGER', 'ENTREPRISE_VIEWER')")
    public ResponseEntity<CommandeResponseDTO> getById(@PathVariable Long id) {
        return ResponseEntity.ok(commandeService.getById(id));
    }

    @GetMapping("/mes-commandes")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<CommandeResponseDTO>> getMesCommandes(
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(commandeService.getCommandesByUser(user));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ENTREPRISE_ADMIN', 'ENTREPRISE_MANAGER')")
    public ResponseEntity<CommandeResponseDTO> create(
            @Valid @RequestBody CommandeRequestDTO dto,
            @AuthenticationPrincipal User user) {

        if (user.getEntreprise() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Aucune entreprise associee");
        }
        dto.setVendeurId(user.getEntreprise().getId());

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(commandeService.create(dto));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ENTREPRISE_ADMIN', 'ENTREPRISE_MANAGER')")
    public ResponseEntity<CommandeResponseDTO> update(
            @PathVariable Long id,
            @Valid @RequestBody CommandeRequestDTO dto,
            @AuthenticationPrincipal User user) {

        verifierDroitVendeur(id, user);
        dto.setVendeurId(user.getEntreprise().getId());

        return ResponseEntity.ok(commandeService.update(id, dto));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ENTREPRISE_ADMIN', 'ENTREPRISE_MANAGER')")
    public ResponseEntity<Void> delete(
            @PathVariable Long id,
            @AuthenticationPrincipal User user) {

        verifierDroitVendeur(id, user);

        commandeService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{id}/confirmer")
    @PreAuthorize("hasAnyRole('ENTREPRISE_ADMIN', 'ENTREPRISE_MANAGER')")
    public ResponseEntity<CommandeResponseDTO> confirmer(
            @PathVariable Long id,
            @AuthenticationPrincipal User user) {

        verifierDroitVendeur(id, user);

        return ResponseEntity.ok(commandeService.confirmer(id));
    }

    @PutMapping("/{id}/demarrer")
    @PreAuthorize("hasAnyRole('ENTREPRISE_ADMIN', 'ENTREPRISE_MANAGER')")
    public ResponseEntity<CommandeResponseDTO> demarrer(
            @PathVariable Long id,
            @AuthenticationPrincipal User user) {

        verifierDroitVendeur(id, user);

        return ResponseEntity.ok(commandeService.demarrer(id));
    }

    @PutMapping("/{id}/livrer")
    @PreAuthorize("hasAnyRole('ENTREPRISE_ADMIN', 'ENTREPRISE_MANAGER')")
    public ResponseEntity<CommandeResponseDTO> marquerLivree(
            @PathVariable Long id,
            @AuthenticationPrincipal User user) {

        verifierDroitVendeur(id, user);

        return ResponseEntity.ok(commandeService.marquerLivree(id));
    }

    @PutMapping("/{id}/annuler")
    @PreAuthorize("hasAnyRole('ENTREPRISE_ADMIN', 'ENTREPRISE_MANAGER')")
    public ResponseEntity<CommandeResponseDTO> annuler(
            @PathVariable Long id,
            @RequestBody Map<String, String> body,
            @AuthenticationPrincipal User user) {

        String raison = body.get("raison");
        if (raison == null || raison.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La raison d'annulation est obligatoire");
        }

        verifierDroitVendeur(id, user);

        return ResponseEntity.ok(commandeService.annuler(id, raison));
    }

    private void verifierDroitVendeur(Long commandeId, User user) {
        if (user.getEntreprise() == null) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Aucune entreprise associee");
        }
        CommandeResponseDTO commande = commandeService.getById(commandeId);
        if (!commande.getVendeurId().equals(user.getEntreprise().getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "Vous n'etes pas le vendeur de cette commande");
        }
    }
}