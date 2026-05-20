import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CreateDemandeRequest } from '../../models/demande.models';
import { environment } from '../../../environments/environment';

export interface DemandeResponse {
  id: number;
  code: string;
  raisonSociale: string;
  email: string;
  status: string;
  dateSoumission: string;
  message?: string;
}

export interface DemandeStatusResponse {
  email: string;
  statut: string;
}

@Injectable({ providedIn: 'root' })
export class DemandeService {
  private readonly API_URL = `${environment.apiUrl}/public/demandes`;
  private readonly SUPER_ADMIN_URL = `${environment.apiUrl}/super-admin/demandes`;

  constructor(private http: HttpClient) { }

  /**
   * Soumettre une demande de création d'entreprise
   */
  soumettreDemande(request: CreateDemandeRequest): Observable<DemandeResponse> {
    return this.http.post<DemandeResponse>(`${this.API_URL}/emetteur`, request);
  }

  /**
   * Vérifier le statut d'une demande par email
   */
  verifierStatut(email: string): Observable<DemandeStatusResponse> {
    return this.http.get<DemandeStatusResponse>(`${this.API_URL}/statut`, {
      params: { email }
    });
  }

  /**
   * Vérifier si une ​demande existe déjà pour cet email
   */
  existeDemande(email: string): Observable<{ existe: boolean }> {
    return this.http.get<{ existe: boolean }>(`${this.API_URL}/existe`, {
      params: { email }
    });
  }

  // ── SUPER ADMIN ──────────────────────────────────────────────

  /**
   * Récupérer toutes les demandes (SUPER_ADMIN)
   */
  getDemandes(): Observable<any[]> {
    return this.http.get<any[]>(this.SUPER_ADMIN_URL);
  }

  /**
   * Récupérer toutes les demandes en attente (SUPER_ADMIN)
   */
  getDemandesEnAttente(): Observable<any[]> {
    return this.http.get<any[]>(`${this.SUPER_ADMIN_URL}/en-attente`);
  }

  /**
   * Récupérer le détail d'une demande par ID (SUPER_ADMIN)
   */
  getDemandeDetails(id: number): Observable<any> {
    return this.http.get<any>(`${this.SUPER_ADMIN_URL}/${id}`);
  }

  /**
   * Approuver une demande (SUPER_ADMIN)
   */
  approuverDemande(id: number, commentaire?: string): Observable<any> {
    return this.http.post<any>(
      `${this.SUPER_ADMIN_URL}/${id}/approuver`,
      { commentaire: commentaire ?? '' }
    );
  }

  /**
   * Rejeter une demande (SUPER_ADMIN)
   */
  rejeterDemande(id: number, commentaire: string): Observable<any> {
    return this.http.post<any>(
      `${this.SUPER_ADMIN_URL}/${id}/rejeter`,
      { commentaire }
    );
  }
}
