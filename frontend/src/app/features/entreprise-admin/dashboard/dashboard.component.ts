import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StatCardComponent } from '../../../shared';
import { ChartModule } from 'primeng/chart';
import { AuthService } from '../../../core/services/auth.service';
import { EmetteurService } from '../../../core/services/emetteur.service';
import { DemandeService } from '../../../core/services/demande.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, StatCardComponent, ChartModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit {
  private authService = inject(AuthService);
  private emetteurService = inject(EmetteurService);
  private demandeService = inject(DemandeService);

  kpiData: any[] = [];
  chartData: any = null;
  chartOptions: any = null;
  enterpriseName: string | null = null;

  ngOnInit(): void {
    console.log('DashboardComponent initialized');
    this.loadEnterpriseName();
    this.initKpis();
    this.initCharts();
  }

  private loadEnterpriseName(): void {
    try {
      const currentUser = this.authService.currentUser();
      console.log('🔍 Current user:', currentUser);
      
      if (!currentUser) {
        console.log('❌ No current user found');
        this.enterpriseName = 'Entreprise';
        return;
      }
      
      if (!currentUser.emetteurId) {
        console.log('⚠️  No emetteurId found in user:', { 
          id: currentUser.id, 
          email: currentUser.email,
          role: currentUser.role
        });
        
        this.enterpriseName = 'Entreprise';
        return;
      }

      console.log('📡 Fetching emetteur with ID:', currentUser.emetteurId);
      this.emetteurService.getEmetteurById(currentUser.emetteurId).subscribe({
        next: (emetteur) => {
          console.log('✅ Emetteur loaded:', emetteur);
          this.enterpriseName = emetteur?.raisonSociale || 'Entreprise';
          console.log('📝 Enterprise name set to:', this.enterpriseName);
        },
        error: (err) => {
          console.error('❌ Error fetching emetteur:', err);
          this.enterpriseName = 'Entreprise';
        },
        complete: () => {
          console.log('✔️  Emetteur subscription completed');
        }
      });
    } catch (error) {
      console.error('❌ Exception in loadEnterpriseName:', error);
      this.enterpriseName = 'Entreprise';
    }
  }

  private initKpis(): void {
    this.kpiData = [
      { value: 45, title: 'Collaborateurs', icon: 'pi pi-users', color: 'blue', trend: '+3' },
      { value: 328, title: 'Produits', icon: 'pi pi-box', color: 'purple', trend: '+12' },
      { value: 152, title: 'Clients', icon: 'pi pi-shopping-cart', color: 'green', trend: '+8' },
      { value: '2.5M TND', title: 'CA Ce Mois', icon: 'pi pi-money-bill', color: 'orange', trend: '+18%' },
      { value: 89, title: 'Factures', icon: 'pi pi-file', color: 'red', trend: '+22' },
      { value: '1.8M TND', title: 'Encaissements', icon: 'pi pi-check-circle', color: 'green', trend: '+15%' }
    ];
  }

  private initCharts(): void {
    this.chartData = {
      labels: ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin'],
      datasets: [
        {
          label: 'Factures Émises',
          data: [12, 19, 8, 15, 22, 18],
          borderColor: '#667eea',
          fill: false,
          tension: 0.4
        },
        {
          label: 'Factures Payées',
          data: [10, 15, 6, 12, 18, 14],
          borderColor: '#764ba2',
          fill: false,
          tension: 0.4
        }
      ]
    };

    this.chartOptions = {
      maintainAspectRatio: false,
      responsive: true,
      plugins: {
        legend: {
          display: true,
          position: 'bottom'
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          grid: {
            color: '#e0e0e0',
            drawBorder: false
          }
        },
        x: {
          grid: {
            display: false,
            drawBorder: false
          }
        }
      }
    };
  }
}
