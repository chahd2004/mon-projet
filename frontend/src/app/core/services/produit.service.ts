// src/app/core/services/produit.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { unwrapList } from '../utils/api-response.util';
import { Produit, ProduitRequest } from '../../models/produit.model';

@Injectable({
  providedIn: 'root'
})
export class ProduitService {
  private apiUrl = `${environment.apiUrl}/produits`;

  constructor(private http: HttpClient) {}

  /**
   * Récupère tous les produits (gère liste directe ou Spring Page { content })
   */
  getProduits(): Observable<Produit[]> {
    return this.http.get<unknown>(this.apiUrl).pipe(
      map(res => unwrapList<Produit>(res))
    );
  }

  /**
   * Récupère un produit par son ID
   */
  getProduitById(id: number): Observable<Produit> {
    return this.http.get<Produit>(`${this.apiUrl}/${id}`);
  }

  /**
   * Crée un nouveau produit
   */
  createProduit(produit: ProduitRequest): Observable<Produit> {
    return this.http.post<Produit>(this.apiUrl, produit);
  }

  /**
   * Met à jour un produit
   */
  updateProduit(id: number, produit: ProduitRequest): Observable<Produit> {
    return this.http.put<Produit>(`${this.apiUrl}/${id}`, produit);
  }

  /**
   * Supprime un produit
   */
  deleteProduit(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
