// src/app/pages/produits/produits.component.ts
import { Component, OnInit, inject, computed } from '@angular/core';
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
import { CheckboxModule } from 'primeng/checkbox';
import { MessageService } from 'primeng/api';
import { ConfirmationService } from 'primeng/api';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { ProduitService } from '../../core/services/produit.service';
import { AuthService } from '../../core/services/auth.service';
import { Produit } from '../../models/produit.model';

// ⚠️ MODE TEST : emetteurId par défaut quand pas d'utilisateur connecté
const DEFAULT_EMETTEUR_ID = 1;

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
    TooltipModule,
    CheckboxModule,
    TranslateModule
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './produits.component.html',
  styleUrls: ['./produits.component.scss']
})
export class ProduitsComponent implements OnInit {
  private produitService = inject(ProduitService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);
  private translate = inject(TranslateService);

  get isViewer(): boolean {
    return this.authService.hasRole('ENTREPRISE_VIEWER');
  }

  isReadOnly = computed(() => this.authService.hasRole('ENTREPRISE_VIEWER'));

  // Données
  produits: Produit[] = [];
  produitsFiltered: Produit[] = [];
  loading: boolean = false;

  // Pagination côté client
  page: number = 1;
  rowsPerPage: number = 10;
  rowsOptions: number[] = [10, 20, 50, 100];

  // Recherche
  searchText: string = '';

  // Dialog
  displayDialog: boolean = false;
  dialogMode: 'add' | 'edit' = 'add';
  selectedProduit: Produit | null = null;

  // Formulaire
  produitForm: {
    reference: string;
    designation: string;
    prixUnitaire: number;
    tauxTVA: number;
    emetteurId: number;
    quantiteStock: number;
    stockIllimite: boolean;
    seuilAlerteStock: number;
  } = {
      reference: '',
      designation: '',
      prixUnitaire: 0,
      tauxTVA: 19,
      emetteurId: DEFAULT_EMETTEUR_ID,
      quantiteStock: 0,
      stockIllimite: false,
      seuilAlerteStock: 5
    };

  ngOnInit(): void {
    this.loadProduits();
  }

  /**
   * Résout l'emetteurId : depuis l'utilisateur connecté, sinon fallback DEFAULT
   */
  private resolveEmetteurId(): number | null {
    const user = this.authService.currentUser();
    if (user?.emetteurId != null && Number(user.emetteurId) > 0) {
      return Number(user.emetteurId);
    }
    if ((user as any)?.entrepriseId != null && Number((user as any).entrepriseId) > 0) {
      return Number((user as any).entrepriseId);
    }
    return null; // Le backend filtre via JWT
  }

  /**
   * Charge la liste des produits
   */
  loadProduits(): void {
    this.loading = true;
    const emetteurId = this.resolveEmetteurId();

    this.produitService.getProduits(emetteurId).subscribe({
      next: (produits) => {
        this.produits = Array.isArray(produits) ? produits : [];
        this.applyFilter();
        this.loading = false;
      },
      error: (error: any) => {
        this.loading = false;
        const msg = error?.error?.message ?? error?.error?.error ?? error?.error?.detail;
        this.messageService.add({
          severity: 'error',
          summary: this.translate.instant('TOAST.ERROR'),
          detail: msg || this.translate.instant('PRODUITS.MSGS.LOAD_ERROR')
        });
      }
    });
  }

  applyFilter(): void {
    const search = (this.searchText || '').toLowerCase().trim();
    let result = search
      ? this.produits.filter(p =>
        (p.reference || '').toLowerCase().includes(search) ||
        (p.designation || '').toLowerCase().includes(search))
      : [...this.produits];

    // Tri par référence alphabétique par défaut
    this.produitsFiltered = result.sort((a, b) => 
      (a.reference || '').localeCompare(b.reference || '')
    );
  }

  loadProduitsLazy(event: any): void {
    this.page = (event.first / event.rows) + 1;
    this.rowsPerPage = event.rows;
    // On ne recharge pas forcément depuis le service car Produits utilise le filtrage local
    // mais on s'assure que le paginateur fonctionne bien
  }

  onPageChange(event: any): void {
    this.page = event.page + 1;
    this.rowsPerPage = event.rows;
    this.loadProduits();
  }

  onSearch(): void {
    this.page = 1;
    this.applyFilter();
  }

  clearSearch(): void {
    this.searchText = '';
    this.onSearch();
  }

  ajouterProduit(): void {
    if (this.isViewer) {
      return;
    }

    this.dialogMode = 'add';
    this.selectedProduit = null;
    this.resetForm();
    this.displayDialog = true;
  }

  modifierProduit(produit: Produit): void {
    if (this.isViewer) {
      return;
    }

    this.dialogMode = 'edit';
    this.selectedProduit = produit;
    this.produitForm = {
      reference: produit.reference,
      designation: produit.designation,
      prixUnitaire: produit.prixUnitaire,
      tauxTVA: produit.tauxTVA,
      emetteurId: (produit as any).emetteurId ?? this.resolveEmetteurId(),
      quantiteStock: produit.quantiteStock ?? 0,
      stockIllimite: produit.stockIllimite ?? false,
      seuilAlerteStock: produit.seuilAlerteStock ?? 5
    };
    this.displayDialog = true;
  }

  resetForm(): void {
    this.produitForm = {
      reference: '',
      designation: '',
      prixUnitaire: 0,
      tauxTVA: 19,
      emetteurId: this.resolveEmetteurId() ?? 0,
      quantiteStock: 0,
      stockIllimite: false,
      seuilAlerteStock: 5
    };
  }

  sauvegarderProduit(): void {
    if (this.isViewer) {
      return;
    }

    if (!this.produitForm.reference?.trim() || !this.produitForm.designation?.trim()) {
      this.messageService.add({
        severity: 'warn',
        summary: this.translate.instant('TOAST.WARN'),
        detail: this.translate.instant('PRODUITS.MSGS.VALIDATION_REQUIRED')
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
      prixUnitaire: Number(this.produitForm.prixUnitaire) || 0,
      tauxTVA: Number(this.produitForm.tauxTVA) || 19,
      emetteurId: this.produitForm.emetteurId,
      quantiteStock: this.produitForm.stockIllimite ? 0 : (Number(this.produitForm.quantiteStock) || 0),
      stockIllimite: this.produitForm.stockIllimite,
      seuilAlerteStock: Number(this.produitForm.seuilAlerteStock) || 5
    };

    if (this.dialogMode === 'add') {
      this.produitService.createProduit(request).subscribe({
        next: () => {
          this.loading = false;
          this.messageService.add({ 
            severity: 'success', 
            summary: this.translate.instant('TOAST.SUCCESS'), 
            detail: this.translate.instant('PRODUITS.MSGS.SAVE_SUCCESS_ADD') 
          });
          this.displayDialog = false;
          this.loadProduits();
        },
        error: (error: any) => {
          this.loading = false;
          const msg = error?.error?.message ?? error?.error?.error ?? error?.error?.detail;
          this.messageService.add({
            severity: 'error',
            summary: this.translate.instant('TOAST.ERROR'),
            detail: msg || this.translate.instant('PRODUITS.MSGS.SAVE_ERROR')
          });
        }
      });
    } else if (this.selectedProduit) {
      this.produitService.updateProduit(this.selectedProduit.id, request).subscribe({
        next: () => {
          this.loading = false;
          this.messageService.add({ 
            severity: 'success', 
            summary: this.translate.instant('TOAST.SUCCESS'), 
            detail: this.translate.instant('PRODUITS.MSGS.SAVE_SUCCESS_EDIT') 
          });
          this.displayDialog = false;
          this.loadProduits();
        },
        error: (error: any) => {
          this.loading = false;
          const msg = error?.error?.message ?? error?.error?.error ?? error?.error?.detail;
          this.messageService.add({
            severity: 'error',
            summary: this.translate.instant('TOAST.ERROR'),
            detail: msg || this.translate.instant('PRODUITS.MSGS.SAVE_ERROR')
          });
        }
      });
    }
  }

  supprimerProduit(id: number): void {
    if (this.isViewer) {
      return;
    }

    this.confirmationService.confirm({
      message: this.translate.instant('PRODUITS.MSGS.DELETE_CONFIRM'),
      header: this.translate.instant('TOAST.CONFIRMATION'),
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.produitService.deleteProduit(id).subscribe({
          next: () => {
            this.messageService.add({ 
              severity: 'success', 
              summary: this.translate.instant('TOAST.SUCCESS'), 
              detail: this.translate.instant('PRODUITS.MSGS.DELETE_SUCCESS') 
            });
            this.loadProduits();
          },
          error: () => {
            this.messageService.add({ 
              severity: 'error', 
              summary: this.translate.instant('TOAST.ERROR'), 
              detail: this.translate.instant('PRODUITS.MSGS.DELETE_ERROR') 
            });
          }
        });
      }
    });
  }

  /**
   * Retourne le statut du stock d'un produit
   */
  getStockStatut(produit: Produit): { label: string; classe: string; icon: string } {
    if (produit.stockIllimite) {
      return { label: 'PRODUITS.STOCK_STATUS.UNLIMITED', classe: 'statut-illimite', icon: '∞' };
    }
    if (produit.ruptureStock || (produit.quantiteStock != null && produit.quantiteStock <= 0)) {
      return { label: 'PRODUITS.STOCK_STATUS.OUT', classe: 'statut-rupture', icon: '🔴' };
    }
    if (produit.stockFaible) {
      return { label: 'PRODUITS.STOCK_STATUS.LOW', classe: 'statut-faible', icon: '⚠️' };
    }
    return { label: 'PRODUITS.STOCK_STATUS.AVAILABLE', classe: 'statut-disponible', icon: '✅' };
  }

  /**
   * Affiche la quantité de stock
   */
  getStockDisplay(produit: Produit): string {
    if (produit.stockIllimite) return '∞';
    if (produit.quantiteStock == null) return '-';
    return produit.quantiteStock.toString();
  }

  formatPrix(prix: number | undefined): string {
    if (prix == null) return '-';
    return new Intl.NumberFormat('fr-TN', {
      minimumFractionDigits: 3,
      maximumFractionDigits: 3
    }).format(prix) + ' TND';
  }

  formatTVA(tva: number): string {
    return tva.toFixed(2) + '%';
  }

}
