/**
 * MODÈLES CLIENT
 * DTOs et interfaces pour la gestion des clients (acheteurs)
 */

import { RegionTunisie } from './enums';

// ========== RÉPONSES ==========

export interface ClientItem {
  id: number;
  raisonSociale: string;
  email?: string;
  telephone?: string;
  region?: RegionTunisie;
  adresseComplete?: string;
  created?: string;
  updated?: string;
}

export interface ClientDetailResponse extends ClientItem {
  nomRepresentant?: string;
  prenomRepresentant?: string;
  nrc?: string;
  matFiscale?: string;
  contact?: string;
  notes?: string;
}

export interface ClientListResponse {
  content: ClientItem[];
  totalElements: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
}

export interface ClientResponseDTO {
  id: number;
  raisonSociale: string;
  email?: string;
  telephone?: string;
  region?: RegionTunisie;
  adresseComplete?: string;
  accountStatus?: string;
}

// ========== REQUÊTES ==========

export interface CreateClientRequest {
  raisonSociale: string;
  email?: string;
  telephone?: string;
  region?: RegionTunisie;
  adresseComplete?: string;
  nomRepresentant?: string;
  prenomRepresentant?: string;
}

export interface UpdateClientRequest {
  raisonSociale?: string;
  email?: string;
  telephone?: string;
  region?: RegionTunisie;
  adresseComplete?: string;
  nomRepresentant?: string;
  prenomRepresentant?: string;
}

// ========== INTERFACES LOCALES ==========

export interface ClientForm {
  raisonSociale: string;
  email?: string;
  telephone?: string;
  region?: RegionTunisie;
  adresseComplete?: string;
}

export interface ClientFilter {
  search?: string;
  region?: RegionTunisie;
  page?: number;
  pageSize?: number;
}

export interface ClientStats {
  total: number;
  active: number;
  inactive: number;
  byRegion: { [key in RegionTunisie]: number };
}
