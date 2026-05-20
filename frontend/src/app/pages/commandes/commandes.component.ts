import { Component, OnInit, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { CommandeService } from '../../core/services/commande.service';
import { BonCommandeService } from '../../core/services/bon-commande.service';
import { BonCommande } from '../../models/bon-commande.model';
import { AuthService } from '../../core/services/auth.service';
import { formatDocumentReference } from '../../shared/utils/reference-format.util';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

interface CommandeView {
  sourceId: number;
  numero: string;
  client: string;
  dateCommande: string;
  totalTTC: number;
  statut: 'DRAFT' | 'CONFIRMED' | 'IN_PROGRESS' | 'DELIVERED' | 'CANCELLED';
}

@Component({
  selector: 'app-commandes',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  templateUrl: './commandes.component.html',
  styleUrls: ['./commandes.component.scss']
})
export class CommandesComponent implements OnInit {
  private readonly commandeService = inject(CommandeService);
  private readonly bonCommandeService = inject(BonCommandeService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly translate = inject(TranslateService);

  loading = false;
  showStats = true;
  errorMessage = '';
  successMessage = '';

  searchTerm = '';
  selectedStatus: 'ALL' | string = 'ALL';

  displayConvertModal = false;
  converting = false;
  conversionSearch = '';
  selectedBCId: number | null = null;

  rawCommandes: any[] = [];
  bonCommandesDisponibles: BonCommande[] = [];
  chargementBCs = false;

  get isViewer(): boolean {
    return this.authService.hasRole('ENTREPRISE_VIEWER');
  }

  isReadOnly = computed(() => this.authService.hasRole('ENTREPRISE_VIEWER'));

  get commandes(): CommandeView[] {
    return this.rawCommandes.map(item => ({
      sourceId: item.id,
      numero: this.formatCommandeReference(item),
      client: item.acheteurNom || '-',
      dateCommande: item.dateCreation,
      totalTTC: item.totalTTC || 0,
      statut: this.toCommandeStatus(item.statut)
    }));
  }

  get availableStatuses(): string[] {
    return ['DRAFT', 'CONFIRMED', 'IN_PROGRESS', 'DELIVERED', 'CANCELLED'];
  }

  get filteredCommandes(): CommandeView[] {
    const term = this.searchTerm.trim().toLowerCase();

    return this.commandes.filter(item => {
      const statusOk = this.selectedStatus === 'ALL' || item.statut === this.selectedStatus;
      if (!statusOk) {
        return false;
      }

      if (!term) {
        return true;
      }

      return (
        item.numero.toLowerCase().includes(term) ||
        item.client.toLowerCase().includes(term)
      );
    });
  }

  get totalCommandes(): number {
    return this.commandes.length;
  }

  get totalMontant(): number {
    return this.commandes.reduce((sum, item) => sum + item.totalTTC, 0);
  }

  get deliveryRate(): number {
    if (!this.totalCommandes) {
      return 0;
    }

    const delivered = this.commandes.filter(item => item.statut === 'DELIVERED').length;
    return (delivered / this.totalCommandes) * 100;
  }

  get statusStats(): Array<{ status: string; count: number }> {
    const counts = new Map<string, number>();
    for (const item of this.commandes) {
      counts.set(item.statut, (counts.get(item.statut) || 0) + 1);
    }

    const order: Record<string, number> = {
      DRAFT: 1,
      CONFIRMED: 2,
      IN_PROGRESS: 3,
      DELIVERED: 4
    };

    return Array.from(counts.entries())
      .map(([status, count]) => ({ status, count }))
      .sort((a, b) => (order[a.status] || 99) - (order[b.status] || 99));
  }

  ngOnInit(): void {
    this.loadCommandes();
  }

  loadCommandes(): void {
    this.loading = true;
    this.errorMessage = '';

    this.commandeService.getAll().subscribe({
      next: (list) => {
        console.log('Commandes loaded:', list);
        this.rawCommandes = Array.isArray(list) ? list : [];
        console.log('Filtered commandes:', this.rawCommandes);
        this.loading = false;
      },
      error: (error) => {
        this.loading = false;
        console.error('Erreur lors du chargement des commandes:', error);
        this.errorMessage = error?.error?.message || this.translate.instant('COMMANDES.MSGS.LOADING_ERROR') || 'Impossible de charger les commandes.';
      }
    });
  }

  depuisBC(): void {
    this.openConvertModal();
  }

  openConvertModal(): void {
    this.displayConvertModal = true;
    this.conversionSearch = '';
    this.selectedBCId = null;
    this.errorMessage = '';
    this.successMessage = '';

    this.chargementBCs = true;
    this.bonCommandeService.getAll().subscribe({
      next: (list) => {
        this.bonCommandesDisponibles = Array.isArray(list) ? list : [];
        this.chargementBCs = false;
      },
      error: () => {
        this.errorMessage = this.translate.instant('COMMANDES.CONVERT_MODAL.LOAD_ERROR') || 'Impossible de charger les bons de commande.';
        this.chargementBCs = false;
      }
    });
  }

  closeConvertModal(): void {
    this.displayConvertModal = false;
    this.conversionSearch = '';
    this.selectedBCId = null;
  }

  get confirmedBonCommandes(): BonCommande[] {
    return this.bonCommandesDisponibles.filter(item => (item.statut || '').toUpperCase() === 'CONFIRMED');
  }

  get filteredConfirmedBonCommandes(): BonCommande[] {
    const term = this.conversionSearch.trim().toLowerCase();
    if (!term) {
      return this.confirmedBonCommandes;
    }

    return this.confirmedBonCommandes.filter(item => {
      const numero = (item.numBonCommande || '').toLowerCase();
      const formattedNumero = this.formatBonCommandeReference(item).toLowerCase();
      const client = (item.acheteurNom || '').toLowerCase();
      return numero.includes(term) || formattedNumero.includes(term) || client.includes(term);
    });
  }

  convertirBCSelectionne(): void {
    if (!this.selectedBCId) {
      this.errorMessage = this.translate.instant('COMMANDES.CONVERT_MODAL.SELECT_REQUIRED');
      return;
    }

    this.converting = true;
    this.errorMessage = '';
    this.successMessage = '';

    const dateDocument = new Date().toISOString().slice(0, 10);

    this.bonCommandeService.convertirEnCommande(this.selectedBCId, dateDocument).subscribe({
      next: () => {
        this.converting = false;
        this.closeConvertModal();
        this.successMessage = this.translate.instant('COMMANDES.CONVERT_MODAL.SUCCESS');
        this.loadCommandes();
      },
      error: (error: any) => {
        this.converting = false;
        this.errorMessage =
          error?.error?.message ||
          error?.error?.error ||
          this.translate.instant('COMMANDES.CONVERT_MODAL.ERROR');
      }
    });
  }


  exporter(): void {
    const data = this.filteredCommandes;
    if (!data.length) {
      return;
    }

    const headers = ['Numero', 'Client', 'DateCommande', 'TotalTTC', 'Statut'];

    const rows = data.map(item => [
      item.numero,
      item.client,
      item.dateCommande || '',
      String(item.totalTTC),
      item.statut
    ]);

    const csv = [headers, ...rows]
      .map(line => line.map(value => `"${String(value).replace(/"/g, '""')}"`).join(';'))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `commandes-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  voirCommande(item: CommandeView): void {
    this.router.navigate(['/commandes/view', item.sourceId]);
  }

  confirmerCommande(item: CommandeView): void {
    const id = item.sourceId;
    this.commandeService.confirmer(id).subscribe({
      next: () => {
        this.successMessage = this.translate.instant('COMMANDES.MSGS.CONFIRM_SUCCESS', { id: item.numero });
        this.loadCommandes();
      },
      error: (error: any) => {
        this.errorMessage = error?.error?.message || this.translate.instant('COMMANDES.MSGS.CONFIRM_ERROR', { id: item.numero });
      }
    });
  }

  demarrerProduction(item: CommandeView): void {
    const id = item.sourceId;
    this.commandeService.demarrer(id).subscribe({
      next: () => {
        this.successMessage = this.translate.instant('COMMANDES.MSGS.START_PROD_SUCCESS', { id: item.numero });
        this.loadCommandes();
      },
      error: (error: any) => {
        this.errorMessage = error?.error?.message || this.translate.instant('COMMANDES.MSGS.START_PROD_ERROR', { id: item.numero });
      }
    });
  }

  livrerCommande(item: CommandeView): void {
    const id = item.sourceId;
    this.commandeService.marquerLivree(id).subscribe({
      next: () => {
        this.successMessage = this.translate.instant('COMMANDES.MSGS.DELIVER_SUCCESS', { id: item.numero });
        this.loadCommandes();
      },
      error: (error: any) => {
        this.errorMessage = error?.error?.message || this.translate.instant('COMMANDES.MSGS.DELIVER_ERROR', { id: item.numero });
      }
    });
  }

  annulerCommande(item: CommandeView): void {
    const id = item.sourceId;
    const raison = prompt(this.translate.instant('COMMANDES.MSGS.CANCEL_REASON_PROMPT'));
    if (!raison || raison.trim() === '') return;

    this.commandeService.annuler(id, raison).subscribe({
      next: () => {
        this.successMessage = this.translate.instant('COMMANDES.MSGS.CANCEL_SUCCESS', { id: item.numero });
        this.loadCommandes();
      },
      error: (error: any) => {
        this.errorMessage = error?.error?.message || this.translate.instant('COMMANDES.MSGS.CANCEL_ERROR', { id: item.numero });
      }
    });
  }

  supprimerCommande(item: CommandeView): void {
    if (!confirm(this.translate.instant('COMMANDES.MSGS.DELETE_CONFIRM'))) return;

    this.commandeService.delete(item.sourceId).subscribe({
      next: () => {
        this.loadCommandes();
        this.successMessage = this.translate.instant('COMMANDES.MSGS.DELETE_SUCCESS');
      },
      error: (error: any) => {
        this.errorMessage = error?.error?.message || this.translate.instant('COMMANDES.MSGS.DELETE_ERROR');
      }
    });
  }

  canConfirm(item: CommandeView): boolean {
    return item.statut === 'DRAFT';
  }

  canStartProduction(item: CommandeView): boolean {
    return item.statut === 'CONFIRMED';
  }

  canDeliver(item: CommandeView): boolean {
    return item.statut === 'IN_PROGRESS';
  }

  canCancel(item: CommandeView): boolean {
    return ['DRAFT', 'CONFIRMED', 'IN_PROGRESS'].includes(item.statut);
  }

  totalByStatus(status: string): number {
    return this.commandes.filter(item => item.statut === status).length;
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

  getStatusClass(status: string): string {
    const map: Record<string, string> = {
      DRAFT: 'draft',
      CONFIRMED: 'confirmed',
      IN_PROGRESS: 'in-progress',
      DELIVERED: 'delivered',
      CANCELLED: 'cancelled'
    };

    return map[status] || 'draft';
  }

  getStatusLabel(status: string): string {
    const map: Record<string, string> = {
      DRAFT: 'DRAFT',
      CONFIRMED: 'CONFIRMED',
      IN_PROGRESS: 'IN_PROGRESS',
      DELIVERED: 'DELIVERED',
      CANCELLED: 'CANCELLED'
    };

    const key = map[status] || status;
    return this.translate.instant('STATUS.' + key);
  }

  formatBonCommandeReference(item: BonCommande): string {
    return formatDocumentReference('BC', item.numBonCommande, item.dateCreation, item.id);
  }

  private formatCommandeReference(item: any): string {
    return formatDocumentReference('CMD', item.numBonCommande || item.numero, item.dateCreation, item.id);
  }
}
