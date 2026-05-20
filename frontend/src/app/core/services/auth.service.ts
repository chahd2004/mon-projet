import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap, catchError, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';

// Interfaces pour les types (à déplacer dans models/user.model.ts)
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  nom: string;
  prenom: string;
  email: string;
  password: string;
  telephone?: string;
  typeUser?: 'CLIENT' | 'EMETTEUR' | null;
  role?: 'ADMIN' | 'USER';
}

export interface AuthResponse {
  token: string;
  type?: string;
  id: number;
  email: string;
  role: 'ADMIN' | 'USER';
  typeUser?: 'CLIENT' | 'EMETTEUR' | null;
  nom: string;
  prenom?: string | null;
  telephone?: string | null;
}

export interface UserDTO {
  id: number;
  email: string;
  nom: string;
  prenom?: string | null;
  telephone?: string | null;
  role: 'ADMIN' | 'USER';
  typeUser?: 'CLIENT' | 'EMETTEUR' | null;
  enabled: boolean;
  clientId?: number;
  emetteurId?: number;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = `${environment.apiUrl}/auth`; // http://localhost:8080/api/auth
  private tokenKey = 'auth_token';
  private userKey = 'current_user';

  constructor(
    private http: HttpClient,
    private router: Router
  ) {}

  /**
   * Connexion - Appel API réel
   */
  login(request: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, request).pipe(
      tap(response => {
        // Stocker le token JWT
        if (response?.token) {
          localStorage.setItem(this.tokenKey, response.token);
        }
        // Stocker les infos utilisateur (gère les champs null du backend)
        localStorage.setItem(this.userKey, JSON.stringify({
          id: response?.id,
          email: response?.email ?? '',
          role: response?.role ?? 'USER',
          typeUser: response?.typeUser ?? null,
          nom: response?.nom ?? '',
          prenom: response?.prenom ?? ''
        }));
      }),
      catchError(error => {
        console.error('Erreur de connexion', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Inscription - Appel API réel (stocke le token si succès)
   */
  register(request: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/register`, request).pipe(
      tap(response => {
        if (response?.token) {
          localStorage.setItem(this.tokenKey, response.token);
          localStorage.setItem(this.userKey, JSON.stringify({
            id: response?.id,
            email: response?.email ?? '',
            role: response?.role ?? 'USER',
            typeUser: response?.typeUser ?? null,
            nom: response?.nom ?? '',
            prenom: response?.prenom ?? ''
          }));
        }
      }),
      catchError(error => {
        console.error('Erreur d\'inscription', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Récupérer l'utilisateur courant
   */
  getCurrentUser(): Observable<UserDTO> {
    return this.http.get<UserDTO>(`${this.apiUrl}/me`).pipe(
      catchError(error => {
        console.error('Erreur récupération utilisateur', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Déconnexion
   */
  logout(): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userKey);
    this.router.navigate(['/login']);
  }

  /**
   * Vérifier si l'utilisateur est connecté
   */
  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  /**
   * Récupérer le token JWT
   */
  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  /**
   * Récupérer les infos utilisateur du localStorage
   */
  getUser(): any | null {
    const user = localStorage.getItem(this.userKey);
    return user ? JSON.parse(user) : null;
  }

  /**
   * Vérifier si l'utilisateur est ADMIN
   */
  isAdmin(): boolean {
    const user = this.getUser();
    return user?.role === 'ADMIN';
  }

  /**
   * Vérifier si l'utilisateur est CLIENT
   */
  isClient(): boolean {
    const user = this.getUser();
    return user?.typeUser === 'CLIENT';
  }

  /**
   * Vérifier si l'utilisateur est EMETTEUR
   */
  isEmetteur(): boolean {
    const user = this.getUser();
    return user?.typeUser === 'EMETTEUR';
  }
}