// src/app/models/facture.model.ts - Aligné avec le backend (camelCase)
export interface Facture {
  id: number;
  numFact: string;
  dateEmission: string;
  datePaiement: string;
  statut: string;
  modePaiement?: string;
  montantEnLettres?: string;
  totalHT: number;
  totalTTC: number;
  montantTVA: number;
  acheteurId: number;
  acheteurNom: string;
  typeAcheteur: 'CLIENT' | 'EMETTEUR';
  vendeurId: number;
  vendeurNom: string;
  lignes?: LigneFacture[];
  periode_du?: string;
  periode_au?: string;
  reference_unique?: string;
  reference_ttn?: string;
}

export interface LigneFacture {
  id?: number;
  produitId: number;
  quantite: number;
  produitDesignation?: string;
}

export interface FactureRequest {
  dateEmission: string;
  datePaiement: string;
  acheteurId: number;
  typeAcheteur: 'CLIENT' | 'EMETTEUR';
  vendeurId: number;
  modePaiement: string;
  statut?: string;
  lignes: { produitId: number; quantite: number }[];
}

export enum StatutFacture {
  BROUILLON = 'BROUILLON',
  EN_ATTENTE = 'EN_ATTENTE',
  PAYEE = 'PAYEE',
  ANNULEE = 'ANNULEE',
  EN_RETARD = 'EN_RETARD'
}

export enum ModePaiement {
  ESPECES = 'ESPECES',
  CHEQUE = 'CHEQUE',
  VIREMENT = 'VIREMENT',
  CCP = 'CCP',
  CARTE_BANCAIRE = 'CARTE_BANCAIRE'
}