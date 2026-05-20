package com.pfe.facturation.entity;

import com.pfe.facturation.enums.StatutAvoir;
import com.pfe.facturation.enums.TypeAvoir;
import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

/**
 * Avoir (note de credit).
 * Cree automatiquement quand une facture passe en CANCELLED.
 * Lie a sa facture source via factureSource.
 */
@Entity
@Table(name = "avoirs")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Avoir {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // numero sequentiel : AV-2024-0001
    @Column(unique = true, nullable = false)
    private String numAvoir;

    private LocalDate dateCreation;

    // email denormalise pour l'envoi de l'avoir au client (copie depuis la facture)
    private String emailAcheteur;
    private String emailVendeur;

    // statut courant de l'avoir
    @Enumerated(EnumType.STRING)
    private StatutAvoir statut;

    // total ou partiel
    @Enumerated(EnumType.STRING)
    private TypeAvoir type;

    // facture qui a genere cet avoir
    @ManyToOne
    @JoinColumn(name = "facture_id", nullable = false)
    private Facture factureSource;

    // vendeur (copie depuis la facture source)
    @ManyToOne
    @JoinColumn(name = "vendeur_id", nullable = false)
    private Emetteur vendeur;

    // acheteur client (copie depuis la facture source)
    @ManyToOne
    @JoinColumn(name = "acheteur_client_id")
    private Client acheteurClient;

    // acheteur emetteur B2B (copie depuis la facture source)
    @ManyToOne
    @JoinColumn(name = "acheteur_emetteur_id")
    private Emetteur acheteurEmetteur;

    // infos denormalisees pour conserver l'historique
    private String nomAcheteur;
    private String nomVendeur;

    // motif de l'avoir, explique pourquoi il a ete cree
    @Column(length = 500)
    private String motif;

    @Column(precision = 15, scale = 2)
    private BigDecimal totalHT;

    @Column(precision = 15, scale = 2)
    private BigDecimal montantTVA;

    @Column(precision = 15, scale = 2)
    private BigDecimal totalTTC;

    // lignes de l'avoir, copiees depuis la facture source
    @OneToMany(mappedBy = "avoir", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<LigneAvoir> lignes;

    // calcule les totaux depuis les lignes de l'avoir
    public void calculerTotaux() {
        if (lignes == null || lignes.isEmpty()) {
            this.totalHT = BigDecimal.ZERO;
            this.montantTVA = BigDecimal.ZERO;
            this.totalTTC = BigDecimal.ZERO;
            return;
        }

        this.totalHT = lignes.stream()
                .map(LigneAvoir::getMontantHT)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // meme taux TVA que la facture : 19%
        this.montantTVA = totalHT.multiply(new BigDecimal("0.19"));
        this.totalTTC = totalHT.add(montantTVA);
    }
}