// src/app/pages/factures/factures.component.ts
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

// PrimeNG Modules
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
import { MessageService } from 'primeng/api';
import { ConfirmationService } from 'primeng/api';

import { FactureService } from '../../core/services/facture.service';
import { getHttpErrorMessage } from '../../core/utils/http-error.util';
import { Facture, StatutFacture } from '../../models/facture.model';

@Component({
  selector: 'app-factures',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    ButtonModule,
    CardModule,
    ToastModule,
    ConfirmDialogModule,
    TagModule,
    TooltipModule,
    DropdownModule,
    CalendarModule,
    InputTextModule,
    ChartModule,
    ProgressSpinnerModule
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './factures.component.html',
  styleUrls: ['./factures.component.scss']
})
export class FacturesComponent implements OnInit {
  private factureService = inject(FactureService);
  private router = inject(Router);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);

  // Données
  factures: Facture[] = [];
  totalRecords: number = 0;
  loading: boolean = false;
  loadingStats: boolean = false;
  
  // Pagination
  page: number = 1;
  rowsPerPage: number = 10;
  
  // Filtres
  statutFilter: string = '';
  searchText: string = '';
  dateDebut: Date | null = null;
  dateFin: Date | null = null;
  
  // Options pour les filtres
  statuts = Object.values(StatutFacture);
  
  // Statistiques
  stats: any = {};
  chartData: any;
  chartOptions: any;

  ngOnInit(): void {
    this.loadFactures();
    this.loadStatistiques();
    this.initChart();
  }

  /**
   * Initialise le graphique
   */
  initChart(): void {
    this.chartOptions = {
      plugins: {
        legend: {
          labels: {
            color: '#495057'
          }
        }
      },
      scales: {
        x: {
          ticks: {
            color: '#495057'
          },
          grid: {
            color: '#ebedef'
          }
        },
        y: {
          ticks: {
            color: '#495057'
          },
          grid: {
            color: '#ebedef'
          }
        }
      }
    };
  }

  /**
   * Charge la liste des factures
   */
  loadFactures(): void {
    this.loading = true;
    
    this.factureService.getFactures(this.page, this.rowsPerPage, this.statutFilter, this.searchText).subscribe({
      next: (response) => {
        this.factures = response.data;
        this.totalRecords = response.total;
        this.loading = false;
      },
      error: (error) => {
        console.error('Erreur lors du chargement des factures:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Erreur',
          detail: getHttpErrorMessage(error, 'Impossible de charger la liste des factures')
        });
        this.loading = false;
      }
    });
  }

  /**
   * Charge les statistiques
   */
  loadStatistiques(): void {
    this.loadingStats = true;
    
    this.factureService.getStatistiques().subscribe({
      next: (stats) => {
        this.stats = stats;
        this.updateChartData();
        this.loadingStats = false;
      },
      error: (error) => {
        console.error('Erreur lors du chargement des statistiques:', error);
        this.loadingStats = false;
      }
    });
  }

  /**
   * Met à jour les données du graphique
   */
  updateChartData(): void {
    // Exemple de données - à adapter selon votre API
    this.chartData = {
      labels: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'],
      datasets: [
        {
          label: 'Factures émises',
          data: [65, 59, 80, 81, 56, 55, 40, 45, 38, 50, 60, 70],
          fill: false,
          borderColor: '#3b82f6',
          tension: 0.4
        },
        {
          label: 'Factures payées',
          data: [45, 40, 60, 70, 45, 40, 30, 35, 28, 40, 45, 55],
          fill: false,
          borderColor: '#10b981',
          tension: 0.4
        }
      ]
    };
  }

  /**
   * Pagination
   */
  onPageChange(event: any): void {
    this.page = event.page + 1;
    this.rowsPerPage = event.rows;
    this.loadFactures();
  }

  /**
   * Recherche
   */
  onSearch(): void {
    this.page = 1;
    this.loadFactures();
  }

  /**
   * Applique les filtres
   */
  applyFilters(): void {
    this.page = 1;
    this.loadFactures();
  }

  /**
   * Réinitialise les filtres
   */
  resetFilters(): void {
    this.statutFilter = '';
    this.searchText = '';
    this.dateDebut = null;
    this.dateFin = null;
    this.page = 1;
    this.loadFactures();
  }

  /**
   * Retourne la sévérité du tag selon le statut
   */
  getStatutSeverity(statut: string): 'success' | 'info' | 'warning' | 'danger' | 'secondary' {
    switch (statut) {
      case StatutFacture.PAYEE:
        return 'success';
      case StatutFacture.EN_ATTENTE:
        return 'warning';
      case StatutFacture.EN_RETARD:
        return 'danger';
      case StatutFacture.ANNULEE:
        return 'secondary';
      case StatutFacture.BROUILLON:
        return 'info';
      default:
        return 'info';
    }
  }

  /**
   * Formate le statut pour l'affichage
   */
  formatStatut(statut: string): string {
    switch (statut) {
      case StatutFacture.PAYEE:
        return 'Payée';
      case StatutFacture.EN_ATTENTE:
        return 'En attente';
      case StatutFacture.EN_RETARD:
        return 'En retard';
      case StatutFacture.ANNULEE:
        return 'Annulée';
      case StatutFacture.BROUILLON:
        return 'Brouillon';
      default:
        return statut;
    }
  }

  /**
   * Voir les détails d'une facture
   */
  voirFacture(id: number): void {
    this.router.navigate(['/dashboard/factures', id]);
  }

  /**
   * Modifier une facture
   */
  modifierFacture(id: number): void {
    this.router.navigate(['/dashboard/factures', id]);
  }

  /**
   * Supprimer une facture
   */
  supprimerFacture(id: number): void {
    this.confirmationService.confirm({
      message: 'Êtes-vous sûr de vouloir supprimer cette facture ?',
      header: 'Confirmation',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.factureService.deleteFacture(id).subscribe({
          next: () => {
            this.messageService.add({
              severity: 'success',
              summary: 'Succès',
              detail: 'Facture supprimée avec succès'
            });
            this.loadFactures();
          },
          error: (error) => {
            console.error('Erreur lors de la suppression:', error);
            this.messageService.add({
              severity: 'error',
              summary: 'Erreur',
              detail: 'Impossible de supprimer la facture'
            });
          }
        });
      }
    });
  }

  /**
   * Créer une nouvelle facture
   */
  nouvelleFacture(): void {
    this.router.navigate(['/dashboard/factures', 'nouvelle']);
  }

  /**
   * Voir les factures d'un client
   */
  voirFacturesClient(acheteurId: number): void {
    this.router.navigate(['/dashboard/factures']);
  }
}