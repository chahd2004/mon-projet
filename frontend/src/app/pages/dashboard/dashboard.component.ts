// src/app/pages/dashboard/dashboard.component.ts
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

// PrimeNG
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

// Services
import { FactureService } from '../../core/services/facture.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ButtonModule,
    TooltipModule,
    ToastModule
  ],
  providers: [MessageService],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent {
  private factureService = inject(FactureService);
  private authService = inject(AuthService);
  private messageService = inject(MessageService);

  // Seulement les données nécessaires pour la sidebar
  totalFactures: number = 0;

  constructor() {
    this.loadTotalFactures();
  }

  loadTotalFactures(): void {
    this.factureService.getFactures(1, 1).subscribe({
      next: (response: any) => {  // ← Type explicite ajouté
        this.totalFactures = response.total || 0;
      },
      error: (error: any) => {     // ← Type explicite ajouté
        console.error('Erreur chargement total factures:', error);
      }
    });
  }

  logout(): void {
    this.messageService.add({
      severity: 'info',
      summary: 'Déconnexion',
      detail: 'Vous êtes déconnecté'
    });
    this.authService.logout();
  }
}