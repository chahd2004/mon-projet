import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { BonCommande } from '../../models/bon-commande.model';

@Injectable({ providedIn: 'root' })
export class CommandeService {
  private readonly apiUrl = `${environment.apiUrl}/commandes`;

  constructor(private readonly http: HttpClient) {}

  getAll(): Observable<BonCommande[]> {
    return this.http.get<BonCommande[]>(this.apiUrl);
  }

  getById(id: number): Observable<BonCommande> {
    return this.http.get<BonCommande>(`${this.apiUrl}/${id}`);
  }

  create(payload: any): Observable<BonCommande> {
    return this.http.post<BonCommande>(this.apiUrl, payload);
  }

  update(id: number, payload: any): Observable<BonCommande> {
    return this.http.put<BonCommande>(`${this.apiUrl}/${id}`, payload);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  // Workflow actions specific to Commandes
  confirmer(id: number): Observable<BonCommande> {
    return this.http.put<BonCommande>(`${this.apiUrl}/${id}/confirmer`, {});
  }

  demarrer(id: number): Observable<BonCommande> {
    return this.http.put<BonCommande>(`${this.apiUrl}/${id}/demarrer`, {});
  }

  marquerLivree(id: number): Observable<BonCommande> {
    return this.http.put<BonCommande>(`${this.apiUrl}/${id}/livrer`, {});
  }

  annuler(id: number, raison: string): Observable<BonCommande> {
    return this.http.put<BonCommande>(`${this.apiUrl}/${id}/annuler`, { raison });
  }
}
