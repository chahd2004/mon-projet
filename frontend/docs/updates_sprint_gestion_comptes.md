# Mise à jour de la Documentation - Sprint Gestion des Comptes

## Objectif
Intégrer les nouvelles fonctionnalités du SuperAdmin dans les diagrammes de conception et la documentation technique.

## User Stories ajoutées
- **En tant que SuperAdmin**, je veux créer d'autres SuperAdmins pour déléguer la gestion de la plateforme.
- **En tant que SuperAdmin**, je veux consulter la liste des utilisateurs pour avoir une vision globale des comptes actifs.

## Diagrammes mis à jour
Les éléments suivants ont été mis à jour :
1. **Diagramme de Cas d'Utilisation** : Ajout des actions "Créer un SuperAdmin" et "Consulter la liste des utilisateurs".
2. **Diagramme de Séquence** : Ajout des flux techniques pour ces deux nouvelles actions.

## Plan d'implémentation (Backend)
- Ajout de `createSuperAdmin` dans `UserService`.
- Ajout d'un endpoint `GET /api/super-admin/users` dans `SuperAdminController`.
- Intégration avec `EmailService` pour l'envoi des accès.
