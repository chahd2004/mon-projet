package com.pfe.facturation.dto.request;

import com.pfe.facturation.enums.RegionTunisie;
import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor

public class ClientRequestDTO {

    @NotBlank(message = "La raison sociale est obligatoire")
    private String raisonSociale;

    @NotBlank(message = "L'adresse est obligatoire")
    private String adresseComplete;

    private String pays = "TUNISIE";

    @NotNull(message = "La région est obligatoire")
    private RegionTunisie region;

    @Email(message = "Format d'email invalide")
    private String email;

    @Pattern(regexp = "^[0-9]{8}$",
            message = "Le téléphone doit contenir exactement 8 chiffres")
    private String telephone;

    private Long userId;
}

