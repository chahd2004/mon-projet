import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Produit } from '../../../models/produit.model';
import { ProduitService } from '../../../core/services/produit.service';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-produits-view',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, TranslateModule],
  templateUrl: './produits-view.component.html',
  styleUrls: ['./produits-view.component.scss']
})
export class ProduitsViewComponent implements OnInit {

  produits: Produit[] = [];
  filteredProduits: Produit[] = [];
  searchTerm: string = '';
  loading: boolean = false;
  error: string = '';

  constructor(private produitService: ProduitService) { }

  ngOnInit(): void {
    this.loadProduits();
  }

  loadProduits(): void {
    this.loading = true;
    this.error = '';
    this.produitService.getProduits().subscribe({
      next: (data: Produit[]) => {
        this.produits = data;
        this.filteredProduits = data;
        this.loading = false;
      },
      error: (err: any) => {
        this.error = 'Erreur lors du chargement des produits';
        console.error(err);
        this.loading = false;
      }
    });
  }

  onSearch(): void {
    const term = this.searchTerm.toLowerCase().trim();
    if (!term) {
      this.filteredProduits = this.produits;
    } else {
      this.filteredProduits = this.produits.filter(p =>
        p.reference.toLowerCase().includes(term) ||
        p.designation.toLowerCase().includes(term)
      );
    }
  }

  getPrixTTC(produit: Produit): number {
    const prix = produit.prixUnitaire || 0;
    const tva = produit.tauxTVA || 0;
    return Math.round(prix * (1 + tva / 100) * 1000) / 1000;
  }

  getStatutStock(produit: Produit): 'illimite' | 'rupture' | 'faible' | 'disponible' {
    if (produit.stockIllimite) return 'illimite';
    if (produit.ruptureStock || (produit.quantiteStock !== undefined && produit.quantiteStock <= 0)) return 'rupture';
    if (produit.stockFaible) return 'faible';
    return 'disponible';
  }

  getStatutLabel(produit: Produit): string {
    const statut = this.getStatutStock(produit);
    switch (statut) {
      case 'illimite':   return '♾️ Illimité';
      case 'rupture':    return '🔴 Rupture';
      case 'faible':     return '⚠️ Stock faible';
      case 'disponible': return '✅ Disponible';
    }
  }

  getStockAffiche(produit: Produit): string {
    if (produit.stockIllimite) return '∞';
    return produit.quantiteStock !== undefined ? String(produit.quantiteStock) : '-';
  }

}
