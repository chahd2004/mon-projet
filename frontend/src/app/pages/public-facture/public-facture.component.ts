import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { ProgressSpinnerModule } from 'primeng/progressspinner';

@Component({
  selector: 'app-public-facture',
  standalone: true,
  imports: [CommonModule, RouterModule, ButtonModule, CardModule, TagModule, ProgressSpinnerModule],
  template: `
    <div class="public-container">
      <div class="header">
        <i class="pi pi-verified verified-icon"></i>
        <h1>Vérification de Facture</h1>
        <p>Statut en temps réel</p>
      </div>

      <div *ngIf="loading" class="loader-container">
        <p-progressSpinner ariaLabel="loading"></p-progressSpinner>
        <p>Chargement des informations...</p>
      </div>

      <p-card *ngIf="!loading && facture" class="status-card shadow-lg">
        <div class="facture-header">
          <span class="num-fact">{{ facture.numFact }}</span>
          <p-tag [value]="getStatutLabel(facture.statut)" [severity]="getStatutSeverity(facture.statut)"></p-tag>
        </div>

        <div class="info-grid">
          <div class="info-item">
            <span class="label">Client</span>
            <span class="valeur">{{ facture.acheteurNom }}</span>
          </div>
          <div class="info-item">
            <span class="label">Émis le</span>
            <span class="valeur">{{ facture.dateEmission | date:'dd/MM/yyyy' }}</span>
          </div>
          <div class="info-item">
            <span class="label">Échéance</span>
            <span class="valeur">{{ facture.datePaiement | date:'dd/MM/yyyy' }}</span>
          </div>
          <div class="info-item border-top pt-3">
            <span class="label">Montant Total</span>
            <span class="valeur total">{{ facture.totalTTC | number:'1.3-3' }} TND</span>
          </div>
        </div>

        <div class="footer">
          <p>Document certifié par <strong>FacturePro</strong></p>
          <small>ID: {{ facture.id }}</small>
        </div>
      </p-card>

      <div *ngIf="!loading && !facture" class="error-msg">
        <i class="pi pi-exclamation-triangle"></i>
        <p>Facture introuvable ou lien expiré.</p>
        <button pButton label="Retour" icon="pi pi-arrow-left" routerLink="/"></button>
      </div>
    </div>
  `,
  styles: [`
    .public-container {
      max-width: 500px;
      margin: 0 auto;
      padding: 2rem 1rem;
      font-family: 'Inter', sans-serif;
      text-align: center;
    }
    .header {
      margin-bottom: 2rem;
      .verified-icon { font-size: 3rem; color: #3b82f6; margin-bottom: 1rem; }
      h1 { margin: 0; font-size: 1.5rem; color: #1e293b; }
      p { margin: 0.5rem 0 0; color: #64748b; }
    }
    .status-card {
      text-align: left;
    }
    .facture-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
      .num-fact { font-weight: 800; font-size: 1.2rem; color: #1e293b; }
    }
    .info-grid {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }
    .info-item {
      display: flex;
      justify-content: space-between;
      .label { color: #64748b; font-size: 0.9rem; }
      .valeur { color: #1e293b; font-weight: 600; }
      .total { font-size: 1.2rem; color: #3b82f6; }
    }
    .footer {
      margin-top: 2rem;
      text-align: center;
      border-top: 1px solid #f1f5f9;
      padding-top: 1rem;
      color: #94a3b8;
      font-size: 0.8rem;
    }
    .loader-container { padding: 3rem 0; }
    .error-msg {
      margin-top: 3rem;
      color: #ef4444;
      i { font-size: 2rem; margin-bottom: 1rem; }
    }
  `]
})
export class PublicFactureComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private http = inject(HttpClient);

  facture: any = null;
  loading = true;

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadFacture(id);
    } else {
      this.loading = false;
    }
  }

  loadFacture(id: string) {
    this.http.get(`${environment.apiUrl}/public/factures/${id}`).subscribe({
      next: (data) => {
        this.facture = data;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  getStatutLabel(statut: string): string {
    const labels: any = {
      'DRAFT': 'Brouillon',
      'SIGNED': 'Signée',
      'SENT': 'Envoyée',
      'PAID': 'Payée',
      'REJECTED': 'Refusée',
      'CANCELLED': 'Annulée'
    };
    return labels[statut] || statut;
  }

  getStatutSeverity(statut: string): any {
    const map: any = {
      'PAID': 'success',
      'SIGNED': 'info',
      'SENT': 'info',
      'DRAFT': 'warning',
      'REJECTED': 'danger',
      'CANCELLED': 'secondary'
    };
    return map[statut] || 'info';
  }
}
