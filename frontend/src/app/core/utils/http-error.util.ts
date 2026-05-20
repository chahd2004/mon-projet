import { HttpErrorResponse } from '@angular/common/http';

/**
 * Retourne un message d'erreur compréhensible selon le type d'erreur HTTP.
 * - status 0 : backend inaccessible (non démarré, CORS, réseau)
 * - 401 : session expirée
 * - 403 : accès refusé
 * - sinon : message du backend ou message par défaut
 */
export function getHttpErrorMessage(
  error: unknown,
  defaultMessage: string = 'Une erreur est survenue'
): string {
  if (error instanceof HttpErrorResponse) {
    if (error.status === 0) {
      return 'Impossible de joindre le serveur. Vérifiez que le backend est démarré (ex: http://localhost:8080) et que CORS est configuré.';
    }
    if (error.status === 401) {
      return 'Session expirée, veuillez vous reconnecter.';
    }
    if (error.status === 403) {
      return 'Accès refusé : droits insuffisants.';
    }
    const body = error.error;
    if (body?.message && typeof body.message === 'string') return body.message;
    if (body?.error && typeof body.error === 'string') return body.error;
  }
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return defaultMessage;
}
