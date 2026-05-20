export type StatutBonLivraison =
  | 'DRAFT'
  | 'DELIVERED'
  | 'SIGNED_CLIENT'
  | 'DISPUTE'
  | 'CLOSED'
  | 'CANCELLED';

export interface LigneBonLivraison {
  id?: number;
  produitId?: number;
  produitDesignation?: string;
  quantite?: number;
}

export interface BonLivraison {
  id: number;
  numBonLivraison?: string;
  dateCreation?: string;
  dateLivraison?: string;
  acheteurId?: number;
  acheteurNom?: string;
  vendeurId?: number;
  vendeurNom?: string;
  adresseLivraison?: string;
  statut?: StatutBonLivraison | string;
  disputeReason?: string;
  commandeSourceRef?: string;
  modePaiement?: string;
  factureRef?: string;
  cancellationReason?: string;
  lignes?: LigneBonLivraison[];
}
