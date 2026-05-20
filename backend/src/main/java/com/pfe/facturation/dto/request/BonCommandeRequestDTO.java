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
 * DTO pour la creation et modification d'un bon de commande.
 * devisSourceRef est optionnel : rempli uniquement si cree depuis un devis.
 */
@Data
public class BonCommandeRequestDTO {

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

    // reference du devis source, null si cree directement
    private String devisSourceRef;

    @NotEmpty
    @Valid
    private List<LigneBonCommandeRequestDTO> lignes;
}