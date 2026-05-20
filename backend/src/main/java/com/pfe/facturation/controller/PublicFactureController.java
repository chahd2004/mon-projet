package com.pfe.facturation.controller;

import com.pfe.facturation.dto.response.FactureResponseDTO;
import com.pfe.facturation.dto.response.PublicFactureResponseDTO;
import com.pfe.facturation.service.FactureService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * Controller public pour la consultation du statut des factures via QR Code
 */
@RestController
@RequestMapping("/api/public/factures")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "http://localhost:4200")
public class PublicFactureController {

    private final FactureService factureService;

    @GetMapping("/{id}")
    public ResponseEntity<PublicFactureResponseDTO> getPublicFacture(@PathVariable Long id) {
        log.info("Consultation publique du statut de la facture ID: {}", id);
        
        FactureResponseDTO full = factureService.getById(id);
        
        // Filtrage manuel pour ne renvoyer que le strict nécessaire
        PublicFactureResponseDTO publicData = PublicFactureResponseDTO.builder()
                .id(full.getId())
                .numFact(full.getNumFact())
                .dateEmission(full.getDateEmission())
                .datePaiement(full.getDatePaiement())
                .acheteurNom(full.getAcheteurNom())
                .vendeurNom(full.getVendeurNom())
                .statut(full.getStatut())
                .totalTTC(full.getTotalTTC())
                .build();
        
        return ResponseEntity.ok(publicData);
    }
}
