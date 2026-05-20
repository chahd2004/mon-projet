package com.pfe.facturation.dto.request;

import com.pfe.facturation.enums.ModePaiement;
import com.pfe.facturation.enums.EntityType;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Data;

import java.time.LocalDate;
import java.util.List;

/**
 * DTO pour la creation et modification d'une commande.
 * sourceDocumentRef est optionnel : rempli si cree depuis un devis ou BC.
 */
@Data
public class CommandeRequestDTO {

    @NotNull(message = "La date de creation est obligatoire")
    private LocalDate dateCreation;

    // acheteur : client ou emetteur
    @NotNull
    @Positive
    private Long acheteurId;

    @NotNull
    private EntityType typeAcheteur;

    // vendeur : injecte depuis l'utilisateur connecte
    @NotNull
    @Positive
    private Long vendeurId;

    @NotNull
    private ModePaiement modePaiement;

    // notes libres : instructions de preparation, observations
    private String notes;

    // reference du document source, null si cree directement
    private String sourceDocumentRef;

    @NotEmpty
    @Valid
    private List<LigneCommandeRequestDTO> lignes;
}