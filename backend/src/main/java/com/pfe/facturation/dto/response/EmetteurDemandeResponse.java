package com.pfe.facturation.dto.response;

import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;
import com.pfe.facturation.enums.AccountStatus;


/**
 * Réponse après soumission d'une demande de création d'entreprise
 */
@Data
@Builder
public class EmetteurDemandeResponse {
    private Long demandeId;
    private String email;
    private String message;
    private LocalDateTime dateSoumission;
    private AccountStatus statut; // "EN_ATTENTE"
}