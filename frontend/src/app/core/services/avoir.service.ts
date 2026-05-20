/**
 * SERVICE AVOIR
 * Gestion des avoirs (credit notes)
 */

import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { Avoir, CreateAvoirRequest, AvoirListResponse } from '../../models/avoir.model';

@Injectable({ providedIn: 'root' })
export class AvoirService {
  private apiUrl = `${environment.apiUrl}/avoirs`;

  constructor(private http: HttpClient) { }

  /**
   * Récupère tous les avoirs
   * Gère la réponse paginée du backend
   */
  getAll(): Observable<Avoir[]> {
    return this.http.get<any>(this.apiUrl).pipe(
      map(response => {
        // Si c'est un tableau directement
        if (Array.isArray(response)) {
          return response;
        }
        // Si c'est une réponse paginée avec "content"
        if (response && response.content) {
          return response.content;
        }
        // Sinon retourner un tableau vide
        return [];
      })
    );
  }

  /**
   * Récupère les avoirs paginés
   */
  getAvoirs(
    page: number = 1,
    limit: number = 10,
    statut?: string,
    search?: string
  ): Observable<{ data: Avoir[]; total: number }> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    if (statut) params = params.set('statut', statut);
    if (search) params = params.set('search', search);

    return this.http.get<AvoirListResponse>(this.apiUrl, { params }).pipe(
      map(response => ({
        data: response.content,
        total: response.totalElements
      }))
    );
  }

  /**
   * Récupère un avoir par ID
   */
  getAvoirById(id: number): Observable<Avoir> {
    return this.http.get<Avoir>(`${this.apiUrl}/${id}`);
  }

  /**
   * Récupère les avoirs liés à une facture
   */
  getAvoirsByFacture(factureId: number): Observable<Avoir[]> {
    return this.http.get<Avoir[]>(`${this.apiUrl}/facture/${factureId}`);
  }

  /**
   * Créé un nouvel avoir
   */
  createAvoir(request: CreateAvoirRequest): Observable<Avoir> {
    return this.http.post<Avoir>(this.apiUrl, request);
  }

  /**
   * Créé automatiquement un avoir lors de l'annulation d'une facture
   * C'est un endpoint spécifique qui gère la création et la mise à jour du statut de la facture
   */
  createAvoirFromCancelledFacture(factureId: number): Observable<Avoir> {
    return this.http.post<Avoir>(`${this.apiUrl}/from-cancelled-facture/${factureId}`, {});
  }

  /**
   * Met à jour un avoir
   */
  updateAvoir(id: number, request: Partial<CreateAvoirRequest>): Observable<Avoir> {
    return this.http.put<Avoir>(`${this.apiUrl}/${id}`, request);
  }

  /**
   * Change le statut d'un avoir
   */
  updateAvoirStatut(id: number, newStatut: string): Observable<Avoir> {
    return this.http.patch<Avoir>(`${this.apiUrl}/${id}/statut`, { statut: newStatut });
  }

  /**
   * Valide un avoir (DRAFT → VALIDATED)
   */
  validerAvoir(id: number): Observable<Avoir> {
    return this.http.put<Avoir>(`${this.apiUrl}/${id}/valider`, {});
  }

  /**
   * Envoie un avoir (VALIDATED → SENT)
   */
  envoyerAvoir(id: number): Observable<Avoir> {
    return this.http.put<Avoir>(`${this.apiUrl}/${id}/envoyer`, {});
  }



  /**
   * Supprime un avoir
   */
  deleteAvoir(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  /**
   * Récupère les statistiques des avoirs
   */
  getStatistiques(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/statistiques`);
  }
}
