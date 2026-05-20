/**
 * MODÈLES COLLABORATEUR
 * DTOs et interfaces pour la gestion des collaborateurs d'une entreprise
 */

import { UserRole, AccountStatus } from './enums';

// ========== RÉPONSES ==========

export interface CollaborateurItem {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  telephone?: string;
  fonction?: string;
  role: UserRole;
  accountStatus: AccountStatus;
  createdAt?: string;
}

export interface CollaborateurDetailResponse extends CollaborateurItem {
  entrepriseId: number;
  permissions?: string[];
  lastLoginDate?: string;
}

export interface CollaborateurListResponse {
  content: CollaborateurItem[];
  totalElements: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
}

// ========== REQUÊTES ==========

export interface CreateCollaborateurRequest {
  email: string;
  nom: string;
  prenom: string;
  telephone?: string;
  fonction?: string;
  role: Exclude<UserRole, 'SUPER_ADMIN' | 'CLIENT' | 'EMETTEUR'>;
}

export interface UpdateCollaborateurRequest {
  nom?: string;
  prenom?: string;
  email?: string;
  telephone?: string;
  fonction?: string;
  role?: UserRole;
  accountStatus?: AccountStatus;
}

export interface InviteCollaborateurRequest {
  email: string;
  nom: string;
  prenom: string;
  fonction?: string;
  role: UserRole;
}

// ========== INTERFACES LOCALES ==========

export interface CollaborateurForm {
  email: string;
  nom: string;
  prenom: string;
  telephone?: string;
  fonction?: string;
  role: UserRole;
}

export interface CollaborateurFilter {
  search?: string;
  role?: UserRole;
  status?: AccountStatus;
  page?: number;
  pageSize?: number;
}
