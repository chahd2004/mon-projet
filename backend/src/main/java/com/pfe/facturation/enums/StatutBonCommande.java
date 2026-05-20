package com.pfe.facturation.enums;

/**
 * Cycle de vie d'un bon de commande.
 *
 * Transitions autorisees :
 *   DRAFT         --> SENT
 *   SENT          --> SIGNED_CLIENT  (client signe via lien email)
 *   SIGNED_CLIENT --> CONFIRMED      (admin confirme apres signature)
 *   SIGNED_CLIENT --> CANCELLED      (annulation apres signature)
 *   CONFIRMED     --> CONVERTED      (converti en commande ou facture)
 *   SENT          --> CANCELLED      (annulation avant signature)
 */
public enum StatutBonCommande {
    DRAFT,          // bon de commande en cours de creation, modifiable
    SENT,           // envoye au client, en attente de signature
    SIGNED_CLIENT,  // signe par le client (via lien email)
    CONFIRMED,      // confirme par l'admin apres signature client
    CONVERTED,      // converti en commande ou facture directe
    CANCELLED       // annule
}