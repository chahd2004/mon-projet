// src/app/models/produit.model.ts - Aligné avec le backend (camelCase)
export interface Produit {
  id: number;
  reference: string;
  designation: string;
  prixUnitaire: number;
  tauxTVA: number;
  emetteurId?: number;
  emetteurRaisonSociale?: string;

  // Gestion de stock
  quantiteStock?: number;
  stockIllimite?: boolean;
  seuilAlerteStock?: number;
  disponible?: boolean;
  stockFaible?: boolean;
  ruptureStock?: boolean;
}

export interface ProduitRequest {
  reference: string;
  designation: string;
  prixUnitaire: number;
  tauxTVA: number;
  emetteurId?: number;

  // Gestion de stock
  quantiteStock?: number;
  stockIllimite?: boolean;
  seuilAlerteStock?: number;
}