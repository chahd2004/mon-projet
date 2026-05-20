import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { AuthResponse, LoginRequest, RegisterRequest } from '../../models/auth.models';
import { UpdatePasswordRequest } from '../../models/user.models';
import { UserDTO } from '../../models/user.models';
import { ADMIN_ROLES, UserRole, normalizeUserRole } from '../../models/enums';

import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AuthService {

  private readonly API_URL = `${environment.apiUrl}/auth`;
  private readonly TOKEN_KEY = 'jwt_token';
  private readonly USER_KEY = 'current_user';

  // ── Signals ───────────────────────────────────────────────
  private _currentUser = signal<UserDTO | null>(this.getUserFromStorage());
  currentUser = this._currentUser.asReadonly();

  isLoggedIn = computed(() => this._currentUser() !== null);
  isAdmin = computed(() => this.hasAnyRole(ADMIN_ROLES));
  isClient = computed(() => this._currentUser()?.role === 'CLIENT');
  isEmetteur = computed(() => this._currentUser()?.role === 'EMETTEUR');

  constructor(private http: HttpClient, private router: Router) {
    this.checkTokenExpiry();
  }

  // ── LOGIN ───────────────────────────────────────────────
  login(request: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.API_URL}/login`, request).pipe(
      tap(response => this.saveSession(response))
    );
  }

  // ── REGISTER ────────────────────────────────────────────
  register(request: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.API_URL}/register`, request).pipe(
      tap(response => this.saveSession(response))
    );
  }

  updatePassword(request: UpdatePasswordRequest): Observable<void> {
    return this.http.post<void>(`${this.API_URL}/change-password`, request).pipe(
      tap(() => this.markFirstLoginAsCompleted())
    );
  }

  updateProfile(request: any): Observable<UserDTO> {
    return this.http.put<UserDTO>(`${this.API_URL}/profile`, request).pipe(
      tap(updatedUser => {
        const current = this._currentUser();
        if (current) {
          const newUser = { ...current, ...updatedUser };
          localStorage.setItem(this.USER_KEY, JSON.stringify(newUser));
          this._currentUser.set(newUser);
        }
      })
    );
  }

  // ── LOGOUT ──────────────────────────────────────────────
  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    this._currentUser.set(null);
    this.router.navigate(['/login']);
  }

  // ── TOKEN ───────────────────────────────────────────────
  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  hasRole(role: UserRole): boolean {
    return this._currentUser()?.role === role;
  }

  hasAnyRole(roles: readonly UserRole[]): boolean {
    const role = this._currentUser()?.role;
    return !!role && roles.includes(role);
  }

  requiresPasswordChange(): boolean {
    return this._currentUser()?.firstLogin === true;
  }

  // ── PRIVÉS ──────────────────────────────────────────────
  private saveSession(response: AuthResponse): void {
    localStorage.setItem(this.TOKEN_KEY, response.token);

    const normalizedRole = normalizeUserRole(response.role);
    const typeUser = response.typeUser ?? (normalizedRole === 'CLIENT' || normalizedRole === 'EMETTEUR' ? normalizedRole : null);

    const user: UserDTO = {
      id: response.id,
      nom: response.nom,
      prenom: response.prenom,
      email: response.email,
      telephone: response.telephone,
      role: normalizedRole,
      typeUser,
      accountStatus: response.accountStatus,
      firstLogin: response.firstLogin,
      enabled: true,
      clientId: response.clientId ?? undefined,
      emetteurId: response.emetteurId ?? (response as any).entrepriseId ?? undefined,
      entrepriseId: (response as any).entrepriseId ?? undefined
    };

    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
    this._currentUser.set(user);
  }

  private getUserFromStorage(): UserDTO | null {
    const stored = localStorage.getItem(this.USER_KEY);
    if (!stored) return null;

    try {
      const parsed = JSON.parse(stored) as UserDTO & { role?: string | null };
      const normalizedRole = normalizeUserRole(parsed.role);
      const typeUser = parsed.typeUser ?? (normalizedRole === 'CLIENT' || normalizedRole === 'EMETTEUR' ? normalizedRole : null);
      return {
        ...parsed,
        role: normalizedRole,
        typeUser,
        enabled: parsed.enabled ?? true
      };
    } catch {
      return null;
    }
  }

  private markFirstLoginAsCompleted(): void {
    const user = this._currentUser();
    if (!user) return;

    const updatedUser: UserDTO = {
      ...user,
      firstLogin: false
    };

    localStorage.setItem(this.USER_KEY, JSON.stringify(updatedUser));
    this._currentUser.set(updatedUser);
  }

  private checkTokenExpiry(): void {
    const token = this.getToken();
    if (!token) return;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const isExpired = payload.exp * 1000 < Date.now();
      if (isExpired) {
        console.warn('🔒 Token expiré détecté — déconnexion automatique');
        localStorage.removeItem(this.TOKEN_KEY);
        localStorage.removeItem(this.USER_KEY);
        this._currentUser.set(null);
      }
    } catch {
      localStorage.removeItem(this.TOKEN_KEY);
      localStorage.removeItem(this.USER_KEY);
      this._currentUser.set(null);
    }
  }
}