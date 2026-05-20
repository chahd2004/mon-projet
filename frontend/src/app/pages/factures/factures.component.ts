// src/app/pages/factures/factures.component.ts
import { Component, OnInit, inject, OnDestroy, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { DropdownModule } from 'primeng/dropdown';
import { CalendarModule } from 'primeng/calendar';
import { InputTextModule } from 'primeng/inputtext';
import { ChartModule } from 'primeng/chart';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { DialogModule } from 'primeng/dialog';
import { MessageService, ConfirmationService } from 'primeng/api';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { SignatureComponent } from '../../components/signature/signature.component';

import { FactureService } from '../../core/services/facture.service';
import { AuthService } from '../../core/services/auth.service';
import { ErrorHandlerService } from '../../core/services/error-handler.service';
import { FactureRefreshService } from '../../core/services/facture-refresh.service';
import { Facture, StatutFacture } from '../../models/facture.model';

@Component({
  selector: 'app-factures',
  standalone: true,
  imports: [
    CommonModule, FormsModule, TableModule, ButtonModule, CardModule,
    ToastModule, ConfirmDialogModule, TagModule, TooltipModule,
    DropdownModule, CalendarModule, InputTextModule, ChartModule,
    ProgressSpinnerModule, TranslateModule, DialogModule,
    SignatureComponent
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './factures.component.html',
  styleUrls: ['./factures.component.scss']
})
export class FacturesComponent implements OnInit, OnDestroy {
  private factureService = inject(FactureService);
  private authService = inject(AuthService);
  private errorHandler = inject(ErrorHandlerService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);
  private translate = inject(TranslateService);
  private factureRefresh = inject(FactureRefreshService);
  private destroy$ = new Subject<void>();

  get isViewer(): boolean {
    return this.authService.hasRole('ENTREPRISE_VIEWER');
  }

  isReadOnly = computed(() => this.authService.hasRole('ENTREPRISE_VIEWER'));

  factures: Facture[] = [];
  totalRecords: number = 0;
  loading: boolean = false;
  loadingStats: boolean = false;

  page: number = 1;
  rowsPerPage: number = 10;
  rowsOptions: number[] = [10, 20, 50, 100];

  statutFilter: string = '';
  searchText: string = '';
  dateDebut: Date | null = null;
  dateFin: Date | null = null;

  statuts = [...Object.values(StatutFacture)];
  stats: any = {};

  // Signature Modal
  showSignatureModal = false;
  currentFactureId: number | null = null;

  ngOnInit(): void {
    // Lire le filtre depuis les queryParams
    const filter = this.route.snapshot.queryParamMap.get('filter');
    if (filter) {
      this.statutFilter = filter;
    }

    this.loadFactures();
    this.loadStatistiques();

    // S'abonner aux notifications de refresh (nouvelle facture créée/modifiée)
    this.factureRefresh.refresh$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.page = 1; // Réinitialiser à la première page
        this.loadFactures();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }



  loadFactures(): void {
    this.loading = true;
    this.factureService.getFactures(this.page, this.rowsPerPage, this.statutFilter, this.searchText).subscribe({
      next: (response) => {
        this.factures = response.data;
        this.totalRecords = response.total;
        this.loading = false;
      },
      error: (err: any) => {
        this.messageService.add({ 
          severity: 'error', 
          summary: this.translate.instant('TOAST.ERROR'), 
          detail: this.errorHandler.extractErrorMessage(err) 
        });
        this.loading = false;
      }
    });
  }

  loadFacturesLazy(event: any): void {
    this.page = (event.first / event.rows) + 1;
    this.rowsPerPage = event.rows;
    this.loadFactures();
  }

  loadStatistiques(): void {
    this.loadingStats = true;
    this.factureService.getStatistiques().subscribe({
      next: (stats) => { this.stats = stats; this.loadingStats = false; },
      error: () => { this.loadingStats = false; }
    });
  }



  onPageChange(event: any): void {
    // Gardé par précaution mais loadFacturesLazy est privilégié
    this.page = event.page + 1;
    this.rowsPerPage = event.rows;
    this.loadFactures();
  }

  onSearch(): void { this.page = 1; this.loadFactures(); }
  applyFilters(): void { this.page = 1; this.loadFactures(); }

  resetFilters(): void {
    this.statutFilter = '';
    this.searchText = '';
    this.dateDebut = null;
    this.dateFin = null;
    this.page = 1;
    this.loadFactures();
  }

  getStatutSeverity(statut: string): 'success' | 'info' | 'warning' | 'danger' | 'secondary' {
    const map: Record<string, any> = {
      [StatutFacture.PAID]: 'success',
      [StatutFacture.SIGNED]: 'success',
      [StatutFacture.SENT]: 'info',
      [StatutFacture.DRAFT]: 'warning',
      [StatutFacture.REJECTED]: 'danger',
      [StatutFacture.CANCELLED]: 'secondary'
    };
    return map[statut] ?? 'info';
  }

  formatStatut(statut: string): string {
    if (!statut) return '';
    return this.translate.instant('STATUS.' + statut);
  }

  // ===== NAVIGATION CORRIGÉE =====
  voirFacture(id: number): void {
    this.router.navigate(['/factures', id]);
  }

  modifierFacture(id: number): void {
    this.router.navigate(['/factures', id], { queryParams: { mode: 'edit' } });
  }

  nouvelleFacture(): void {
    this.router.navigate(['/factures', 'nouvelle']);
  }

  signerFacture(id: number): void {
    this.currentFactureId = id;
    this.showSignatureModal = true;
  }

  closeSignatureModal(): void {
    this.showSignatureModal = false;
    this.currentFactureId = null;
    this.loadFactures(); // Refresh list after signature
  }

  supprimerFacture(id: number): void {
    this.confirmationService.confirm({
      message: this.translate.instant('FACTURES.MSGS.DELETE_CONFIRM'),
      header: this.translate.instant('TOAST.CONFIRMATION'),
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.factureService.deleteFacture(id).subscribe({
          next: () => {
            this.messageService.add({ 
              severity: 'success', 
              summary: this.translate.instant('TOAST.SUCCESS'), 
              detail: this.translate.instant('FACTURES.MSGS.DELETE_SUCCESS') 
            });
            this.loadFactures();
          },
          error: () => {
            this.messageService.add({ 
              severity: 'error', 
              summary: this.translate.instant('TOAST.ERROR'), 
              detail: this.translate.instant('FACTURES.MSGS.DELETE_ERROR') 
            });
          }
        });
      }
    });
  }

  emettreFacture(id: number): void {
    this.factureService.envoyerFacture(id).subscribe({
      next: () => {
        this.messageService.add({ 
          severity: 'success', 
          summary: this.translate.instant('TOAST.SUCCESS'), 
          detail: this.translate.instant('FACTURES.MSGS.EMIT_SUCCESS') 
        });
        this.loadFactures();
      },
      error: (err: any) => this.messageService.add({ 
        severity: 'error', 
        summary: this.translate.instant('TOAST.ERROR'), 
        detail: this.errorHandler.extractErrorMessage(err) 
      })
    });
  }

  payerFacture(id: number): void {
    this.factureService.marquerPayee(id).subscribe({
      next: () => {
        this.messageService.add({ 
          severity: 'success', 
          summary: this.translate.instant('TOAST.SUCCESS'), 
          detail: this.translate.instant('FACTURES.MSGS.PAY_SUCCESS') 
        });
        this.loadFactures();
      },
      error: (err: any) => this.messageService.add({ 
        severity: 'error', 
        summary: this.translate.instant('TOAST.ERROR'), 
        detail: this.errorHandler.extractErrorMessage(err) 
      })
    });
  }

  rejeterFacture(id: number): void {
    const raison = window.prompt(this.translate.instant('FACTURES.MSGS.REJECT_REASON_REQ') + ' :');
    if (!raison || raison.trim() === '') {
      this.messageService.add({ 
        severity: 'warn', 
        summary: this.translate.instant('TOAST.WARN'), 
        detail: this.translate.instant('FACTURES.MSGS.REJECT_REASON_REQ') 
      });
      return;
    }

    this.factureService.rejeterFacture(id, raison).subscribe({
      next: () => {
        this.messageService.add({ 
          severity: 'success', 
          summary: this.translate.instant('TOAST.SUCCESS'), 
          detail: this.translate.instant('FACTURES.MSGS.REJECT_SUCCESS') 
        });
        this.loadFactures();
      },
      error: (err: any) => this.messageService.add({ 
        severity: 'error', 
        summary: this.translate.instant('TOAST.ERROR'), 
        detail: this.errorHandler.extractErrorMessage(err) 
      })
    });
  }

  annulerFacture(id: number): void {
    this.confirmationService.confirm({
      message: this.translate.instant('FACTURES.MSGS.CANCEL_CONFIRM'),
      header: this.translate.instant('TOAST.CONFIRMATION'),
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.factureService.annulerFacture(id).subscribe({
          next: () => {
            this.messageService.add({ 
              severity: 'success', 
              summary: this.translate.instant('TOAST.SUCCESS'), 
              detail: this.translate.instant('FACTURES.MSGS.CANCEL_SUCCESS') 
            });
            this.loadFactures();
          },
          error: (err: any) => this.messageService.add({ 
            severity: 'error', 
            summary: this.translate.instant('TOAST.ERROR'), 
            detail: this.errorHandler.extractErrorMessage(err) 
          })
        });
      }
    });
  }

  retourBrouillon(id: number): void {
    this.factureService.retourBrouillon(id).subscribe({
      next: () => {
        this.messageService.add({ 
          severity: 'info', 
          summary: this.translate.instant('TOAST.INFO'), 
          detail: this.translate.instant('FACTURES.MSGS.DRAFT_SUCCESS') 
        });
        this.loadFactures();
      },
      error: (err: any) => this.messageService.add({ 
        severity: 'error', 
        summary: this.translate.instant('TOAST.ERROR'), 
        detail: this.errorHandler.extractErrorMessage(err) 
      })
    });
  }

  telechargerXml(id: number): void {
    this.factureService.downloadXml(id).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `facture-${id}.xml`;
        a.click();
        window.URL.revokeObjectURL(url);
        this.messageService.add({ 
          severity: 'success', 
          summary: this.translate.instant('TOAST.SUCCESS'), 
          detail: this.translate.instant('FACTURES.MSGS.DOWNLOAD_SUCCESS') 
        });
      },
      error: (err: any) => this.messageService.add({ 
        severity: 'error', 
        summary: this.translate.instant('TOAST.ERROR'), 
        detail: this.translate.instant('FACTURES.MSGS.DOWNLOAD_ERROR') 
      })
    });
  }
}