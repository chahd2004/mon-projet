// src/app/core/services/dashboard.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { FactureService } from './facture.service';
import { ClientService } from './client.service';

// Interface pour les statistiques du dashboard
export interface DashboardStats {
  factures: {
    total: number;
    enAttente: number;
    payees: number;
    enRetard: number;
  };
  clients: {
    total: number;
  };
  chiffreAffaires: {
    actuel: number;
    evolution: number;
    exercice: string;
    parAnnee: {
      annee: number;
      montant: number;
      debut: string;
      fin: string;
    }[];
  };
  graphiques: {
    caMensuel: {
      mois: string[];
      valeurs: number[];
    };
  };
}

export interface FactureRecente {
  id: number;
  num_fact: string;
  nom_client: string;
  totalttc: number;
  statut: string;
  date_emission: Date;
}

export interface FactureBatch {
  nom: string;
  dateCreation: string;
  montant: string;
}

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  
  private apiUrl = `${environment.apiUrl}`;

  constructor(
    private http: HttpClient,
    private factureService: FactureService,
    private clientService: ClientService
  ) { }

  /**
   * Récupère toutes les statistiques pour le dashboard
   */
  getStats(): Observable<DashboardStats> {
    return forkJoin({
      factures: this.factureService.getFactures(1, 1000),
      clients: this.clientService.getClients()
    }).pipe(
      map(({ factures, clients }) => {
        return this.calculerStats(factures.data, clients);
      })
    );
  }

  /**
   * Calcule les statistiques à partir des données (camelCase ou snake_case selon le backend)
   */
  private calculerStats(factures: any[], clients: any[]): DashboardStats {
    const anneeActuelle = new Date().getFullYear();
    const dateEmission = (f: any) => f.dateEmission ?? f.date_emission;
    const totalTTC = (f: any) => f.totalTTC ?? f.totalttc ?? 0;

    // Statistiques factures
    const totalFactures = factures.length;
    const facturesEnAttente = factures.filter(f => f.statut === 'EN_ATTENTE').length;
    const facturesPayees = factures.filter(f => f.statut === 'PAYEE').length;
    const facturesEnRetard = factures.filter(f => f.statut === 'EN_RETARD').length;

    // Statistiques clients
    const totalClients = clients.length;

    // Calcul du chiffre d'affaires par année
    const caParAnneeMap = new Map<number, number>();
    factures.forEach(facture => {
      const date = dateEmission(facture);
      const ttc = totalTTC(facture);
      if (date && (ttc || ttc === 0)) {
        const annee = new Date(date).getFullYear();
        const montantActuel = caParAnneeMap.get(annee) || 0;
        caParAnneeMap.set(annee, montantActuel + Number(ttc));
      }
    });

    const caParAnnee = Array.from(caParAnneeMap.entries())
      .map(([annee, montant]) => ({
        annee,
        montant,
        debut: `01/01/${annee}`,
        fin: `31/12/${annee}`
      }))
      .sort((a, b) => a.annee - b.annee);

    // Chiffre d'affaires actuel (année en cours)
    const caActuel = caParAnnee.find(ca => ca.annee === anneeActuelle)?.montant || 0;
    const caPrecedent = caParAnnee.find(ca => ca.annee === anneeActuelle - 1)?.montant || 0;
    const evolution = caPrecedent > 0 ? ((caActuel - caPrecedent) / caPrecedent) * 100 : 0;

    const mois = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
    const valeursMensuelles = mois.map((_, index) => {
      const facturesMois = factures.filter(f => {
        const date = dateEmission(f);
        if (!date) return false;
        const d = new Date(date);
        return d.getFullYear() === anneeActuelle && d.getMonth() === index;
      });
      return facturesMois.reduce((sum, f) => sum + Number(totalTTC(f)), 0);
    });

    return {
      factures: {
        total: totalFactures,
        enAttente: facturesEnAttente,
        payees: facturesPayees,
        enRetard: facturesEnRetard
      },
      clients: {
        total: totalClients
      },
      chiffreAffaires: {
        actuel: caActuel,
        evolution: evolution,
        exercice: anneeActuelle.toString(),
        parAnnee: caParAnnee
      },
      graphiques: {
        caMensuel: {
          mois: mois,
          valeurs: valeursMensuelles
        }
      }
    };
  }

  /**
   * Récupère les dernières factures (camelCase ou snake_case)
   */
  getDernieresFactures(limit: number = 5): Observable<FactureRecente[]> {
    return this.factureService.getFactures(1, limit).pipe(
      map(response => {
        return response.data.map((f: any) => ({
          id: f.id,
          num_fact: f.numFact ?? f.num_fact ?? '',
          nom_client: f.acheteurNom ?? f.vendeurNom ?? f.nom_client ?? '',
          totalttc: f.totalTTC ?? f.totalttc ?? 0,
          statut: f.statut ?? '',
          date_emission: f.dateEmission ?? f.date_emission
        }));
      })
    );
  }

  /**
   * Récupère les lots de factures
   */
  getFactureBatches(): Observable<FactureBatch[]> {
    return this.http.get<FactureBatch[]>(`${this.apiUrl}/factures/batches`);
  }

  /**
   * Version avec API dédiée (si tu préfères un endpoint spécifique)
   */
  getDashboardStatsFromAPI(): Observable<DashboardStats> {
    return this.http.get<DashboardStats>(`${this.apiUrl}/dashboard/stats`);
  }
  // src/app/core/services/dashboard.service.ts
// Ajoute cette méthode dans la classe DashboardService

/**
 * Récupère les statistiques du dashboard
 */
getDashboardStats(): Observable<DashboardStats> {
  return this.getStats(); // Ou appelle directement l'API
}
}