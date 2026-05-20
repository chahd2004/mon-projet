package com.pfe.facturation.enums;

public enum UserRole {
    SUPER_ADMIN,
    ENTREPRISE_ADMIN,
    ENTREPRISE_MANAGER, // Gérant/Manager : accès quasi-complet sans gestion collaborateurs
    ENTREPRISE_VIEWER,
    EMETTEUR, // Restauré pour compatibilité avec les données dans la base
    CLIENT    // Restauré pour compatibilité avec les données dans la base
}