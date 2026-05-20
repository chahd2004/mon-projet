/**
 * MODÈLES ÉMETTEUR
 * DTOs et interfaces pour la gestion des émetteurs (vendeurs)
 */

import { UserRole } from './enums';
import { EmetteurDashboard } from './dashboard.models';

// ========== RÉPONSES ==========

export interface EmetteurItem {
  id: number;
  raisonSociale: string;
  email?: string;
  telephone?: string;
  adresseComplete?: string;
  nomRepresentant?: string;
  prenomRepresentant?: string;
}

export interface EmetteurResponseDTO extends EmetteurItem {
  nrc?: string;
  matFiscale?: string;
  accountStatus?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface EmetteurDetailResponse extends EmetteurResponseDTO {
  userId: number;
  totalVentes: number;
  totalProduits: number;
  chiffreAffaires: number;
  derniereFacture?: string;
}

export interface EmetteurListResponse {
  content: EmetteurResponseDTO[];
  totalElements: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
}

// ========== STATS ==========

export interface EmetteurStats {
  ventes: number;
  achats: number;
  ca: number;
  clients: number;
}

// ========== REQUÊTES ==========

export interface CreateEmetteurRequest {
  raisonSociale: string;
  email?: string;
  telephone?: string;
  adresseComplete?: string;
  nomRepresentant?: string;
  prenomRepresentant?: string;
}

export interface UpdateEmetteurRequest {
  raisonSociale?: string;
  email?: string;
  telephone?: string;
  adresseComplete?: string;
  nomRepresentant?: string;
  prenomRepresentant?: string;
}

export interface UpdateProfileEmetteurRequest {
  raisonSociale?: string;
  email?: string;
  telephone?: string;
  adresseComplete?: string;
}

// ========== INTERFACES LOCALES ==========

export interface EmetteurForm {
  raisonSociale: string;
  email?: string;
  telephone?: string;
  adresseComplete?: string;
  nomRepresentant?: string;
  prenomRepresentant?: string;
}

export interface EmetteurFilter {
  search?: string;
  accountStatus?: string;
  page?: number;
  pageSize?: number;
}

export interface EmetteurProfile {
  id: number;
  user: {
    id: number;
    email: string;
    nom: string;
    prenom: string;
    role: UserRole;
  };
  emetteur: EmetteurDetailResponse;
  stats: EmetteurDashboard;
}
