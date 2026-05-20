// src/app/pages/clients/clients.component.ts
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';

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
import { getHttpErrorMessage } from '../../core/utils/http-error.util';
import { Client, ClientRequest, RegionTunisie } from '../../models/client.model';

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
    TooltipModule
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './clients.component.html',
  styleUrls: ['./clients.component.scss']
})
export class ClientsComponent implements OnInit {
  private clientService = inject(ClientService);
  private router = inject(Router);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);

  // Données
  clients: Client[] = [];
  clientsFiltered: Client[] = [];
  loading: boolean = false;
  
  // Pagination côté client
  page: number = 1;
  rowsPerPage: number = 10;
  
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
      error: (error) => {
        console.error('Erreur:', error);
        this.loading = false;
        const msg = getHttpErrorMessage(error, 'Impossible de charger les clients');
        this.messageService.add({
          severity: 'error',
          summary: 'Erreur',
          detail: msg
        });
        // En cas de 403 (réponse brute ou erreur transformée par l'intercepteur), rediriger
        const is403 = (error instanceof HttpErrorResponse && error.status === 403) ||
          (error instanceof Error && error.message?.includes('Accès non autorisé'));
        if (is403) {
          this.router.navigate(['/dashboard']);
        }
      }
    });
  }

  applyFilter(): void {
    const search = (this.searchText || '').toLowerCase().trim();
    this.clientsFiltered = search
      ? this.clients.filter(c =>
          (c.raisonSociale || '').toLowerCase().includes(search) ||
          (c.email || '').toLowerCase().includes(search) ||
          (c.telephone || '').includes(search))
      : [...this.clients];
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
    this.dialogMode = 'add';
    this.selectedClient = null;
    this.resetForm();
    this.displayDialog = true;
  }

  modifierClient(client: Client): void {
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
    if (!this.clientForm.raisonSociale?.trim() || !this.clientForm.email?.trim() || !this.clientForm.telephone?.trim()) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Validation',
        detail: 'Champs obligatoires: Raison sociale, Email, Téléphone (8 chiffres)'
      });
      return;
    }
    if (!/^[0-9]{8}$/.test(this.clientForm.telephone)) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Validation',
        detail: 'Le téléphone doit contenir exactement 8 chiffres'
      });
      return;
    }
    if (!this.clientForm.adresseComplete?.trim()) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Validation',
        detail: 'L\'adresse est obligatoire'
      });
      return;
    }
    if (!this.clientForm.region) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Validation',
        detail: 'La région est obligatoire'
      });
      return;
    }

    this.loading = true;
    const request: ClientRequest = {
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
            summary: 'Succès',
            detail: 'Client ajouté'
          });
          this.displayDialog = false;
          this.loadClients();
        },
        error: (error) => {
          console.error('Erreur:', error);
          const msg = error?.error?.message || error?.error?.error || (error?.status === 403 ? 'Accès refusé : droits insuffisants' : 'Impossible d\'ajouter le client');
          this.messageService.add({
            severity: 'error',
            summary: 'Erreur',
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
            summary: 'Succès',
            detail: 'Client modifié'
          });
          this.displayDialog = false;
          this.loadClients();
        },
        error: (error) => {
          console.error('Erreur:', error);
          this.messageService.add({
            severity: 'error',
            summary: 'Erreur',
            detail: 'Impossible de modifier le client'
          });
          this.loading = false;
        }
      });
    }
  }

  supprimerClient(id: number): void {
    this.confirmationService.confirm({
      message: 'Supprimer ce client ?',
      header: 'Confirmation',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Oui',
      rejectLabel: 'Non',
      accept: () => {
        this.clientService.deleteClient(id).subscribe({
          next: () => {
            this.messageService.add({
              severity: 'success',
              summary: 'Succès',
              detail: 'Client supprimé'
            });
            this.loadClients();
          },
          error: (error) => {
            console.error('Erreur:', error);
            this.messageService.add({
              severity: 'error',
              summary: 'Erreur',
              detail: 'Impossible de supprimer'
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
}