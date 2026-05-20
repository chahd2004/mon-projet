package com.pfe.facturation.entity;

import com.pfe.facturation.enums.StatutBonLivraison;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.time.LocalDate;
import java.util.List;

/**
 * Entite representant un bon de livraison.
 * Peut etre cree depuis une Commande ou directement.
 * Le client signe en presence lors de la reception (Partie 8).
 * Prouve que le client a bien recu les articles.
 * Tracabilite via commandeSourceRef.
 */
@Entity
@Table(name = "bon_livraisons")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class BonLivraison {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(columnDefinition = "TEXT")
    private String xmlSigne;

    // numero sequentiel : BL-2024-0001
    @Column(unique = true, nullable = false)
    private String numBonLivraison;

    @NotNull
    private LocalDate dateCreation;

    // date effective de livraison, remplie quand statut = DELIVERED
    private LocalDate dateLivraison;

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
    @ManyToOne
    @JoinColumn(name = "vendeur_id", nullable = false)
    private Emetteur vendeur;

    // ===== INFOS DENORMALISEES =====
    // adresse de l'acheteur utilisee comme adresse de livraison par defaut
    private String nomAcheteur;
    private String adresseLivraison;
    private String emailAcheteur;
    private String telephoneAcheteur;

    private String nomVendeur;
    private String emailVendeur;
    private String telephoneVendeur;

    // statut courant
    @Enumerated(EnumType.STRING)
    private StatutBonLivraison statut;

    // motif du litige si statut = DISPUTE
    @Column(length = 500)
    private String disputeReason;

    // reference de la commande source pour la tracabilite
    // ex: "CMD-2024-0001", null si cree directement
    @Column(length = 100)
    private String commandeSourceRef;

    // reference de la facture generee apres cloture
    // ex: "FACT-2024-0001"
    @Column(length = 100)
    private String factureRef;

    // raison de l'annulation si statut = CANCELLED
    @Column(length = 500)
    private String cancellationReason;

    // lignes du bon de livraison
    @OneToMany(mappedBy = "bonLivraison", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<LigneBonLivraison> lignes;

    // remplit les champs denormalises depuis l'acheteur
    // l'adresse de l'acheteur est utilisee comme adresse de livraison
    public void remplirInfosAcheteur() {
        if (acheteurClient != null) {
            this.nomAcheteur = acheteurClient.getRaisonSociale();
            this.adresseLivraison = acheteurClient.getAdresseComplete();
            this.emailAcheteur = acheteurClient.getEmail();
            this.telephoneAcheteur = acheteurClient.getTelephone();
        } else if (acheteurEmetteur != null) {
            this.nomAcheteur = acheteurEmetteur.getRaisonSociale();
            this.adresseLivraison = acheteurEmetteur.getAdresseComplete();
            this.emailAcheteur = acheteurEmetteur.getEmail();
            this.telephoneAcheteur = acheteurEmetteur.getTelephone();
        }
    }

    // remplit les champs denormalises depuis le vendeur
    public void remplirInfosVendeur() {
        if (vendeur != null) {
            this.nomVendeur = vendeur.getRaisonSociale();
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