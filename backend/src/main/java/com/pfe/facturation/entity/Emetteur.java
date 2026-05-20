package com.pfe.facturation.entity;

import com.pfe.facturation.validation.MatriculeFiscalTunisie;
import com.pfe.facturation.enums.FormeJuridique;
import com.pfe.facturation.enums.RegionTunisie;
import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.*;
import java.util.List;

/**
 * Entité représentant l'entreprise qui émet la facture.
 */
@Entity
@Table(name = "emetteurs")
@Data                       // ← Génère getters, setters, toString, equals, hashCode
@NoArgsConstructor          // ← Constructeur sans paramètres
@AllArgsConstructor        // ← Constructeur avec tous les paramètres
@Builder
public class Emetteur {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    @NotBlank(message = "Le code est obligatoire")
    private String code;

    @Column(nullable = false)
    @NotBlank(message = "La raison sociale est obligatoire")
    @Size(min = 2, max = 150)
    private String raisonSociale;

    /**
     * Format matricule fiscal tunisien :
     * 1234567/A/A/M/000
     */
    @Column(unique = true, nullable = false)
    @NotBlank(message = "Le matricule fiscal est obligatoire")
    @MatriculeFiscalTunisie
    private String matriculeFiscal;

    @Enumerated(EnumType.STRING)
    @NotNull(message = "La forme juridique est obligatoire")
    private FormeJuridique formeJuridique;

    @NotBlank(message = "L'adresse est obligatoire")
    private String adresseComplete;

    private String pays = "TUNISIE";

    @Enumerated(EnumType.STRING)
    @NotNull(message = "La région est obligatoire")
    private RegionTunisie region;

    @Email(message = "Email invalide")
    private String email;

    @Pattern(regexp = "^$|^[0-9]{8}$", message = "Téléphone invalide (8 chiffres)")
    private String telephone;

    private String siteWeb;

    @Size(max = 34, message = "IBAN invalide")
    private String iban;

    private String banque;

    //========== RELATIONS ==================

    /**
     * Factures où cet émetteur est le vendeur
     */
    @OneToMany(mappedBy = "vendeur")  // ← correspond à Facture.vendeur
    private List<Facture> facturesEnTantQueVendeur;

    /**
     * Factures où cet émetteur est l'acheteur
     */
    @OneToMany(mappedBy = "acheteurEmetteur")  // ← correspond à Facture.acheteurEmetteur
    private List<Facture> facturesEnTantQueAcheteur;

    @OneToOne
    @JoinColumn(name = "user_id")
    private User user;  // ← Compte utilisateur associé

    /**
     * Catalogue des produits de cet émetteur (ce qu'il vend)
     * Un émetteur peut avoir plusieurs produits à vendre
     */
    @OneToMany(mappedBy = "emetteur")
    private List<Produit> produits;  // ← Son catalogue de produits

   // ← AJOUT


}