# Backlog de Produit - Plateforme de Facturation

## Épopée 1 : Authentification et Gestion de l'Entreprise (Sprint 1)

**Objectif** : Mettre en place les fondations de l'application.

| ID | Tâche | User Story | Est. (h) | Complexité |
|:---|:---|:---|:---:|:---:|
| 1 | Gestion des comptes | En tant qu'utilisateur, je veux me connecter pour accéder à ma session. | 8 | Moyenne |
| 2 | Gestion des demandes | En tant que SuperAdmin, je veux valider ou rejeter une demande d'entreprise. | 8 | Moyenne |
| 3 | Gestion des collaborateurs | En tant qu'EntrepriseAdmin, je veux gérer mes collaborateurs (Manager/Viewer). | 6 | Moyenne |
| 4 | Profil & Sécurité | En tant qu'utilisateur, je veux modifier mon profil et mon mot de passe. | 5 | Moyenne |
| 5 | Gestion des Clients | En tant que gérant, je veux ajouter, modifier ou supprimer un client. | 8 | Moyenne |
| 6 | Gestion des Produits | En tant que gérant, je veux gérer mon catalogue de produits/services. | 8 | Moyenne |
| 7 | Consultation globale | En tant que **Consultant**, je veux pouvoir consulter l'ensemble des données. | 2 | Faible |

---

## Épopée 2 : Cycle de Vie des Documents Commerciaux (Sprint 2)

**Objectif** : Automatiser le flux de facturation du devis jusqu'au paiement.

| ID | Tâche | User Story | Est. (h) | Complexité |
|:---|:---|:---|:---:|:---:|
| 1 | **Gestion des Devis** | - En tant que gér., je veux gérer (création/modif) et suivre l'expiration des devis.<br>- En tant que client, je veux consulter et accept./rejeter un devis reçu par mail. | 11 | Moyenne |
| 2 | **Bons de commande** | - En tant que gérant, je veux générer un bon de commande lié à l'acceptation de devis. | 4 | Moyenne |
| 3 | **Gestion des Commandes** | - En tant que gérant, je veux générer une commande et suivre son état depuis la confirmation du BC. | 6 | Haute |
| 4 | **Bons de livraison** | - En tant que gérant, je veux générer un BL pour clore la réception de commande. | 4 | Moyenne |
| 5 | **Gestion de facture** | - En tant que gérant, je veux générer les factures selon les trois flux métier.<br>- En tant que gérant, je veux suivre le cycle de vie d'une facture (Brouillon → Envoyée → Payée) avec avoir auto. | 13 | Haute |
| 6 | **Outils & Public** | - En tant que gérant, je veux imprimer/télécharger la facture en PDF professionnel.<br>- En tant que user, je veux scanner le QR Code pour vérifier le statut de facture. | 8 | Moyenne |

---

## Épopée 3 : Signatures Numériques & Sécurité (Sprint 3)

**Objectif** : Intégrer la signature électronique et la validation légale.

| ID | Tâche | User Story | Est. (h) | Complexité |
|:---|:---|:---|:---:|:---:|
| 1 | **Signature Numérique** | - En tant que Manager, je veux charger la clé de signature (.p12) afin de pouvoir signer les factures.<br>- En tant que Manager, je veux convertir une facture JSON en XML afin de préparer sa signature.<br>- En tant que Manager, je veux appliquer une signature XAdES-B sur le XML généré afin de garantir son intégrité.<br>- En tant que Manager, je veux stocker le XML signé en base de données afin de conserver une preuve.<br>- En tant que Manager, je veux télécharger le XML signé afin de le partager ou de le vérifier.<br>- En tant que Manager, je veux valider les champs du XML avant signature afin d'éviter des erreurs.<br>- En tant que Client, je veux signer électroniquement un bon de commande afin de valider ma commande.<br>- En tant que Client, je veux signer électroniquement un bon de livraison afin de confirmer la réception des marchandises. | 39 | Très Haute |

---

## Épopée 4 : Tableaux de Bord et Statistiques (Sprint 4)

**Objectif** : Visualiser les performances et gérer les avoirs.

| ID | Tâche | User Story | Estimation (h) |
|:---|:---|:---|:---:|
| 10 | Dashboard | En tant que gérant, je veux voir l'état global de mon activité (CA, impayés). | 8 |
| 11 | Statistiques | En tant que gérant, je veux consulter des graphiques sur mes ventes par période. | 8 |
| 12 | Gestion des Avoirs | En tant que Manager, je veux gérer mes avoirs (modification, validation, envoi) liés aux factures annulées. | 6 |

---

## Résumé des Sprints

| Sprint | Nom | Focalisation | Heures |
|:---|:---|:---|:---:|
| 1 | Fondations | Authentification, Clients & Produits | 43h |
| 2 | Flux Métier | Devis, Commandes, BL, Factures & QR Code | 50h |
| 3 | Signatures & Sécurité | Signatures numériques, Clés .p12 & Validation XAdES | 39h |

**Total : 29 user stories | 125 heures environ**
