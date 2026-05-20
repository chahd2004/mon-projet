package com.pfe.facturation.controller;

import com.pfe.facturation.dto.request.ConversionRequestDTO;
import com.pfe.facturation.dto.response.*;
import com.pfe.facturation.entity.User;
import com.pfe.facturation.enums.UserRole;
import com.pfe.facturation.service.ConversionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/conversions")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:4200")
public class ConversionController {

    private final ConversionService conversionService;

    // POST /api/conversions/devis/{id}/vers-facture
    // Flux 2 : Devis --> Facture directe
    @PostMapping("/devis/{id}/vers-facture")
    @PreAuthorize("hasAnyRole('ENTREPRISE_ADMIN', 'ENTREPRISE_MANAGER')")
    public ResponseEntity<FactureResponseDTO> devisVersFacture(
            @PathVariable Long id,
            @Valid @RequestBody ConversionRequestDTO dto) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(conversionService.devisVersFacture(id, dto));
    }

    // POST /api/conversions/devis/{id}/vers-bon-commande
    // Flux 3 etape 1 : Devis --> Bon de Commande
    @PostMapping("/devis/{id}/vers-bon-commande")
    @PreAuthorize("hasAnyRole('ENTREPRISE_ADMIN', 'ENTREPRISE_MANAGER')")
    public ResponseEntity<BonCommandeResponseDTO> devisVersBonCommande(
            @PathVariable Long id,
            @Valid @RequestBody ConversionRequestDTO dto) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(conversionService.devisVersBonCommande(id, dto));
    }

    // POST /api/conversions/bon-commande/{id}/vers-commande
    // Flux 3 etape 2 : Bon de Commande --> Commande
    @PostMapping("/bon-commande/{id}/vers-commande")
    @PreAuthorize("hasAnyRole('ENTREPRISE_ADMIN', 'ENTREPRISE_MANAGER')")
    public ResponseEntity<CommandeResponseDTO> bonCommandeVersCommande(
            @PathVariable Long id,
            @Valid @RequestBody ConversionRequestDTO dto) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(conversionService.bonCommandeVersCommande(id, dto));
    }

    // POST /api/conversions/commande/{id}/vers-bon-livraison
    // Flux 3 etape 3a : Commande --> Bon de Livraison
    @PostMapping("/commande/{id}/vers-bon-livraison")
    @PreAuthorize("hasAnyRole('ENTREPRISE_ADMIN', 'ENTREPRISE_MANAGER')")
    public ResponseEntity<BonLivraisonResponseDTO> commandeVersBonLivraison(
            @PathVariable Long id,
            @Valid @RequestBody ConversionRequestDTO dto) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(conversionService.commandeVersBonLivraison(id, dto));
    }

    // POST /api/conversions/commande/{id}/vers-facture
    // Flux 3 etape 3b : Commande --> Facture directe (sans BL)
    @PostMapping("/commande/{id}/vers-facture")
    @PreAuthorize("hasAnyRole('ENTREPRISE_ADMIN', 'ENTREPRISE_MANAGER')")
    public ResponseEntity<FactureResponseDTO> commandeVersFacture(
            @PathVariable Long id,
            @Valid @RequestBody ConversionRequestDTO dto) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(conversionService.commandeVersFacture(id, dto));
    }

    // POST /api/conversions/bon-livraison/{id}/vers-facture
    // Flux 3 etape 4 : Bon de Livraison --> Facture
    @PostMapping("/bon-livraison/{id}/vers-facture")
    @PreAuthorize("hasAnyRole('ENTREPRISE_ADMIN', 'ENTREPRISE_MANAGER')")
    public ResponseEntity<FactureResponseDTO> bonLivraisonVersFacture(
            @PathVariable Long id,
            @Valid @RequestBody ConversionRequestDTO dto) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(conversionService.bonLivraisonVersFacture(id, dto));
    }
}