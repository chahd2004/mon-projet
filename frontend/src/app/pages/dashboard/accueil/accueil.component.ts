import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

// PrimeNG Modules
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { ChartModule } from 'primeng/chart';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { TooltipModule } from 'primeng/tooltip';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

// Services
import { FactureService } from '../../../core/services/facture.service';
import { ClientService } from '../../../core/services/client.service';
import { DashboardService } from '../../../core/services/dashboard.service';
import { getHttpErrorMessage } from '../../../core/utils/http-error.util';

@Component({
  selector: 'app-accueil',
  standalone: true,
  imports: [
    CommonModule,
    CardModule,
    ButtonModule,
    ChartModule,
    TableModule,
    TagModule,
    ProgressSpinnerModule,
    TooltipModule,
    ToastModule
  ],
  providers: [MessageService],
  templateUrl: './accueil.component.html',
  styleUrls: ['./accueil.component.scss']
})
export class AccueilComponent implements OnInit {
  private factureService = inject(FactureService);
  private clientService = inject(ClientService);
  private dashboardService = inject(DashboardService);
  private router = inject(Router);
  private messageService = inject(MessageService);

  // Stats principales
  totalFactures: number = 0;
  totalClients: number = 0;
  chiffreAffaires: number = 0;
  facturesImpayees: number = 0;
  loading: boolean = true;

  // Dernières factures
  dernieresFactures: any[] = [];

  // Données du graphique
  chartData: any = {
    labels: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'],
    datasets: [
      {
        label: 'Chiffre d\'affaires (TND)',
        data: [],
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
        fill: true
      },
      {
        label: 'Factures payées',
        data: [],
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        tension: 0.4
      }
    ]
  };

  chartOptions: any;

  // Stats supplémentaires
  stats: any = {
    evolution: 0,
    exercice: new Date().getFullYear().toString(),
    annees: []
  };

  ngOnInit(): void {
    this.initChartOptions();
    this.loadData();
  }

  initChartOptions(): void {
    this.chartOptions = {
      plugins: {
        legend: { 
          labels: { color: '#495057' } 
        },
        tooltip: {
          callbacks: {
            label: (context: any) => {
              let label = context.dataset.label || '';
              if (label) label += ': ';
              if (context.parsed.y !== null) {
                label += this.formatMontant(context.parsed.y);
              }
              return label;
            }
          }
        }
      },
      scales: {
        x: { 
          ticks: { color: '#495057' }, 
          grid: { color: '#ebedef' } 
        },
        y: { 
          ticks: { 
            color: '#495057',
            callback: (value: any) => this.formatMontant(value, true)
          },
          grid: { color: '#ebedef' }
        }
      },
      responsive: true,
      maintainAspectRatio: false
    };
  }

  loadData(): void {
    this.loading = true;

    // Récupérer les statistiques
    this.dashboardService.getStats().subscribe({
      next: (data: any) => {
        this.totalFactures = data.factures?.total || 0;
        this.totalClients = data.clients?.total || 0;
        this.chiffreAffaires = data.chiffreAffaires?.actuel || 0;
        this.facturesImpayees = data.factures?.enRetard || 0;
        
        this.stats.evolution = data.chiffreAffaires?.evolution || 0;
        this.stats.annees = data.chiffreAffaires?.parAnnee || [];
        
        if (data.graphiques?.caMensuel) {
          this.chartData.datasets[0].data = data.graphiques.caMensuel.valeurs || [];
        }
        
        this.loading = false;
      },
      error: (error: unknown) => {
        console.error('Erreur chargement stats:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Erreur',
          detail: getHttpErrorMessage(error, 'Impossible de charger les statistiques')
        });
        this.loading = false;
      }
    });

    // Récupérer les dernières factures
    this.dashboardService.getDernieresFactures(5).subscribe({
      next: (factures: any[]) => {
        this.dernieresFactures = factures || [];
      },
      error: (error: any) => {
        console.error('Erreur chargement factures:', error);
        this.dernieresFactures = [];
      }
    });

    // Récupérer le total des clients
    this.clientService.getClients().subscribe({
      next: (clients) => {
        this.totalClients = clients.length;
      },
      error: (error: any) => {
        console.error('Erreur chargement clients:', error);
      }
    });
  }

  formatMontant(montant: number, abrege: boolean = false): string {
    if (!montant && montant !== 0) return '0 TND';
    
    if (abrege && montant >= 1000000) {
      return (montant / 1000000).toFixed(1) + ' M TND';
    }
    return new Intl.NumberFormat('fr-TN', {
      minimumFractionDigits: 3,
      maximumFractionDigits: 3
    }).format(montant) + ' TND';
  }

  getStatutSeverity(statut: string): 'success' | 'info' | 'warning' | 'danger' | 'secondary' {
    switch (statut) {
      case 'PAYEE': return 'success';
      case 'EN_ATTENTE': return 'warning';
      case 'EN_RETARD': return 'danger';
      case 'ANNULEE': return 'secondary';
      case 'BROUILLON': return 'info';
      default: return 'info';
    }
  }

  formatStatut(statut: string): string {
    switch (statut) {
      case 'PAYEE': return 'Payée';
      case 'EN_ATTENTE': return 'En attente';
      case 'EN_RETARD': return 'En retard';
      case 'ANNULEE': return 'Annulée';
      case 'BROUILLON': return 'Brouillon';
      default: return statut;
    }
  }

  naviguerVersFactures(): void {
    this.router.navigate(['/factures']);
  }

  naviguerVersClients(): void {
    this.router.navigate(['/clients']);
  }

  voirFacture(id: number): void {
    this.router.navigate(['/facture', id]);
  }

  rafraichir(): void {
    this.loadData();
    this.messageService.add({
      severity: 'info',
      summary: 'Rafraîchi',
      detail: 'Données mises à jour'
    });
  }
}