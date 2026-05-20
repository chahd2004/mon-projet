package com.pfe.facturation.entity;

import com.pfe.facturation.enums.AccountStatus;
import com.pfe.facturation.enums.FormeJuridique;
import com.pfe.facturation.enums.RegionTunisie;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "demandes_emetteur")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DemandeEmetteur {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // ===== INFORMATIONS ENTREPRISE =====
    @Column(nullable = false)
    private String code;

    @Column(nullable = false)
    private String raisonSociale;

    @Column(nullable = false, unique = true)
    private String matriculeFiscal;

    @Enumerated(EnumType.STRING)
    private FormeJuridique formeJuridique;

    @Column(nullable = false)
    private String adresseComplete;

    @Enumerated(EnumType.STRING)
    private RegionTunisie region;

    @Column(nullable = false)
    private String email;

    private String telephone;
    private String siteWeb;
    private String iban;
    private String banque;

    // ===== INFORMATIONS RESPONSABLE =====
    private String nomResponsable;
    private String prenomResponsable;
    private String fonctionResponsable;

    // ===== STATUT DE LA DEMANDE =====
    @Enumerated(EnumType.STRING)
    @Builder.Default
    private AccountStatus status = AccountStatus.REQUESTED;

    private LocalDateTime dateSoumission;
    private LocalDateTime dateTraitement;

    @Column(length = 500)
    private String commentaireTraitement;

    // ===== MÉTADONNÉES =====
    private String ipAdresse;
    private String userAgent;

    // ===== RELATIONS  =====
    @OneToOne
    @JoinColumn(name = "user_cree_id")
    private User userCree;

    @OneToOne
    @JoinColumn(name = "emetteur_cree_id")
    private Emetteur emetteurCree;
}