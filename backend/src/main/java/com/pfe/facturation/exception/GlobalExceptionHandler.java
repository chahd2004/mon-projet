package com.pfe.facturation.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.authentication.LockedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.dao.DataIntegrityViolationException;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    // ========== 1. VALIDATION DES FORMULAIRES ==========

    /**
     * Gère les erreurs de validation (@Valid)
     * Retourne la liste des champs en erreur avec leurs messages
     */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> handleValidation(
            MethodArgumentNotValidException ex) {

        Map<String, String> errors = new HashMap<>();
        ex.getBindingResult().getFieldErrors()
                .forEach(error -> errors.put(error.getField(), error.getDefaultMessage()));

        Map<String, Object> response = new HashMap<>();
        response.put("timestamp", LocalDateTime.now());
        response.put("status", HttpStatus.BAD_REQUEST.value());
        response.put("errors", errors);
        response.put("message", "Erreur de validation");

        return ResponseEntity.badRequest().body(response);
    }

    // ========== 2. RESSOURCES NON TROUVÉES ==========

    /**
     * Gère les ressources non trouvées (404)
     */
    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<Map<String, Object>> handleNotFound(ResourceNotFoundException ex) {
        Map<String, Object> response = new HashMap<>();
        response.put("timestamp", LocalDateTime.now());
        response.put("status", HttpStatus.NOT_FOUND.value());
        response.put("message", ex.getMessage());
        response.put("error", "Ressource non trouvée");

        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
    }

    // ========== 3. DOUBLONS / CONFLITS ==========

    /**
     * Gère les tentatives de création de ressources déjà existantes
     */
    @ExceptionHandler(DuplicateResourceException.class)
    public ResponseEntity<Map<String, Object>> handleDuplicate(DuplicateResourceException ex) {
        Map<String, Object> response = new HashMap<>();
        response.put("timestamp", LocalDateTime.now());
        response.put("status", HttpStatus.CONFLICT.value());
        response.put("message", ex.getMessage());
        response.put("error", "Conflit - Donnée déjà existante");

        return ResponseEntity.status(HttpStatus.CONFLICT).body(response);
    }

    /**
     * Gère les violations d'intégrité de la base de données (unique constraints)
     */
    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<Map<String, Object>> handleDataIntegrityViolation(DataIntegrityViolationException ex) {
        Map<String, Object> response = new HashMap<>();
        response.put("timestamp", LocalDateTime.now());
        response.put("status", HttpStatus.CONFLICT.value());
        
        String detailMessage = ex.getMostSpecificCause().getMessage();
        String userFriendlyMessage = "Conflit - Une donnée identique existe déjà.";
        
        if (detailMessage != null) {
            if (detailMessage.contains("UK_") || detailMessage.toLowerCase().contains("duplicate entry")) {
                if (detailMessage.toLowerCase().contains("email")) {
                    userFriendlyMessage = "Cet email est déjà utilisé.";
                } else if (detailMessage.toLowerCase().contains("reference") || detailMessage.toLowerCase().contains("ref")) {
                    userFriendlyMessage = "Cette référence est déjà utilisée.";
                } else {
                    userFriendlyMessage = "Cette donnée existe déjà dans le système.";
                }
            }
        }
        
        response.put("message", userFriendlyMessage);
        response.put("error", "Conflit d'intégrité");

        return ResponseEntity.status(HttpStatus.CONFLICT).body(response);
    }

    // ========== 4. AUTHENTIFICATION ==========

    /**
     * Gère les identifiants incorrects (login)
     */
    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<Map<String, Object>> handleBadCredentials(BadCredentialsException ex) {
        Map<String, Object> response = new HashMap<>();
        response.put("timestamp", LocalDateTime.now());
        response.put("status", HttpStatus.UNAUTHORIZED.value());
        response.put("message", "Email ou mot de passe incorrect");
        response.put("error", "Authentification échouée");

        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);
    }

    /**
     * Gère les comptes désactivés
     */
    @ExceptionHandler(DisabledException.class)
    public ResponseEntity<Map<String, Object>> handleDisabled(DisabledException ex) {
        Map<String, Object> response = new HashMap<>();
        response.put("timestamp", LocalDateTime.now());
        response.put("status", HttpStatus.FORBIDDEN.value());
        response.put("message", "Votre compte a été désactivé. Contactez l'administrateur.");
        response.put("error", "Compte désactivé");

        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(response);
    }

    /**
     * Gère les comptes verrouillés (trop de tentatives)
     */
    @ExceptionHandler(LockedException.class)
    public ResponseEntity<Map<String, Object>> handleLocked(LockedException ex) {
        Map<String, Object> response = new HashMap<>();
        response.put("timestamp", LocalDateTime.now());
        response.put("status", HttpStatus.FORBIDDEN.value());
        response.put("message", "Votre compte est verrouillé. Réessayez dans 30 minutes.");
        response.put("error", "Compte verrouillé");

        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(response);
    }

    // ========== 5. EXCEPTIONS MÉTIER ==========

    /**
     * Gère les comptes non activés
     */
    @ExceptionHandler(AccountNotActivatedException.class)
    public ResponseEntity<Map<String, Object>> handleAccountNotActivated(AccountNotActivatedException ex) {
        Map<String, Object> response = new HashMap<>();
        response.put("timestamp", LocalDateTime.now());
        response.put("status", HttpStatus.FORBIDDEN.value());
        response.put("message", ex.getMessage());
        response.put("error", "Compte non activé");

        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(response);
    }

    /**
     * Gère les mots de passe expirés
     */
    @ExceptionHandler(PasswordExpiredException.class)
    public ResponseEntity<Map<String, Object>> handlePasswordExpired(PasswordExpiredException ex) {
        Map<String, Object> response = new HashMap<>();
        response.put("timestamp", LocalDateTime.now());
        response.put("status", HttpStatus.FORBIDDEN.value());
        response.put("message", ex.getMessage());
        response.put("error", "Mot de passe expiré");
        response.put("requirePasswordChange", true); // Indique au front de rediriger

        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(response);
    }

    // ========== 6. ERREURS GÉNÉRALES ==========

    /**
     * Gère toutes les autres exceptions non prévues
     */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> handleGeneral(Exception ex) {
        // Log l'erreur pour le débogage
        ex.printStackTrace();

        Map<String, Object> response = new HashMap<>();
        response.put("timestamp", LocalDateTime.now());
        response.put("status", HttpStatus.INTERNAL_SERVER_ERROR.value());
        response.put("message", "Une erreur interne est survenue");
        response.put("error", "Erreur serveur");

        // En développement, on peut inclure le message réel
        // response.put("debug", ex.getMessage());

        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
    }

}