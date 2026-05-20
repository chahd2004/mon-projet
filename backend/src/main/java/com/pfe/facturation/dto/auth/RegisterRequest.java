package com.pfe.facturation.dto.auth;

import com.pfe.facturation.enums.FormeJuridique;
import com.pfe.facturation.enums.RegionTunisie;
import com.pfe.facturation.enums.UserRole;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RegisterRequest {
    private String email;
    private String password;
    private String nom;
    private String prenom;
    private String telephone;
    private UserRole role;

    // ✅ Ajouter ces champs pour l'entreprise
    private String raisonSociale;
    private String matriculeFiscal;
    private String code;
    private FormeJuridique formeJuridique;
    private String adresseComplete;
    private RegionTunisie region;
}