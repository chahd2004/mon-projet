/**
 * MODÈLES FACTURE
 * DTOs et interfaces pour la gestion des factures et lignes
 */

import { FactureStatus, UserRole } from './enums';

// ========== RÉPONSES ==========

export interface FactureItem {
  id: number;
  numFact: string;
  dateEmission: string;
  client: string;
  totalHT: number;
  montantTVA: number;
  totalTTC: number;
  statut: FactureStatus;
  typeAcheteur: UserRole;
}

export interface FactureDetailResponse extends FactureItem {
  dateEcheance?: string;
  description?: string;
  reference?: string;
  lignes: LigneFactureResponse[];
  observations?: string;
  modePaiement?: string;
  acheteurId?: number;
  vendeurId?: number;
}

export interface FactureListResponse {
  content: FactureItem[];
  totalElements: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
}

export interface FactureResponseDTO extends FactureItem {
  acheteurId?: number;
  vendeurId?: number;
  createdAt?: string;
  updatedAt?: string;
}

// ========== LIGNES FACTURE ==========

export interface LigneFactureResponse {
  id: number;
  produitId: number;
  designation: string;
  quantite: number;
  prixUnitaire: number;
  tauxTVA: number;
  sousTotal: number;
  montantTVA: number;
  totalTTC: number;
}

export interface LigneFactureResponseDTO {
  produit: {
    id: number;
    reference: string;
    designation: string;
    prixUnitaire: number;
    tauxTVA: number;
  };
  quantite: number;
  sousTotal: number;
  montantTVA: number;
  totalTTC: number;
}

// ========== REQUÊTES ==========

export interface CreateFactureRequest {
  dateEmission: Date;
  dateEcheance?: Date;
  acheteurId: number;
  typeAcheteur: UserRole;
  reference?: string;
  description?: string;
  modePaiement?: string;
  lignes: LigneFactureRequestDTO[];
  observations?: string;
}

export interface UpdateFactureRequest {
  dateEmission?: Date;
  dateEcheance?: Date;
  statut?: FactureStatus;
  modePaiement?: string;
  observations?: string;
}

export interface SendFactureRequest {
  factureId: number;
  email?: string;
}

// ========== LIGNES FACTURE REQUÊTE ==========

export interface LigneFactureRequestDTO {
  produitId: number;
  quantite: number;
  prixUnitaire?: number;
  tauxTVA?: number;
}

export interface LigneFactureRequest {
  produit: {
    id: number;
    prixUnitaire: number;
    tauxTVA: number;
  };
  quantite: number;
}

// ========== INTERFACES LOCALES ==========

export interface FactureForm {
  dateEmission: Date;
  dateEcheance?: Date;
  acheteurId: number;
  typeAcheteur: UserRole;
  modePaiement?: string;
  description?: string;
  lignes: LigneFactureForm[];
}

export interface LigneFactureForm {
  produitId: number;
  quantite: number;
  prixUnitaire?: number;
  tauxTVA?: number;
}

export interface FactureFilter {
  search?: string;
  statut?: FactureStatus;
  dateFrom?: Date;
  dateTo?: Date;
  montantMin?: number;
  montantMax?: number;
  page?: number;
  pageSize?: number;
}

export interface FactureStatistics {
  total: number;
  totalAmount: number;
  paid: number;
  unpaid: number;
  overdue: number;
  byStatus: { [key in FactureStatus]: number };
}

export interface FacturePrintData {
  facture: FactureDetailResponse;
  entreprise: {
    nom: string;
    adresse?: string;
    telephone?: string;
    email?: string;
    matFiscale?: string;
  };
  acheteur: {
    nom: string;
    adresse?: string;
    contact?: string;
  };
}
