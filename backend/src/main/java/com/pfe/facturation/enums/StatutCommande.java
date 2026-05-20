package com.pfe.facturation.enums;

/**
 * Cycle de vie d'une commande.
 *
 * Transitions autorisees :
 *   DRAFT       --> CONFIRMED    (admin confirme la commande)
 *   CONFIRMED   --> IN_PROGRESS  (preparation en cours)
 *   IN_PROGRESS --> DELIVERED    (livraison effectuee)
 *   IN_PROGRESS --> CANCELLED    (annulation pendant preparation)
 *   DELIVERED   --> CLOSED       (commande terminee, facture emise)
 */
public enum StatutCommande {
    DRAFT,       // commande en cours de creation, modifiable
    CONFIRMED,   // commande confirmee par l'admin, preparation a lancer
    IN_PROGRESS, // preparation en cours
    DELIVERED,   // livree, en attente de cloture et facturation
    CANCELLED    // annulee pendant la preparation
}