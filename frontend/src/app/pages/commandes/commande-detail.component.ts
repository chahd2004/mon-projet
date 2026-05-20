import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';

import { CommandeService } from '../../core/services/commande.service';
import { ClientService } from '../../core/services/client.service';
import { ProduitService } from '../../core/services/produit.service';
import { BonCommande, LigneBonCommande } from '../../models/bon-commande.model';
import { Client } from '../../models/client.model';
import { Emetteur } from '../../models/emetteur.model';
import { Produit } from '../../models/produit.model';
import { environment } from '../../../environments/environment';
import { formatDocumentReference } from '../../shared/utils/reference-format.util';

interface BonLivraisonLie {
  numero: string;
}

@Component({
  selector: 'app-commande-detail',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './commande-detail.component.html',
  styleUrls: ['./commande-detail.component.scss']
})
export class CommandeDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly commandeService = inject(CommandeService);
  private readonly clientService = inject(ClientService);
  private readonly produitService = inject(ProduitService);
  private readonly http = inject(HttpClient);
  private readonly translate = inject(TranslateService);

  commandeId = 0;
  commande: BonCommande | null = null;
  client: Client | null = null;
  vendeur: Emetteur | null = null;
  produitsMap: Record<number, Produit> = {};

  loading = false;
  actionLoading = false;
  errorMessage = '';
  infoMessage = '';

  get lignes(): LigneBonCommande[] {
    return this.commande?.lignes ?? [];
  }

  get statutNormalise(): 'DRAFT' | 'CONFIRMED' | 'IN_PROGRESS' | 'DELIVERED' | 'CANCELLED' {
    return this.toCommandeStatus(this.commande?.statut);
  }

  get commandeReference(): string {
    if (!this.commande) {
      return '-';
    }

    return formatDocumentReference('CMD', this.commande.numBonCommande, this.commande.dateCreation, this.commande.id);
  }

  get bonCommandeLieReference(): string {
    if (!this.commande) {
      return '-';
    }

    return formatDocumentReference('BC', this.commande.numBonCommande, this.commande.dateCreation, this.commande.id);
  }


  get bonsLivraisonLies(): BonLivraisonLie[] {
    if (!this.commande || !this.commande.documentConvertiRef) {
      return [];
    }

    return [
      {
        numero: this.commande.documentConvertiRef
      }
    ];
  }

  get statusHintMessage(): string {
    const map: Record<string, string> = {
      DRAFT: 'COMMANDES.HINTS.DRAFT',
      CONFIRMED: 'COMMANDES.HINTS.CONFIRMED',
      IN_PROGRESS: 'COMMANDES.HINTS.IN_PROGRESS',
      DELIVERED: 'COMMANDES.HINTS.DELIVERED',
      CANCELLED: 'COMMANDES.HINTS.CANCELLED'
    };

    const key = map[this.statutNormalise] || 'COMMANDES.HINTS.NOT_DEFINED';
    return this.translate.instant(key);
  }

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    this.commandeId = Number(idParam || 0);

    if (!this.commandeId) {
      this.errorMessage = 'Identifiant de commande invalide.';
      return;
    }

    this.loadCommandeDetail();
  }

  retourAuxCommandes(): void {
    this.router.navigate(['/commandes']);
  }

  modifierCommande(): void {
    if (!this.commande) {
      return;
    }

    this.router.navigate(['/bons-commandes/nouveau'], { queryParams: { editId: this.commande.id } });
  }

  demarrerProduction(): void {
    if (!this.commande || this.statutNormalise !== 'CONFIRMED') {
      return;
    }

    this.actionLoading = true;
    this.errorMessage = '';
    this.infoMessage = '';

    this.commandeService.demarrer(this.commande.id).subscribe({
      next: (updated) => {
        this.actionLoading = false;
        this.commande = updated;
        this.infoMessage = 'Production demarree avec succes.';
      },
      error: (error) => {
        this.actionLoading = false;
        this.errorMessage = error?.error?.message || 'Erreur lors du demarrage de la production.';
      }
    });
  }

  livrerCommande(): void {
    if (!this.commande || this.statutNormalise !== 'IN_PROGRESS') {
      return;
    }

    this.actionLoading = true;
    this.errorMessage = '';
    this.infoMessage = '';

    this.commandeService.marquerLivree(this.commande.id).subscribe({
      next: (updated) => {
        this.actionLoading = false;
        this.commande = updated;
        this.infoMessage = 'Commande marquee livree avec succes.';
      },
      error: (error) => {
        this.actionLoading = false;
        this.errorMessage = error?.error?.message || 'Erreur lors de la livraison de la commande.';
      }
    });
  }

  annulerCommande(): void {
    if (!this.commande) {
      return;
    }

    // Simple implementation - in production, you might want a dialog for reason
    const raison = 'Annulation demandee par l utilisateur';

    this.actionLoading = true;
    this.errorMessage = '';
    this.infoMessage = '';

    this.commandeService.annuler(this.commande.id, raison).subscribe({
      next: (updated) => {
        this.actionLoading = false;
        this.commande = updated;
        this.infoMessage = 'Commande annulee avec succes.';
      },
      error: (error) => {
        this.actionLoading = false;
        this.errorMessage = error?.error?.message || 'Erreur lors de l annulation de la commande.';
      }
    });
  }

  envoyerEmail(): void {
    this.infoMessage = 'Envoi email commande non disponible pour le moment.';
    this.errorMessage = '';
  }

  convertirEnBL(): void {
    this.router.navigate(['/bons-livraison/nouveau']);
  }

  creerFacture(): void {
    this.infoMessage = 'Creation facture depuis commande non disponible pour le moment.';
    this.errorMessage = '';
  }


  voirBLLie(): void {
    if (!this.commande) {
      return;
    }

    this.router.navigate(['/bons-livraison/view', this.commande.id]);
  }

  creerBonLivraison(): void {
    this.router.navigate(['/bons-livraison/nouveau']);
  }

  confirmerCommande(): void {
    if (!this.commande || this.statutNormalise !== 'DRAFT') {
      return;
    }

    this.actionLoading = true;
    this.errorMessage = '';
    this.infoMessage = '';

    this.commandeService.confirmer(this.commande.id).subscribe({
      next: (updated) => {
        this.actionLoading = false;
        this.commande = updated;
        this.infoMessage = 'Commande confirmee avec succes.';
      },
      error: (error) => {
        this.actionLoading = false;
        this.errorMessage = error?.error?.message || 'Erreur lors de la confirmation de la commande.';
      }
    });
  }

  supprimerCommande(): void {
    this.infoMessage = 'Suppression non disponible: endpoint backend absent.';
  }

  canModifyOrDelete(): boolean {
    return this.statutNormalise === 'DRAFT';
  }

  canConfirm(): boolean {
    return this.statutNormalise === 'DRAFT';
  }

  canStartProduction(): boolean {
    return this.statutNormalise === 'CONFIRMED';
  }

  canDeliver(): boolean {
    return this.statutNormalise === 'IN_PROGRESS';
  }

  canCancel(): boolean {
    return ['DRAFT', 'CONFIRMED', 'IN_PROGRESS'].includes(this.statutNormalise);
  }

  getStatusClass(statut?: string): string {
    const normalized = this.toCommandeStatus(statut);

    const map: Record<string, string> = {
      DRAFT: 'draft',
      CONFIRMED: 'confirmed',
      IN_PROGRESS: 'in-progress',
      DELIVERED: 'delivered',
      CANCELLED: 'cancelled'
    };

    return map[normalized] || 'draft';
  }

  getStatusLabel(statut?: string): string {
    const normalized = this.toCommandeStatus(statut);

    const map: Record<string, string> = {
      DRAFT: 'STATUS.DRAFT',
      CONFIRMED: 'STATUS.CONFIRMED',
      IN_PROGRESS: 'STATUS.IN_PROGRESS',
      DELIVERED: 'STATUS.DELIVERED',
      CANCELLED: 'STATUS.CANCELLED'
    };

    return normalized ? this.translate.instant(map[normalized] || normalized) : '-';
  }

  getLigneTauxTVA(ligne: LigneBonCommande): number {
    const inlineTaux = Number((ligne as any)?.tauxTVA);
    if (Number.isFinite(inlineTaux) && inlineTaux >= 0) {
      return inlineTaux;
    }

    const produitId = Number(ligne.produitId || 0);
    if (produitId > 0) {
      const tauxProduit = this.produitsMap[produitId]?.tauxTVA;
      if (typeof tauxProduit === 'number' && Number.isFinite(tauxProduit) && tauxProduit >= 0) {
        return tauxProduit;
      }
    }

    return 0;
  }

  getLigneMontantTVA(ligne: LigneBonCommande): number {
    const ht = Number(ligne.montantHT || 0);
    const taux = this.getLigneTauxTVA(ligne);
    return ht * (taux / 100);
  }

  getLigneMontantTTC(ligne: LigneBonCommande): number {
    return Number(ligne.montantHT || 0) + this.getLigneMontantTVA(ligne);
  }

  private loadCommandeDetail(): void {
    this.loading = true;
    this.errorMessage = '';

    this.commandeService.getById(this.commandeId).subscribe({
      next: (bc) => {
        this.commande = bc;
        this.loadParties();
      },
      error: (error) => {
        this.loading = false;
        console.error('Erreur lors du chargement de la commande:', error);
        const message = error?.error?.message || 'Impossible de charger le detail de la commande.';
        this.errorMessage = message;
      }
    });
  }

  private loadParties(): void {
    if (!this.commande) {
      this.loading = false;
      return;
    }

    const client$ = this.commande.acheteurId
      ? this.clientService.getClientById(this.commande.acheteurId).pipe(catchError(() => of(null)))
      : of(null);

    const vendeur$ = this.commande.vendeurId
      ? this.http.get<Emetteur>(`${environment.apiUrl}/emetteurs/${this.commande.vendeurId}`).pipe(catchError(() => of(null)))
      : of(null);

    const produits$ = this.produitService
      .getProduits(this.commande.vendeurId)
      .pipe(catchError(() => of([] as Produit[])));

    forkJoin([client$, vendeur$, produits$]).subscribe({
      next: ([client, vendeur, produits]) => {
        this.client = client;
        this.vendeur = vendeur;
        this.produitsMap = (produits || []).reduce<Record<number, Produit>>((acc, p) => {
          acc[p.id] = p;
          return acc;
        }, {});
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  formatCommandeReference(): string {
    return this.commandeReference;
  }

  formatModePaiement(value?: string | null): string {
    if (!value) return '-';
    return this.translate.instant('FACTURE.PAYMENT_METHODS.' + value);
  }



  private toDate(value?: string | null): Date | null {
    if (!value) {
      return null;
    }

    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  private formatDate(date: Date | null): string {
    if (!date) {
      return '-';
    }

    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  }

  private toCommandeStatus(raw?: string | null): 'DRAFT' | 'CONFIRMED' | 'IN_PROGRESS' | 'DELIVERED' | 'CANCELLED' {
    const value = (raw || '').toUpperCase();

    if (value === 'DRAFT') {
      return 'DRAFT';
    }

    if (value === 'CONFIRMED') {
      return 'CONFIRMED';
    }

    if (value === 'DELIVERED') {
      return 'DELIVERED';
    }

    if (value === 'CANCELLED') {
      return 'CANCELLED';
    }

    if (value === 'SENT' || value === 'SIGNED_CLIENT' || value === 'IN_PROGRESS') {
      return 'IN_PROGRESS';
    }

    return 'IN_PROGRESS';
  }
}
