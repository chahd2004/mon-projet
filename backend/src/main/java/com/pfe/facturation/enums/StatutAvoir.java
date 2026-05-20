package com.pfe.facturation.enums;

/**
 * Cycle de vie d'un avoir.
 *
 * Transitions autorisees :
 *   DRAFT     --> VALIDATED
 *   VALIDATED --> SENT
 *   SENT      --> APPLIED
 */
public enum StatutAvoir {
    DRAFT,      // avoir cree automatiquement, en attente de validation
    VALIDATED,  // avoir valide par l'admin
    SENT,       // avoir envoye au client
    APPLIED     // avoir applique, remboursement effectue
}