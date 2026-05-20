// src/app/pages/dashboard/dashboard.component.ts
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { ChartModule } from 'primeng/chart';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { TooltipModule } from 'primeng/tooltip';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { signal, effect } from '@angular/core';

import { AuthService } from '../../core/services/auth.service';
import { EmetteurService } from '../../core/services/emetteur.service';
import { FactureService } from '../../core/services/facture.service';
import { ClientService } from '../../core/services/client.service';
import { DashboardService } from '../../core/services/dashboard.service';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { DemandeService } from '../../core/services/demande.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule, CardModule, ButtonModule, ChartModule,
    TableModule, TagModule, ProgressSpinnerModule, TooltipModule, ToastModule, TranslateModule
  ],
  providers: [MessageService],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  private factureService = inject(FactureService);
  private clientService = inject(ClientService);
  private dashboardService = inject(DashboardService);
  private router = inject(Router);
  private messageService = inject(MessageService);
  private authService = inject(AuthService);
  private emetteurService = inject(EmetteurService);
  private translate = inject(TranslateService);
  private demandeService = inject(DemandeService);

  totalFactures: number = 0;
  totalClients: number = 0;
  totalCollaborateurs: number = 0;
  chiffreAffaires: number = 0;
  facturesImpayees: number = 0;
  loading: boolean = true;
  raisonSociale: string | null = null;
  lateInvoices: any[] = [];

  get isViewer(): boolean {
    return this.authService.hasRole('ENTREPRISE_VIEWER' as any);
  }

  get isManager(): boolean {
    return this.authService.hasRole('ENTREPRISE_MANAGER' as any);
  }

  chartData: any = {
    labels: [],
    datasets: [
      {
        data: [],
        backgroundColor: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#6b7280'],
        hoverBackgroundColor: ['#2563eb', '#059669', '#d97706', '#dc2626', '#4b5563'],
        borderWidth: 0
      }
    ]
  };

  ventesProduitsData: any = {
    labels: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'],
    datasets: []
  };

  chartOptions: any;
  ventesProduitsOptions: any;

  ngOnInit(): void {
    if (this.authService.hasRole('SUPER_ADMIN')) {
      this.router.navigate(['/super-admin/statistiques']);
      return;
    }
    this.initChartOptions();
    this.loadData();
    this.loadLateInvoices();
    this.fetchEnterpriseName();

    this.translate.onLangChange.subscribe(() => {
      this.loadData();
      this.loadLateInvoices();
    });
  }

  private loadLateInvoices(): void {
    this.factureService.getAll().subscribe({
      next: (factures) => {
        const now = new Date();
        now.setHours(0, 0, 0, 0);

        this.lateInvoices = factures
          .filter(f => {
            // Utiliser datePaiement (champ échéance réel) avec dateEcheance en fallback
            const dueDateStr = f.datePaiement || f.dateEcheance;
            if (!dueDateStr || f.statut === 'PAID' || f.statut === 'CANCELLED' || f.statut === 'REJECTED') return false;

            const echeance = new Date(dueDateStr);
            echeance.setHours(0, 0, 0, 0);

            // On l'affiche dès le jour de l'échéance (<=)
            return echeance <= now;
          })
          .map(f => {
            const dueDateStr = f.datePaiement || f.dateEcheance!;
            const echeance = new Date(dueDateStr);
            const diffMs = now.getTime() - echeance.getTime();
            const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
            return {
              numFact: f.numFact,
              days: days,
              severity: days > 10 ? 'high' : 'medium'
            };
          })
          .sort((a, b) => b.days - a.days)
          .slice(0, 5);
      }
    });
  }

  private fetchEnterpriseName(): void {
    const user = this.authService.currentUser();
    if (user?.emetteurId) {
      this.emetteurService.getEmetteurById(user.emetteurId).subscribe({
        next: (emetteur) => this.raisonSociale = emetteur?.raisonSociale || null,
        error: () => this.raisonSociale = null
      });

    }
  }

  initChartOptions(): void {
    this.chartOptions = {
      plugins: {
        legend: {
          position: 'right',
          labels: {
            usePointStyle: true,
            font: { size: 14, weight: '600' },
            padding: 20
          }
        },
        tooltip: {
          callbacks: {
            label: (context: any) => {
              const label = context.label || '';
              const value = context.raw || 0;
              return `${label}: ${value}`;
            }
          }
        }
      },
      cutout: '70%',
      maintainAspectRatio: false
    };

    this.ventesProduitsOptions = {
      plugins: {
        legend: {
          position: 'bottom',
          labels: { usePointStyle: true, boxWidth: 10 }
        },
        tooltip: {
          mode: 'index',
          intersect: false
        }
      },
      scales: {
        x: { stacked: true, grid: { display: false } },
        y: { stacked: true, beginAtZero: true }
      },
      maintainAspectRatio: false
    };
  }

  loadData(): void {
    this.loading = true;

    this.dashboardService.getStats().subscribe({
      next: (data: any) => {
        this.totalFactures = data.factures?.total || 0;
        this.totalClients = data.clients?.total || 0;
        this.totalCollaborateurs = data.collaborateurs?.total || 0;
        this.chiffreAffaires = data.chiffreAffaires?.actuel || 0;
        this.facturesImpayees = data.factures?.enRetard || 0;

        if (!this.raisonSociale && data.nomEntreprise) {
          this.raisonSociale = data.nomEntreprise;
        }

        if (data.graphiques?.factureRepartition) {
          const valeurs = data.graphiques.factureRepartition.valeurs;
          const labels = data.graphiques.factureRepartition.labels;
          const total = valeurs.reduce((a: number, b: number) => a + b, 0);

          this.chartData.labels = labels.map((label: string, i: number) => {
            const translatedLabel = this.translate.instant('STATUS.' + (label.toUpperCase() === 'SIGNÉE' ? 'SIGNED' : label.toUpperCase() === 'PAYÉE' ? 'PAID' : label.toUpperCase() === 'BROUILLON' ? 'DRAFT' : label.toUpperCase() === 'ANNULÉE' ? 'CANCELLED' : label.toUpperCase() === 'REJETÉE' || label.toUpperCase() === 'REJECTED' ? 'REJECTED' : label));
            const pct = total > 0 ? Math.round((valeurs[i] / total) * 100) : 0;
            return `${translatedLabel} ${pct}%`;
          });
          this.chartData.datasets[0].data = valeurs;
          this.chartData = { ...this.chartData };
        }

        if (data.graphiques?.ventesParProduit) {
          const colors = ['#8b5cf6', '#6366f1', '#3b82f6', '#0ea5e9', '#06b6d4', '#14b8a6', '#10b981', '#84cc16'];
          this.ventesProduitsData.labels = data.graphiques.ventesParProduit.mois;
          this.ventesProduitsData.datasets = data.graphiques.ventesParProduit.produits.map((prod: any, idx: number) => ({
            type: 'bar',
            label: prod.label,
            backgroundColor: colors[idx % colors.length],
            data: prod.data,
            borderRadius: 4
          }));
          this.ventesProduitsData = { ...this.ventesProduitsData };
        }

        this.loading = false;
      },
      error: () => {
        this.messageService.add({ 
          severity: 'error', 
          summary: this.translate.instant('TOAST.ERROR'), 
          detail: this.translate.instant('PARAMETRES.MSGS.ERROR') 
        });
        this.loading = false;
      }
    });
  }

  formatMontant(montant: number, abrege: boolean = false): string {
    if (!montant && montant !== 0) return '0 TND';
    if (abrege && montant >= 1000000) return (montant / 1000000).toFixed(1) + ' M TND';
    return new Intl.NumberFormat('fr-TN', { minimumFractionDigits: 3, maximumFractionDigits: 3 }).format(montant) + ' TND';
  }

  getStatutSeverity(statut: string): 'success' | 'info' | 'warning' | 'danger' | 'secondary' {
    const map: Record<string, any> = {
      PAYEE: 'success', EN_ATTENTE: 'warning', EN_RETARD: 'danger', ANNULEE: 'secondary', BROUILLON: 'info'
    };
    return map[statut] ?? 'info';
  }

  formatStatut(statut: string): string {
    return this.translate.instant('STATUS.' + statut);
  }

  naviguerVersFactures(): void { this.router.navigate(['/factures']); }
  naviguerVersClients(): void { this.router.navigate(['/clients']); }
  naviguerVersCollaborateurs(): void { this.router.navigate(['/collaborateurs']); }
  naviguerVersFacturesImpayees(): void { this.router.navigate(['/factures'], { queryParams: { filter: 'UNPAID' } }); }

  rafraichir(): void {
    this.loadData();
    this.messageService.add({ 
      severity: 'info', 
      summary: this.translate.instant('DASHBOARD.REFRESH'), 
      detail: this.translate.instant('DASHBOARD.REFRESH_SUCCESS') 
    });
  }
}