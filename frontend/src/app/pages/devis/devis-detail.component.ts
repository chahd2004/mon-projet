import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { DropdownModule } from 'primeng/dropdown';
import { CalendarModule } from 'primeng/calendar';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { DevisService } from '../../core/services/devis.service';
import { ClientService } from '../../core/services/client.service';
import { ProduitService } from '../../core/services/produit.service';
import { Devis, LigneDevis } from '../../models/devis.model';
import { Client } from '../../models/client.model';
import { Emetteur } from '../../models/emetteur.model';
import { Produit } from '../../models/produit.model';
import { environment } from '../../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { formatDocumentReference } from '../../shared/utils/reference-format.util';

@Component({
  selector: 'app-devis-detail',
  standalone: true,
  imports: [
    CommonModule, FormsModule, ReactiveFormsModule, TranslateModule,
    DialogModule, ButtonModule, DropdownModule, CalendarModule, ToastModule
  ],
  providers: [MessageService],
  templateUrl: './devis-detail.component.html',
  styleUrls: ['./devis-detail.component.scss']
})
export class DevisDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly devisService = inject(DevisService);
  private readonly clientService = inject(ClientService);
  private readonly produitService = inject(ProduitService);
  private readonly http = inject(HttpClient);
  private readonly translate = inject(TranslateService);
  private readonly fb = inject(FormBuilder);
  private readonly messageService = inject(MessageService);

  devisId = 0;
  devis: Devis | null = null;
  client: Client | null = null;
  vendeur: Emetteur | null = null;
  produitsMap: Record<number, Produit> = {};
  loading = false;
  errorMessage = '';

  // Conversion
  displayConvertDialog = false;
  conversionForm!: FormGroup;
  isConverting = false;
  paymentModes = [
    { label: 'Virement', value: 'VIREMENT' },
    { label: 'Chèque', value: 'CHEQUE' },
    { label: 'Espèces', value: 'ESPECES' },
    { label: 'Carte', value: 'CARTE' }
  ];

  get lignes(): LigneDevis[] {
    return this.devis?.lignes ?? [];
  }


  ngOnInit(): void {
    this.initConversionForm();
    const rawParam = this.route.snapshot.paramMap.get('id') || this.route.snapshot.paramMap.get('ref') || '';
    const maybeId = Number(rawParam);

    if (Number.isFinite(maybeId) && maybeId > 0) {
      this.devisId = maybeId;
      this.loadDevisDetail();
      return;
    }

    if (rawParam && rawParam.toUpperCase().startsWith('DEV-')) {
      this.resolveDevisIdFromReference(rawParam);
      return;
    }

    this.resolveDevisIdFromReference(rawParam);
  }

  retourAuxDevis(): void {
    this.router.navigate(['/devis']);
  }

  loadDevisDetail(): void {
    this.loading = true;
    this.errorMessage = '';

    this.devisService.getById(this.devisId).subscribe({
      next: (devis) => {
        this.devis = devis;
        this.loadParties();
      },
      error: () => {
        this.loading = false;
        this.errorMessage = 'Impossible de charger le détail du devis.';
      }
    });
  }



  private resolveDevisIdFromReference(reference: string): void {
    const target = this.normalizeRef(reference);
    if (!target) {
      this.errorMessage = 'Reference de devis invalide.';
      return;
    }

    this.loading = true;
    this.devisService.getAll().subscribe({
      next: (list) => {
        const items = Array.isArray(list) ? list : [];
        const match = items.find((d) => this.normalizeRef(d.numDevis) === target);

        if (!match?.id) {
          this.loading = false;
          this.errorMessage = `Devis introuvable pour la reference ${reference}.`;
          return;
        }

        this.devisId = match.id;
        this.router.navigate(['/devis/view', this.devisId], { replaceUrl: true });
        this.loadDevisDetail();
      },
      error: () => {
        this.loading = false;
        this.errorMessage = 'Impossible de resoudre la reference du devis.';
      }
    });
  }

  private normalizeRef(value?: string | null): string {
    return (value || '').trim().toUpperCase();
  }

  private loadParties(): void {
    if (!this.devis) {
      this.loading = false;
      return;
    }

    const client$ = this.devis.acheteurId
      ? this.clientService.getClientById(this.devis.acheteurId).pipe(catchError(() => of(null)))
      : of(null);

    const vendeur$ = this.devis.vendeurId
      ? this.http.get<Emetteur>(`${environment.apiUrl}/emetteurs/${this.devis.vendeurId}`).pipe(catchError(() => of(null)))
      : of(null);

    const produits$ = this.produitService
      .getProduits(this.devis.vendeurId)
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
    if (!this.devis) {
      return;
    }

    this.devisService.envoyer(this.devis.id).subscribe({
      next: (updated) => {
        this.devis = updated;
      },
      error: () => {
        this.errorMessage = 'Erreur lors de l\'envoi au client.';
      }
    });
  }

  accepterDevis(): void {
    if (!this.devis) {
      return;
    }

    this.devisService.accepter(this.devis.id).subscribe({
      next: (updated) => {
        this.devis = updated;
      },
      error: () => {
        this.errorMessage = 'Erreur lors de l\'acceptation du devis.';
      }
    });
  }

  rejeterDevis(): void {
    if (!this.devis) {
      return;
    }

    const raison = window.prompt('Saisir la raison du rejet:');
    if (!raison || !raison.trim()) {
      return;
    }

    this.devisService.rejeter(this.devis.id, raison.trim()).subscribe({
      next: (updated) => {
        this.devis = updated;
      },
      error: () => {
        this.errorMessage = 'Erreur lors du rejet du devis.';
      }
    });
  }

  convertirEnBonCommande(): void {
    if (!this.devis) {
      return;
    }

    const dateDocument = new Date().toISOString().slice(0, 10);
    this.devisService.convertirEnBonCommande(this.devis.id, dateDocument).subscribe({
      next: () => {
        this.loadDevisDetail();
      },
      error: () => {
        this.errorMessage = 'Erreur lors de la conversion en bon de commande.';
      }
    });
  }


  private initConversionForm(): void {
    this.conversionForm = this.fb.group({
      dateDocument: [new Date(), Validators.required],
      modePaiement: ['VIREMENT', Validators.required],
      datePaiement: [new Date(), Validators.required]
    });
  }

  ouvrirConversionFacture(): void {
    if (!this.devis) return;
    this.conversionForm.patchValue({
      dateDocument: new Date(),
      modePaiement: 'VIREMENT',
      datePaiement: new Date()
    });
    this.displayConvertDialog = true;
  }

  confirmerConversionFacture(): void {
    if (this.conversionForm.invalid || !this.devis) return;

    this.isConverting = true;
    const val = this.conversionForm.value;
    const dateDoc = this.formatDate(val.dateDocument);
    const datePay = this.formatDate(val.datePaiement);

    this.devisService.convertirEnFactureDirecte(
      this.devis.id,
      dateDoc,
      val.modePaiement,
      datePay
    ).subscribe({
      next: (res) => {
        this.isConverting = false;
        this.displayConvertDialog = false;
        this.messageService.add({
          severity: 'success',
          summary: 'Succès',
          detail: this.translate.instant('DEVIS.MSGS.CONVERT_FACT_SUCCESS')
        });
        this.router.navigate(['/factures']);
      },
      error: (err) => {
        this.isConverting = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Erreur',
          detail: err?.error?.message || this.translate.instant('DEVIS.MSGS.CONVERT_FACT_ERROR')
        });
      }
    });
  }

  private formatDate(date: any): string {
    if (!date) return '';
    const d = new Date(date);
    return d.toISOString().split('T')[0];
  }


  canEnvoyer(): boolean {
    return this.getEffectiveStatut() === 'DRAFT';
  }

  canAccepterOuRejeter(): boolean {
    return this.getEffectiveStatut() === 'SENT';
  }

  canConvertir(): boolean {
    return this.getEffectiveStatut() === 'ACCEPTED';
  }

  canConvertirDirectement(): boolean {
    return this.getEffectiveStatut() === 'ACCEPTED';
  }

  formatModePaiement(value?: string | null): string {
    if (!value) return '-';
    return this.translate.instant('FACTURE.PAYMENT_METHODS.' + value);
  }

  getStatutLabel(statut?: string): string {
    if (!statut) {
      return '-';
    }

    return this.getEffectiveStatut();
  }

  getEffectiveStatut(): string {
    if (!this.devis) {
      return '-';
    }

    return this.devis.statut || 'DRAFT';
  }

  getLigneTauxTVA(ligne: LigneDevis): number {
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

  getLigneMontantTVA(ligne: LigneDevis): number {
    const ht = Number(ligne.montantHT || 0);
    const taux = this.getLigneTauxTVA(ligne);
    return ht * (taux / 100);
  }

  getLigneMontantTTC(ligne: LigneDevis): number {
    return Number(ligne.montantHT || 0) + this.getLigneMontantTVA(ligne);
  }

  private toDateOnly(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }


  private toValidDate(value: string | null): Date | null {
    if (!value) {
      return null;
    }

    // Accept YYYY-MM-DD, full ISO, and DD/MM/YYYY.
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(value)) {
      const [day, month, year] = value.split('/').map(Number);
      const localDate = new Date(year, month - 1, day);
      return Number.isNaN(localDate.getTime()) ? null : localDate;
    }

    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  formatDevisReference(): string {
    if (!this.devis) {
      return '-';
    }

    return formatDocumentReference('DEVIS', this.devis.numDevis, this.devis.dateCreation, this.devis.id);
  }

  private normalizeModePaiement(value?: string | null): 'VIREMENT' | 'CHEQUE' | 'ESPECES' | 'CARTE' {
    if (value === 'CHEQUE' || value === 'ESPECES' || value === 'CARTE' || value === 'VIREMENT') {
      return value;
    }

    return 'VIREMENT';
  }
}
