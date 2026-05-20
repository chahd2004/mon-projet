import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { MessageService, ConfirmationService } from 'primeng/api';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { DemandeService } from '../../../core/services/demande.service';

@Component({
  selector: 'app-demande-detail',
  standalone: true,
  imports: [
    CommonModule, FormsModule, ButtonModule, CardModule,
    InputTextareaModule, ToastModule, ConfirmDialogModule, ProgressSpinnerModule,
    TranslateModule
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './demande-detail.component.html',
  styleUrl: './demande-detail.component.scss'
})
export class DemandeDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private demandeService = inject(DemandeService);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);
  private translate = inject(TranslateService);

  demande: any = null;
  isLoading = false;
  actionLoading = false;
  rejectionReason = '';
  showRejectionForm = false;

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadDetail(+id);
    }
  }

  loadDetail(id: number): void {
    this.isLoading = true;
    this.demandeService.getDemandeDetails(id).subscribe({
      next: (data) => {
        this.demande = data;
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
        this.messageService.add({
          severity: 'error', summary: this.translate.instant('TOAST.ERROR'),
          detail: this.translate.instant('SUPER_ADMIN.REQUESTS.DETAIL.MSGS.LOAD_ERROR') || 'Impossible de charger les détails de cette demande.'
        });
      }
    });
  }

  confirmerApprobation(): void {
    this.confirmationService.confirm({
      message: this.translate.instant('SUPER_ADMIN.REQUESTS.CONFIRMATIONS.APPROVE_MESSAGE', { company: this.demande?.raisonSociale }),
      header: this.translate.instant('SUPER_ADMIN.REQUESTS.CONFIRMATIONS.APPROVE_HEADER'),
      icon: 'pi pi-check-circle',
      acceptLabel: this.translate.instant('SUPER_ADMIN.REQUESTS.DETAIL.APPROVE'),
      rejectLabel: this.translate.instant('COMMON.CANCEL'),
      acceptButtonStyleClass: 'p-button-success',
      accept: () => this.approuver()
    });
  }

  approuver(): void {
    this.actionLoading = true;
    this.demandeService.approuverDemande(this.demande.id).subscribe({
      next: () => {
        this.actionLoading = false;
        this.demande.status = 'APPROVED';
        this.messageService.add({
          severity: 'success', summary: this.translate.instant('SUPER_ADMIN.REQUESTS.CONFIRMATIONS.APPROVE_SUCCESS_TITLE'),
          detail: this.translate.instant('SUPER_ADMIN.REQUESTS.CONFIRMATIONS.APPROVE_SUCCESS_DETAIL')
        });
        setTimeout(() => this.router.navigate(['/super-admin/demandes']), 2500);
      },
      error: (err) => {
        this.actionLoading = false;
        const msg = this.extractApiError(err, 'Erreur lors de l\'approbation.');
        this.messageService.add({ severity: 'error', summary: 'Erreur', detail: msg });
      }
    });
  }

  ouvrirRejet(): void {
    this.showRejectionForm = true;
    this.rejectionReason = '';
  }

  annulerRejet(): void {
    this.showRejectionForm = false;
    this.rejectionReason = '';
  }

  rejeter(): void {
    if (!this.rejectionReason.trim()) {
      this.messageService.add({
        severity: 'warn', summary: this.translate.instant('SUPER_ADMIN.REQUESTS.CONFIRMATIONS.REJECT_WARN_TITLE'),
        detail: this.translate.instant('SUPER_ADMIN.REQUESTS.CONFIRMATIONS.REJECT_WARN_DETAIL')
      });
      return;
    }
    this.actionLoading = true;
    this.demandeService.rejeterDemande(this.demande.id, this.rejectionReason).subscribe({
      next: () => {
        this.actionLoading = false;
        this.demande.status = 'REJECTED';
        this.showRejectionForm = false;
        this.messageService.add({
          severity: 'info', summary: this.translate.instant('SUPER_ADMIN.REQUESTS.CONFIRMATIONS.REJECT_SUCCESS_TITLE'),
          detail: this.translate.instant('SUPER_ADMIN.REQUESTS.CONFIRMATIONS.REJECT_SUCCESS_DETAIL')
        });
        setTimeout(() => this.router.navigate(['/super-admin/demandes']), 2500);
      },
      error: (err) => {
        this.actionLoading = false;
        const msg = this.extractApiError(err, 'Erreur lors du rejet.');
        this.messageService.add({ severity: 'error', summary: 'Erreur', detail: msg });
      }
    });
  }

  retourListe(): void {
    this.router.navigate(['/super-admin/demandes']);
  }

  getStatusLabel(): string {
    const status = this.demande?.status;
    const map: Record<string, string> = {
      'REQUESTED': 'STATUS.PENDING',
      'PENDING': 'STATUS.APPROVED',
      'APPROVED': 'STATUS.APPROVED',
      'REJECTED': 'STATUS.REJECTED'
    };
    const localized = this.translate.instant(map[status] || 'STATUS.UNKNOWN');
    return localized;
  }

  getStatusSeverity(): 'warning' | 'success' | 'danger' | 'info' {
    const map: Record<string, 'warning' | 'success' | 'danger' | 'info'> = {
      'REQUESTED': 'warning',
      'PENDING': 'success',
      'APPROVED': 'success',
      'REJECTED': 'danger'
    };
    return map[this.demande?.status] || 'info';
  }

  isPending(): boolean {
    return this.demande?.status === 'REQUESTED';
  }

  private extractApiError(err: any, fallback: string): string {
    const payload = err?.error;
    if (typeof payload === 'string' && payload.trim()) {
      return payload;
    }
    if (payload?.message) {
      return payload.message;
    }
    if (payload?.error) {
      return payload.error;
    }
    if (err?.message) {
      return err.message;
    }
    return fallback;
  }
}
