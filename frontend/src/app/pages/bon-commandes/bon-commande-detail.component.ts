import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';

import { BonCommandeService } from '../../core/services/bon-commande.service';
import { ClientService } from '../../core/services/client.service';
import { ProduitService } from '../../core/services/produit.service';
import { BonCommande, LigneBonCommande } from '../../models/bon-commande.model';
import { Client } from '../../models/client.model';
import { Emetteur } from '../../models/emetteur.model';
import { Produit } from '../../models/produit.model';
import { environment } from '../../../environments/environment';
import { formatDocumentReference } from '../../shared/utils/reference-format.util';

@Component({
  selector: 'app-bon-commande-detail',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './bon-commande-detail.component.html',
  styleUrls: ['./bon-commande-detail.component.scss']
})
export class BonCommandeDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly bonCommandeService = inject(BonCommandeService);
  private readonly clientService = inject(ClientService);
  private readonly produitService = inject(ProduitService);
  private readonly http = inject(HttpClient);

  bonCommandeId = 0;
  bonCommande: BonCommande | null = null;
  client: Client | null = null;
  vendeur: Emetteur | null = null;
  produitsMap: Record<number, Produit> = {};
  loading = false;
  sending = false;
  errorMessage = '';
  infoMessage = '';

  get lignes(): LigneBonCommande[] {
    return this.bonCommande?.lignes ?? [];
  }

  get statutNormalise(): 'DRAFT' | 'SENT' | 'SIGNED_CLIENT' | 'CONFIRMED' | 'CONVERTED' | 'CANCELLED' {
    const raw = (this.bonCommande?.statut || '').toUpperCase();
    if (raw === 'DRAFT' || raw === 'SENT' || raw === 'SIGNED_CLIENT' || raw === 'CONFIRMED' || raw === 'CONVERTED' || raw === 'CANCELLED') {
      return raw;
    }

    return 'DRAFT';
  }

  get devisLieReference(): string {
    if (!this.bonCommande) {
      return '-';
    }

    if (this.bonCommande.devisSourceRef) {
      return this.bonCommande.devisSourceRef;
    }

    return formatDocumentReference('DEVIS', this.bonCommande.numBonCommande, this.bonCommande.dateCreation, this.bonCommande.id);
  }

  get statutTexteAction(): string {
    const map: Record<string, string> = {
      DRAFT: 'Brouillon',
      SENT: 'Envoye au client',
      SIGNED_CLIENT: 'Signe par le client',
      CONFIRMED: 'Confirme',
      CONVERTED: 'Converti en commande',
      CANCELLED: 'Annule'
    };

    return map[this.statutNormalise] || this.statutNormalise;
  }

  get messageStatut(): string {
    const map: Record<string, string> = {
      DRAFT: 'Le bon de commande est en brouillon. Vous pouvez encore modifier avant envoi.',
      SENT: 'Le bon de commande a ete envoye par email au client. Vous pouvez confirmer apres accord client.',
      SIGNED_CLIENT: 'Le client a signe le bon de commande. Vous pouvez confirmer pour convertir en commande.',
      CONFIRMED: 'Bon de commande confirme. Vous pouvez le convertir en commande.',
      CONVERTED: 'Bon de commande converti en commande.',
      CANCELLED: 'Bon de commande annule.'
    };

    return map[this.statutNormalise] || '';
  }



  ngOnInit(): void {
    const rawParam = this.route.snapshot.paramMap.get('id') || this.route.snapshot.paramMap.get('ref') || '';
    const maybeId = Number(rawParam);

    if (Number.isFinite(maybeId) && maybeId > 0) {
      this.bonCommandeId = maybeId;
      this.loadBonCommandeDetail();
      return;
    }

    this.resolveBonCommandeIdFromReference(rawParam);
  }

  retourAuxBC(): void {
    this.router.navigate(['/bons-commandes']);
  }

  loadBonCommandeDetail(): void {
    this.loading = true;
    this.errorMessage = '';

    this.bonCommandeService.getById(this.bonCommandeId).subscribe({
      next: (bc) => {
        this.bonCommande = bc;
        this.loadParties();
      },
      error: () => {
        this.loading = false;
        this.errorMessage = 'Impossible de charger le detail du bon de commande.';
      }
    });
  }

  private resolveBonCommandeIdFromReference(reference: string): void {
    const target = this.normalizeRef(reference);
    if (!target) {
      this.errorMessage = 'Reference de bon de commande invalide.';
      return;
    }

    this.loading = true;
    this.bonCommandeService.getAll().subscribe({
      next: (list) => {
        const items = Array.isArray(list) ? list : [];
        const match = items.find((bc) => this.normalizeRef(bc.numBonCommande) === target);

        if (!match?.id) {
          this.loading = false;
          this.errorMessage = `Bon de commande introuvable pour la reference ${reference}.`;
          return;
        }

        this.bonCommandeId = match.id;
        this.router.navigate(['/bons-commandes/view', this.bonCommandeId], { replaceUrl: true });
        this.loadBonCommandeDetail();
      },
      error: () => {
        this.loading = false;
        this.errorMessage = 'Impossible de resoudre la reference du bon de commande.';
      }
    });
  }

  private normalizeRef(value?: string | null): string {
    return (value || '').trim().toUpperCase();
  }

  private loadParties(): void {
    if (!this.bonCommande) {
      this.loading = false;
      return;
    }

    const client$ = this.bonCommande.acheteurId
      ? this.clientService.getClientById(this.bonCommande.acheteurId).pipe(catchError(() => of(null)))
      : of(null);

    const vendeur$ = this.bonCommande.vendeurId
      ? this.http.get<Emetteur>(`${environment.apiUrl}/emetteurs/${this.bonCommande.vendeurId}`).pipe(catchError(() => of(null)))
      : of(null);

    const produits$ = this.produitService
      .getProduits(this.bonCommande.vendeurId)
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

  envoyerAuClient(): void {
    if (!this.bonCommande || !this.canEnvoyer()) {
      return;
    }

    this.sending = true;
    this.errorMessage = '';
    this.infoMessage = '';

    this.bonCommandeService.envoyer(this.bonCommande.id).subscribe({
      next: (updated) => {
        this.sending = false;
        this.bonCommande = updated;
        this.infoMessage = 'Email envoye au client avec succes.';
      },
      error: (error) => {
        this.sending = false;
        this.errorMessage = error?.error?.message || 'Erreur lors de l\'envoi du bon de commande.';
      }
    });
  }

  confirmerManuellement(): void {
    if (!this.bonCommande || !this.canConfirmer()) return;
    this.sending = true;
    this.errorMessage = '';
    this.infoMessage = '';
    this.bonCommandeService.confirmer(this.bonCommande.id).subscribe({
      next: (updated) => {
        this.sending = false;
        this.bonCommande = updated;
        this.infoMessage = 'Bon de commande confirmé avec succès.';
      },
      error: (error) => {
        this.sending = false;
        this.errorMessage = error?.error?.message || 'Erreur lors de la confirmation.';
      }
    });
  }

  annulerBonCommande(): void {
    if (!this.bonCommande || !this.canAnnuler()) return;
    const raison = prompt('Raison de l\'annulation :');
    if (!raison || raison.trim() === '') return;
    this.sending = true;
    this.errorMessage = '';
    this.infoMessage = '';
    this.bonCommandeService.annuler(this.bonCommande.id, raison).subscribe({
      next: (updated) => {
        this.sending = false;
        this.bonCommande = updated;
        this.infoMessage = 'Bon de commande annulé.';
      },
      error: (error) => {
        this.sending = false;
        this.errorMessage = error?.error?.message || 'Erreur lors de l\'annulation.';
      }
    });
  }

  envoyerParEmail(): void {
    this.envoyerAuClient();
  }

  convertirEnCommande(): void {
    if (!this.bonCommande) {
      return;
    }

    const dateDocument = new Date().toISOString().slice(0, 10);
    this.sending = true;
    this.errorMessage = '';
    this.infoMessage = '';

    this.bonCommandeService.convertirEnCommande(this.bonCommande.id, dateDocument).subscribe({
      next: () => {
        this.sending = false;
        this.infoMessage = 'Bon de commande converti en commande avec succes.';
        this.router.navigate(['/commandes']);
      },
      error: (error) => {
        this.sending = false;
        this.errorMessage = error?.error?.message || 'Erreur lors de la conversion en commande.';
      }
    });
  }

  renvoyerEmail(): void {
    this.envoyerAuClient();
  }

  canConfirmer(): boolean {
    return this.statutNormalise === 'SENT' || this.statutNormalise === 'SIGNED_CLIENT';
  }

  canAnnuler(): boolean {
    return this.statutNormalise !== 'CONVERTED' && this.statutNormalise !== 'CANCELLED';
  }

  canConvertirCommande(): boolean {
    return this.statutNormalise === 'CONFIRMED' || this.statutNormalise === 'SIGNED_CLIENT';
  }

  canEnvoyer(): boolean {
    return this.bonCommande?.statut === 'DRAFT';
  }

  getStatutLabel(statut?: string): string {
    if (!statut) {
      return '-';
    }

    const map: Record<string, string> = {
      DRAFT: 'DRAFT',
      SENT: 'SENT',
      SIGNED_CLIENT: 'SIGNED_CLIENT',
      CONFIRMED: 'CONFIRMED',
      CONVERTED: 'CONVERTED',
      CANCELLED: 'CANCELLED'
    };

    return map[statut] || statut;
  }

  getStatutClass(statut?: string): string {
    const map: Record<string, string> = {
      DRAFT: 'draft',
      SENT: 'sent',
      SIGNED_CLIENT: 'signed',
      CONFIRMED: 'confirmed',
      CONVERTED: 'converted',
      CANCELLED: 'cancelled'
    };

    return map[statut || ''] || 'draft';
  }

  formatModePaiement(value?: string | null): string {
    const map: Record<string, string> = {
      VIREMENT: 'Virement bancaire',
      CHEQUE: 'Cheque',
      ESPECES: 'Especes',
      CARTE: 'Carte bancaire'
    };

    if (!value) {
      return '-';
    }

    return map[value] || value;
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

  formatBonCommandeReference(): string {
    if (!this.bonCommande) {
      return '-';
    }

    return formatDocumentReference('BC', this.bonCommande.numBonCommande, this.bonCommande.dateCreation, this.bonCommande.id);
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

    const d = String(date.getDate()).padStart(2, '0');
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const y = date.getFullYear();
    return `${d}/${m}/${y}`;
  }
}
