package com.pfe.facturation.enums;

public enum AccountStatus {
    REQUESTED,   // Demande reçue, en attente de création par admin
    PENDING,     // Compte créé, en attente de première connexion
    ACTIVE,      // Compte actif
    DISABLED,    // Désactivé manuellement
    REJECTED,    // Demande rejetée par SUPER_ADMIN
    EXPIRED      // Expiré (fin de contrat/abonnement)
}