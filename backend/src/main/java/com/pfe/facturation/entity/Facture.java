package com.pfe.facturation.entity;

import com.pfe.facturation.enums.ModePaiement;
import com.pfe.facturation.enums.StatutFacture;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.time.LocalDateTime;

@Entity
@Table(name = "factures")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Facture {

    @PrePersist
    @PreUpdate
    public void onSave() {
        calculerTotaux();
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // numero unique genere automatiquement : FACT-2024-0001
    @Column(unique = true, nullable = false)
    private String numFact;

    @NotNull
    private LocalDate dateEmission;

    @NotNull
    private LocalDate datePaiement;

    // acheteur de type client
    @ManyToOne
    @JoinColumn(name = "acheteur_client_id")
    private Client acheteurClient;

    // acheteur de type emetteur (B2B)
    @ManyToOne
    @JoinColumn(name = "acheteur_emetteur_id")
    private Emetteur acheteurEmetteur;

    // vendeur, toujours un emetteur
    @ManyToOne
    @JoinColumn(name = "vendeur_id", nullable = false)
    private Emetteur vendeur;

    // infos denormalisees pour conserver l'historique meme si l'entite change
    private String nomAcheteur;
    private String adresseAcheteur;
    private String emailAcheteur;
    private String telephoneAcheteur;

    private String nomVendeur;
    private String adresseVendeur;
    private String emailVendeur;
    private String telephoneVendeur;

    // statut courant de la facture
    @Enumerated(EnumType.STRING)
    private StatutFacture statut;

    // statut precedent, utile pour savoir si REJECTED peut revenir en DRAFT
    @Enumerated(EnumType.STRING)
    private StatutFacture previousStatut;

    @Enumerated(EnumType.STRING)
    private ModePaiement modePaiement;

    // raison du rejet, obligatoire quand statut = REJECTED
    @Column(length = 500)
    private String rejectionReason;

    // reference vers le document source (ex: "DEVIS-2024-0001")
    // permet la tracabilite dans le flux commercial
    @Column(length = 100)
    private String sourceDocumentRef;

    @Column(precision = 15, scale = 2)
    private BigDecimal totalHT;

    @Column(precision = 15, scale = 2)
    private BigDecimal montantTVA;

    @Column(precision = 15, scale = 2)
    private BigDecimal totalTTC;

    @Column(length = 1000)
    private String montantEnLettres;

    // contenu XML genere lors de la signature
    // stocke en base de donnees sous forme de texte
    @Column(columnDefinition = "TEXT")
    private String xmlContent;
    // À ajouter dans votre entité Facture, après xmlContent par exemple

    @Column
    private LocalDateTime dateSignature;

    @OneToMany(mappedBy = "facture", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<LigneFacture> lignes;

    // calcule totalHT, montantTVA et totalTTC depuis les lignes
    public void calculerTotaux() {
        if (lignes == null || lignes.isEmpty()) {
            this.totalHT = BigDecimal.ZERO;
            this.montantTVA = BigDecimal.ZERO;
            this.totalTTC = BigDecimal.ZERO;
            return;
        }
        this.totalHT = lignes.stream()
                .map(ligne -> {
                    BigDecimal prixUnitaire = ligne.getProduit() != null ? ligne.getProduit().getPrixUnitaire()
                            : BigDecimal.ZERO;
                    return prixUnitaire.multiply(BigDecimal.valueOf(ligne.getQuantite()));
                })
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // taux TVA fixe a 19%
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

    public Object getAcheteur() {
        return acheteurClient != null ? acheteurClient : acheteurEmetteur;
    }

    public boolean isAcheteurClient() {
        return acheteurClient != null;
    }

    public boolean isAcheteurEmetteur() {
        return acheteurEmetteur != null;
    }
}