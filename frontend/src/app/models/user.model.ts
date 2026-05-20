import { AccountStatus, BuyerRole, UserRole } from './role.model';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  nom: string;
  prenom: string;
  email: string;
  password: string;
  telephone?: string;
  role?: UserRole;
  typeUser?: BuyerRole | null;
  // Champs Client (requis si typeUser = CLIENT)
  raisonSociale?: string;
  adresseComplete?: string;
  region?: string;
}

export interface AuthResponse {
  token: string;
  type: string;
  id: number;
  email: string;
  nom: string;
  prenom?: string | null;
  telephone?: string | null;
  role: UserRole;
  accountStatus?: AccountStatus;
  firstLogin?: boolean;
  requirePasswordChange?: boolean;
  message?: string | null;
  clientId?: number | null;
  emetteurId?: number | null;
  typeUser?: BuyerRole | null;
}

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
  clientId?: number;
  emetteurId?: number;
}