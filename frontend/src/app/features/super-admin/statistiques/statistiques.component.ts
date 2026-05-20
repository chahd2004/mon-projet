import { Component, OnInit, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { SkeletonModule } from 'primeng/skeleton';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { DashboardService, DashboardStats, SuperAdminStatsResponse } from '../../../core/services/dashboard.service';
import { SuperAdminUserService } from '../../../core/services/super-admin-user.service';
import { FactureService } from '../../../core/services/facture.service';
import { AuthService } from '../../../core/services/auth.service';
import { UserDTO, normalizeUserRole, UserRole } from '../../../models';
import { forkJoin } from 'rxjs';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { ChartModule } from 'primeng/chart';

@Component({
  selector: 'app-statistiques',
  standalone: true,
  imports: [CommonModule, RouterModule, ButtonModule, CardModule, SkeletonModule, TableModule, TagModule, TranslateModule, ChartModule],
  templateUrl: './statistiques.component.html',
  styleUrl: './statistiques.component.scss'
})
export class StatistiquesComponent implements OnInit {
  private dashboardService = inject(DashboardService);
  private superAdminUserService = inject(SuperAdminUserService);
  private factureService = inject(FactureService);
  private authService = inject(AuthService);
  private translate = inject(TranslateService);

  isLoading = true;

  // Chart Data
  chartData: any;
  chartOptions: any;
  totalInvoicesForChart = 0;

  // Current user
  currentUser = this.authService.currentUser;
  userFullName = computed(() => {
    const user = this.currentUser();
    const fallback = this.translate.instant('ROLES.ENTREPRISE_ADMIN'); // Or just 'Administrator'
    if (!user) return fallback;
    const firstName = user.prenom || '';
    const lastName = user.nom || '';
    return `${firstName} ${lastName}`.trim() || fallback;
  });

  // KPI Data
  usersCount = 0;
  clientsCount = 0;
  emetteursCount = 0;
  facturesCount = 0;

  // Breakdown data
  showInvoicesByCompany = false;
  invoicesByCompany: { company: string, count: number, percentage: number }[] = [];
  loadingBreakdown = false;

  ngOnInit(): void {
    this.loadStatistics();
  }

  private loadStatistics(): void {
    this.isLoading = true;

    forkJoin({
      adminStats: this.dashboardService.getSuperAdminStatistics(),
      users: this.superAdminUserService.getAllUsers()
    }).subscribe({
      next: ({ adminStats, users }) => {
        // Filtrer pour ne compter que les administrateurs (Super Admin et Entreprise Admin)
        const allowedRoles: UserRole[] = ['SUPER_ADMIN', 'ENTREPRISE_ADMIN'];
        this.usersCount = users.filter(u =>
          allowedRoles.includes(normalizeUserRole(u.role))
        ).length;

        this.clientsCount = adminStats.totalClients ?? 0;
        this.emetteursCount = adminStats.totalEmetteurs ?? 0;
        this.facturesCount = adminStats.totalFactures ?? 0;
        
        this.initChartData();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Erreur lors du chargement des statistiques:', error);
        this.isLoading = false;
      }
    });
  }

  onFacturesClick(): void {
    this.showInvoicesByCompany = !this.showInvoicesByCompany;

    if (this.showInvoicesByCompany && this.invoicesByCompany.length === 0) {
      this.loadInvoicesBreakdown();
    }
  }

  private loadInvoicesBreakdown(): void {
    this.loadingBreakdown = true;
    this.factureService.getAll().subscribe({
      next: (factures) => {
        const grouping = new Map<string, number>();
        factures.forEach(f => {
          // Use vendor name or buyer name as fallback for grouping
          const company = f.vendeurNom || (f as any).vendeurRaisonSociale || (f as any).nomVendeur || 'Inconnu';
          grouping.set(company, (grouping.get(company) || 0) + 1);
        });

        const sorted = Array.from(grouping.entries())
          .map(([company, count]) => ({ company, count }))
          .sort((a, b) => b.count - a.count);

        const max = sorted.length > 0 ? sorted[0].count : 1;

        this.invoicesByCompany = sorted.map(item => ({
          ...item,
          percentage: (item.count / max) * 100
        }));

        this.loadingBreakdown = false;
      },
      error: () => {
        this.loadingBreakdown = false;
      }
    });
  }

  private initChartData(): void {
    this.factureService.getAll().subscribe({
      next: (factures) => {
        const grouping = new Map<string, number>();
        factures.forEach(f => {
          const company = f.vendeurNom || (f as any).vendeurRaisonSociale || (f as any).nomVendeur || 'Inconnu';
          grouping.set(company, (grouping.get(company) || 0) + 1);
        });

        const sorted = Array.from(grouping.entries())
          .map(([company, count]) => ({ company, count }))
          .sort((a, b) => b.count - a.count);

        this.totalInvoicesForChart = factures.length;
        this.invoicesByCompany = sorted.map(item => ({ 
          ...item, 
          percentage: Math.round((item.count / this.totalInvoicesForChart) * 100) 
        }));

        const colors = [
          '#10b981', // Emerald
          '#818cf8', // Indigo/Purple
          '#fbbf24', // Amber
          '#3b82f6', // Blue
          '#ef4444'  // Red
        ];

        this.chartData = {
          labels: sorted.map(i => i.company),
          datasets: [
            {
              data: sorted.map(i => i.count),
              backgroundColor: colors.slice(0, sorted.length),
              hoverBackgroundColor: colors.slice(0, sorted.length),
              borderWidth: 0
            }
          ]
        };

        this.chartOptions = {
          cutout: '75%',
          plugins: {
            legend: {
              display: false
            },
            tooltip: {
              enabled: true
            }
          },
          maintainAspectRatio: false,
          responsive: true
        };
      }
    });
  }
}
