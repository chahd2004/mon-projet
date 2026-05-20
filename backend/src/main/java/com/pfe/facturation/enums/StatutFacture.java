package com.pfe.facturation.enums;

/**
 * Cycle de vie d'une facture.
 *
 * Transitions autorisees :
 *   DRAFT    --> SIGNED
 *   SIGNED   --> SENT
 *   SIGNED   --> REJECTED  (rejet interne, peut revenir en DRAFT)
 *   SIGNED   --> CANCELLED (annulation avant envoi, genere un Avoir)
 *   SENT     --> PAID
 *   SENT     --> REJECTED  (rejet par le client, terminal)
 *   SENT     --> CANCELLED (annulation apres envoi, genere un Avoir)
 *   REJECTED --> DRAFT     (seulement si le rejet vient de SIGNED)
 */
public enum StatutFacture {
    DRAFT,      // facture en cours de creation, modifiable
    SIGNED,     // facture validee et signee par l'admin, non modifiable
    SENT,       // facture envoyee au client, en attente de paiement
    PAID,       // facture payee, cycle termine positivement
    REJECTED,   // facture rejetee (interne ou par le client)
    CANCELLED   // facture annulee, genere automatiquement un Avoir
}