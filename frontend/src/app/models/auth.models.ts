/**
 * MODÈLES D'AUTHENTIFICATION
 * Requêtes et réponses pour login/register
 */

import { UserRole, BuyerRole, AccountStatus } from './enums';

// ========== REQUÊTES ==========

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  // Données utilisateur
  email: string;
  password: string;
  nom: string;
  prenom: string;
  telephone?: string;

  // Rôle et type
  role?: UserRole;
  typeUser?: BuyerRole | null;

  // Champs Client optionnels
  raisonSociale?: string;
  adresseComplete?: string;
  region?: string;
}

// ========== RÉPONSES ==========

export interface AuthResponse {
  // Auth
  token: string;
  type?: string;
  message?: string | null;

  // User info
  id: number;
  email: string;
  nom: string;
  prenom?: string | null;
  telephone?: string | null;
  role: UserRole;
  typeUser?: BuyerRole | null;

  // Status
  accountStatus?: AccountStatus;
  firstLogin?: boolean;
  requirePasswordChange?: boolean;
  enabled?: boolean;

  // Relations
  clientId?: number | null;
  emetteurId?: number | null;
}

export interface AuthToken {
  token: string;
  expiresIn?: number;
  type?: string;
}
