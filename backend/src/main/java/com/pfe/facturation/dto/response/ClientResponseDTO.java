package com.pfe.facturation.dto.response;

import com.pfe.facturation.enums.RegionTunisie;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import com.pfe.facturation.enums.UserRole;
import com.pfe.facturation.enums.AccountStatus;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ClientResponseDTO {

    private Long id;
    private String raisonSociale;
    private String adresseComplete;
    private String pays;
    private RegionTunisie region;
    private String email;
    private String telephone;

    // Informations de l'utilisateur associé
    private Long userId;
    private String userEmail;
    private UserRole userRole;
    private boolean userEnabled;
    private AccountStatus userAccountStatus;

}
