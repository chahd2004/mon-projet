import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface CollaborateurApiItem {
  id?: number | string;
  prenom: string;
  nom: string;
  email: string;
  role: 'ENTREPRISE_VIEWER' | 'ENTREPRISE_ADMIN' | 'ENTREPRISE_MANAGER' | 'EMETTEUR';
  fonction?: string;
  telephone?: string;
}

export interface CreateCollaborateurPayload {
  email: string;
  prenom: string;
  nom: string;
  role: 'ENTREPRISE_VIEWER' | 'ENTREPRISE_ADMIN' | 'ENTREPRISE_MANAGER' | 'EMETTEUR';
  fonction: string;
  telephone?: string;
}

interface CreateCollaborateurApiPayload {
  email: string;
  firstName: string;
  lastName: string;
  role: 'ENTREPRISE_VIEWER' | 'ENTREPRISE_ADMIN' | 'ENTREPRISE_MANAGER' | 'EMETTEUR';
  fonction: string;
  telephone?: string;
}

@Injectable({ providedIn: 'root' })
export class CollaborateurService {
  private readonly apiUrl = `${environment.apiUrl}/entreprise-admin/collaborateurs`;
  private readonly inviteUrl = `${environment.apiUrl}/entreprise-admin/collaborateurs/inviter`;

  constructor(private http: HttpClient) {}

  getCollaborateurs(): Observable<CollaborateurApiItem[] | { content: CollaborateurApiItem[] }> {
    return this.http.get<CollaborateurApiItem[] | { content: CollaborateurApiItem[] }>(this.apiUrl);
  }

  createCollaborateur(payload: CreateCollaborateurPayload): Observable<CollaborateurApiItem> {
    const apiPayload: CreateCollaborateurApiPayload = {
      email: payload.email,
      firstName: payload.prenom,
      lastName: payload.nom,
      role: payload.role,
      fonction: payload.fonction,
      telephone: payload.telephone
    };

    return this.http.post<CollaborateurApiItem>(this.apiUrl, apiPayload);
  }

  inviteCollaborateur(payload: CreateCollaborateurPayload): Observable<CollaborateurApiItem> {
    return this.http.post<CollaborateurApiItem>(this.inviteUrl, {
      email: payload.email,
      prenom: payload.prenom,
      nom: payload.nom,
      fonction: payload.fonction,
      role: payload.role
    });
  }

  deleteCollaborateur(id: number | string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
