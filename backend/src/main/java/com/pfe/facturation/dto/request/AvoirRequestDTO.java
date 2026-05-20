package com.pfe.facturation.dto.request;

import com.pfe.facturation.enums.TypeAvoir;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.List;

/**
 * DTO pour la modification d'un avoir en DRAFT.
 * Permet de changer le type (total/partiel) et d'ajuster les lignes.
 */
@Data
public class AvoirRequestDTO {

    // motif du remboursement
    private String motif;

    @NotNull
    private Long factureSourceId;

    @NotNull
    private TypeAvoir type;

    // lignes a rembourser (toutes les lignes = total, subset = partiel)
    @NotEmpty
    @Valid
    private List<LigneAvoirRequestDTO> lignes;
}