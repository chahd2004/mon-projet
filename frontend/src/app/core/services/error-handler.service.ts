import { Injectable } from '@angular/core';

/**
 * Service pour extraire et formater les messages d'erreur du backend
 */
@Injectable({
  providedIn: 'root'
})
export class ErrorHandlerService {
  constructor() { }

  /**
   * Extrait un message d'erreur lisible à partir d'une erreur HTTP
   * Essaie plusieurs sources avec un ordre de priorité pour trouver le message le plus pertinent
   */
  extractErrorMessage(err: any): string {
    // 1. Vérifier err.error.message (format JSON standard)
    if (err?.error?.message && typeof err.error.message === 'string' && err.error.message.trim()) {
      return err.error.message;
    }

    // 2. Vérifier err.error.detail (format Spring Boot)
    if (err?.error?.detail && typeof err.error.detail === 'string' && err.error.detail.trim()) {
      return err.error.detail;
    }

    // 3. Vérifier err.error.error (erreur imbriquée)
    if (err?.error?.error && typeof err.error.error === 'string' && err.error.error.trim()) {
      return err.error.error;
    }

    // 4. Vérifier si err.error est une chaîne directe
    if (err?.error && typeof err.error === 'string' && err.error.trim()) {
      return err.error;
    }

    // 5. Vérifier err.message (message HTTP standard)
    if (err?.message && typeof err.message === 'string' && err.message.trim()) {
      return err.message;
    }

    // 6. Vérifier err.statusText (description du code HTTP)
    if (err?.statusText && typeof err.statusText === 'string' && err.statusText.trim()) {
      return err.statusText;
    }

    // 7. Chercher récursivement une chaîne de texte significative
    const errorStr = this._findMeaningfulText(err);
    if (errorStr) {
      return errorStr;
    }

    // 8. Fallback basé sur le code d'erreur HTTP
    if (err?.status) {
      return this._getHttpStatusText(err.status);
    }

    // 9. Message par défaut
    return 'Une erreur s\'est produite. Veuillez réessayer.';
  }

  /**
   * Cherche récursivement du texte significatif dans l'objet d'erreur
   */
  private _findMeaningfulText(obj: any, depth: number = 0): string | null {
    if (depth > 5) return null; // Éviter une récursion infinie
    if (!obj) return null;

    // Chercher des propriétés communes
    const keys = ['message', 'detail', 'error', 'msg', 'text', 'description', 'exception', 'cause', 'reason'];
    for (const key of keys) {
      const value = obj[key];
      if (value && typeof value === 'string' && value.trim().length > 5) {
        return value;
      }
    }

    // Chercher dans les propriétés imbriquées
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const value = obj[key];
        if (value && typeof value === 'object') {
          const found = this._findMeaningfulText(value, depth + 1);
          if (found) return found;
        }
      }
    }

    return null;
  }

  /**
   * Retourne une description lisible pour un code HTTP
   */
  private _getHttpStatusText(status: number): string {
    const statusTexts: Record<number, string> = {
      400: 'Requête invalide. Vérifiez vos données.',
      401: 'Authentification requise.',
      403: 'Accès non autorisé.',
      404: 'Ressource non trouvée.',
      409: 'Conflit. Cette action ne peut pas être effectuée.',
      422: 'Données invalides ou incomplètes.',
      429: 'Trop de requêtes. Veuillez attendre un moment.',
      500: 'Erreur serveur. Veuillez réessayer ou contacter le support.',
      502: 'Service temporairement indisponible.',
      503: 'Service en maintenance.',
      504: 'Délai d\'attente dépassé.',
    };

    return statusTexts[status] || `Erreur HTTP ${status}`;
  }

  /**
   * Détecte si l'erreur est due à une clé dupliquée
   */
  isDuplicateKeyError(err: any): boolean {
    const message = JSON.stringify(err?.error || '').toLowerCase();
    const raw = String(err?.message || '').toLowerCase();
    return message.includes('unique') 
      || message.includes('dupliqué')
      || message.includes('duplicate')
      || message.includes('key')
      || raw.includes('unique') 
      || raw.includes('duplicate');
  }

  /**
   * Détecte si l'erreur est due à une constraint de stock
   */
  isStockError(err: any): boolean {
    const message = JSON.stringify(err?.error || '').toLowerCase();
    return message.includes('stock') || message.includes('insuffisant') || message.includes('quantité');
  }

  /**
   * Détecte les erreurs de validation
   */
  isValidationError(err: any): boolean {
    return err?.status === 422 || err?.status === 400;
  }
}
