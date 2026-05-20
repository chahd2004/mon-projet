// src/app/core/services/client.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Client, ClientRequest } from '../../models/client.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ClientService {
  
  private apiUrl = `${environment.apiUrl}/clients`;
  
  constructor(private http: HttpClient) {}
  
  /**
   * Récupère le token JWT du localStorage et crée les headers
   */
  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }
  
  /**
   * Récupère la liste de tous les clients
   * GET /api/clients
   */
  getClients(): Observable<Client[]> {
    return this.http.get<Client[]>(this.apiUrl, {
      headers: this.getHeaders()
    });
  }
  
  /**
   * Récupère un client par son ID
   * GET /api/clients/{id}
   */
  getClientById(id: number): Observable<Client> {
    return this.http.get<Client>(`${this.apiUrl}/${id}`, {
      headers: this.getHeaders()
    });
  }
  
  /**
   * Crée un nouveau client
   * POST /api/clients
   */
  createClient(client: ClientRequest): Observable<Client> {
    return this.http.post<Client>(this.apiUrl, client, {
      headers: this.getHeaders()
    });
  }
  
  /**
   * Met à jour un client existant
   * PUT /api/clients/{id}
   */
  updateClient(id: number, client: ClientRequest): Observable<Client> {
    return this.http.put<Client>(`${this.apiUrl}/${id}`, client, {
      headers: this.getHeaders()
    });
  }
  
  /**
   * Supprime un client
   * DELETE /api/clients/{id}
   */
  deleteClient(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`, {
      headers: this.getHeaders()
    });
  }
  
  /**
   * Récupère le profil du client connecté
   * GET /api/clients/profile/me
   */
  getMyProfile(): Observable<Client> {
    return this.http.get<Client>(`${this.apiUrl}/profile/me`, {
      headers: this.getHeaders()
    });
  }
  
  /**
   * Met à jour le profil du client connecté
   * PUT /api/clients/profile/me
   */
  updateMyProfile(client: ClientRequest): Observable<Client> {
    return this.http.put<Client>(`${this.apiUrl}/profile/me`, client, {
      headers: this.getHeaders()
    });
  }
}