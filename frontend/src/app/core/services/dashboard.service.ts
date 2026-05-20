import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin, map, catchError, of } from 'rxjs';
import { environment } from '../../../environments/environment';
import { FactureService } from './facture.service';
import { ClientService } from './client.service';
import { AuthService } from './auth.service';
import { BaseService } from './base.service';

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
  collaborateurs: {
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
    factureEvolution: {
      mois: string[];
      emises: number[];
      payees: number[];
    };
    factureRepartition: {
      labels: string[];
      valeurs: number[];
    };
    ventesParProduit: {
      mois: string[];
      produits: { label: string; data: number[] }[];
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

export interface SuperAdminStatsResponse {
  totalUsers: number;
  totalClients: number;
  totalEmetteurs: number;
  totalFactures: number;
}

@Injectable({ providedIn: 'root' })
export class DashboardService extends BaseService {
  private apiUrl = `${environment.apiUrl}`;

  constructor(
    private http: HttpClient,
    private factureService: FactureService,
    private clientService: ClientService,
    private authService: AuthService
  ) { super(); }

  getStats(): Observable<DashboardStats> {
    const user = this.authService.currentUser();
    
    return forkJoin({
      factures: this.factureService.getFactures(1, 1000).pipe(catchError(() => of({ data: [], total: 0 }))),
      clients: this.clientService.getClients().pipe(catchError(() => of([]))),
      // On n'essaie pas de charger les collaborateurs pour le VIEWER car il n'a pas les droits en principe
      // Ou alors le backend doit autoriser le GET pour le VIEWER.
      collaborateurs: (!user || user.role === 'ENTREPRISE_VIEWER') 
        ? of([]) 
        : this.http.get<any[] | { content: any[] }>(`${this.apiUrl}/entreprise-admin/collaborateurs`, this.getHeaders())
            .pipe(catchError(() => of([])))
    }).pipe(
      map(({ factures, clients, collaborateurs }) => {
        const collabList = Array.isArray(collaborateurs) ? collaborateurs : (collaborateurs as any).content || [];
        const stats = this.calculerStats(factures.data, clients, collabList);
        
        if (factures.data && factures.data.length > 0) {
          (stats as any).nomEntreprise = factures.data[0].vendeurNom || factures.data[0].acheteurNom;
        }
        
        return stats;
      })
    );
  }

  getDashboardStats(): Observable<DashboardStats> {
    return this.getStats();
  }

  getDernieresFactures(limit: number = 5): Observable<FactureRecente[]> {
    return this.factureService.getFactures(1, limit).pipe(
      map(response => response.data.map((f: any) => ({
        id: f.id,
        num_fact: f.num_fact,
        nom_client: f.nom_client,
        totalttc: f.totalttc,
        statut: f.statut,
        date_emission: f.date_emission
      })))
    );
  }

  getFactureBatches(): Observable<FactureBatch[]> {
    return this.http.get<FactureBatch[]>(
      `${this.apiUrl}/factures/batches`,
      this.getHeaders()
    );
  }

  getDashboardStatsFromAPI(): Observable<DashboardStats> {
    // Le backend actuel n'expose pas /dashboard/stats.
    // On calcule les stats à partir des endpoints existants.
    return this.getStats();
  }

  getSuperAdminStatistics(): Observable<SuperAdminStatsResponse> {
    return this.http.get<SuperAdminStatsResponse>(
      `${this.apiUrl}/super-admin/statistiques`,
      this.getHeaders()
    );
  }

  getEntreprisesInscritesParMois(): Observable<{ mois: string[]; valeurs: number[] }> {
    return this.http.get<any[]>(
      `${this.apiUrl}/emetteurs`,
      this.getHeaders()
    ).pipe(
      map((emetteurs: any[]) => {
        const mois = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
        const anneeCible = 2026;
        const compteurParMois = new Array(12).fill(0);

        console.log('📊 Emetteurs reçus:', emetteurs);
        emetteurs.forEach((em: any) => {
          // Robustité sur les noms de champs de date
          const dateStr = em.dateCreation || em.createdAt || em.date_creation || em.created_date;
          if (dateStr) {
            const dateObj = new Date(dateStr);
            if (dateObj.getFullYear() === anneeCible) {
              const moisIndex = dateObj.getMonth();
              compteurParMois[moisIndex]++;
            }
          }
        });

        return {
          mois,
          valeurs: compteurParMois
        };
      })
    );
  }

  private calculerStats(factures: any[], clients: any[], collaborateurs: any[]): DashboardStats {
    const anneeActuelle = new Date().getFullYear();
    const caParAnneeMap = new Map<number, number>();

    factures.forEach(f => {
      if (f.dateEmission && f.totalTTC) {
        const annee = new Date(f.dateEmission).getFullYear();
        // On ne compte dans le CA que les factures payées (ou signées/émises si on veut le CA prévisionnel)
        // Ici on va prendre PAYE, SIGNED, SENT pour avoir une vue globale de l'activité validée
        if (['PAID', 'SIGNED', 'SENT'].includes(f.statut)) {
          caParAnneeMap.set(annee, (caParAnneeMap.get(annee) || 0) + f.totalTTC);
        }
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

    const caActuel = caParAnnee.find(ca => ca.annee === anneeActuelle)?.montant || 0;
    const caPrecedent = caParAnnee.find(ca => ca.annee === anneeActuelle - 1)?.montant || 0;
    const mois = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];

    return {
      factures: {
        total: factures.length,
        enAttente: factures.filter(f => f.statut === 'SENT' || f.statut === 'SIGNED').length,
        payees: factures.filter(f => f.statut === 'PAID').length,
        enRetard: factures.length - factures.filter(f => f.statut === 'PAID').length
      },
      clients: {
        total: clients.length
      },
      collaborateurs: {
        total: collaborateurs.length
      },
      chiffreAffaires: {
        actuel: caActuel,
        evolution: caPrecedent > 0
          ? ((caActuel - caPrecedent) / caPrecedent) * 100
          : 0,
        exercice: anneeActuelle.toString(),
        parAnnee: caParAnnee
      },
      graphiques: {
        caMensuel: {
          mois,
          valeurs: mois.map((_, i) =>
            factures
              .filter(f =>
                f.dateEmission &&
                new Date(f.dateEmission).getFullYear() === anneeActuelle &&
                new Date(f.dateEmission).getMonth() === i &&
                ['PAID', 'SIGNED', 'SENT'].includes(f.statut)
              )
              .reduce((sum, f) => sum + (f.totalTTC || 0), 0)
          )
        },
        factureEvolution: {
          mois,
          emises: mois.map((_, i) =>
            factures.filter(f =>
              f.dateEmission &&
              new Date(f.dateEmission).getFullYear() === anneeActuelle &&
              new Date(f.dateEmission).getMonth() === i &&
              ['SIGNED', 'SENT'].includes(f.statut)
            ).length
          ),
          payees: mois.map((_, i) =>
            factures.filter(f =>
              f.dateEmission &&
              new Date(f.dateEmission).getFullYear() === anneeActuelle &&
              new Date(f.dateEmission).getMonth() === i &&
              f.statut === 'PAID'
            ).length
          )
        },
        factureRepartition: {
          labels: ['Signée', 'Payée', 'Brouillon', 'Annulée', 'Rejetée'],
          valeurs: [
            factures.filter(f => f.statut === 'SIGNED').length,
            factures.filter(f => f.statut === 'PAID').length,
            factures.filter(f => f.statut === 'SENT' || f.statut === 'DRAFT').length,
            factures.filter(f => f.statut === 'CANCELLED').length,
            factures.filter(f => f.statut === 'REJECTED').length
          ]
        },
        ventesParProduit: (() => {
          const produitsMap = new Map<string, number[]>();
          
          factures.forEach(f => {
            if (f.dateEmission && ['PAID', 'SIGNED', 'SENT'].includes(f.statut)) {
              const date = new Date(f.dateEmission);
              if (date.getFullYear() === anneeActuelle) {
                const m = date.getMonth();
                if (f.lignes && Array.isArray(f.lignes)) {
                  f.lignes.forEach((ligne: any) => {
                    const designation = ligne.produitDesignation || ('Produit ' + ligne.produitId);
                    if (!produitsMap.has(designation)) {
                      produitsMap.set(designation, new Array(12).fill(0));
                    }
                    produitsMap.get(designation)![m] += (ligne.quantite || 0);
                  });
                }
              }
            }
          });

          return {
            mois,
            produits: Array.from(produitsMap.entries()).map(([label, data]) => ({ label, data }))
          };
        })()
      }
    };
  }
}