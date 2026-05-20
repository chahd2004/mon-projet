package com.pfe.facturation.enums;

/**
 * Cycle de vie d'un devis.
 *
 * Transitions autorisees :
 *   DRAFT    --> SENT
 *   SENT     --> ACCEPTED  (client accepte)
 *   SENT     --> REJECTED  (client refuse)
 *   SENT     --> EXPIRED   (sans reponse du client)
 *   ACCEPTED --> CONVERTED (converti en bon de commande, commande ou facture)
 */
public enum StatutDevis {
    DRAFT,      // devis en cours de creation, modifiable
    SENT,       // devis envoye au client, en attente de reponse
    ACCEPTED,   // devis accepte par le client
    REJECTED,   // devis refuse par le client
    EXPIRED,    // devis sans reponse, expire
    CONVERTED   // devis converti en document suivant du flux
}