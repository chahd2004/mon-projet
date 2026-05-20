/**
 * MODÈLES DEMANDE
 * Request/Response pour la gestion des demandes d'entreprise
 */

import { DemandeStatus, AccountStatus } from './enums';

// ========== RÉPONSES ==========

export interface DemandeItem {
  id: number;
  raisonSociale: string;
  matriculeFiscal: string;
  email: string;
  telephone?: string;
  region?: string;
  status: DemandeStatus;
  accountStatus?: AccountStatus;
  createdAt?: string;
  updatedAt?: string;
}

export interface DemandeDetailResponse {
  id: number;
  code?: string;
  raisonSociale: string;
  matriculeFiscal: string;
  formeJuridique?: string;
  adresseComplete?: string;
  region?: string;
  email: string;
  telephone?: string;
  siteWeb?: string;
  iban?: string;
  banque?: string;
  nomResponsable: string;
  prenomResponsable: string;
  fonctionResponsable?: string;
  status: DemandeStatus;
  accountStatus?: AccountStatus;
  dateSoumission: string;
  dateTraitement?: string;
  commentaireTraitement?: string;
  requestDate: string;
  approvalDate?: string;
  rejectionReason?: string;
  approvedBy?: string;
}

export interface DemandeListResponse {
  content: DemandeItem[];
  totalElements: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
}

// ========== REQUÊTES ==========

export interface CreateDemandeRequest {
  code: string;
  raisonSociale: string;
  matriculeFiscal: string;
  email: string;
  formeJuridique?: string;
  adresseComplete: string;
  region: string;
  telephone?: string;
  siteWeb?: string;
  iban?: string;
  banque?: string;
  nomResponsable: string;
  prenomResponsable: string;
  fonctionResponsable: string;
}

export interface ApproveDemandeRequest {
  id: number;
  notes?: string;
}

export interface RejectDemandeRequest {
  id: number;
  rejectionReason: string;
}

export interface UpdateDemandeRequest {
  status?: DemandeStatus;
  accountStatus?: AccountStatus;
  notes?: string;
}

// ========== INTERFACE LOCALES ==========

export interface DemandeAction {
  id: number;
  action: 'APPROVE' | 'REJECT';
  reason?: string;
}

export interface DemandeStatistics {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
}
