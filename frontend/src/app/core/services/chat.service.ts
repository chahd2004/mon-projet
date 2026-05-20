import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/chat`;

  /**
   * Envoie un message à l'IA et retourne la réponse.
   * Récupère le token depuis localStorage pour l'ajouter aux headers.
   */
  sendMessage(message: string): Observable<string> {
    const token = localStorage.getItem('jwt_token');
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });

    return this.http.post(this.apiUrl, { message }, { headers, responseType: 'text' });
  }
}
