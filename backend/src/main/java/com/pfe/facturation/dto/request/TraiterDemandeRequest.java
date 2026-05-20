package com.pfe.facturation.dto.request;

import lombok.Data;

/**
 * DTO pour le traitement d'une demande par SUPER_ADMIN
 */
@Data
public class TraiterDemandeRequest {
    private String commentaire; // Obligatoire pour REJECTED, optionnel pour APPROVED
}