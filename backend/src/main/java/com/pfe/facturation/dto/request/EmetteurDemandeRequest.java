package com.pfe.facturation.dto.request;

import com.pfe.facturation.enums.FormeJuridique;
import com.pfe.facturation.enums.RegionTunisie;
import com.pfe.facturation.validation.MatriculeFiscalTunisie;
import jakarta.validation.constraints.*;
import lombok.Data;

/**
 * DTO pour la demande de création d'entreprise (formulaire public)
 * L'entreprise remplit ce formulaire pour demander la création de son compte
 */
@Data
public class EmetteurDemandeRequest {

    // ===== INFORMATIONS ENTREPRISE =====
    @NotBlank(message = "Le code est obligatoire")
    private String code;

    @NotBlank(message = "La raison sociale est obligatoire")
    @Size(min = 2, max = 150)
    private String raisonSociale;

    @NotBlank(message = "Le matricule fiscal est obligatoire")
    @MatriculeFiscalTunisie
    private String matriculeFiscal;

    private FormeJuridique formeJuridique;

    @NotBlank(message = "L'adresse est obligatoire")
    private String adresseComplete;

    @NotNull(message = "La région est obligatoire")
    private RegionTunisie region;

    @Email(message = "Email invalide")
    @NotBlank(message = "L'email est obligatoire")
    private String email;  // Sera utilisé comme identifiant de connexion

    @Pattern(regexp = "^[0-9]{8}$", message = "Téléphone invalide (8 chiffres)")
    private String telephone;

    private String siteWeb;
    private String iban;
    private String banque;

    // ===== INFORMATIONS CONTACT / ADMIN =====
    @NotBlank(message = "Le nom du responsable est obligatoire")
    private String nomResponsable;

    @NotBlank(message = "Le prénom du responsable est obligatoire")
    private String prenomResponsable;

    @NotBlank(message = "La fonction du responsable est obligatoire")
    private String fonctionResponsable;
}