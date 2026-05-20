package com.pfe.facturation.controller;

import com.pfe.facturation.dto.request.ClientRequestDTO;
import com.pfe.facturation.dto.request.CreateCollaborateurRequest;
import com.pfe.facturation.dto.request.FactureRequestDTO;
import com.pfe.facturation.dto.request.ProduitRequestDTO;
import com.pfe.facturation.dto.response.ClientResponseDTO;
import com.pfe.facturation.dto.response.FactureResponseDTO;
import com.pfe.facturation.dto.response.ProduitResponseDTO;
import com.pfe.facturation.dto.response.UserResponseDTO;
import com.pfe.facturation.entity.User;
import com.pfe.facturation.enums.UserRole;
import com.pfe.facturation.service.ClientService;
import com.pfe.facturation.service.EmetteurService;
import com.pfe.facturation.service.FactureService;
import com.pfe.facturation.service.ProduitService;
import com.pfe.facturation.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;


@RestController
@RequestMapping("/api/entreprise-admin")
@PreAuthorize("hasRole('ENTREPRISE_ADMIN')")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "http://localhost:4200")
public class EntrepriseAdminController {

    private final UserService userService;
    private final ClientService clientService;
    private final EmetteurService emetteurService;
    private final FactureService factureService;
    private final ProduitService produitService;

    // ==================== GESTION DES COLLABORATEURS ====================

    /**
     * Liste tous les collaborateurs de l'entreprise

     */
    @GetMapping("/collaborateurs")
    public ResponseEntity<List<UserResponseDTO>> getCollaborateurs(
            @AuthenticationPrincipal User admin) {


        if (admin.getEntreprise() == null) {
            return ResponseEntity.ok(Collections.emptyList());
        }


        List<User> collaborateurs = userService.getCollaborateursByEntrepriseId(admin.getEntreprise().getId());

        List<UserResponseDTO> response = collaborateurs.stream()
                .filter(user -> user.getRole() == UserRole.ENTREPRISE_VIEWER || user.getRole() == UserRole.ENTREPRISE_MANAGER)
                .map(userService::convertToDTO)
                .collect(Collectors.toList());

        log.info("Nombre de collaborateurs trouvés pour l'entreprise {} : {}",
                admin.getEntreprise().getId(), response.size());

        return ResponseEntity.ok(response);
    }

    /**
     * Créer un nouveau collaborateur (ENTREPRISE_VIEWER)

     */
    @PostMapping("/collaborateurs")
    public ResponseEntity<UserResponseDTO> createCollaborateur(
            @AuthenticationPrincipal User admin,
            @Valid @RequestBody CreateCollaborateurRequest request) {


        if (admin.getEntreprise() == null) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "Vous n'êtes pas associé à une entreprise");
        }


        if (request.getRole() != UserRole.ENTREPRISE_VIEWER && request.getRole() != UserRole.ENTREPRISE_MANAGER) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Vous ne pouvez créer que des comptes avec les rôles CONSULTANT ou GÉRANT");
        }


        User collaborateur = userService.createCollaborateur(request, admin.getEntreprise());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(userService.convertToDTO(collaborateur));
    }

    /**
     * Supprimer un collaborateur
     */
    @DeleteMapping("/collaborateurs/{id}")
    public ResponseEntity<Void> deleteCollaborateur(
            @AuthenticationPrincipal User admin,
            @PathVariable Long id) {

        if (admin.getEntreprise() == null) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "Vous n'êtes pas associé à une entreprise");
        }

        // Vérifier que le collaborateur appartient bien à cette entreprise
        User collaborateur = userService.findById(id);
        if (collaborateur.getEntreprise() == null ||
                !collaborateur.getEntreprise().getId().equals(admin.getEntreprise().getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "Ce collaborateur n'appartient pas à votre entreprise");
        }

        userService.deleteUser(id);
        return ResponseEntity.noContent().build();
    }

    // ==================== GESTION DES PRODUITS ====================


    @GetMapping("/produits")
    public ResponseEntity<List<ProduitResponseDTO>> getMesProduits(
            @AuthenticationPrincipal User admin) {

        if (admin.getEntreprise() == null) {
            return ResponseEntity.ok(Collections.emptyList());
        }

        List<ProduitResponseDTO> produits = produitService.getProduitsByEmetteur(admin.getEntreprise().getId());
        return ResponseEntity.ok(produits);
    }


    @PostMapping("/produits")
    public ResponseEntity<ProduitResponseDTO> createProduit(
            @AuthenticationPrincipal User admin,
            @Valid @RequestBody ProduitRequestDTO request) {

        if (admin.getEntreprise() == null) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "Vous n'êtes pas associé à une entreprise");
        }

        request.setEntrepriseId(admin.getEntreprise().getId());
        ProduitResponseDTO produit = produitService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(produit);
    }


    @PutMapping("/produits/{id}")
    public ResponseEntity<ProduitResponseDTO> updateProduit(
            @AuthenticationPrincipal User admin,
            @PathVariable Long id,
            @Valid @RequestBody ProduitRequestDTO request) {

        if (admin.getEntreprise() == null) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "Vous n'êtes pas associé à une entreprise");
        }

        if (!produitService.isOwner(id, admin.getEntreprise().getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "Ce produit n'appartient pas à votre entreprise");
        }

        ProduitResponseDTO produit = produitService.update(id, request);
        return ResponseEntity.ok(produit);
    }


    @DeleteMapping("/produits/{id}")
    public ResponseEntity<Void> deleteProduit(
            @AuthenticationPrincipal User admin,
            @PathVariable Long id) {

        if (admin.getEntreprise() == null) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "Vous n'êtes pas associé à une entreprise");
        }

        if (!produitService.isOwner(id, admin.getEntreprise().getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "Ce produit n'appartient pas à votre entreprise");
        }

        produitService.delete(id);
        return ResponseEntity.noContent().build();
    }

    // ==================== GESTION DES CLIENTS ====================

    @GetMapping("/clients")
    public ResponseEntity<List<ClientResponseDTO>> getMesClients(
            @AuthenticationPrincipal User admin) {

        if (admin.getEntreprise() == null) {
            return ResponseEntity.ok(Collections.emptyList());
        }

        List<ClientResponseDTO> clients = clientService.findAll();
        return ResponseEntity.ok(clients);
    }

    @PostMapping("/clients")
    public ResponseEntity<ClientResponseDTO> createClient(
            @AuthenticationPrincipal User admin,
            @Valid @RequestBody ClientRequestDTO request) {

        if (admin.getEntreprise() == null) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "Vous n'êtes pas associé à une entreprise");
        }

        ClientResponseDTO client = clientService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(client);
    }

    // ==================== GESTION DES FACTURES ====================

    @GetMapping("/factures")
    public ResponseEntity<List<FactureResponseDTO>> getMesFactures(
            @AuthenticationPrincipal User admin) {

        if (admin.getEntreprise() == null) {
            return ResponseEntity.ok(Collections.emptyList());
        }

        List<FactureResponseDTO> factures = factureService.getFacturesByVendeur(admin.getEntreprise().getId());
        return ResponseEntity.ok(factures);
    }

    @PostMapping("/factures")
    public ResponseEntity<FactureResponseDTO> createFacture(
            @AuthenticationPrincipal User admin,
            @Valid @RequestBody FactureRequestDTO request) {

        if (admin.getEntreprise() == null) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "Vous n'êtes pas associé à une entreprise");
        }

        request.setVendeurId(admin.getEntreprise().getId());
        FactureResponseDTO facture = factureService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(facture);
    }

    @GetMapping("/factures/{id}")
    public ResponseEntity<FactureResponseDTO> getFactureById(
            @AuthenticationPrincipal User admin,
            @PathVariable Long id) {

        if (admin.getEntreprise() == null) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "Vous n'êtes pas associé à une entreprise");
        }

        FactureResponseDTO facture = factureService.getById(id);

        if (!facture.getVendeurId().equals(admin.getEntreprise().getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "Cette facture n'appartient pas à votre entreprise");
        }

        return ResponseEntity.ok(facture);
    }

    @PutMapping("/factures/{id}")
    public ResponseEntity<FactureResponseDTO> updateFacture(
            @AuthenticationPrincipal User admin,
            @PathVariable Long id,
            @Valid @RequestBody FactureRequestDTO request) {

        if (admin.getEntreprise() == null) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "Vous n'êtes pas associé à une entreprise");
        }

        FactureResponseDTO existingFacture = factureService.getById(id);
        if (!existingFacture.getVendeurId().equals(admin.getEntreprise().getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "Cette facture n'appartient pas à votre entreprise");
        }

        request.setVendeurId(admin.getEntreprise().getId());
        FactureResponseDTO facture = factureService.update(id, request);
        return ResponseEntity.ok(facture);
    }

    @DeleteMapping("/factures/{id}")
    public ResponseEntity<Void> deleteFacture(
            @AuthenticationPrincipal User admin,
            @PathVariable Long id) {

        if (admin.getEntreprise() == null) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "Vous n'êtes pas associé à une entreprise");
        }

        FactureResponseDTO existingFacture = factureService.getById(id);
        if (!existingFacture.getVendeurId().equals(admin.getEntreprise().getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "Cette facture n'appartient pas à votre entreprise");
        }

        factureService.delete(id);
        return ResponseEntity.noContent().build();
    }

    // ==================== TABLEAU DE BORD ====================

    @GetMapping("/dashboard")
    public ResponseEntity<?> getDashboard(@AuthenticationPrincipal User admin) {

        if (admin.getEntreprise() == null) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "Vous n'êtes pas associé à une entreprise");
        }

        return ResponseEntity.ok(emetteurService.getEmetteurDashboard(admin.getId()));
    }
}