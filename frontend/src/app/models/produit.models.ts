/**
 * MODÈLES PRODUIT
 * DTOs et interfaces pour la gestion des produits
 */

// ========== RÉPONSES ==========

export interface ProduitItem {
  id: number;
  reference: string;
  designation: string;
  prixUnitaire: number;
  tauxTVA: number;
  description?: string;
  created?: string;
  updated?: string;
}

export interface ProduitDetailResponse extends ProduitItem {
  stock?: number;
  unite?: string;
  categorie?: string;
  fournisseur?: string;
}

export interface ProduitListResponse {
  content: ProduitItem[];
  totalElements: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
}

export interface ProduitResponseDTO extends ProduitItem {
  createdAt?: string;
  updatedAt?: string;
}

// ========== REQUÊTES ==========

export interface CreateProduitRequest {
  reference: string;
  designation: string;
  prixUnitaire: number;
  tauxTVA: number;
  description?: string;
  stock?: number;
  unite?: string;
}

export interface UpdateProduitRequest {
  reference?: string;
  designation?: string;
  prixUnitaire?: number;
  tauxTVA?: number;
  description?: string;
  stock?: number;
  unite?: string;
}

// ========== INTERFACES LOCALES ==========

export interface ProduitForm {
  reference: string;
  designation: string;
  prixUnitaire: number;
  tauxTVA: number;
  description?: string;
}

export interface ProduitFilter {
  search?: string;
  tauxTVAMin?: number;
  tauxTVAMax?: number;
  prixMin?: number;
  prixMax?: number;
  page?: number;
  pageSize?: number;
}

export interface ProduitStats {
  total: number;
  totalValue: number;
  averagePrice: number;
  avgTVA: number;
}

export interface LigneFactureInfo {
  produit: ProduitItem;
  quantite: number;
  sousTotal: number;
  montantTVA: number;
  totalTTC: number;
}
