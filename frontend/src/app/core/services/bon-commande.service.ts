import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { BonCommande, BonCommandeRequest } from '../../models/bon-commande.model';

@Injectable({ providedIn: 'root' })
export class BonCommandeService {
  private readonly apiUrl = `${environment.apiUrl}/bon-commandes`;
  private readonly publicApiUrl = `${environment.apiUrl}/public/bon-commande`;
  private readonly conversionApiUrl = `${environment.apiUrl}/conversions`;

  constructor(private readonly http: HttpClient) {}

  getAll(): Observable<BonCommande[]> {
    return this.http.get<BonCommande[]>(this.apiUrl);
  }

  getById(id: number): Observable<BonCommande> {
    return this.http.get<BonCommande>(`${this.apiUrl}/${id}`);
  }

  create(payload: BonCommandeRequest): Observable<BonCommande> {
    return this.http.post<BonCommande>(this.apiUrl, payload);
  }

  update(id: number, payload: BonCommandeRequest): Observable<BonCommande> {
    return this.http.put<BonCommande>(`${this.apiUrl}/${id}`, payload);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  envoyer(id: number): Observable<BonCommande> {
    return this.http.put<BonCommande>(`${this.apiUrl}/${id}/envoyer`, {});
  }

  convertirEnCommande(id: number, dateDocument: string, notes?: string): Observable<unknown> {
    return this.http.post(`${this.conversionApiUrl}/bon-commande/${id}/vers-commande`, {
      dateDocument,
      notes
    });
  }

  convertirEnBonLivraison(id: number, dateDocument: string, notes?: string): Observable<unknown> {
    return this.http.post(`${this.conversionApiUrl}/bon-commande/${id}/vers-bon-livraison`, {
      dateDocument,
      notes
    });
  }

  /**
   * Called by the client from the signature page (public, no auth required).
   * Sends the .p12 file + password to sign the Bon de Commande.
   */

  confirmer(id: number): Observable<BonCommande> {
    return this.http.put<BonCommande>(`${this.apiUrl}/${id}/confirmer`, {});
  }

  annuler(id: number, raison: string): Observable<BonCommande> {
    return this.http.put<BonCommande>(`${this.apiUrl}/${id}/annuler`, { raison });
  }

  // PUBLIC ACCESS
  getPublicByRef(ref: string): Observable<BonCommande> {
    return this.http.get<BonCommande>(`${this.publicApiUrl}/${ref}`);
  }

  getXmlBrutPublic(id: number): Observable<string> {
    return this.http.get(`${this.publicApiUrl}/${id}/xml-brut`, { responseType: 'text' });
  }

  sauvegarderXmlSignePublic(id: number, xmlSigne: string): Observable<BonCommande> {
    return this.http.post<BonCommande>(`${this.publicApiUrl}/${id}/xml-signe`, { xmlSigne });
  }

  signerPublic(formData: FormData): Observable<BonCommande> {
    return this.http.post<BonCommande>(`${this.publicApiUrl}/signer-client`, formData);
  }
}

