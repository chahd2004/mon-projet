package com.pfe.facturation.entity;

import com.pfe.facturation.enums.ModePaiement;
import com.pfe.facturation.enums.StatutCommande;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

/**
 * Entite representant une commande.
 * Peut etre creee depuis un Devis accepte, un BonCommande confirme,
 * ou directement sans document source.
 * Tracabilite via sourceDocumentRef.
 */
@Entity
@Table(name = "commandes")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Commande {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // numero sequentiel : CMD-2024-0001
    @Column(unique = true, nullable = false)
    private String numCommande;

    @NotNull
    private LocalDate dateCreation;

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

    // statut courant
    @Enumerated(EnumType.STRING)
    private StatutCommande statut;

    @Enumerated(EnumType.STRING)
    private ModePaiement modePaiement;

    // notes libres : instructions de preparation, observations
    @Column(length = 1000)
    private String notes;

    // raison d'annulation si statut = CANCELLED
    @Column(length = 500)
    private String cancellationReason;

    // reference du document source pour la tracabilite
    // ex: "DEVIS-2024-0001" ou "BC-2024-0001", null si cree directement
    @Column(length = 100)
    private String sourceDocumentRef;

    // reference du document genere apres cloture
    // ex: "FACT-2024-0001" ou "BL-2024-0001"
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

    // lignes de la commande
    @OneToMany(mappedBy = "commande", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<LigneCommande> lignes;

    // calcule totalHT, montantTVA et totalTTC depuis les lignes
    public void calculerTotaux() {
        if (lignes == null || lignes.isEmpty()) {
            this.totalHT = BigDecimal.ZERO;
            this.montantTVA = BigDecimal.ZERO;
            this.totalTTC = BigDecimal.ZERO;
            return;
        }

        this.totalHT = lignes.stream()
                .map(LigneCommande::getMontantHT)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // taux TVA fixe a 19%, coherent avec tous les autres documents
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