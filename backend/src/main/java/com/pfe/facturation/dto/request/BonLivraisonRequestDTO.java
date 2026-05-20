package com.pfe.facturation.dto.request;

import com.pfe.facturation.enums.EntityType;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Data;

import java.time.LocalDate;
import java.util.List;

/**
 * DTO pour la creation d'un bon de livraison.
 * commandeSourceRef est optionnel : rempli si cree depuis une commande.
 */
@Data
public class BonLivraisonRequestDTO {

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

    // reference de la commande source, null si cree directement
    private String commandeSourceRef;

    @NotEmpty
    @Valid
    private List<LigneBonLivraisonRequestDTO> lignes;
}