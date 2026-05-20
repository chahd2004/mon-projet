import { Component, OnInit, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TooltipModule } from 'primeng/tooltip';

import { AuthService } from '../../../core/services/auth.service';
import { ProduitService } from '../../../core/services/produit.service';
import { Produit } from '../../../models/produit.model';

@Component({
  selector: 'app-produits-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, TableModule, ButtonModule, InputTextModule, TooltipModule],
  templateUrl: './produits-list.component.html',
  styleUrl: './produits-list.component.scss'
})
export class ProduitsListComponent implements OnInit {
  private produitService = inject(ProduitService);
  private authService = inject(AuthService);
  
  isReadOnly = computed(() => this.authService.hasRole('ENTREPRISE_VIEWER'));

  produits: Produit[] = [];
  filteredProduits: Produit[] = [];
  isLoading = false;
  searchTerm = '';

  ngOnInit(): void {
    this.loadProduits();
  }

  private loadProduits(): void {
    this.isLoading = true;
    this.produitService.getProduits().subscribe({
      next: (data) => {
        this.produits = data;
        this.filteredProduits = [...this.produits];
        this.isLoading = false;
      },
      error: (err: any) => {
        console.error('Erreur chargement produits:', err);
        this.isLoading = false;
      }
    });
  }

  onSearch(): void {
    this.filteredProduits = this.produits.filter(
      prod =>
        prod.designation?.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        prod.reference?.toLowerCase().includes(this.searchTerm.toLowerCase())
    );
  }

  editProduit(id: string | number): void {
    console.log('Edit produit:', id);
  }

  deleteProduit(id: string | number): void {
    if (confirm('Voulez-vous vraiment supprimer ce produit ?')) {
      this.produitService.deleteProduit(Number(id)).subscribe({
        next: () => {
          this.produits = this.produits.filter(p => p.id !== id);
          this.onSearch();
        },
        error: (err: any) => console.error('Erreur lors de la suppression du produit:', err)
      });
    }
  }

  getPrixTTC(prix: number, tva: number): number {
    return Math.round(prix * (1 + tva / 100) * 100) / 100;
  }
}
