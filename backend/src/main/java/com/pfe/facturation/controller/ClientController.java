package com.pfe.facturation.controller;

import com.pfe.facturation.dto.request.ClientRequestDTO;
import com.pfe.facturation.dto.response.ClientResponseDTO;
import com.pfe.facturation.entity.User;
import com.pfe.facturation.enums.UserRole;
import com.pfe.facturation.service.ClientService;
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
@RequestMapping("/api/clients")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:4200")
public class ClientController {

    private final ClientService service;



    @PostMapping
    @PreAuthorize("hasAnyRole('ENTREPRISE_ADMIN', 'ENTREPRISE_MANAGER')")
    public ResponseEntity<ClientResponseDTO> create(
            @Valid @RequestBody ClientRequestDTO request,
            @AuthenticationPrincipal User user) {
        // Lier automatiquement au compte connecté
        if (user != null && request.getUserId() == null) {
            request.setUserId(user.getId());
        }
        return new ResponseEntity<>(service.create(request), HttpStatus.CREATED);
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ENTREPRISE_ADMIN', 'ENTREPRISE_MANAGER', 'ENTREPRISE_VIEWER')")
    public ResponseEntity<List<ClientResponseDTO>> getAll(
            @AuthenticationPrincipal User user) {
        if (user.getRole() == UserRole.SUPER_ADMIN) {
            return ResponseEntity.ok(service.findAll());
        }
        return ResponseEntity.ok(service.findByEmetteurUserId(user.getId()));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ENTREPRISE_ADMIN', 'ENTREPRISE_MANAGER', 'ENTREPRISE_VIEWER')")
    public ResponseEntity<ClientResponseDTO> getById(
            @PathVariable Long id,
            @AuthenticationPrincipal User user) {
        ClientResponseDTO client = service.findById(id);
        return ResponseEntity.ok(client);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ENTREPRISE_ADMIN', 'ENTREPRISE_MANAGER')")
    public ResponseEntity<ClientResponseDTO> update(
            @PathVariable Long id,
            @Valid @RequestBody ClientRequestDTO request,
            @AuthenticationPrincipal User user) {
        // Lier automatiquement au compte connecté
        if (user != null && request.getUserId() == null) {
            request.setUserId(user.getId());
        }
        return ResponseEntity.ok(service.update(id, request));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ENTREPRISE_ADMIN', 'ENTREPRISE_MANAGER')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }



}