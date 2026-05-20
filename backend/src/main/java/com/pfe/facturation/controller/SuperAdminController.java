package com.pfe.facturation.controller;

import com.pfe.facturation.dto.response.ClientResponseDTO;
import com.pfe.facturation.dto.response.EmetteurResponseDTO;
import com.pfe.facturation.dto.response.FactureResponseDTO;
import com.pfe.facturation.dto.response.UserResponseDTO;
import com.pfe.facturation.dto.request.UpdateUserRequest;
import com.pfe.facturation.entity.User;
import com.pfe.facturation.enums.AccountStatus;
import com.pfe.facturation.enums.UserRole;
import com.pfe.facturation.repository.EmetteurRepository;
import com.pfe.facturation.repository.UserRepository;
import com.pfe.facturation.service.ClientService;
import com.pfe.facturation.service.EmetteurService;
import com.pfe.facturation.service.FactureService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

/**
 * Contrôleur pour le SUPER_ADMIN (administrateur système)
 * Accès uniquement aux utilisateurs avec le rôle SUPER_ADMIN
 */
@RestController
@RequestMapping("/api/super-admin")
@PreAuthorize("hasRole('SUPER_ADMIN')")
@RequiredArgsConstructor
public class SuperAdminController {

    private final UserRepository userRepository;
    private final ClientService clientService;
    private final EmetteurService emetteurService;
    private final FactureService factureService;
    private final EmetteurRepository emetteurRepository;

    // ==================== GESTION DES UTILISATEURS ====================

    /**
     * Liste tous les utilisateurs du système
     */
    @GetMapping("/users")
    public ResponseEntity<List<UserResponseDTO>> getAllUsers() {
        List<User> users = userRepository.findAll();
        List<UserResponseDTO> usersDTO = users.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
        return ResponseEntity.ok(usersDTO);
    }

    /**
     * Détails d'un utilisateur spécifique
     */
    @GetMapping("/users/{id}")
    public ResponseEntity<UserResponseDTO> getUserById(@PathVariable Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé avec l'id: " + id));
        return ResponseEntity.ok(convertToDTO(user));
    }

    /**
     * Mettre à jour un utilisateur (super admin seulement)
     */
    @PutMapping("/users/{id}")
    public ResponseEntity<UserResponseDTO> updateUser(
            @PathVariable Long id,
            @RequestBody UpdateUserRequest request) {

        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé avec l'id: " + id));

        // Mise à jour des champs autorisés
        if (request.getNom() != null) user.setNom(request.getNom());
        if (request.getPrenom() != null) user.setPrenom(request.getPrenom());
        if (request.getTelephone() != null) user.setTelephone(request.getTelephone());
        if (request.getRole() != null) user.setRole(request.getRole());
        if (request.getAccountStatus() != null) user.setAccountStatus(request.getAccountStatus());

        if (request.getEmetteurId() != null) {
            com.pfe.facturation.entity.Emetteur emetteur = emetteurRepository.findById(request.getEmetteurId())
                    .orElseThrow(() -> new RuntimeException("Entreprise non trouvée avec l'id: " + request.getEmetteurId()));
            user.setEntreprise(emetteur);
        }

        User savedUser = userRepository.save(user);
        return ResponseEntity.ok(convertToDTO(savedUser));
    }

    /**
     * Activer/Désactiver un utilisateur
     */
    @PatchMapping("/users/{id}/status")
    public ResponseEntity<UserResponseDTO> changeUserStatus(
            @PathVariable Long id,
            @RequestParam AccountStatus status) {

        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé avec l'id: " + id));

        user.setAccountStatus(status);
        User savedUser = userRepository.save(user);
        return ResponseEntity.ok(convertToDTO(savedUser));
    }

    /**
     * Supprimer un utilisateur
     */
    @DeleteMapping("/users/{id}")
    public ResponseEntity<Void> deleteUser(@PathVariable Long id) {
        if (!userRepository.existsById(id)) {
            throw new RuntimeException("Utilisateur non trouvé avec l'id: " + id);
        }
        userRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    // ==================== LISTES DES DONNÉES ====================

    @GetMapping("/clients")
    public ResponseEntity<List<ClientResponseDTO>> getAllClients() {
        return ResponseEntity.ok(clientService.findAll());
    }

    @GetMapping("/emetteurs")
    public ResponseEntity<List<EmetteurResponseDTO>> getAllEmetteurs() {
        return ResponseEntity.ok(emetteurService.findAll());
    }

    @GetMapping("/factures")
    public ResponseEntity<List<FactureResponseDTO>> getAllFactures() {
        return ResponseEntity.ok(factureService.getAll());
    }

    // ==================== STATISTIQUES ====================

    @GetMapping("/statistiques")
    public ResponseEntity<DashboardStatsDTO> getStatistics() {
        long totalUsers = userRepository.count();
        long totalClients = clientService.count();
        long totalEmetteurs = emetteurService.count();
        long totalFactures = factureService.count();

        return ResponseEntity.ok(new DashboardStatsDTO(
                totalUsers, totalClients, totalEmetteurs, totalFactures
        ));
    }

    // ==================== CONVERSION ====================

    private UserResponseDTO convertToDTO(User user) {
        return UserResponseDTO.builder()
                .id(user.getId())
                .email(user.getEmail())
                .nom(user.getNom())
                .prenom(user.getPrenom())
                .telephone(user.getTelephone())
                .role(user.getRole())
                .accountStatus(user.getAccountStatus())
                .firstLogin(user.isFirstLogin())
                .enabled(user.isEnabled())
                .createdAt(user.getCreatedAt())
                .lastLoginDate(user.getLastLoginDate())
                .entrepriseId(user.getEntreprise() != null ? user.getEntreprise().getId() : null)
                .build();
    }

    // ==================== DTO INTERNES ====================

    public record DashboardStatsDTO(
            long totalUsers,
            long totalClients,
            long totalEmetteurs,
            long totalFactures
    ) {}
}