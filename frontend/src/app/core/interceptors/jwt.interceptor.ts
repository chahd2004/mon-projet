// src/app/core/interceptors/jwt.interceptor.ts
import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable, throwError, catchError, switchMap } from 'rxjs';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Interceptor JWT pour ajouter automatiquement le token d'authentification
 * à toutes les requêtes HTTP sortantes (sauf les endpoints publics)
 */
export const jwtInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>, 
  next: HttpHandlerFn
): Observable<HttpEvent<unknown>> => {
  
  // Injecter les services nécessaires
  const authService = inject(AuthService);
  const router = inject(Router);
  
  // Liste des URLs publiques qui ne nécessitent pas d'authentification
  const publicUrls: string[] = [
    '/auth/login',
    '/auth/register',
    '/auth/forgot-password',
    '/auth/reset-password',
    '/assets/',
    '/environments/'
  ];
  
  // Vérifier si l'URL est publique
  const isPublicUrl: boolean = publicUrls.some(url => req.url.includes(url));
  
  // Récupérer le token JWT
  const token: string | null = authService.getToken();
  
  // Logs de débogage (à désactiver en production)
  if (!environment.production) {
    console.group(`🌐 [JWT Interceptor] ${req.method} ${req.url}`);
    console.log('🔑 Token présent:', !!token);
    console.log('🔄 URL publique:', isPublicUrl);
  }
  
  // Si c'est une URL publique, passer sans token
  if (isPublicUrl) {
    if (!environment.production) {
      console.log('✅ URL publique, envoi sans token');
      console.groupEnd();
    }
    return next(req);
  }
  
  // Si token existe, cloner la requête avec le header Authorization
  if (token) {
    // Cloner la requête et ajouter les headers
    const authReq: HttpRequest<unknown> = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      },
      withCredentials: true // Important pour les cookies si nécessaire
    });
    
    if (!environment.production) {
      console.log('✅ Token ajouté aux headers');
      console.log('🔐 Authorization:', `Bearer ${token.substring(0, 15)}...`);
      console.groupEnd();
    }
    
    // Traiter la requête et gérer les erreurs d'authentification
    return next(authReq).pipe(
      catchError((error: HttpErrorResponse) => {
        return handleAuthError(error, authService, router, req, next);
      })
    );
  }
  
  // Pas de token pour URL protégée : ne pas envoyer la requête, rediriger vers login
  if (!environment.production) {
    console.warn('⚠️ Pas de token pour URL protégée, redirection vers login');
    console.groupEnd();
  }
  router.navigate(['/login']);
  return throwError(() => new Error('Non authentifié'));
};

/**
 * Gère les erreurs d'authentification (401, 403)
 */
function handleAuthError(
  error: HttpErrorResponse,
  authService: AuthService,
  router: Router,
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
): Observable<HttpEvent<unknown>> {
  
  // Erreur 401 - Non autorisé (token expiré ou invalide)
  if (error.status === 401) {
    console.warn('⛔ Token expiré ou invalide (401)');
    
    // Déconnecter l'utilisateur
    authService.logout();
    
    // Rediriger vers login avec message
    router.navigate(['/login'], { 
      queryParams: { session: 'expired' } 
    });
    
    return throwError(() => new Error('Session expirée, veuillez vous reconnecter'));
  }
  
  // Erreur 403 - Interdit (accès refusé)
  if (error.status === 403) {
    console.warn('⛔ Accès interdit (403)');
    
    // Rediriger vers page d'accès refusé ou dashboard
    router.navigate(['/dashboard']);
    
    return throwError(() => new Error('Accès non autorisé à cette ressource'));
  }
  
  // Erreur 0 - Problème réseau ou CORS
  if (error.status === 0) {
    console.error('🌐 Erreur réseau ou CORS:', error.message);
    return throwError(() => new Error('Problème de connexion au serveur'));
  }
  
  // Pour les autres erreurs, les propager
  return throwError(() => error);
}

// Importer environment pour les logs de débogage
import { environment } from '../../../environments/environment';