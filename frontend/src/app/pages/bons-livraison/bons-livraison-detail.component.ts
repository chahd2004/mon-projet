import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { BonLivraisonService } from '../../core/services/bon-livraison.service';
import { ClientService } from '../../core/services/client.service';
import { BonLivraison } from '../../models/bon-livraison.model';
import { Client } from '../../models/client.model';
import { formatDocumentReference } from '../../shared/utils/reference-format.util';

interface LigneLivraisonView {
  index: number;
  designation: string;
  quantiteLivree: number;
}

@Component({
  selector: 'app-bons-livraison-detail',
  standalone: true,
  imports: [CommonModule, TranslateModule, FormsModule],
  templateUrl: './bons-livraison-detail.component.html',
  styleUrls: ['./bons-livraison-detail.component.scss']
})
export class BonsLivraisonDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly bonLivraisonService = inject(BonLivraisonService);
  private readonly clientService = inject(ClientService);
  private readonly translate = inject(TranslateService);

  livraisonId = 0;
  livraison: BonLivraison | null = null;
  client: Client | null = null;

  loading = false;
  actionLoading = false;
  errorMessage = '';
  infoMessage = '';

  adresseLivraison = '-';

  displayFactureModal = false;
  factureDateDocument = '';
  factureDatePaiement = '';
  factureModePaiement = 'VIREMENT';
  generatingFacture = false;

  ngOnInit(): void {
    const rawParam = this.route.snapshot.paramMap.get('id') || this.route.snapshot.paramMap.get('ref') || '';
    const maybeId = Number(rawParam);

    if (Number.isFinite(maybeId) && maybeId > 0) {
      this.livraisonId = maybeId;
      this.loadDetail();
      return;
    }

    this.resolveLivraisonIdFromReference(rawParam);
  }

  retourAuxBL(): void {
    this.router.navigate(['/bons-livraison']);
  }

  get statusLabel(): string {
    const map: Record<string, string> = {
      DRAFT: 'STATUS.DRAFT',
      DELIVERED: 'STATUS.DELIVERED',
      SIGNED_CLIENT: 'STATUS.SIGNED_CLIENT',
      DISPUTE: 'STATUS.DISPUTE',
      CLOSED: 'STATUS.CLOSED'
    };

    return this.translate.instant(map[this.statusValue] || this.statusValue);
  }

  get currentStatusText(): string {
    return this.statusLabel;
  }

  get statusValue(): 'DRAFT' | 'DELIVERED' | 'SIGNED_CLIENT' | 'DISPUTE' | 'CLOSED' {
    const value = (this.livraison?.statut || '').toUpperCase();

    if (value === 'SIGNED_CLIENT') {
      return 'SIGNED_CLIENT';
    }

    if (value === 'CLOSED') {
      return 'CLOSED';
    }

    if (value === 'DELIVERED') {
      return 'DELIVERED';
    }

    if (value === 'DISPUTE') {
      return 'DISPUTE';
    }

    return 'DRAFT';
  }

  get statusClass(): string {
    const map: Record<string, string> = {
      DRAFT: 'draft',
      DELIVERED: 'delivered',
      SIGNED_CLIENT: 'signed-client',
      DISPUTE: 'dispute',
      CLOSED: 'closed'
    };

    return map[this.statusValue] || 'draft';
  }

  get lignes(): LigneLivraisonView[] {
    const source = this.livraison?.lignes || [];

    return source.map((ligne, idx) => {
      return {
        index: idx + 1,
        designation: ligne.produitDesignation || '-',
        quantiteLivree: Number(ligne.quantite || 0)
      };
    });
  }

  get commandeReference(): string {
    if (!this.livraison) {
      return '-';
    }

    return this.livraison.commandeSourceRef || '-';
  }

  get commandeDate(): string {
    return '';
  }

  get totalLivresArticles(): number {
    return this.lignes.reduce((sum, ligne) => sum + ligne.quantiteLivree, 0);
  }

  get referenceBL(): string {
    if (!this.livraison) {
      return '-';
    }

    return formatDocumentReference(
      'BL',
      this.livraison.numBonLivraison,
      this.livraison.dateCreation,
      this.livraison.id
    );
  }

  get linkSignature(): string {
    if (!this.livraison) return '';
    const ref = this.livraison.numBonLivraison || '';
    const origin = window.location.origin;
    return `${origin}/bon-livraison-signature/${ref}`;
  }

  copierLien(input: HTMLInputElement): void {
    input.select();
    document.execCommand('copy');
    this.infoMessage = this.translate.instant('BONS_LIVRAISON.LINK_COPIED');
  }


  marquerCommeLivre(): void {
    this.actionLoading = true;
    this.infoMessage = '';
    this.errorMessage = '';

    this.bonLivraisonService.marquerLivre(this.livraisonId).subscribe({
      next: () => {
        this.actionLoading = false;
        this.infoMessage = this.translate.instant('BONS_LIVRAISON.MSGS.DELIVERED_SUCCESS');
        this.loadDetail();
      },
      error: (error) => {
        this.actionLoading = false;
        this.errorMessage = error?.error?.message || 'Impossible de marquer ce bon de livraison comme livre.';
      }
    });
  }

  envoyerParEmail(): void {
    if (this.statusValue !== 'DRAFT') {
      this.infoMessage = 'Email deja envoye ou BL deja traite.';
      this.errorMessage = '';
      return;
    }
    this.marquerCommeLivre();
  }


  actionSelonStatut(): void {
    if (this.statusValue === 'DRAFT') {
      this.marquerCommeLivre();
      return;
    }

    if (this.statusValue === 'DELIVERED') {
      this.infoMessage = this.translate.instant('BONS_LIVRAISON.MSGS.WAIT_WAIT');
      this.errorMessage = '';
      return;
    }

    if (this.statusValue === 'SIGNED_CLIENT') {
      this.cloturerBL();
      return;
    }

    if (this.statusValue === 'CLOSED') {
      this.ouvrirFactureModal();
      return;
    }

    this.infoMessage = 'Resolution litige non disponible pour le moment.';
    this.errorMessage = '';
  }

  cloturerBL(): void {
    this.actionLoading = true;
    this.errorMessage = '';
    this.infoMessage = '';

    // On passe une chaine vide pour declencher la generation automatique de facture draft cote backend
    this.bonLivraisonService.cloturer(this.livraisonId, '').subscribe({
      next: () => {
        this.actionLoading = false;
        this.infoMessage = this.translate.instant('BONS_LIVRAISON.MSGS.CLOSED_SUCCESS');
        this.loadDetail();
      },
      error: (err) => {
        this.actionLoading = false;
        this.errorMessage = err?.error?.message || 'Erreur lors de la cloture du bon de livraison.';
      }
    });
  }

  ouvrirFactureModal(): void {
    if (this.statusValue !== 'CLOSED') {
      this.errorMessage = 'Le bon de livraison doit être cloturé pour être facturé.';
      return;
    }
    this.factureDateDocument = new Date().toISOString().slice(0, 10);
    const in30Days = new Date();
    in30Days.setDate(in30Days.getDate() + 30);
    this.factureDatePaiement = in30Days.toISOString().slice(0, 10);
    this.factureModePaiement = 'VIREMENT';
    this.displayFactureModal = true;
    this.errorMessage = '';
    this.infoMessage = '';
  }

  fermerFactureModal(): void {
    this.displayFactureModal = false;
    this.generatingFacture = false;
  }

  genererFactureDepuiBL(): void {
    if (!this.factureDateDocument || !this.factureDatePaiement || !this.factureModePaiement) {
      this.errorMessage = 'Veuillez remplir tous les champs.';
      return;
    }

    this.generatingFacture = true;
    this.errorMessage = '';

    const payload = {
      dateDocument: this.factureDateDocument,
      datePaiement: this.factureDatePaiement,
      modePaiement: this.factureModePaiement
    };

    this.bonLivraisonService.versFacture(this.livraisonId, payload).subscribe({
      next: () => {
        this.generatingFacture = false;
        this.fermerFactureModal();
        this.infoMessage = 'Facture générée avec succès.';
        this.loadDetail();
      },
      error: (err: any) => {
        this.generatingFacture = false;
        this.errorMessage = err?.error?.message || 'Erreur lors de la génération de la facture.';
      }
    });
  }

  get actionStatutLabel(): string {
    const map: Record<string, string> = {
      DRAFT: 'BONS_LIVRAISON.ACTIONS.DELIVER',
      DELIVERED: 'BONS_LIVRAISON.ACTIONS.WAIT_SIGNATURE',
      SIGNED_CLIENT: 'BONS_LIVRAISON.ACTIONS.CLOSE',
      CLOSED: 'Générer une facture',
      DISPUTE: 'BONS_LIVRAISON.ACTIONS.RESOLVE_DISPUTE'
    };

    return this.translate.instant(map[this.statusValue] || 'BONS_LIVRAISON.ACTIONS.RESOLVE_DISPUTE');
  }


  private loadDetail(): void {
    this.loading = true;
    this.errorMessage = '';

    this.bonLivraisonService.getById(this.livraisonId).subscribe({
      next: (livraison) => {
        this.livraison = livraison;
        this.loadClientEtMeta();
      },
      error: () => {
        this.loading = false;
        this.errorMessage = 'Impossible de charger le detail du bon de livraison.';
      }
    });
  }

  private loadClientEtMeta(): void {
    if (!this.livraison) {
      this.loading = false;
      return;
    }

    const client$ = this.livraison.acheteurId
      ? this.clientService.getClientById(this.livraison.acheteurId).pipe(catchError(() => of(null)))
      : of(null);

    forkJoin([client$]).subscribe({
      next: ([client]) => {
        this.client = client;
        this.adresseLivraison = this.livraison?.adresseLivraison || client?.adresseComplete || '-';
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  private resolveLivraisonIdFromReference(reference: string): void {
    const target = this.normalizeRef(reference);
    if (!target) {
      this.errorMessage = 'Reference de bon de livraison invalide.';
      return;
    }

    this.loading = true;
    this.bonLivraisonService.getAll().subscribe({
      next: (list) => {
        const items = Array.isArray(list) ? list : [];
        const match = items.find((bl) => this.normalizeRef(bl.numBonLivraison) === target);

        if (!match?.id) {
          this.loading = false;
          this.errorMessage = `Bon de livraison introuvable pour la reference ${reference}.`;
          return;
        }

        this.livraisonId = match.id;
        this.router.navigate(['/bons-livraison/view', this.livraisonId], { replaceUrl: true });
        this.loadDetail();
      },
      error: () => {
        this.loading = false;
        this.errorMessage = 'Impossible de resoudre la reference du bon de livraison.';
      }
    });
  }

  private normalizeRef(value?: string | null): string {
    return (value || '').trim().toUpperCase();
  }
}
