// src/app/models/dashboard.model.ts
export interface DashboardStats {
  // Statistiques principales
  totalFactures: number;
  totalClients: number;
  chiffreAffaires: number;
  facturesImpayees: number;
  
  // Dernières factures
  dernieresFactures: FactureRecente[];
  
  // Données pour le graphique
  evolutionMensuelle: {
    mois: string[];
    ca: number[];
    facturesPayees: number[];
  };
  
  // CA par année
  caParAnnee: {
    annee: number;
    montant: number;
    debut: string;
    fin: string;
  }[];
  
  // Stats clients (optionnel)
  clientsActifs?: number;
  clientsInactifs?: number;
}

export interface FactureRecente {
  id: number;
  num_fact: string;
  nom_client: string;
  totalttc: number;
  statut: string;
  date_emission: Date;
}