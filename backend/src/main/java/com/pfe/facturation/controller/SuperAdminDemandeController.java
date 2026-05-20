package com.pfe.facturation.controller;

import com.pfe.facturation.dto.request.TraiterDemandeRequest;
import com.pfe.facturation.dto.response.DemandeDetailResponse;
import com.pfe.facturation.service.DemandeEmetteurService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import jakarta.validation.Valid;

/**
 * Controller pour la gestion des demandes par SUPER_ADMIN
 */
@RestController
@RequestMapping("/api/super-admin/demandes")
@RequiredArgsConstructor
@Slf4j
@PreAuthorize("hasRole('SUPER_ADMIN')")
public class SuperAdminDemandeController {

    private final DemandeEmetteurService demandeService;

    /**
     * Liste toutes les demandes (SUPER_ADMIN)
     * @return Liste complète des demandes
     */
    @GetMapping
    public ResponseEntity<List<DemandeDetailResponse>> getAllDemandes() {
        List<DemandeDetailResponse> demandes = demandeService.getAllDemandes();
        return ResponseEntity.ok(demandes);
    }

    /**
     * Liste toutes les demandes en attente
     * @return Liste des demandes avec statut REQUESTED
     */
    @GetMapping("/en-attente")
    public ResponseEntity<List<DemandeDetailResponse>> getDemandesEnAttente() {
        List<DemandeDetailResponse> demandes = demandeService.getDemandesEnAttente();
        return ResponseEntity.ok(demandes);
    }

    /**
     * Voir les détails d'une demande spécifique
     * @param id L'ID de la demande
     * @return Détails complets
     */
    @GetMapping("/{id}")
    public ResponseEntity<DemandeDetailResponse> getDemandeDetails(@PathVariable Long id) {
        DemandeDetailResponse demande = demandeService.getDemandeDetails(id);
        return ResponseEntity.ok(demande);
    }

    /**
     * Approuver une demande et créer automatiquement le compte
     * @param id L'ID de la demande
     * @param request Commentaire optionnel
     * @return Message de confirmation
     */
    @PostMapping("/{id}/approuver")
    public ResponseEntity<Map<String, String>> approuverDemande(
            @PathVariable Long id,
            @RequestBody(required = false) TraiterDemandeRequest request) {

        demandeService.approuverDemande(id, request);

        Map<String, String> response = new HashMap<>();
        response.put("message", "Demande approuvée avec succès");
        response.put("status", "APPROVED");

        return ResponseEntity.ok(response);
    }

    /**
     * Rejeter une demande avec commentaire obligatoire
     * @param id L'ID de la demande
     * @param request Commentaire obligatoire (raison du rejet)
     * @return Message de confirmation
     */
    @PostMapping("/{id}/rejeter")
    public ResponseEntity<Map<String, String>> rejeterDemande(
            @PathVariable Long id,
            @Valid @RequestBody TraiterDemandeRequest request) {

        demandeService.rejeterDemande(id, request);

        Map<String, String> response = new HashMap<>();
        response.put("message", "Demande rejetée");
        response.put("status", "REJECTED");

        return ResponseEntity.ok(response);
    }

    /**
     * Statistiques des demandes (optionnel)
     * @return Compteurs par statut
     */
    @GetMapping("/statistiques")
    public ResponseEntity<Map<String, Long>> getStatistiques() {
        // À implémenter si besoin
        return ResponseEntity.ok(new HashMap<>());
    }
}