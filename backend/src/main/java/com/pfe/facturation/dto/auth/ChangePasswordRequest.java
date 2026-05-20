package com.pfe.facturation.dto.auth;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * DTO pour la demande de changement de mot de passe.
 *
 * Rôle :
 * - Recevoir les données du formulaire de changement de mot de passe
 * - Valider les champs (non vides, taille minimale)
 * - Vérifier que le nouveau mot de passe et la confirmation correspondent
 */
@Data
public class ChangePasswordRequest {

    //Ancien mot de passe de l'utilisateur
    @NotBlank(message = "L'ancien mot de passe est obligatoire")
    private String oldPassword;

    //Nouveau mot de passe choisi par l'utilisateur
    @NotBlank(message = "Le nouveau mot de passe est obligatoire")
    @Size(min = 8, message = "Le nouveau mot de passe doit contenir au moins 8 caractères")
    private String newPassword;


    //Confirmation du nouveau mot de passe
    @NotBlank(message = "La confirmation du mot de passe est obligatoire")
    private String confirmPassword;

    //Vérifie que le nouveau mot de passe et la confirmation correspondent
    public boolean isMatchingPasswords() {
        return newPassword != null && newPassword.equals(confirmPassword);
    }
}