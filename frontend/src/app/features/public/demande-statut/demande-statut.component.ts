import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { DemandeService } from '../../../core/services/demande.service';

@Component({
  selector: 'app-demande-statut',
  standalone: true,
  imports: [CommonModule, CardModule, ButtonModule, ProgressSpinnerModule],
  templateUrl: './demande-statut.component.html',
  styleUrls: ['./demande-statut.component.scss']
})
export class DemandeStatutComponent implements OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private demandeService = inject(DemandeService);

  loading = true;
  error = '';

  demande = {
    id: '',
    entreprise: '',
    email: '',
    dateSubmission: new Date(),
    statut: 'PENDING' as 'PENDING' | 'APPROVED' | 'REJECTED',
    notes: 'Votre demande est en cours de traitement. Nous vous notifierons une fois la décision prise.'
  };

  ngOnInit(): void {
    // Récupérer l'email depuis le query param
    const email = this.route.snapshot.queryParamMap.get('email') || '';

    // Récupérer les données sauvegardées lors de la soumission (localStorage)
    const saved = localStorage.getItem('demande_soumise');
    if (saved) {
      try {
        const data = JSON.parse(saved);
        this.demande.email = data.email || email;
        this.demande.entreprise = data.raisonSociale || '';
        this.demande.dateSubmission = data.dateSoumission ? new Date(data.dateSoumission) : new Date();
        this.demande.id = data.code || '';
      } catch {
        this.demande.email = email;
      }
    } else {
      this.demande.email = email;
    }

    // Récupérer le statut réel depuis le backend
    if (this.demande.email) {
      this.demandeService.verifierStatut(this.demande.email).subscribe({
        next: (res) => {
          const statut = res.statut as string;
          if (statut === 'REQUESTED' || statut === 'PENDING') {
            this.demande.statut = 'PENDING';
          } else if (statut === 'APPROVED' || statut === 'ACTIVE') {
            this.demande.statut = 'APPROVED';
          } else if (statut === 'REJECTED') {
            this.demande.statut = 'REJECTED';
          }
          this.loading = false;
        },
        error: () => {
          this.loading = false;
          this.error = 'Impossible de récupérer le statut de votre demande.';
        }
      });
    } else {
      this.loading = false;
      this.error = 'Email non trouvé. Veuillez soumettre votre demande.';
    }
  }

  navigateToHome(): void {
    this.router.navigate(['/']);
  }

  navigateToLogin(): void {
    this.router.navigate(['/login']);
  }

  getStatusLabel(): string {
    const labels: Record<string, string> = {
      PENDING: 'En attente',
      APPROVED: 'Approuvée',
      REJECTED: 'Rejetée'
    };
    return labels[this.demande.statut] || 'Inconnu';
  }

  getStatusColor(): 'warning' | 'success' | 'danger' | 'info' {
    const colors: Record<string, 'warning' | 'success' | 'danger' | 'info'> = {
      PENDING: 'warning',
      APPROVED: 'success',
      REJECTED: 'danger'
    };
    return colors[this.demande.statut] || 'info';
  }

  isApproved(): boolean {
    return this.demande.statut === 'APPROVED';
  }
}
