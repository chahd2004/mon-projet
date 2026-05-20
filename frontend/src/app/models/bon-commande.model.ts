export type StatutBonCommande =
  | 'DRAFT'
  | 'SENT'
  | 'SIGNED_CLIENT'
  | 'CONFIRMED'
  | 'CONVERTED'
  | 'CANCELLED'
  | string;

export interface LigneBonCommande {
  id?: number;
  produitId?: number;
  produitDesignation?: string;
  quantite?: number;
  prixUnitaire?: number;
  montantHT?: number;
  tauxTVA?: number;
}

export interface BonCommande {
  id: number;
  numBonCommande: string;
  numCommande?: string; // Ajouté pour compatibilité backend
  dateCreation: string;
  acheteurId: number;
  acheteurNom: string;
  vendeurId: number;
  vendeurNom: string;
  statut: StatutBonCommande;
  modePaiement?: string | null;
  cancellationReason?: string | null;
  devisSourceRef?: string | null;
  documentConvertiRef?: string | null;
  totalHT: number;
  montantTVA: number;
  totalTTC: number;
  montantEnLettres?: string | null;
  lignes?: LigneBonCommande[];
}

export interface LigneBonCommandeRequest {
  produitId: number;
  quantite: number;
}

export interface BonCommandeRequest {
  dateCreation: string;
  acheteurId: number;
  typeAcheteur: 'CLIENT' | 'EMETTEUR';
  vendeurId: number;
  modePaiement: 'VIREMENT' | 'CHEQUE' | 'ESPECES' | 'CARTE';
  lignes: LigneBonCommandeRequest[];
}
