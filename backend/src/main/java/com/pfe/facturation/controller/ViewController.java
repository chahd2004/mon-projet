package com.pfe.facturation.controller;

import com.pfe.facturation.dto.response.ClientResponseDTO;
import com.pfe.facturation.dto.response.FactureResponseDTO;
import com.pfe.facturation.dto.response.ProduitResponseDTO;
import com.pfe.facturation.entity.User;
import com.pfe.facturation.service.ClientService;
import com.pfe.facturation.service.FactureService;
import com.pfe.facturation.service.ProduitService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Contrôleur pour les utilisateurs avec le rôle ENTREPRISE_VIEWER.
 * Accès en lecture seule aux données de l'entreprise.
 */
@RestController
@RequestMapping("/api/viewer")
@PreAuthorize("hasAnyRole('ENTREPRISE_VIEWER', 'ENTREPRISE_MANAGER')")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:4200")
public class ViewController {

    private final FactureService factureService;
    private final ClientService clientService;
    private final ProduitService produitService;

    // ==================== FACTURES ====================

    @GetMapping("/factures")
    public ResponseEntity<List<FactureResponseDTO>> getAllFactures(
            @AuthenticationPrincipal User viewer) {

        if (viewer.getEntreprise() == null) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "Vous n'êtes pas associé à une entreprise");
        }

        List<FactureResponseDTO> factures = factureService.getFacturesByVendeur(viewer.getEntreprise().getId());
        return ResponseEntity.ok(factures);
    }

    @GetMapping("/factures/{id}")
    public ResponseEntity<FactureResponseDTO> getFactureById(
            @PathVariable Long id,
            @AuthenticationPrincipal User viewer) {

        if (viewer.getEntreprise() == null) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "Vous n'êtes pas associé à une entreprise");
        }

        FactureResponseDTO facture = factureService.getById(id);

        if (!facture.getVendeurId().equals(viewer.getEntreprise().getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "Cette facture n'appartient pas à votre entreprise");
        }

        return ResponseEntity.ok(facture);
    }

    // ==================== CLIENTS ====================

    @GetMapping("/clients")
    public ResponseEntity<List<ClientResponseDTO>> getAllClients(
            @AuthenticationPrincipal User viewer) {

        if (viewer.getEntreprise() == null) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "Vous n'êtes pas associé à une entreprise");
        }

        List<ClientResponseDTO> clients = clientService.findAll();
        return ResponseEntity.ok(clients);
    }

    // ==================== PRODUITS ====================

    @GetMapping("/produits")
    public ResponseEntity<List<ProduitResponseDTO>> getAllProduits(
            @AuthenticationPrincipal User viewer) {

        if (viewer.getEntreprise() == null) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "Vous n'êtes pas associé à une entreprise");
        }

        List<ProduitResponseDTO> produits = produitService.getProduitsByEmetteur(viewer.getEntreprise().getId());
        return ResponseEntity.ok(produits);
    }

    // ==================== TABLEAU DE BORD ====================

    @GetMapping("/dashboard")
    public ResponseEntity<Map<String, Object>> getDashboard(
            @AuthenticationPrincipal User viewer) {

        if (viewer.getEntreprise() == null) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "Vous n'êtes pas associé à une entreprise");
        }

        Map<String, Object> response = new HashMap<>();
        response.put("message", "Dashboard viewer - consultation seule");
        response.put("entreprise", viewer.getEntreprise().getRaisonSociale());
        response.put("role", viewer.getRole().name());

        return ResponseEntity.ok(response);
    }
}