package com.pfe.facturation.dto.response;

import com.pfe.facturation.enums.AccountStatus;
import com.pfe.facturation.enums.FormeJuridique;
import com.pfe.facturation.enums.RegionTunisie;
import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;

/**
 * DTO pour afficher les détails d'une demande (pour SUPER_ADMIN)
 */
@Data
@Builder
public class DemandeDetailResponse {
    private Long id;

    // Informations entreprise
    private String code;
    private String raisonSociale;
    private String matriculeFiscal;
    private FormeJuridique formeJuridique;
    private String adresseComplete;
    private RegionTunisie region;
    private String email;
    private String telephone;
    private String siteWeb;
    private String iban;
    private String banque;

    // Informations responsable
    private String nomResponsable;
    private String prenomResponsable;
    private String fonctionResponsable;

    // Statut et dates
    private AccountStatus status;
    private LocalDateTime dateSoumission;
    private LocalDateTime dateTraitement;
    private String commentaireTraitement;
}