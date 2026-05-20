import { Component, OnInit, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { DropdownModule } from 'primeng/dropdown';
import { CalendarModule } from 'primeng/calendar';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

import { DevisService } from '../../core/services/devis.service';
import { AuthService } from '../../core/services/auth.service';
import { Devis } from '../../models/devis.model';
import { formatDocumentReference } from '../../shared/utils/reference-format.util';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-devis',
  standalone: true,
  imports: [
    CommonModule, FormsModule, ReactiveFormsModule, TranslateModule,
    DialogModule, ButtonModule, DropdownModule, CalendarModule, ToastModule
  ],
  providers: [MessageService],
  templateUrl: './devis.component.html',
  styleUrls: ['./devis.component.scss']
})
export class DevisComponent implements OnInit {
  private readonly devisService = inject(DevisService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly translate = inject(TranslateService);
  private readonly fb = inject(FormBuilder);
  private readonly messageService = inject(MessageService);

  get isViewer(): boolean {
    return this.authService.hasRole('ENTREPRISE_VIEWER');
  }

  isReadOnly = computed(() => this.authService.hasRole('ENTREPRISE_VIEWER'));

  devis: Devis[] = [];
  loading = false;
  errorMessage = '';
  showStats = true;
  selectedStatus: 'ALL' | string = 'ALL';

  // Conversion
  displayConvertDialog = false;
  conversionForm!: FormGroup;
  selectedDevisId: number | null = null;
  isConverting = false;
  paymentModes = [
    { label: 'Virement', value: 'VIREMENT' },
    { label: 'Chèque', value: 'CHEQUE' },
    { label: 'Espèces', value: 'ESPECES' },
    { label: 'Carte', value: 'CARTE' }
  ];

  readonly statusOptions: string[] = ['DRAFT', 'SENT', 'ACCEPTED', 'REJECTED', 'EXPIRED'];

  get filteredDevis(): Devis[] {
    if (this.selectedStatus === 'ALL') {
      return this.devis;
    }

    return this.devis.filter(item => this.getEffectiveStatut(item) === this.selectedStatus);
  }

  ngOnInit(): void {
    this.initConversionForm();
    this.loadDevis();
  }

  private initConversionForm(): void {
    this.conversionForm = this.fb.group({
      dateDocument: [new Date(), Validators.required],
      modePaiement: ['VIREMENT', Validators.required],
      datePaiement: [new Date(), Validators.required]
    });
  }


  get totalDevis(): number {
    return this.filteredDevis.length;
  }

  get totalMontant(): number {
    return this.filteredDevis.reduce((sum, item) => sum + (item.totalTTC || 0), 0);
  }

  get acceptedCount(): number {
    return this.filteredDevis.filter(item => this.getEffectiveStatut(item) === 'ACCEPTED').length;
  }

  get pendingCount(): number {
    return this.filteredDevis.filter(item => this.getEffectiveStatut(item) === 'SENT').length;
  }

  get expiredCount(): number {
    return this.filteredDevis.filter(item => this.getEffectiveStatut(item) === 'EXPIRED').length;
  }

  get draftCount(): number {
    return this.filteredDevis.filter(item => this.getEffectiveStatut(item) === 'DRAFT').length;
  }

  get rejectedCount(): number {
    return this.filteredDevis.filter(item => this.getEffectiveStatut(item) === 'REJECTED').length;
  }

  get convertedCount(): number {
    return this.filteredDevis.filter(item => this.getEffectiveStatut(item) === 'CONVERTED').length;
  }

  get acceptanceRate(): number {
    if (!this.totalDevis) {
      return 0;
    }

    return (this.acceptedCount / this.totalDevis) * 100;
  }

  loadDevis(): void {
    this.loading = true;
    this.errorMessage = '';

    this.devisService.getAll().subscribe({
      next: (list) => {
        this.devis = Array.isArray(list) ? list : [];
        this.loading = false;
      },
      error: () => {
        this.errorMessage = this.translate.instant('DEVIS.MSGS.LOADING_ERROR') || 'Impossible de charger les devis.';
        this.loading = false;
      }
    });
  }


  nouveauDevis(): void {
    this.router.navigate(['/devis', 'nouveau']);
  }

  voirDevis(id: number): void {
    this.router.navigate(['/devis', 'view', id]);
  }

  accepterDevis(id: number): void {
    this.devisService.accepter(id).subscribe({
      next: () => {
        this.loadDevis();
        this.errorMessage = '';
      },
      error: (error: any) => {
        this.errorMessage = error?.error?.message || this.translate.instant('DEVIS.MSGS.ACCEPT_ERROR', { id });
      }
    });
  }

  rejeterDevis(id: number): void {
    const raison = window.prompt(this.translate.instant('DEVIS.MSGS.REJECT_REASON_PROMPT') || 'Saisir la raison du rejet :');
    if (!raison || !raison.trim()) return;

    this.devisService.rejeter(id, raison.trim()).subscribe({
      next: () => {
        this.loadDevis();
        this.errorMessage = '';
      },
      error: (error: any) => {
        this.errorMessage = error?.error?.message || this.translate.instant('DEVIS.MSGS.REJECT_ERROR', { id });
      }
    });
  }

  convertirEnBC(id: number): void {
    const dateDocument = new Date().toISOString().slice(0, 10);
    this.devisService.convertirEnBonCommande(id, dateDocument).subscribe({
      next: () => {
        this.loadDevis();
        this.router.navigate(['/bons-commandes']);
      },
      error: (error: any) => {
        this.errorMessage = error?.error?.message || this.translate.instant('DEVIS.MSGS.CONVERT_ERROR', { id });
      }
    });
  }

  ouvrirConversionFacture(id: number): void {
    this.selectedDevisId = id;
    this.conversionForm.patchValue({
      dateDocument: new Date(),
      datePaiement: new Date()
    });
    this.displayConvertDialog = true;
  }

  confirmerConversionFacture(): void {
    if (this.conversionForm.invalid || !this.selectedDevisId) return;

    this.isConverting = true;
    const val = this.conversionForm.value;
    const dateDoc = this.formatDate(val.dateDocument);
    const datePay = this.formatDate(val.datePaiement);

    this.devisService.convertirEnFactureDirecte(
      this.selectedDevisId,
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

  private normalizeModePaiement(value?: string | null): 'VIREMENT' | 'CHEQUE' | 'ESPECES' | 'CARTE' {
    if (value === 'CHEQUE' || value === 'ESPECES' || value === 'CARTE' || value === 'VIREMENT') {
      return value as any;
    }
    return 'VIREMENT';
  }

  private formatDate(date: any): string {
    if (!date) return '';
    const d = new Date(date);
    return d.toISOString().split('T')[0];
  }

  canAccepterOuRejeter(item: Devis): boolean {
    return this.getEffectiveStatut(item) === 'SENT';
  }

  canConvertir(item: Devis): boolean {
    return this.getEffectiveStatut(item) === 'ACCEPTED';
  }

  modifierDevis(id: number): void {
    this.router.navigate(['/devis', 'nouveau'], { queryParams: { editId: id } });
  }

  envoyerDevis(id: number): void {
    this.devisService.envoyer(id).subscribe({
      next: () => {
        this.loadDevis();
        this.errorMessage = '';
      },
      error: (error: any) => {
        this.errorMessage = error?.error?.message || this.translate.instant('DEVIS.MSGS.SEND_ERROR', { id });
      }
    });
  }

  getEffectiveStatut(item: Devis): string {
    const backendStatut = item.statut || 'DRAFT';
    const finalStatuts = new Set(['ACCEPTED', 'REJECTED', 'CONVERTED', 'EXPIRED']);

    if (finalStatuts.has(backendStatut)) {
      return backendStatut;
    }

    // Frontend-only expiration for non-final statuses.
    const limite = this.getDateLimite(item);
    if (limite && Date.now() > limite.getTime()) {
      return 'EXPIRED';
    }

    return backendStatut;
  }

  isEnvoyable(item: Devis): boolean {
    return this.getEffectiveStatut(item) === 'DRAFT';
  }

  private getDateLimite(item: Devis): Date | null {
    const explicit = this.toValidDate(item.dateValidite || null);
    if (explicit) {
      return explicit;
    }

    const base = this.toValidDate(item.dateCreation || null);
    if (!base) {
      return null;
    }

    const fallback = new Date(base);
    fallback.setDate(fallback.getDate() + 30);
    return fallback;
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

  exporterCsv(): void {
    if (!this.devis.length) {
      return;
    }

    const headers = [
      'Numero',
      'Client',
      'DateEmission',
      'DateValidite',
      'TotalTTC',
      'Statut'
    ];

    const rows = this.devis.map(item => [
      this.formatDevisReference(item),
      item.acheteurNom,
      item.dateCreation,
      item.dateValidite ?? '',
      String(item.totalTTC ?? 0),
      item.statut
    ]);

    const csv = [headers, ...rows]
      .map(line => line.map(value => `"${String(value).replace(/"/g, '""')}"`).join(';'))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `devis-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  getStatutClass(statut: string): string {
    const map: Record<string, string> = {
      DRAFT: 'draft',
      SENT: 'sent',
      ACCEPTED: 'accepted',
      REJECTED: 'rejected',
      EXPIRED: 'expired',
      CONVERTED: 'converted'
    };

    return map[statut] || 'draft';
  }

  formatDevisReference(item: Devis): string {
    return formatDocumentReference('DEVIS', item.numDevis, item.dateCreation, item.id);
  }
}
