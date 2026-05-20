package com.pfe.facturation.controller;

import com.pfe.facturation.dto.request.EmetteurDemandeRequest;
import com.pfe.facturation.dto.response.EmetteurDemandeResponse;
import com.pfe.facturation.service.DemandeEmetteurService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

/**
 * Controller public pour les demandes de création d'entreprise
 * Accessible sans authentification
 */
@RestController
@RequestMapping("/api/public/demandes")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "http://localhost:4200")
public class PublicDemandeController {

    private final DemandeEmetteurService demandeService;

    /**
     * Soumettre une nouvelle demande de création d'entreprise
     * 
     * @param httpRequest Pour récupérer IP et user-agent
     * @return Confirmation de la demande
     */
    @PostMapping("/emetteur")
    public ResponseEntity<EmetteurDemandeResponse> soumettreDemande(
            @Valid @RequestBody EmetteurDemandeRequest request,
            HttpServletRequest httpRequest) {

        log.info("Réception d'une nouvelle demande pour: {}", request.getEmail());

        EmetteurDemandeResponse response = demandeService.soumettreDemande(request, httpRequest);

        return ResponseEntity.ok(response);
    }

    /**
     * Vérifier le statut d'une demande par email
     * 
     * @param email L'email de la demande
     * @return Le statut actuel
     */
    @GetMapping("/statut")
    public ResponseEntity<Map<String, String>> verifierStatut(@RequestParam String email) {
        String statut = demandeService.verifierStatutDemande(email);

        Map<String, String> response = new HashMap<>();
        response.put("email", email);
        response.put("statut", statut);

        return ResponseEntity.ok(response);
    }

    /**
     * Vérifier si une demande existe déjà pour cet email
     * 
     * @param email L'email à vérifier
     * @return true si existe
     */
    @GetMapping("/existe")
    public ResponseEntity<Map<String, Boolean>> existeDemande(@RequestParam String email) {
        boolean existe = demandeService.existsByEmail(email);

        Map<String, Boolean> response = new HashMap<>();
        response.put("existe", existe);

        return ResponseEntity.ok(response);
    }
}