package com.pfe.facturation.controller;

import com.pfe.facturation.dto.auth.*;
import com.pfe.facturation.dto.request.UpdateUserRequest;
import com.pfe.facturation.entity.User;
import com.pfe.facturation.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * Contrôleur pour l'authentification.
 *
 * Rôle :
 * - Gérer l'inscription des nouveaux utilisateurs
 * - Gérer la connexion des utilisateurs existants
 * - Fournir les informations de l'utilisateur connecté
 * - Permettre le changement de mot de passe
 */
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    /**
     * Inscription d'un nouvel utilisateur
     * @param request Les données d'inscription
     * @return La réponse avec le token JWT
     */
    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        return ResponseEntity.ok(authService.register(request));
    }

    /**
     * Connexion d'un utilisateur
     * @param request Les identifiants de connexion
     * @return La réponse avec le token JWT
     */
    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.authenticate(request));
    }

    /**
     * Récupère les informations de l'utilisateur connecté
     * @param user L'utilisateur authentifié (injecté par Spring Security)
     * @return Les informations de l'utilisateur
     */
    @GetMapping("/me")
    public ResponseEntity<UserDTO> getCurrentUser(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(authService.getCurrentUser(user.getEmail()));
    }

    /**
     * Change le mot de passe de l'utilisateur connecté
     * @param request Les ancien et nouveau mots de passe
     * @param user L'utilisateur authentifié
     * @return Un message de confirmation
     */
    @PostMapping("/change-password")
    public ResponseEntity<Map<String, String>> changePassword(
            @Valid @RequestBody ChangePasswordRequest request,
            @AuthenticationPrincipal User user) {

        // Appel au service pour changer le mot de passe
        authService.changePassword(request, user.getEmail());

        // Retourne un message de confirmation
        return ResponseEntity.ok(Map.of(
                "message", "Mot de passe changé avec succès",
                "status", "SUCCESS"
        ));
    }

    /**
     * Met à jour le profil de l'utilisateur connecté
     * @param request Les nouvelles données du profil
     * @param user L'utilisateur authentifié
     * @return Les informations de l'utilisateur mises à jour
     */
    @PutMapping("/profile")
    public ResponseEntity<UserDTO> updateProfile(
            @Valid @RequestBody UpdateUserRequest request,
            @AuthenticationPrincipal User user) {

        return ResponseEntity.ok(authService.updateProfile(request, user.getEmail()));
    }
}