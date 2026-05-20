package com.pfe.facturation.entity;

import com.pfe.facturation.enums.ModePaiement;
import com.pfe.facturation.enums.StatutDevis;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

/**
 * Entite representant un devis commercial.
 * Point de depart du flux commercial.
 * Peut etre converti en BonCommande, Commande ou Facture directement.
 */
@Entity
@Table(name = "devis")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Devis {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // numero sequentiel genere automatiquement : DEVIS-2024-0001
    @Column(unique = true, nullable = false)
    private String numDevis;

    @NotNull
    private LocalDate dateCreation;

    private LocalDate dateValidite;

    // ===== ACHETEUR =====
    // acheteur de type client
    @ManyToOne
    @JoinColumn(name = "acheteur_client_id")
    private Client acheteurClient;

    // acheteur de type emetteur (B2B)
    @ManyToOne
    @JoinColumn(name = "acheteur_emetteur_id")
    private Emetteur acheteurEmetteur;

    // ===== VENDEUR =====
    // vendeur, toujours un emetteur
    @ManyToOne
    @JoinColumn(name = "vendeur_id", nullable = false)
    private Emetteur vendeur;

    // ===== INFOS DENORMALISEES =====
    // conservees pour l'historique meme si les entites changent
    private String nomAcheteur;
    private String adresseAcheteur;
    private String emailAcheteur;
    private String telephoneAcheteur;

    private String nomVendeur;
    private String adresseVendeur;
    private String emailVendeur;
    private String telephoneVendeur;

    // statut courant du devis
    @Enumerated(EnumType.STRING)
    private StatutDevis statut;

    // notes libres : conditions particulieres, observations, validite, etc.
    @Column(length = 1000)
    private String notes;

    // raison du refus si statut = REJECTED
    @Column(length = 500)
    private String rejectionReason;

    // reference du document genere apres conversion
    // ex: "BC-2024-0001" ou "FACT-2024-0001"
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

    // lignes du devis
    @OneToMany(mappedBy = "devis", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<LigneDevis> lignes;

    // calcule totalHT, montantTVA et totalTTC depuis les lignes
    public void calculerTotaux() {
        if (lignes == null || lignes.isEmpty()) {
            this.totalHT = BigDecimal.ZERO;
            this.montantTVA = BigDecimal.ZERO;
            this.totalTTC = BigDecimal.ZERO;
            return;
        }

        this.totalHT = lignes.stream()
                .map(LigneDevis::getMontantHT)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // taux TVA fixe a 19%, coherent avec la Facture
        this.montantTVA = totalHT.multiply(new BigDecimal("0.19"));
        this.totalTTC = totalHT.add(montantTVA);
    }

    // remplit les champs denormalises depuis l'acheteur
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

    // remplit les champs denormalises depuis le vendeur
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