import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Emetteur, EmetteurRequest } from '../../models/emetteur.model';
import { BaseService } from './base.service';

@Injectable({ providedIn: 'root' })
export class EmetteurService extends BaseService {
  private apiUrl = `${environment.apiUrl}/emetteurs`;

  constructor(private http: HttpClient) { super(); }

  getEmetteurs(): Observable<Emetteur[]> {
    return this.http.get<Emetteur[]>(this.apiUrl, this.getHeaders());
  }

  getEmetteurById(id: number): Observable<Emetteur> {
    return this.http.get<Emetteur>(`${this.apiUrl}/${id}`, this.getHeaders());
  }

  createEmetteur(emetteur: EmetteurRequest): Observable<Emetteur> {
    return this.http.post<Emetteur>(this.apiUrl, emetteur, this.getHeaders());
  }

  updateEmetteur(id: number, emetteur: EmetteurRequest): Observable<Emetteur> {
    return this.http.put<Emetteur>(`${this.apiUrl}/${id}`, emetteur, this.getHeaders());
  }

  deleteEmetteur(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`, this.getHeaders());
  }

  // Profil entreprise pour l'utilisateur connecté
  getMyProfile(): Observable<Emetteur> {
    return this.http.get<Emetteur>(`${this.apiUrl}/my-profile`, this.getHeaders());
  }

  updateMyProfile(emetteur: EmetteurRequest): Observable<Emetteur> {
    return this.http.put<Emetteur>(`${this.apiUrl}/my-profile`, emetteur, this.getHeaders());
  }
}