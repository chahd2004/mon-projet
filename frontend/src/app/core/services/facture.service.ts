// src/app/core/services/facture.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { unwrapList } from '../utils/api-response.util';
import { Facture, FactureRequest } from '../../models/facture.model';

@Injectable({
  providedIn: 'root'
})
export class FactureService {
  private apiUrl = `${environment.apiUrl}/factures`;

  constructor(private http: HttpClient) {}

  /**
   * Récupère toutes les factures (gère liste directe ou Spring Page { content })
   */
  getAll(): Observable<Facture[]> {
    return this.http.get<unknown>(this.apiUrl).pipe(
      map(res => unwrapList<Facture>(res))
    );
  }

  /**
   * Récupère mes ventes (émetteur connecté)
   */
  getMesVentes(): Observable<Facture[]> {
    return this.http.get<unknown>(`${this.apiUrl}/mes-ventes`).pipe(
      map(res => unwrapList<Facture>(res))
    );
  }

  /**
   * Récupère mes achats (client ou émetteur connecté)
   */
  getMesAchats(): Observable<Facture[]> {
    return this.http.get<unknown>(`${this.apiUrl}/mes-achats`).pipe(
      map(res => unwrapList<Facture>(res))
    );
  }

  /**
   * Récupère une facture par ID
   */
  getFactureById(id: number): Observable<Facture> {
    return this.http.get<Facture>(`${this.apiUrl}/${id}`);
  }

  /**
   * Crée une facture (émetteur)
   */
  createFacture(facture: FactureRequest): Observable<Facture> {
    return this.http.post<Facture>(this.apiUrl, facture);
  }

  /**
   * Met à jour une facture (admin)
   */
  updateFacture(id: number, facture: FactureRequest): Observable<Facture> {
    return this.http.put<Facture>(`${this.apiUrl}/${id}`, facture);
  }

  /**
   * Supprime une facture (admin)
   */
  deleteFacture(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  private filterFactures(list: Facture[], statut?: string, search?: string): Facture[] {
    let result = list;
    if (statut) result = result.filter(f => f.statut === statut);
    if (search) {
      const s = search.toLowerCase();
      result = result.filter(f =>
        (f.numFact || '').toLowerCase().includes(s) ||
        (f.acheteurNom || '').toLowerCase().includes(s) ||
        (f.vendeurNom || '').toLowerCase().includes(s));
    }
    return result;
  }

  /**
   * Récupère les factures (compatibilité - admin: getAll, sinon mes-ventes + mes-achats)
   */
  getFactures(page: number = 1, limit: number = 10, statut?: string, search?: string): Observable<{ data: Facture[]; total: number }> {
    return new Observable(observer => {
      this.getAll().subscribe({
        next: (list) => {
          const filtered = this.filterFactures(list, statut, search);
          const start = (page - 1) * limit;
          observer.next({ data: filtered.slice(start, start + limit), total: filtered.length });
          observer.complete();
        },
        error: () => {
          this.getMesVentes().subscribe({
            next: (ventes) => {
              this.getMesAchats().subscribe({
                next: (achats) => {
                  const ids = new Set(ventes.map(f => f.id));
                  const merged = [...ventes];
                  achats.forEach(f => { if (!ids.has(f.id)) merged.push(f); });
                  const filtered = this.filterFactures(merged, statut, search);
                  const start = (page - 1) * limit;
                  observer.next({ data: filtered.slice(start, start + limit), total: filtered.length });
                  observer.complete();
                },
                error: () => {
                  const filtered = this.filterFactures(ventes, statut, search);
                  const start = (page - 1) * limit;
                  observer.next({ data: filtered.slice(start, start + limit), total: filtered.length });
                  observer.complete();
                }
              });
            },
            error: () => {
              this.getMesAchats().subscribe({
                next: (achats) => {
                  const filtered = this.filterFactures(achats, statut, search);
                  const start = (page - 1) * limit;
                  observer.next({ data: filtered.slice(start, start + limit), total: filtered.length });
                  observer.complete();
                },
                error: (err) => observer.error(err)
              });
            }
          });
        }
      });
    });
  }

  /**
   * Statistiques simplifiées (calculées côté client)
   */
  getStatistiques(): Observable<any> {
    return new Observable(observer => {
      this.getMesVentes().subscribe({
        next: (list) => {
          const total = list.length;
          const payees = list.filter(f => f.statut === 'PAYEE').length;
          const attente = list.filter(f => f.statut === 'EN_ATTENTE' || f.statut === 'BROUILLON').length;
          const ca = list.filter(f => f.statut === 'PAYEE').reduce((s, f) => s + (f.totalTTC || 0), 0);
          observer.next({
            totalFactures: total,
            facturesPayees: payees,
            facturesEnAttente: attente,
            chiffreAffaires: ca
          });
          observer.complete();
        },
        error: () => {
          observer.next({ totalFactures: 0, facturesPayees: 0, facturesEnAttente: 0, chiffreAffaires: 0 });
          observer.complete();
        }
      });
    });
  }
}
