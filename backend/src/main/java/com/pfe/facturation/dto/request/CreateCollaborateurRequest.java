package com.pfe.facturation.dto.request;

import com.pfe.facturation.enums.UserRole;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

/**
 * DTO pour la création d'un collaborateur par ENTREPRISE_ADMIN
 * Les collaborateurs ont généralement le rôle ENTREPRISE_VIEWER
 */
@Data
public class CreateCollaborateurRequest {

    @Email(message = "Format d'email invalide")
    @NotBlank(message = "L'email est obligatoire")
    private String email;

    @NotBlank(message = "Le prénom est obligatoire")
    private String firstName;

    @NotBlank(message = "Le nom est obligatoire")
    private String lastName;

    @NotNull(message = "Le rôle est obligatoire")
    private UserRole role;  // Sera généralement ENTREPRISE_VIEWER

    @NotBlank(message = "La fonction est obligatoire")
    private String fonction;  // Ex: "Comptable", "Consultant", etc.

    private String telephone;
}