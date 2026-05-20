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
 * DTO pour la creation et modification d'un devis.
 */
@Data
public class DevisRequestDTO {

    @NotNull(message = "La date de creation est obligatoire")
    private LocalDate dateCreation;

    private LocalDate dateValidite;

    // acheteur : client ou emetteur
    @NotNull
    @Positive
    private Long acheteurId;

    @NotNull
    private EntityType typeAcheteur;

    // vendeur : toujours un emetteur, injecte depuis l'utilisateur connecte
    @NotNull
    @Positive
    private Long vendeurId;

    // notes libres : conditions, observations, validite du devis
    private String notes;

    @NotEmpty
    @Valid
    private List<LigneDevisRequestDTO> lignes;
}