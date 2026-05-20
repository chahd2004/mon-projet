package com.pfe.facturation.dto.request;

import com.pfe.facturation.enums.EntityType;
import com.pfe.facturation.enums.ModePaiement;
import com.pfe.facturation.enums.StatutFacture;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.time.LocalDate;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class FactureRequestDTO {

    @NotNull(message = "La date d'émission est obligatoire")
    @PastOrPresent(message = "La date d'émission ne peut pas être future")
    private LocalDate dateEmission;

    @NotNull(message = "La date de paiement est obligatoire")
    private LocalDate datePaiement;

    // Acheteur (client ou émetteur)
    @NotNull @Positive
    private Long acheteurId;           // ← ID du client OU de l'émetteur

    @NotNull
    private EntityType typeAcheteur;      // ← CLIENT ou EMETTEUR (distinction entité)

    // Vendeur (toujours un émetteur)
    @NotNull @Positive
    private Long vendeurId;  // ← ID de l'émetteur qui vend

    @NotNull
    private ModePaiement modePaiement;

    private StatutFacture statut = StatutFacture.DRAFT;

    // reference du document source si cree depuis une conversion
    // ex: "DEVIS-2024-0001", "CMD-2024-0001", null si cree directement
    private String sourceDocumentRef;

    @NotEmpty @Valid
    private List<LigneFactureRequestDTO> lignes;
}