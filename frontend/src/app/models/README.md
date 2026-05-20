/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║                      STRUCTURE DES MODÈLES FRONTEND                          ║
 * ║                       (Source unique de vérité)                              ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 * 
 * NOUVEAU FICHIERS (*.models.ts avec 's' au pluriel)
 * ======================================================
 * 
 * 1️⃣  ENUMS.TS
 *    ─────────────────────────────────────────────────────────────────────────
 *    Énumérés centralisés et type guards
 * 
 *    Exports:
 *    • USER_ROLES constant: ['SUPER_ADMIN', 'ENTREPRISE_ADMIN', 'ENTREPRISE_VIEWER', 'CLIENT', 'EMETTEUR']
 *    • type UserRole = union of above
 *    • type BuyerRole = 'CLIENT' | 'EMETTEUR'
 *    • ACCOUNT_STATUSES: ['PENDING', 'ACTIVE', 'DISABLED', 'EXPIRED', 'REQUESTED', 'REJECTED']
 *    • type AccountStatus = union of above
 *    • DEMANDE_STATUSES: ['REQUESTED', 'APPROVED', 'REJECTED', 'PENDING']
 *    • type DemandeStatus
 *    • FACTURE_STATUSES: ['DRAFT', 'SEND', 'PARTIALLY_PAID', 'FULLY_PAID', 'CANCELLED', 'OVERDUE']
 *    • type FactureStatus
 *    • REGIONS_TUNISIE: 24 régions
 *    • type RegionTunisie
 *    • Functions: isUserRole(), isAccountStatus(), normalizeUserRole(), etc.
 * 
 *    Usage:
 *    import { UserRole, ADMIN_ROLES, normalizeUserRole } from '@app/models/enums';
 * 
 * ─────────────────────────────────────────────────────────────────────────────
 * 
 * 2️⃣  AUTH.MODELS.TS
 *    ─────────────────────────────────────────────────────────────────────────
 *    Authentification: Requêtes et réponses
 * 
 *    Requêtes:
 *    • LoginRequest { email, password }
 *    • RegisterRequest { email, password, nom, prenom, telephone?, role?, typeUser?, raisonSociale?, region? }
 * 
 *    Réponses:
 *    • AuthResponse { token, type?, id, email, nom, prenom?, role, accountStatus?, firstLogin?, clientId?, emetteurId? }
 *    • AuthToken { token, expiresIn?, type? }
 * 
 *    Usage:
 *    import { AuthResponse, LoginRequest } from '@app/models/auth.models';
 * 
 * ─────────────────────────────────────────────────────────────────────────────
 * 
 * 3️⃣  USER.MODELS.TS
 *    ─────────────────────────────────────────────────────────────────────────
 *    Gestion des utilisateurs
 * 
 *    DTOs:
 *    • UserDTO { id, nom, prenom, email, telephone?, role, typeUser?, accountStatus?, firstLogin?, enabled, clientId?, emetteurId? }
 *    • UserResponseDTO { ...UserDTO fields as strings, createdAt?, updatedAt? }
 * 
 *    Requêtes:
 *    • CreateUserRequest
 *    • UpdateUserRequest
 *    • UpdateProfileRequest
 *    • UpdatePasswordRequest { currentPassword, newPassword, confirmPassword }
 * 
 *    Réponses:
 *    • UserListResponse { content[], totalElements, totalPages, currentPage, pageSize }
 * 
 *    Usage:
 *    import { UserDTO, UpdatePasswordRequest } from '@app/models/user.models';
 * 
 * ─────────────────────────────────────────────────────────────────────────────
 * 
 * 4️⃣  DEMANDE.MODELS.TS
 *    ─────────────────────────────────────────────────────────────────────────
 *    Demandes d'entreprise (SUPER_ADMIN)
 * 
 *    Réponses:
 *    • DemandeItem { id, raisonSociale, email, status, accountStatus }
 *    • DemandeDetailResponse { id, raisonSociale, nomRepresentant, prenomRepresentant, notes?, requestDate, approvalDate?, rejectionReason?, approvedBy? }
 *    • DemandeListResponse (pagination)
 * 
 *    Requêtes:
 *    • CreateDemandeRequest
 *    • ApproveDemandeRequest { id, notes? }
 *    • RejectDemandeRequest { id, rejectionReason }
 * 
 *    Usage:
 *    import { DemandeItem, ApproveDemandeRequest } from '@app/models/demande.models';
 * 
 * ─────────────────────────────────────────────────────────────────────────────
 * 
 * 5️⃣  COLLABORATEUR.MODELS.TS
 *    ─────────────────────────────────────────────────────────────────────────
 *    Collaborateurs d'entreprise (ENTREPRISE_ADMIN)
 * 
 *    • CollaborateurItem { id, nom, prenom, email, telephone?, fonction?, role, accountStatus }
 *    • CollaborateurDetailResponse (+ permissions, lastLoginDate)
 *    • CreateCollaborateurRequest
 *    • UpdateCollaborateurRequest
 *    • InviteCollaborateurRequest
 *    • CollaborateurFilter, CollaborateurListResponse
 * 
 * ─────────────────────────────────────────────────────────────────────────────
 * 
 * 6️⃣  CLIENT.MODELS.TS
 *    ─────────────────────────────────────────────────────────────────────────
 *    Clients/Acheteurs (ENTREPRISE_ADMIN)
 * 
 *    • ClientItem { id, raisonSociale, email?, telephone?, region?, adresseComplete? }
 *    • ClientDetailResponse (+ nomRepresentant, prenomRepresentant, nrc, matFiscale, contact)
 *    • CreateClientRequest, UpdateClientRequest
 *    • ClientFilter, ClientStats
 * 
 * ─────────────────────────────────────────────────────────────────────────────
 * 
 * 7️⃣  PRODUIT.MODELS.TS
 *    ─────────────────────────────────────────────────────────────────────────
 *    Produits (ENTREPRISE_ADMIN)
 * 
 *    • ProduitItem { id, reference, designation, prixUnitaire, tauxTVA, description? }
 *    • ProduitDetailResponse (+ stock, unite, categorie)
 *    • CreateProduitRequest, UpdateProduitRequest
 *    • ProduitFilter, ProduitStats
 *    • LigneFactureInfo { produit, quantite, sousTotal, montantTVA, totalTTC }
 * 
 * ─────────────────────────────────────────────────────────────────────────────
 * 
 * 8️⃣  FACTURE.MODELS.TS
 *    ─────────────────────────────────────────────────────────────────────────
 *    Factures et lignes
 * 
 *    Factures:
 *    • FactureItem { id, numFact, dateEmission, client, totalTTC, statut }
 *    • FactureDetailResponse (+ lignes[], acheteurId, vendeurId)
 * 
 *    Lignes:
 *    • LigneFactureResponse { id, produitId, designation, quantite, prixUnitaire, tauxTVA, totalTTC }
 *    • LigneFactureRequestDTO { produit?, quantite }
 * 
 *    Requêtes:
 *    • CreateFactureRequest { dateEmission, acheteurId, typeAcheteur, lignes[] }
 *    • UpdateFactureRequest, SendFactureRequest
 * 
 *    • FactureFilter, FactureStatistics, FacturePrintData
 * 
 * ─────────────────────────────────────────────────────────────────────────────
 * 
 * 9️⃣  EMETTEUR.MODELS.TS
 *    ─────────────────────────────────────────────────────────────────────────
 *    Émetteurs/Vendeurs (EMETTEUR)
 * 
 *    • EmetteurItem { id, raisonSociale, email?, telephone?, adresseComplete? }
 *    • EmetteurResponseDTO (+ nrc, matFiscale, accountStatus)
 *    • EmetteurDetailResponse (+ totalVentes, totalProduits, chiffreAffaires)
 *    • EmetteurProfile { id, user, emetteur, stats }
 *    • CreateEmetteurRequest, UpdateEmetteurRequest
 * 
 *    Note: EmetteurDashboard importé depuis dashboard.models.ts
 * 
 * ─────────────────────────────────────────────────────────────────────────────
 * 
 * 🔟 DASHBOARD.MODELS.TS
 *    ─────────────────────────────────────────────────────────────────────────
 *    KPI et statistiques pour tous les rôles
 * 
 *    Rôles:
 *    • SuperAdminDashboard { totalEntreprises, totalUtilisateurs, demandesPendantes, totalFacturesEmises }
 *    • EntrepriseAdminDashboard { totalVentes, totalAchats, chiffreAffairesMois, totalClients, totalProduits }
 *    • ClientDashboard { totalAchats, montantJour, montantMois, facturesNonPayees }
 *    • ViewerDashboard { totalFactures, totalClients, totalProduits, lectureSeule: true }
 *    • EmetteurDashboard { totalVentes, totalAchats, chiffreAffairesMois, nombreClients }
 * 
 *    Composants:
 *    • KPICard { title, value, icon, color, trend? }
 *    • KPIDashboard { cards[], period }
 *    • ChartData { labels, datasets[] }
 *    • PieChartData { labels, datasets[] }
 *    • RecentActivity { id, type, action, description, timestamp }
 * 
 * ─────────────────────────────────────────────────────────────────────────────
 * 
 * 🎯 INDEX.TS
 *    ─────────────────────────────────────────────────────────────────────────
 *    Central export point pour tous les modèles
 * 
 *    Usage simplifié:
 *    import { UserDTO, AuthResponse, DemandeItem, UserRole } from '@app/models';
 * 
 * ═════════════════════════════════════════════════════════════════════════════
 * 
 * FLOW D'UTILISATION
 * ═════════════════════════════════════════════════════════════════════════════
 * 
 * 1. AUTH SERVICE
 *    ─────────────────────────────────────────────────────────────────────────
 *    login(LoginRequest) → Observable<AuthResponse>
 *      → saveSession() → UserDTO en localStorage
 *      → isLoggedIn$ signal activé
 *    
 *    currentUser() signal → UserDTO | null
 *    hasRole(UserRole) → boolean
 *    hasAnyRole(UserRole[]) → boolean
 * 
 * 2. ROUTE GUARDS
 *    ─────────────────────────────────────────────────────────────────────────
 *    authGuard → vérifie isLoggedIn
 *    roleGuard → vérifie hasAnyRole(route.data.roles)
 *    guestGuard → redirige si déjà connecté
 * 
 * 3. SERVICES
 *    ─────────────────────────────────────────────────────────────────────────
 *    demande.service.ts:
 *      getList() → Observable<DemandeListResponse>
 *      approve(ApproveDemandeRequest) → Observable<void>
 *      reject(RejectDemandeRequest) → Observable<void>
 * 
 *    client.service.ts:
 *      getList(ClientFilter) → Observable<ClientListResponse>
 *      create(CreateClientRequest) → Observable<ClientItem>
 *      update(id, UpdateClientRequest) → Observable<ClientItem>
 * 
 *    facture.service.ts:
 *      getList(FactureFilter) → Observable<FactureListResponse>
 *      create(CreateFactureRequest) → Observable<FactureItem>
 *      getDetail(id) → Observable<FactureDetailResponse>
 *      print(id) → Observable<FacturePrintData>
 * 
 * 4. COMPOSANTS
 *    ─────────────────────────────────────────────────────────────────────────
 *    demandes-list.component:
 *      demandes$: Observable<DemandeItem[]>
 *      onApprove(id) → appelle demandeService.approve()
 *      onReject(id) → appelle demandeService.reject()
 * 
 *    factures-list.component:
 *      factures$: Observable<FactureItem[]>
 *      filteredFactures: computed via signal filter
 *      onCreateFacture(CreateFactureRequest) → POST /factures
 * 
 * ═════════════════════════════════════════════════════════════════════════════
 * 
 * EXEMPLE DE COMPOSANT
 * ═════════════════════════════════════════════════════════════════════════════
 * 
 * import { Component } from '@angular/core';
 * import { 
 *   DemandeItem, 
 *   ApproveDemandeRequest, 
 *   DemandeListResponse 
 * } from '@app/models';
 * import { DemandeService } from '@app/services/demande.service';
 * 
 * @Component({
 *   selector: 'app-demandes-list',
 *   template: `
 *     <table>
 *       <tr *ngFor="let demande of demandes">
 *         <td>{{ demande.raisonSociale }}</td>
 *         <td>{{ demande.status }}</td>
 *         <td>
 *           <button (click)="onApprove(demande.id)">Approuver</button>
 *           <button (click)="onReject(demande.id)">Rejeter</button>
 *         </td>
 *       </tr>
 *     </table>
 *   `
 * })
 * export class DemandesListComponent {
 *   demandes: DemandeItem[] = [];
 * 
 *   constructor(private demandeService: DemandeService) {}
 * 
 *   ngOnInit() {
 *     this.demandeService.getList().subscribe(
 *       (response: DemandeListResponse) => {
 *         this.demandes = response.content;
 *       }
 *     );
 *   }
 * 
 *   onApprove(id: number) {
 *     const request: ApproveDemandeRequest = { id, notes: 'Approuvé' };
 *     this.demandeService.approve(request).subscribe(() => {
 *       this.demandes = this.demandes.filter(d => d.id !== id);
 *     });
 *   }
 * }
 * 
 * ═════════════════════════════════════════════════════════════════════════════
 * 
 * NOTES IMPORTANTES
 * ═════════════════════════════════════════════════════════════════════════════
 * 
 * 1. Type Safety
 *    - Tous les modèles sont strictement typés (TypeScript strict mode)
 *    - Utiliser les types union pour les énums (ne pas utiliser strings)
 *    - Les fonctions isUserRole() validént à l'exécution
 * 
 * 2. Normalization
 *    - normalizeUserRole() gère les legacy values (ADMIN → SUPER_ADMIN, USER → CLIENT)
 *    - Appliquer lors de la réception du backend
 * 
 * 3. Optionals
 *    - Les champs avec ? sont optionnels (peuvent être undefined)
 *    - Les réponses du backend peuvent omettre certains champs
 *    - Toujours vérifier null avant utilisation
 * 
 * 4. Pagination
 *    - ListResponse objects contiennent toujours { content[], totalElements, totalPages, currentPage, pageSize }
 *    - Implémenter la pagination dans les services avec skip/take/pageNumber
 * 
 * 5. Imports
 *    - Préférer: import { UserDTO, AuthResponse } from '@app/models';
 *    - Éviter: import { UserDTO } from '@app/models/user.models.ts';
 *    - Le index.ts centralise tous les exports
 */
