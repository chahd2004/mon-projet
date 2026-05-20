import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { Facture, FactureRequest } from '../../models/facture.model';

@Injectable({ providedIn: 'root' })
export class FactureService {
  private apiUrl = `${environment.apiUrl}/factures`; // ← corrigé

  constructor(private http: HttpClient) { }

  getAll(): Observable<Facture[]> {
    return this.http.get<Facture[]>(this.apiUrl);
  }

  getMesVentes(): Observable<Facture[]> {
    return this.http.get<Facture[]>(`${this.apiUrl}/mes-ventes`);
  }

  getMesAchats(): Observable<Facture[]> {
    return this.http.get<Facture[]>(`${this.apiUrl}/mes-achats`);
  }

  getFactureById(id: number): Observable<Facture> {
    return this.http.get<Facture>(`${this.apiUrl}/${id}`);
  }

  createFacture(facture: FactureRequest): Observable<Facture> {
    return this.http.post<Facture>(this.apiUrl, facture);
  }

  updateFacture(id: number, facture: FactureRequest): Observable<Facture> {
    return this.http.put<Facture>(`${this.apiUrl}/${id}`, facture);
  }

  deleteFacture(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  signerFacture(id: number): Observable<Facture> {
    return this.http.put<Facture>(`${this.apiUrl}/${id}/signer`, {});
  }

  envoyerFacture(id: number): Observable<Facture> {
    return this.http.put<Facture>(`${this.apiUrl}/${id}/envoyer`, {});
  }

  marquerPayee(id: number): Observable<Facture> {
    return this.http.put<Facture>(`${this.apiUrl}/${id}/payer`, {});
  }

  rejeterFacture(id: number, raison: string): Observable<Facture> {
    return this.http.put<Facture>(`${this.apiUrl}/${id}/rejeter`, { raison });
  }

  annulerFacture(id: number): Observable<Facture> {
    return this.http.put<Facture>(`${this.apiUrl}/${id}/annuler`, {});
  }

  retourBrouillon(id: number): Observable<Facture> {
    return this.http.put<Facture>(`${this.apiUrl}/${id}/retour-brouillon`, {});
  }

  downloadXml(id: number): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/${id}/xml`, { responseType: 'blob' });
  }


  getFactures(
    page: number = 1,
    limit: number = 10,
    statut?: string,
    search?: string
  ): Observable<{ data: Facture[]; total: number }> {
    return this.http.get<Facture[]>(this.apiUrl).pipe(
      map(list => {
        const filtered = this.filterFactures(
          Array.isArray(list) ? list : [],
          statut,
          search
        );
        const sorted = filtered.sort((a, b) => 
          new Date(b.dateEmission).getTime() - new Date(a.dateEmission).getTime()
        );
        const start = (page - 1) * limit;
        return {
          data: sorted.slice(start, start + limit),
          total: sorted.length
        };
      })
    );
  }

  getStatistiques(): Observable<any> {
    return this.http.get<Facture[]>(this.apiUrl).pipe(
      map(list => {
        const arr = Array.isArray(list) ? list : [];
        return {
          totalFactures: arr.length,
          facturesPayees: arr.filter(f => f.statut === 'PAID').length,
          facturesEnAttente: arr.filter(
            f => f.statut === 'SENT' || f.statut === 'SIGNED' || f.statut === 'DRAFT'
          ).length,
          chiffreAffaires: arr
            .filter(f => f.statut === 'PAID')
            .reduce((s, f) => s + (f.totalTTC || 0), 0)
        };
      })
    );
  }

  private filterFactures(
    list: Facture[],
    statut?: string,
    search?: string
  ): Facture[] {
    let result = list;
    if (statut === 'EN_RETARD') {
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      result = result.filter(f => {
        const dueDateStr = f.datePaiement || f.dateEcheance;
        if (!dueDateStr || f.statut === 'PAID' || f.statut === 'CANCELLED' || f.statut === 'REJECTED') return false;
        const echeance = new Date(dueDateStr);
        echeance.setHours(0, 0, 0, 0);
        return echeance <= now;
      });
    } else if (statut === 'UNPAID') {
      result = result.filter(f => f.statut !== 'PAID');
    } else if (statut) {
      result = result.filter(f => f.statut === statut);
    }
    if (search) {
      const s = search.toLowerCase();
      result = result.filter(
        f =>
          (f.numFact || '').toLowerCase().includes(s) ||
          (f.acheteurNom || '').toLowerCase().includes(s) ||
          (f.vendeurNom || '').toLowerCase().includes(s)
      );
    }
    return result;
  }
}