package com.pfe.facturation.dto.response;

import com.pfe.facturation.enums.FormeJuridique;
import com.pfe.facturation.enums.RegionTunisie;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import com.pfe.facturation.enums.UserRole;
import com.pfe.facturation.enums.AccountStatus;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class EmetteurResponseDTO {

    // Informations de l'émetteur
    private Long id;
    private String code;
    private String raisonSociale;
    private String matriculeFiscal;
    private FormeJuridique formeJuridique;
    private String adresseComplete;
    private String pays;
    private RegionTunisie region;
    private String email;
    private String telephone;
    private String siteWeb;
    private String iban;
    private String banque;
    private Long factureCount;

    // Informations de l'utilisateur associé
    private Long userId;
    private String userEmail;
    private UserRole userRole;
    private AccountStatus userAccountStatus;
    private boolean userEnabled;
}