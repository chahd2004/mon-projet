import { Component, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { DropdownModule } from 'primeng/dropdown';
import { TooltipModule } from 'primeng/tooltip';
import { TagModule } from 'primeng/tag';
import { FactureService } from '../../../core/services/facture.service';
import { AuthService } from '../../../core/services/auth.service';
import { Facture } from '../../../models/facture.model';

@Component({
  selector: 'app-factures-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, TableModule, ButtonModule, InputTextModule, DropdownModule, TooltipModule, TagModule],
  templateUrl: './factures-list.component.html',
  styleUrl: './factures-list.component.scss'
})
export class FacturesListComponent implements OnInit {
  factures: any[] = [];
  filteredFactures: any[] = [];
  isLoading = false;
  searchTerm = '';
  selectedStatut = '';
  currentEmetteurId: number | null = null;
  
  isReadOnly = computed(() => this.authService.hasRole('ENTREPRISE_VIEWER'));

  statutOptions = [
    { label: 'Tous', value: '' },
    { label: 'Brouillon', value: 'DRAFT' },
    { label: 'Signée', value: 'SIGNED' },
    { label: 'Envoyée', value: 'SENT' },
    { label: 'Payée', value: 'PAID' },
    { label: 'Rejetée', value: 'REJECTED' },
    { label: 'Annulée', value: 'CANCELLED' }
  ];

  constructor(
    private factureService: FactureService,
    private authService: AuthService
  ) { }

  ngOnInit(): void {
    const user = this.authService.currentUser();
    this.currentEmetteurId = user?.emetteurId || null;
    this.loadFactures();
  }

  loadFactures(): void {
    this.isLoading = true;
    this.factureService.getAll().subscribe({
      next: (data) => {
        // Marquer chaque facture comme Vente ou Achat
        const processedData = data.map(f => ({
          ...f,
          isVente: f.vendeurId === this.currentEmetteurId,
          partenaireNom: f.vendeurId === this.currentEmetteurId ? f.acheteurNom : f.vendeurNom
        }));

        this.factures = processedData.sort((a, b) => (b.id || 0) - (a.id || 0));
        this.filteredFactures = [...this.factures];
        this.isLoading = false;
        console.log('Factures chargées:', this.factures.length);
      },
      error: (err) => {
        console.error('Erreur lors du chargement des factures:', err);
        this.isLoading = false;
      }
    });
  }

  onSearch(): void {
    this.applyFilters();
  }

  onStatutChange(): void {
    this.applyFilters();
  }

  applyFilters(): void {
    this.filteredFactures = this.factures.filter(fact => {
      const matchesSearch =
        (fact.numFact || '').toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        (fact.partenaireNom || '').toLowerCase().includes(this.searchTerm.toLowerCase());

      const matchesStatut = !this.selectedStatut || fact.statut === this.selectedStatut;

      return matchesSearch && matchesStatut;
    });
  }

  getStatutSeverity(statut: string): string {
    switch (statut) {
      case 'DRAFT':
        return 'info';
      case 'SENT':
        return 'warning';
      case 'SIGNED':
        return 'info';
      case 'PAID':
        return 'success';
      case 'REJECTED':
        return 'danger';
      case 'CANCELLED':
        return 'danger';
      default:
        return 'secondary';
    }
  }

  getStatutLabel(statut: string): string {
    switch (statut) {
      case 'DRAFT':
        return 'Brouillon';
      case 'SENT':
        return 'Envoyée';
      case 'SIGNED':
        return 'Signée';
      case 'PAID':
        return 'Payée';
      case 'REJECTED':
        return 'Rejetée';
      case 'CANCELLED':
        return 'Annulée';
      default:
        return statut;
    }
  }

  viewDetail(id: string): void {
    console.log('View detail:', id);
  }

  deleteFacture(id: number): void {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette facture ?')) {
      this.factureService.deleteFacture(id).subscribe(() => {
        this.factures = this.factures.filter(f => f.id !== id);
        this.applyFilters();
      });
    }
  }

  signerFacture(id: number): void {
    this.factureService.signerFacture(id).subscribe(() => this.loadFactures());
  }

  emettreFacture(id: number): void {
    this.factureService.envoyerFacture(id).subscribe(() => this.loadFactures());
  }

  payerFacture(id: number): void {
    this.factureService.marquerPayee(id).subscribe(() => this.loadFactures());
  }

  rejeterFacture(id: number): void {
    const motif = prompt('Motif du rejet :');
    if (motif) {
      this.factureService.rejeterFacture(id, motif).subscribe(() => this.loadFactures());
    }
  }

  annulerFacture(id: number): void {
    if (confirm('Êtes-vous sûr de vouloir annuler cette facture ?')) {
      this.factureService.annulerFacture(id).subscribe(() => this.loadFactures());
    }
  }

  retourBrouillon(id: number): void {
    if (confirm('Retourner cette facture en brouillon ?')) {
      this.factureService.retourBrouillon(id).subscribe(() => this.loadFactures());
    }
  }
}
