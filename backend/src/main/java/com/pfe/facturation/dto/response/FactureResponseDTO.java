package com.pfe.facturation.dto.response;

import com.pfe.facturation.enums.EntityType;
import com.pfe.facturation.enums.ModePaiement;
import com.pfe.facturation.enums.StatutFacture;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class FactureResponseDTO {

    private Long id;
    private String numFact;
    private LocalDate dateEmission;
    private LocalDate datePaiement;

    // acheteur
    private Long acheteurId;
    private String acheteurNom;
    private EntityType typeAcheteur;
    private Long vendeurId;
    private String vendeurNom;
    private EntityType typeVendeur;

    private StatutFacture statut;

    // statut precedent, utile pour savoir si retour en DRAFT est possible
    private StatutFacture previousStatut;

    // raison du rejet, presente uniquement si statut = REJECTED
    private String rejectionReason;

    // reference du document source dans le flux commercial (ex: DEVIS-2024-0001)
    private String sourceDocumentRef;

    // contenu XML genere apres signature
    // null si le XML n'a pas encore ete genere
    private String xmlContent;

    private ModePaiement modePaiement;
    private BigDecimal totalHT;
    private BigDecimal montantTVA;
    private BigDecimal totalTTC;
    private String montantEnLettres;
    private List<LigneFactureResponseDTO> lignes;
}