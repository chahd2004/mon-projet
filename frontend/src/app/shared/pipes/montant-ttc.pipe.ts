import { Pipe, PipeTransform } from '@angular/core';

/**
 * Calcul montant TTC à partir d'un montant HT et taux TVA
 * Usage: {{ montantHT | montantTTC : tauxTVA }}
 * Example: {{ 100 | montantTTC : 19 }} → 119
 */
@Pipe({
  name: 'montantTTC',
  standalone: true
})
export class MontantTTCPipe implements PipeTransform {
  transform(montantHT: number, tauxTVA: number = 0): number {
    if (isNaN(montantHT) || isNaN(tauxTVA)) {
      return 0;
    }
    const montantTVA = montantHT * (tauxTVA / 100);
    const montantTTC = montantHT + montantTVA;
    return Math.round(montantTTC * 100) / 100; // Arrondir à 2 décimales
  }
}
