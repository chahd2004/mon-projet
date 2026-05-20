/**
 * MODÈLE AVOIR (Credit Note)
 * Créé automatiquement lors de l'annulation d'une facture
 */

import { BuyerRole } from './role.model';

export type AvoirType = 'TOTAL' | 'PARTIEL';
export type AvoirStatut = 'DRAFT' | 'VALIDATED' | 'SENT';

export interface AvoirLine {
  id?: number;
  produitId: number;
  produitDesignation?: string;
  quantite: number;
  prixUnitaire?: number;
  montantHT?: number;
}

export interface Avoir {
  id: number;
  numAvoir: string;                 // AV-2024-0001
  type: AvoirType;                  // TOTAL ou PARTIEL
  statut: AvoirStatut;              // DRAFT → VALIDATED → SENT
  totalHT: number;
  montantTVA: number;
  totalTTC: number;
  
  // Facture associée
  factureSourceId: number;
  factureSourceNum: string;          // FACT-2026-0001
  
  // Vendeur & Acheteur
  vendeurId: number;
  nomAcheteur: string;
  nomVendeur: string;
  emailAcheteur?: string;
  emailVendeur?: string;
  
  // Dates
  dateCreation: string;
  
  // Raison de l'avoir
  motif?: string;                   // Ex: "Annulation de la facture FACT-2026-0001"
  
  lignes: AvoirLine[];
  
  // Métadonnées
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateAvoirRequest {
  factureSourceId: number;
  type: AvoirType;
  motif?: string;
  lignes: AvoirLine[];
}

export interface AvoirListResponse {
  content: Avoir[];
  totalElements: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
}

export enum AvoirStatutLabel {
  DRAFT = 'Brouillon',
  VALIDATED = 'Validé',
  SENT = 'Envoyé'
}

export const AVOIR_STATUT_COLORS = {
  DRAFT: '#ef4444',        // 🟠 Orange/Red
  VALIDATED: '#3b82f6',    // 🔵 Blue
  SENT: '#10b981'          // 🟢 Green
};
