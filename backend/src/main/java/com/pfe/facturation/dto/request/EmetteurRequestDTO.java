package com.pfe.facturation.dto.request;

import com.pfe.facturation.enums.FormeJuridique;
import com.pfe.facturation.enums.RegionTunisie;
import com.pfe.facturation.validation.MatriculeFiscalTunisie;
import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class EmetteurRequestDTO {

    @NotBlank(message = "Le code est obligatoire")
    @Size(min = 3, max = 20, message = "Le code doit contenir entre 3 et 20 caractères")
    private String code;

    @NotBlank(message = "La raison sociale est obligatoire")
    @Size(min = 2, max = 150, message = "La raison sociale doit contenir entre 2 et 150 caractères")
    private String raisonSociale;

    @NotBlank(message = "Le matricule fiscal est obligatoire")
    @MatriculeFiscalTunisie
    private String matriculeFiscal;

    @NotNull(message = "La forme juridique est obligatoire")
    private FormeJuridique formeJuridique;

    @NotBlank(message = "L'adresse est obligatoire")
    @Size(max = 255, message = "L'adresse ne peut pas dépasser 255 caractères")
    private String adresseComplete;

    private String pays = "TUNISIE";

    @NotNull(message = "La région est obligatoire")
    private RegionTunisie region;

    @Email(message = "Format d'email invalide")
    @NotBlank(message = "L'email est obligatoire")
    private String email;

    @Pattern(regexp = "^$|^[0-9]{8}$", message = "Le téléphone doit contenir 8 chiffres")
    private String telephone;

    @Pattern(regexp = "^$|^(https?://)?([\\w-]+\\.)+[\\w-]+(/[\\w- ./?%&=]*)?$",
            message = "Format de site web invalide")
    private String siteWeb;

    @Size(max = 34, message = "L'IBAN ne peut pas dépasser 34 caractères")
    private String iban;

    private String banque;
    // userId pour lier à un utilisateur existant
    private Long userId;

}