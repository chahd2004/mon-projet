// src/app/pages/produits/produits.component.ts
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

// PrimeNG Modules
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { InputTextModule } from 'primeng/inputtext';
import { DialogModule } from 'primeng/dialog';
import { InputNumberModule } from 'primeng/inputnumber';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService } from 'primeng/api';
import { ConfirmationService } from 'primeng/api';

import { ProduitService } from '../../core/services/produit.service';
import { getHttpErrorMessage } from '../../core/utils/http-error.util';
import { Produit } from '../../models/produit.model';

@Component({
  selector: 'app-produits',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    ButtonModule,
    CardModule,
    ToastModule,
    ConfirmDialogModule,
    InputTextModule,
    DialogModule,
    InputNumberModule,
    TooltipModule
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './produits.component.html',
  styleUrls: ['./produits.component.scss']
})
export class ProduitsComponent implements OnInit {
  private produitService = inject(ProduitService);
  private router = inject(Router);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);

  // Données
  produits: Produit[] = [];
  produitsFiltered: Produit[] = [];
  loading: boolean = false;
  
  // Pagination côté client
  page: number = 1;
  rowsPerPage: number = 10;
  
  // Recherche
  searchText: string = '';
  
  // Dialog
  displayDialog: boolean = false;
  dialogMode: 'add' | 'edit' = 'add';
  selectedProduit: Produit | null = null;
  
  // Formulaire (camelCase pour le backend)
  produitForm: { reference: string; designation: string; prixUnitaire: number; tauxTVA: number } = {
    reference: '',
    designation: '',
    prixUnitaire: 0,
    tauxTVA: 19
  };

  ngOnInit(): void {
    this.loadProduits();
  }

  /**
   * Charge la liste des produits
   */
  loadProduits(): void {
    this.loading = true;
    
    this.produitService.getProduits().subscribe({
      next: (produits) => {
        this.produits = produits;
        this.applyFilter();
        this.loading = false;
      },
      error: (error) => {
        console.error('Erreur:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Erreur',
          detail: getHttpErrorMessage(error, 'Impossible de charger les produits')
        });
        this.loading = false;
      }
    });
  }

  /**
   * Filtre côté client par recherche
   */
  applyFilter(): void {
    const search = (this.searchText || '').toLowerCase().trim();
    this.produitsFiltered = search
      ? this.produits.filter(p =>
          (p.reference || '').toLowerCase().includes(search) ||
          (p.designation || '').toLowerCase().includes(search))
      : [...this.produits];
  }

  /**
   * Pagination
   */
  onPageChange(event: any): void {
    this.page = event.page + 1;
    this.rowsPerPage = event.rows;
    this.loadProduits();
  }

  /**
   * Recherche
   */
  onSearch(): void {
    this.page = 1;
    this.applyFilter();
  }

  /**
   * Réinitialise la recherche
   */
  clearSearch(): void {
    this.searchText = '';
    this.onSearch();
  }

  /**
   * Ouvre le dialogue d'ajout
   */
  ajouterProduit(): void {
    this.dialogMode = 'add';
    this.selectedProduit = null;
    this.resetForm();
    this.displayDialog = true;
  }

  /**
   * Ouvre le dialogue de modification
   */
  modifierProduit(produit: Produit): void {
    this.dialogMode = 'edit';
    this.selectedProduit = produit;
    this.produitForm = {
      reference: produit.reference,
      designation: produit.designation,
      prixUnitaire: produit.prixUnitaire,
      tauxTVA: produit.tauxTVA
    };
    this.displayDialog = true;
  }

  /**
   * Réinitialise le formulaire
   */
  resetForm(): void {
    this.produitForm = {
      reference: '',
      designation: '',
      prixUnitaire: 0,
      tauxTVA: 19
    };
  }

  /**
   * Sauvegarde le produit
   */
  sauvegarderProduit(): void {
    if (!this.produitForm.reference?.trim() || !this.produitForm.designation?.trim()) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Validation',
        detail: 'La référence et la désignation sont obligatoires'
      });
      return;
    }

    if (this.produitForm.prixUnitaire <= 0) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Validation',
        detail: 'Le prix unitaire doit être supérieur à 0'
      });
      return;
    }

    this.loading = true;
    const request = {
      reference: this.produitForm.reference.trim(),
      designation: this.produitForm.designation.trim(),
      prixUnitaire: this.produitForm.prixUnitaire,
      tauxTVA: this.produitForm.tauxTVA
    };

    if (this.dialogMode === 'add') {
      this.produitService.createProduit(request).subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Succès',
            detail: 'Produit ajouté avec succès'
          });
          this.displayDialog = false;
          this.loadProduits();
        },
        error: (error) => {
          console.error('Erreur:', error);
          this.messageService.add({
            severity: 'error',
            summary: 'Erreur',
            detail: error.error?.message || 'Impossible d\'ajouter le produit'
          });
          this.loading = false;
        }
      });
    } else if (this.selectedProduit) {
      this.produitService.updateProduit(this.selectedProduit.id, request).subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Succès',
            detail: 'Produit modifié avec succès'
          });
          this.displayDialog = false;
          this.loadProduits();
        },
        error: (error) => {
          console.error('Erreur:', error);
          this.messageService.add({
            severity: 'error',
            summary: 'Erreur',
            detail: error.error?.message || 'Impossible de modifier le produit'
          });
          this.loading = false;
        }
      });
    }
  }

  /**
   * Supprime un produit
   */
  supprimerProduit(id: number): void {
    this.confirmationService.confirm({
      message: 'Êtes-vous sûr de vouloir supprimer ce produit ?',
      header: 'Confirmation',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.produitService.deleteProduit(id).subscribe({
          next: () => {
            this.messageService.add({
              severity: 'success',
              summary: 'Succès',
              detail: 'Produit supprimé'
            });
            this.loadProduits();
          },
          error: (error) => {
            console.error('Erreur:', error);
            this.messageService.add({
              severity: 'error',
              summary: 'Erreur',
              detail: 'Impossible de supprimer le produit'
            });
          }
        });
      }
    });
  }

  /**
   * Formate le prix (gère prixUnitaire ou prix_unitaire pour compatibilité)
   */
  formatPrix(prix: number | undefined): string {
    if (prix == null) return '-';
    return new Intl.NumberFormat('fr-TN', {
      minimumFractionDigits: 3,
      maximumFractionDigits: 3
    }).format(prix) + ' TND';
  }

  /**
   * Formate la TVA
   */
  formatTVA(tva: number): string {
    return tva.toFixed(2) + '%';
  }

  /**
   * Retour à la liste
   */
  retourListe(): void {
    this.router.navigate(['/dashboard']);
  }
}

