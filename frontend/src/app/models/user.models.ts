/**
 * MODÈLES UTILISATEUR
 * DTOs et interfaces pour la gestion des utilisateurs
 */

import { UserRole, BuyerRole, AccountStatus } from './enums';

// ========== RÉPONSES ==========

export interface UserDTO {
  id: number;
  nom: string;
  prenom?: string | null;
  email: string;
  telephone?: string | null;
  role: UserRole;
  typeUser?: BuyerRole | null;
  accountStatus?: AccountStatus;
  firstLogin?: boolean;
  enabled: boolean;
  clientId?: number | null;
  emetteurId?: number | null;
  entrepriseId?: number | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface UserResponseDTO {
  id: number;
  nom: string;
  prenom?: string | null;
  email: string;
  telephone?: string | null;
  role: UserRole;
  typeUser?: BuyerRole | null;
  accountStatus?: AccountStatus;
  firstLogin?: boolean;
  enabled: boolean;
  clientId?: number | null;
  emetteurId?: number | null;
  entrepriseId?: number | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface UserListResponse {
  content: UserDTO[];
  totalElements: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
}

// ========== REQUÊTES ==========

export interface CreateUserRequest {
  email: string;
  password: string;
  nom: string;
  prenom: string;
  telephone?: string;
  role: UserRole;
  typeUser?: BuyerRole | null;
  raisonSociale?: string;
  adresseComplete?: string;
  region?: string;
}

export interface UpdateUserRequest {
  nom?: string;
  prenom?: string;
  telephone?: string;
  role?: UserRole;
  typeUser?: BuyerRole | null;
  accountStatus?: AccountStatus;
  enabled?: boolean;
}

export interface UpdateProfileRequest {
  nom?: string;
  prenom?: string;
  telephone?: string;
  email?: string;
}

export interface UpdatePasswordRequest {
  oldPassword: string;
  newPassword: string;
  confirmPassword: string;
}

// ========== INTERFACES LOCALES ==========

export interface UserSessionData {
  id: number;
  email: string;
  nom: string;
  prenom?: string;
  role: UserRole;
  accountStatus?: AccountStatus;
  clientId?: number;
  emetteurId?: number;
}

export interface UserContextData {
  user: UserDTO | null;
  permissions: string[];
  canEdit: boolean;
  canDelete: boolean;
  canApprove: boolean;
}
