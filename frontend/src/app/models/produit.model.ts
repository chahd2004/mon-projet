// src/app/models/produit.model.ts - Aligné avec le backend (camelCase)
export interface Produit {
  id: number;
  reference: string;
  designation: string;
  prixUnitaire: number;
  tauxTVA: number;
  emetteurId?: number;
  emetteurRaisonSociale?: string;
}

export interface ProduitRequest {
  reference: string;
  designation: string;
  prixUnitaire: number;
  tauxTVA: number;
}