import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { DropdownModule } from 'primeng/dropdown';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { DemandeService } from '../../../core/services/demande.service';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';

@Component({
  selector: 'app-demandes-list',
  standalone: true,
  imports: [
    CommonModule, FormsModule, ButtonModule, InputTextModule,
    TableModule, TagModule, DropdownModule, ToastModule, RouterModule, TranslateModule,
    TooltipModule, ConfirmDialogModule
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './demandes-list.component.html',
  styleUrl: './demandes-list.component.scss'
})
export class DemandesListComponent implements OnInit {
  private demandeService = inject(DemandeService);
  private router = inject(Router);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);
  private translate = inject(TranslateService);

  demandes: any[] = [];
  filteredDemandes: any[] = [];
  isLoading = false;
  searchTerm = '';
  selectedStatus: string | null = null;

  statusOptions = [];

  ngOnInit(): void {
    // S'assurer que les traductions sont chargées avant d'initialiser les options
    this.translate.get('SUPER_ADMIN.REQUESTS.STATUS_ALL').subscribe(() => {
      this.initStatusOptions();
    });

    // Ré-initialiser les options si on change de langue
    this.translate.onLangChange.subscribe(() => {
      this.initStatusOptions();
    });

    this.loadDemandes();
  }

  private initStatusOptions(): void {
    this.statusOptions = [
      { label: this.translate.instant('SUPER_ADMIN.REQUESTS.STATUS_ALL') as string, value: null },
      { label: this.translate.instant('STATUS.PENDING') as string, value: 'REQUESTED' },
      { label: this.translate.instant('STATUS.APPROVED') as string, value: 'APPROVED' },
      { label: this.translate.instant('STATUS.REJECTED') as string, value: 'REJECTED' }
    ] as any;
  }

  loadDemandes(): void {
    this.isLoading = true;
    this.demandeService.getDemandes().subscribe({
      next: (data) => {
        this.demandes = data;
        this.applyFilters();
        this.isLoading = false;
      },
      error: (err) => {
        this.isLoading = false;
        this.messageService.add({
          severity: 'error',
          summary: this.translate.instant('TOAST.ERROR'),
          detail: this.translate.instant('SUPER_ADMIN.REQUESTS.MSGS.LOAD_ERROR') || 'Impossible de charger les demandes.'
        });
      }
    });
  }

  applyFilters(): void {
    this.filteredDemandes = this.demandes.filter(d => {
      const matchesSearch = !this.searchTerm ||
        d.raisonSociale?.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        d.email?.toLowerCase().includes(this.searchTerm.toLowerCase());
      
      let matchesStatus = !this.selectedStatus || d.status === this.selectedStatus;
      
      // Si on filtre par 'Approuvée', on inclut APPROVED et PENDING
      if (this.selectedStatus === 'APPROVED') {
        matchesStatus = d.status === 'APPROVED' || d.status === 'PENDING';
      }
      
      return matchesSearch && matchesStatus;
    });
  }

  onSearch(): void {
    this.applyFilters();
  }

  onStatusChange(): void {
    this.applyFilters();
  }

  viewDetails(id: number): void {
    this.router.navigate(['/super-admin/demandes', id]);
  }

  getStatusLabel(status: string): string {
    const map: Record<string, string> = {
      'REQUESTED': 'STATUS.PENDING',
      'PENDING': 'STATUS.APPROVED',
      'APPROVED': 'STATUS.APPROVED',
      'REJECTED': 'STATUS.REJECTED'
    };
    return this.translate.instant(map[status] || 'STATUS.UNKNOWN');
  }

  getStatusSeverity(status: string): 'warning' | 'success' | 'danger' | 'info' {
    const map: Record<string, 'warning' | 'success' | 'danger' | 'info'> = {
      'REQUESTED': 'warning',
      'PENDING': 'success',
      'APPROVED': 'success',
      'REJECTED': 'danger'
    };
    return map[status] || 'info';
  }

  isPending(status: string): boolean {
    return status === 'REQUESTED';
  }

  approveDemande(demande: any): void {
    this.confirmationService.confirm({
      header: this.translate.instant('SUPER_ADMIN.REQUESTS.CONFIRMATIONS.APPROVE_HEADER') as string,
      message: this.translate.instant('SUPER_ADMIN.REQUESTS.CONFIRMATIONS.APPROVE_MESSAGE', { company: demande.raisonSociale }) as string,
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: this.translate.instant('SUPER_ADMIN.REQUESTS.DETAIL.APPROVE') as string,
      rejectLabel: this.translate.instant('COMMON.CANCEL') as string,
      acceptButtonStyleClass: 'p-button-success',
      rejectButtonStyleClass: 'p-button-text p-button-secondary',
      accept: () => {
        this.isLoading = true;
        this.demandeService.approuverDemande(demande.id).subscribe({
          next: () => {
            this.messageService.add({
              severity: 'success',
              summary: this.translate.instant('SUPER_ADMIN.REQUESTS.CONFIRMATIONS.APPROVE_SUCCESS_TITLE') as string,
              detail: this.translate.instant('SUPER_ADMIN.REQUESTS.CONFIRMATIONS.APPROVE_SUCCESS_DETAIL') as string
            });
            this.loadDemandes();
          },
          error: (err) => {
            this.isLoading = false;
            this.messageService.add({
              severity: 'error',
              summary: 'Erreur',
              detail: 'Impossible d\'approuver la demande.'
            });
          }
        });
      }
    });
  }

  rejectDemande(demande: any): void {
    const reason = prompt(this.translate.instant('SUPER_ADMIN.REQUESTS.DETAIL.REJECT_REASON_PLACEHOLDER') as string);
    if (reason === null) return; // Annulé

    if (!reason.trim()) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Attention',
        detail: this.translate.instant('SUPER_ADMIN.REQUESTS.CONFIRMATIONS.REJECT_WARN_DETAIL') as string
      });
      return;
    }

    this.isLoading = true;
    this.demandeService.rejeterDemande(demande.id, reason).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: this.translate.instant('SUPER_ADMIN.REQUESTS.CONFIRMATIONS.REJECT_SUCCESS_TITLE') as string,
          detail: this.translate.instant('SUPER_ADMIN.REQUESTS.CONFIRMATIONS.REJECT_SUCCESS_DETAIL') as string
        });
        this.loadDemandes();
      },
      error: (err) => {
        this.isLoading = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Erreur',
          detail: 'Impossible de rejeter la demande.'
        });
      }
    });
  }
}
