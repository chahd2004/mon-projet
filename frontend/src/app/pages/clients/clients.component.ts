// src/app/pages/clients/clients.component.ts
import { Component, OnInit, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

// PrimeNG Modules
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { InputTextModule } from 'primeng/inputtext';
import { DialogModule } from 'primeng/dialog';
import { DropdownModule } from 'primeng/dropdown';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService } from 'primeng/api';
import { ConfirmationService } from 'primeng/api';

import { ClientService } from '../../core/services/client.service';
import { AuthService } from '../../core/services/auth.service';
import { Client, ClientRequest, RegionTunisie } from '../../models/client.model';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-clients',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    ButtonModule,
    CardModule,
    ToastModule,
    ConfirmDialogModule,
    InputTextModule,
    DialogModule,
    DropdownModule,
    TooltipModule,
    TranslateModule
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './clients.component.html',
  styleUrls: ['./clients.component.scss']
})
export class ClientsComponent implements OnInit {
  private clientService = inject(ClientService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);
  private translate = inject(TranslateService);

  get isViewer(): boolean {
    return this.authService.hasRole('ENTREPRISE_VIEWER');
  }

  isReadOnly = computed(() => this.authService.hasRole('ENTREPRISE_VIEWER'));

  // Données
  clients: Client[] = [];
  clientsFiltered: Client[] = [];
  loading: boolean = false;

  // Pagination côté client
  page: number = 1;
  rowsPerPage: number = 10;
  rowsOptions: number[] = [10, 20, 50, 100];

  // Recherche
  searchText: string = '';

  // Dialog
  displayDialog: boolean = false;
  dialogMode: 'add' | 'edit' = 'add';
  selectedClient: Client | null = null;

  // Formulaire client (camelCase pour le backend)
  clientForm: Partial<ClientRequest> = {
    raisonSociale: '',
    email: '',
    telephone: '',
    adresseComplete: '',
    pays: 'TUNISIE',
    region: 'TUNIS'
  };

  // Liste des régions (valeurs backend RegionTunisie)
  regions: { label: string; value: RegionTunisie }[] = [
    { label: 'Tunis', value: 'TUNIS' },
    { label: 'Ariana', value: 'ARIANA' },
    { label: 'Ben Arous', value: 'BEN_AROUS' },
    { label: 'Manouba', value: 'MANOUBA' },
    { label: 'Nabeul', value: 'NABEUL' },
    { label: 'Zaghouan', value: 'ZAGHOUAN' },
    { label: 'Bizerte', value: 'BIZERTE' },
    { label: 'Béja', value: 'BEJA' },
    { label: 'Jendouba', value: 'JENDOUBA' },
    { label: 'Kef', value: 'KEF' },
    { label: 'Siliana', value: 'SILIANA' },
    { label: 'Sousse', value: 'SOUSSE' },
    { label: 'Monastir', value: 'MONASTIR' },
    { label: 'Mahdia', value: 'MAHDIA' },
    { label: 'Sfax', value: 'SFAX' },
    { label: 'Kairouan', value: 'KAIROUAN' },
    { label: 'Kasserine', value: 'KASSERINE' },
    { label: 'Sidi Bouzid', value: 'SIDI_BOUZID' },
    { label: 'Gabès', value: 'GABES' },
    { label: 'Medenine', value: 'MEDENINE' },
    { label: 'Tataouine', value: 'TATAOUINE' },
    { label: 'Gafsa', value: 'GAFSA' },
    { label: 'Tozeur', value: 'TOZEUR' },
    { label: 'Kebili', value: 'KEBILI' }
  ];

  ngOnInit(): void {
    this.loadClients();
  }

  loadClients(): void {
    this.loading = true;

    this.clientService.getClients().subscribe({
      next: (clients) => {
        this.clients = clients;
        this.applyFilter();
        this.loading = false;
      },
      error: (error: any) => {
        console.error('Erreur:', error);
        this.messageService.add({
          severity: 'error',
          summary: this.translate.instant('TOAST.ERROR'),
          detail: error?.error?.message || this.translate.instant('CLIENTS.MSGS.LOAD_ERROR')
        });
        this.loading = false;
      }
    });
  }

  applyFilter(): void {
    const search = (this.searchText || '').toLowerCase().trim();
    let result = search
      ? this.clients.filter(c =>
        (c.raisonSociale || '').toLowerCase().includes(search) ||
        (c.email || '').toLowerCase().includes(search) ||
        (c.telephone || '').includes(search))
      : [...this.clients];

    // Tri par raison sociale alphabétique par défaut
    this.clientsFiltered = result.sort((a, b) => 
      (a.raisonSociale || '').localeCompare(b.raisonSociale || '')
    );
  }

  loadClientsLazy(event: any): void {
    this.page = (event.first / event.rows) + 1;
    this.rowsPerPage = event.rows;
  }

  onPageChange(event: any): void {
    this.page = event.page + 1;
    this.rowsPerPage = event.rows;
  }

  onSearch(): void {
    this.page = 1;
    this.applyFilter();
  }

  clearSearch(): void {
    this.searchText = '';
    this.onSearch();
  }

  ajouterClient(): void {
    if (this.isViewer) {
      return;
    }

    this.dialogMode = 'add';
    this.selectedClient = null;
    this.resetForm();
    this.displayDialog = true;
  }

  modifierClient(client: Client): void {
    if (this.isViewer) {
      return;
    }

    this.dialogMode = 'edit';
    this.selectedClient = client;
    this.clientForm = {
      raisonSociale: client.raisonSociale,
      email: client.email,
      telephone: client.telephone,
      adresseComplete: client.adresseComplete,
      pays: client.pays || 'TUNISIE',
      region: (client.region as RegionTunisie) || 'TUNIS'
    };
    this.displayDialog = true;
  }

  resetForm(): void {
    this.clientForm = {
      raisonSociale: '',
      email: '',
      telephone: '',
      adresseComplete: '',
      pays: 'TUNISIE',
      region: 'TUNIS'
    };
  }

  sauvegarderClient(): void {
    if (this.isViewer) {
      return;
    }

    if (!this.clientForm.raisonSociale?.trim() || !this.clientForm.email?.trim() || !this.clientForm.telephone?.trim()) {
      this.messageService.add({
        severity: 'warn',
        summary: this.translate.instant('TOAST.WARN'),
        detail: this.translate.instant('CLIENTS.MSGS.VALIDATION_REQUIRED')
      });
      return;
    }
    if (!/^[0-9]{8}$/.test(this.clientForm.telephone)) {
      this.messageService.add({
        severity: 'warn',
        summary: this.translate.instant('TOAST.WARN'),
        detail: this.translate.instant('CLIENTS.MSGS.VALIDATION_PHONE')
      });
      return;
    }
    if (!this.clientForm.adresseComplete?.trim()) {
      this.messageService.add({
        severity: 'warn',
        summary: this.translate.instant('TOAST.WARN'),
        detail: this.translate.instant('CLIENTS.MSGS.VALIDATION_ADDRESS')
      });
      return;
    }
    if (!this.clientForm.region) {
      this.messageService.add({
        severity: 'warn',
        summary: this.translate.instant('TOAST.WARN'),
        detail: this.translate.instant('CLIENTS.MSGS.VALIDATION_REGION')
      });
      return;
    }

    this.loading = true;
    const request: ClientRequest = {
      code: this.generateClientCode(),
      raisonSociale: this.clientForm.raisonSociale!.trim(),
      email: this.clientForm.email!.trim(),
      telephone: this.clientForm.telephone!.trim(),
      adresseComplete: this.clientForm.adresseComplete!.trim(),
      pays: this.clientForm.pays || 'TUNISIE',
      region: this.clientForm.region!
    };

    if (this.dialogMode === 'add') {
      this.clientService.createClient(request).subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: this.translate.instant('TOAST.SUCCESS'),
            detail: this.translate.instant('CLIENTS.MSGS.SAVE_SUCCESS_ADD')
          });
          this.displayDialog = false;
          this.loadClients();
        },
        error: (error: any) => {
          console.error('Erreur:', error);
          const msg = error?.error?.message || error?.error?.error || (error?.status === 403 ? 'Accès refusé' : this.translate.instant('CLIENTS.MSGS.SAVE_ERROR_ADD'));
          this.messageService.add({
            severity: 'error',
            summary: this.translate.instant('TOAST.ERROR'),
            detail: msg
          });
          this.loading = false;
        }
      });
    } else if (this.selectedClient) {
      this.clientService.updateClient(this.selectedClient.id, request).subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: this.translate.instant('TOAST.SUCCESS'),
            detail: this.translate.instant('CLIENTS.MSGS.SAVE_SUCCESS_EDIT')
          });
          this.displayDialog = false;
          this.loadClients();
        },
        error: (error: any) => {
          console.error('Erreur:', error);
          this.messageService.add({
            severity: 'error',
            summary: this.translate.instant('TOAST.ERROR'),
            detail: this.translate.instant('CLIENTS.MSGS.SAVE_ERROR_EDIT')
          });
          this.loading = false;
        }
      });
    }
  }

  supprimerClient(id: number): void {
    if (this.isViewer) {
      return;
    }

    this.confirmationService.confirm({
      message: this.translate.instant('CLIENTS.MSGS.DELETE_CONFIRM'),
      header: this.translate.instant('TOAST.CONFIRMATION'),
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.clientService.deleteClient(id).subscribe({
          next: () => {
            this.messageService.add({
              severity: 'success',
              summary: this.translate.instant('TOAST.SUCCESS'),
              detail: this.translate.instant('CLIENTS.MSGS.DELETE_SUCCESS')
            });
            this.loadClients();
          },
          error: (error: any) => {
            console.error('Erreur:', error);
            this.messageService.add({
              severity: 'error',
              summary: this.translate.instant('TOAST.ERROR'),
              detail: this.translate.instant('CLIENTS.MSGS.DELETE_ERROR')
            });
          }
        });
      }
    });
  }

  voirDetails(id: number): void {
    this.router.navigate(['/clients', id]);
  }

  voirFactures(clientId: number): void {
    this.router.navigate(['/clients', clientId, 'factures']);
  }

  private generateClientCode(): string {
    return `CL-${Date.now().toString().slice(-8)}`;
  }
}