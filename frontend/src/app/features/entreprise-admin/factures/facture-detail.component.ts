import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { TableModule } from 'primeng/table';
import { TabViewModule } from 'primeng/tabview';
import { FactureService } from '../../../core/services/facture.service';
import { ActivatedRoute, Router } from '@angular/router';
import { inject } from '@angular/core';

@Component({
  selector: 'app-facture-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, ButtonModule, CardModule, TagModule, TableModule, TabViewModule],
  templateUrl: './facture-detail.component.html',
  styleUrl: './facture-detail.component.scss'
})
export class FactureDetailComponent {
  private factureService = inject(FactureService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  loading = false;
  facture: any = {
    id: '1',
    numero: 'FAC-2024-001',
    client: 'Société ABC SARL',
    dateEmission: '2024-01-15',
    dateEcheance: '2024-02-14',
    montantHT: 5000,
    montantTTC: 5950,
    statut: 'PAYEE',
    modePaiement: 'Virement',
    lignes: [
      { produit: 'Logiciel Comptabilité Pro', quantite: 1, prixUnitaire: 5000, tva: 19, montant: 5950 }
    ],
    dateReglement: '2024-01-20'
  };

  getStatusTag(): { label: string; severity: string } {
    const statusMap: any = {
      DRAFT: { label: 'Brouillon', severity: 'info' },
      ENVOYEE: { label: 'Envoyée', severity: 'warning' },
      ACCEPTEE: { label: 'Acceptée', severity: 'info' },
      PAYEE: { label: 'Payée', severity: 'success' },
      ANNULEE: { label: 'Annulée', severity: 'danger' }
    };
    return statusMap[this.facture.statut] || { label: this.facture.statut, severity: 'secondary' };
  }

  downloadPDF(): void {
    console.log('Download PDF');
  }

  sendEmail(): void {
    console.log('Send email');
  }

  goBack(): void {
    this.router.navigate(['..'], { relativeTo: this.route });
  }

  signer(): void {
    this.factureService.signerFacture(this.facture.id).subscribe(() => this.loadFacture());
  }

  envoyee(): void {
    this.factureService.envoyerFacture(this.facture.id).subscribe(() => this.loadFacture());
  }

  payer(): void {
    this.factureService.marquerPayee(this.facture.id).subscribe(() => this.loadFacture());
  }

  rejeter(): void {
    const motif = prompt('Motif du rejet :');
    if (motif) {
      this.factureService.rejeterFacture(this.facture.id, motif).subscribe(() => this.loadFacture());
    }
  }

  annuler(): void {
    if (confirm('Êtes-vous sûr de vouloir annuler cette facture ?')) {
      this.factureService.annulerFacture(this.facture.id).subscribe(() => this.loadFacture());
    }
  }

  retourBrouillon(): void {
    if (confirm('Retourner cette facture en brouillon ?')) {
      this.factureService.retourBrouillon(this.facture.id).subscribe(() => this.loadFacture());
    }
  }

  private loadFacture(): void {
    const id = this.route.snapshot.params['id'];
    if (id) {
      this.loading = true;
      this.factureService.getFactureById(id).subscribe({
        next: (f) => {
          this.facture = f;
          this.loading = false;
        },
        error: () => this.loading = false
      });
    }
  }

  ngOnInit(): void {
    this.loadFacture();
  }
}
