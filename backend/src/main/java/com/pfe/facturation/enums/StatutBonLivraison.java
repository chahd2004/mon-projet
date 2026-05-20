package com.pfe.facturation.enums;

/**
 * Cycle de vie d'un bon de livraison.
 *
 * Transitions autorisees :
 *   DRAFT     --> DELIVERED      (livraison effectuee)
 *   DELIVERED --> SIGNED_CLIENT  (client signe en presence)
 *   DELIVERED --> DISPUTE        (client conteste la livraison)
 *   DISPUTE   --> SIGNED_CLIENT  (litige resolu, client signe)
 *   SIGNED_CLIENT --> CLOSED     (bon de livraison clos, pret pour facturation)
 */
public enum StatutBonLivraison {
    DRAFT,          // bon de livraison en cours de preparation
    DELIVERED,      // livraison effectuee, en attente de signature client
    SIGNED_CLIENT,  // signe par le client en presence
    DISPUTE,        // client conteste la livraison
    CLOSED,         // clos, facture peut etre emise
    CANCELLED       // annule
}