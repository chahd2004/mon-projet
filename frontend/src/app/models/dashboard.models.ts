/**
 * MODÈLES DASHBOARD
 * Statistiques et données d'affichage pour les tableaux de bord
 */

// ========== STATISTIQUES SUPER_ADMIN ==========

export interface SuperAdminDashboard {
  totalEntreprises: number;
  totalUtilisateurs: number;
  totalDemandes: number;
  demandesPendantes: number;
  totalFacturesEmises: number;
  chiffreAffairesTotal: number;
  derniereMiseAJour: string;
}

export interface AdminStats {
  demandes: DemandeStat[];
  utilisateurs: UserStat[];
  entreprises: EntrepriseStat[];
}

export interface DemandeStat {
  raisonSociale: string;
  date: string;
  status: string;
}

export interface UserStat {
  email: string;
  role: string;
  createdAt: string;
}

export interface EntrepriseStat {
  raisonSociale: string;
  nombreUtilisateurs: number;
  nombreFactures: number;
}

// ========== STATISTIQUES ENTREPRISE_ADMIN ==========

export interface EntrepriseAdminDashboard {
  totalVentes: number;
  totalAchats: number;
  chiffreAffairesMois: number;
  chiffreAffairesTotal: number;
  totalClients: number;
  totalProduits: number;
  totalFactures: number;
  facturesNonPayees: number;
}

export interface EntrepriseStats {
  ventes: SalesStat[];
  achats: PurchaseStat[];
}

export interface SalesStat {
  mois: string;
  montant: number;
  nombreFactures: number;
}

export interface PurchaseStat {
  fournisseur: string;
  montant: number;
  nombreFactures: number;
}

// ========== STATISTIQUES EMETTEUR ==========

export interface EmetteurDashboard {
  totalVentes: number;
  totalAchats: number;
  chiffreAffairesMois: number;
  chiffreAffairesTotal: number;
  nombreClients: number;
  nombreFactures: number;
  facturesNonPayees: number;
  derniereVente?: string;
}

// ========== STATISTIQUES CLIENT ==========

export interface ClientDashboard {
  totalAchats: number;
  montantDuJour: number;
  montantMois: number;
  nombreFactures: number;
  facturesNonPayees: number;
  facturesEchuesdepuis30j: number;
  dernierAchat: string;
}

// ========== STATISTIQUES VIEWER ==========

export interface ViewerDashboard {
  totalFactures: number;
  totalClients: number;
  totalProduits: number;
  lectureSeule: boolean;
}

// ========== KPI CARD ==========

export interface KPICard {
  title: string;
  value: string | number;
  icon: string;
  color: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

export interface KPIDashboard {
  cards: KPICard[];
  period: 'daily' | 'weekly' | 'monthly' | 'yearly';
}

// ========== GRAPHIQUES ==========

export interface ChartData {
  labels: string[];
  datasets: ChartDataset[];
}

export interface ChartDataset {
  label: string;
  data: number[];
  borderColor?: string;
  backgroundColor?: string;
  fill?: boolean;
}

export interface PieChartData {
  labels: string[];
  datasets: [
    {
      data: number[];
      backgroundColor: string[];
    }
  ];
}

// ========== ACTIVITÉ RÉCENTE ==========

export interface RecentActivity {
  id: number;
  type: 'facture' | 'client' | 'produit' | 'demande' | 'utilisateur';
  action: 'create' | 'update' | 'delete' | 'approve' | 'reject';
  description: string;
  timestamp: string;
  user?: string;
  icon?: string;
}
