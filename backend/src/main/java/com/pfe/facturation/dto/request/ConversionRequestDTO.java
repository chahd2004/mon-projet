package com.pfe.facturation.dto.request;

import com.pfe.facturation.enums.ModePaiement;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDate;

/**
 * DTO utilise pour declencher une conversion entre documents.
 * Contient les informations supplementaires necessaires
 * pour creer le document cible (ex: date, mode de paiement).
 */
@Data
public class ConversionRequestDTO {

    // date du document cible, obligatoire pour tous les flux
    @NotNull(message = "La date est obligatoire")
    private LocalDate dateDocument;

    // mode de paiement, obligatoire uniquement pour la creation de facture
    private ModePaiement modePaiement;

    // date de paiement, obligatoire uniquement pour la creation de facture
    private LocalDate datePaiement;
}