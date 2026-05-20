package com.pfe.facturation.entity;

import com.pfe.facturation.enums.ModePaiement;
import com.pfe.facturation.enums.StatutBonCommande;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime; // ← AJOUTER
import java.util.List;

/**
 * Entite representant un bon de commande.
 * Peut etre cree depuis un Devis accepte ou directement.
 * Le client le signe via un lien email (signature electronique, Partie 8).
 * Lien de tracabilite vers le devis source via devisSourceRef.
 */
@Entity
@Table(name = "bon_commandes")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class BonCommande {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // numero sequentiel : BC-2024-0001
    @Column(unique = true, nullable = false)
    private String numBonCommande;

    @NotNull
    private LocalDate dateCreation;

    // ===== ACHETEUR =====
    @ManyToOne
    @JoinColumn(name = "acheteur_client_id")
    private Client acheteurClient;

    @ManyToOne
    @JoinColumn(name = "acheteur_emetteur_id")
    private Emetteur acheteurEmetteur;

    // ===== VENDEUR =====
    @ManyToOne
    @JoinColumn(name = "vendeur_id", nullable = false)
    private Emetteur vendeur;

    // ===== INFOS DENORMALISEES =====
    private String nomAcheteur;
    private String adresseAcheteur;
    private String emailAcheteur;
    private String telephoneAcheteur;

    private String nomVendeur;
    private String adresseVendeur;
    private String emailVendeur;
    private String telephoneVendeur;

    // statut courant
    @Enumerated(EnumType.STRING)
    private StatutBonCommande statut;

    @Enumerated(EnumType.STRING)
    private ModePaiement modePaiement;

    // raison d'annulation si statut = CANCELLED
    @Column(length = 500)
    private String cancellationReason;

    // reference du devis source pour la tracabilite
    @Column(length = 100)
    private String devisSourceRef;

    // reference du document genere apres conversion
    @Column(length = 100)
    private String documentConvertiRef;

    @Column(precision = 15, scale = 2)
    private BigDecimal totalHT;

    @Column(precision = 15, scale = 2)
    private BigDecimal montantTVA;

    @Column(precision = 15, scale = 2)
    private BigDecimal totalTTC;

    @Column(length = 1000)
    private String montantEnLettres;

    // ===== NOUVEAUX CHAMPS POUR LA SIGNATURE ÉLECTRONIQUE =====

    // XML signé stocké en base
    @Column(columnDefinition = "TEXT")
    private String xmlSigne;

    // Date de signature
    @Column
    private LocalDateTime dateSignature;

    // ===== RELATIONS =====

    @OneToMany(mappedBy = "bonCommande", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<LigneBonCommande> lignes;

    // ===== METHODES =====

    public void calculerTotaux() {
        if (lignes == null || lignes.isEmpty()) {
            this.totalHT = BigDecimal.ZERO;
            this.montantTVA = BigDecimal.ZERO;
            this.totalTTC = BigDecimal.ZERO;
            return;
        }

        this.totalHT = lignes.stream()
                .map(LigneBonCommande::getMontantHT)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        this.montantTVA = totalHT.multiply(new BigDecimal("0.19"));
        this.totalTTC = totalHT.add(montantTVA);
    }

    public void remplirInfosAcheteur() {
        if (acheteurClient != null) {
            this.nomAcheteur = acheteurClient.getRaisonSociale();
            this.adresseAcheteur = acheteurClient.getAdresseComplete();
            this.emailAcheteur = acheteurClient.getEmail();
            this.telephoneAcheteur = acheteurClient.getTelephone();
        } else if (acheteurEmetteur != null) {
            this.nomAcheteur = acheteurEmetteur.getRaisonSociale();
            this.adresseAcheteur = acheteurEmetteur.getAdresseComplete();
            this.emailAcheteur = acheteurEmetteur.getEmail();
            this.telephoneAcheteur = acheteurEmetteur.getTelephone();
        }
    }

    public void remplirInfosVendeur() {
        if (vendeur != null) {
            this.nomVendeur = vendeur.getRaisonSociale();
            this.adresseVendeur = vendeur.getAdresseComplete();
            this.emailVendeur = vendeur.getEmail();
            this.telephoneVendeur = vendeur.getTelephone();
        }
    }

    public boolean isAcheteurClient() {
        return acheteurClient != null;
    }

    public boolean isAcheteurEmetteur() {
        return acheteurEmetteur != null;
    }
}