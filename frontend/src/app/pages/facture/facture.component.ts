// src/app/pages/facture/facture.component.ts
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

// PrimeNG Modules
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { CalendarModule } from 'primeng/calendar';
import { DropdownModule } from 'primeng/dropdown';
import { InputNumberModule } from 'primeng/inputnumber';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService } from 'primeng/api';

import { FactureService } from '../../core/services/facture.service';
import { getHttpErrorMessage } from '../../core/utils/http-error.util';
import { Facture, FactureRequest } from '../../models/facture.model';
import { AuthService } from '../../core/services/auth.service';
import { ClientService } from '../../core/services/client.service';
import { ProduitService } from '../../core/services/produit.service';

@Component({
  selector: 'app-facture',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    InputTextModule,
    CalendarModule,
    DropdownModule,
    InputNumberModule,
    ToastModule,
    TooltipModule
  ],
  providers: [MessageService],
  templateUrl: './facture.component.html',
  styleUrls: ['./facture.component.scss']
})
export class FactureComponent implements OnInit {
  // Injection des dépendances
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private factureService = inject(FactureService);
  private authService = inject(AuthService);
  private clientService = inject(ClientService);
  private produitService = inject(ProduitService);
  private messageService = inject(MessageService);

  // Propriétés principales
  facture: Facture | null = null;
  isLoading: boolean = true;
  isNewFacture: boolean = false;
  
  // Propriétés pour les lignes de facture (backend: produitId, quantite)
  lignesFacture: { produitId: number; quantite: number; produitDesignation?: string }[] = [];
  
  // Ligne en cours d'ajout (création)
  nouvelleLigne: { produitId: number | null; quantite: number } = { produitId: null, quantite: 1 };
  
  // Pour création: clients, produits, émetteur
  clients: any[] = [];
  produits: any[] = [];
  selectedAcheteurId: number | null = null;
  typeAcheteur: 'CLIENT' | 'EMETTEUR' = 'CLIENT';
  vendeurId: number = 0;
  modePaiement: string = 'VIREMENT';
  
  // Propriétés pour la section Poste
  couponEmission: string = '';
  referencePaiement: string = '';
  cle: string = '';
  tvaParDefaut: number = 19;
  droitTimbre: number = 0.5;

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      const id = params['id'];
      
      if (id === 'nouvelle') {
        this.isNewFacture = true;
        this.initialiserNouvelleFacture();
        this.isLoading = false;
      } else if (id) {
        this.chargerFacture(parseInt(id));
      } else {
        // ✅ CORRIGÉ : redirection vers /dashboard/factures
        this.router.navigate(['/dashboard/factures']);
      }
    });
  }

  /**
   * Initialise une nouvelle facture
   */
  initialiserNouvelleFacture(): void {
    const aujourdhui = new Date().toISOString().split('T')[0];
    this.facture = {
      id: 0,
      numFact: '',
      dateEmission: aujourdhui,
      datePaiement: aujourdhui,
      statut: 'BROUILLON',
      modePaiement: 'VIREMENT',
      montantEnLettres: '',
      totalHT: 0,
      totalTTC: 0,
      montantTVA: 0,
      acheteurId: 0,
      acheteurNom: '',
      typeAcheteur: 'CLIENT',
      vendeurId: 0,
      vendeurNom: ''
    };
    this.lignesFacture = [];
    this.authService.getCurrentUser().subscribe({
      next: (user: any) => {
        if (user?.emetteurId) {
          this.vendeurId = user.emetteurId;
        }
      }
    });
    this.clientService.getClients().subscribe({ next: (c) => (this.clients = c) });
    this.produitService.getProduits().subscribe({ next: (p) => (this.produits = p) });
  }

  /**
   * Charge une facture existante
   */
  chargerFacture(id: number): void {
    this.isLoading = true;
    
    this.factureService.getFactureById(id).subscribe({
      next: (facture) => {
        this.facture = facture;
        this.selectedAcheteurId = facture.acheteurId;
        this.lignesFacture = (facture.lignes || []).map(l => ({
          produitId: l.produitId,
          quantite: l.quantite,
          produitDesignation: l.produitDesignation
        }));
        this.genererInformationsPoste();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Erreur lors du chargement de la facture:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Erreur',
          detail: getHttpErrorMessage(error, 'Impossible de charger la facture')
        });
        this.isLoading = false;
        this.facture = null;
      }
    });
  }

  /**
   * Ajoute une ligne (produit + quantité)
   */
  ajouterLigne(): void {
    if (!this.nouvelleLigne.produitId || this.nouvelleLigne.quantite < 1) return;
    const p = this.produits.find(pr => pr.id === this.nouvelleLigne.produitId);
    this.lignesFacture.push({
      produitId: this.nouvelleLigne.produitId,
      quantite: this.nouvelleLigne.quantite,
      produitDesignation: p?.designation
    });
    this.nouvelleLigne = { produitId: null, quantite: 1 };
  }

  /**
   * Supprime une ligne
   */
  supprimerLigne(index: number): void {
    this.lignesFacture.splice(index, 1);
  }

  /**
   * Génère les informations pour la section Poste
   */
  genererInformationsPoste(): void {
    const num = this.facture?.numFact || '';
    if (num) {
      const date = new Date();
      this.couponEmission = `${date.getFullYear()}${(date.getMonth() + 1).toString().padStart(2, '0')}${date.getDate().toString().padStart(2, '0')}${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
      this.referencePaiement = num.replace(/[^0-9]/g, '').slice(-8).padStart(8, '0');
      this.cle = this.calculerCle(this.referencePaiement);
    }
  }

  /**
   * Calcule une clé de contrôle
   */
  calculerCle(reference: string): string {
    if (!reference) return '';
    
    let somme = 0;
    for (let i = 0; i < reference.length; i++) {
      somme += parseInt(reference[i]) * (i + 1);
    }
    return (somme % 97).toString().padStart(2, '0');
  }

  /**
   * Retourne à la liste des factures
   * ✅ CORRIGÉ
   */
  retourListe(): void {
    this.router.navigate(['/dashboard/factures']);
  }

  /**
   * Sauvegarde une nouvelle facture (format backend FactureRequestDTO)
   */
  sauvegarderFacture(): void {
    if (!this.facture) return;
    if (!this.selectedAcheteurId || !this.vendeurId) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Validation',
        detail: 'Veuillez sélectionner l\'acheteur et l\'émetteur'
      });
      return;
    }
    if (this.lignesFacture.length === 0) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Validation',
        detail: 'Veuillez ajouter au moins une ligne (produit + quantité)'
      });
      return;
    }
    this.isLoading = true;
    const request: FactureRequest = {
      dateEmission: this.facture.dateEmission,
      datePaiement: this.facture.datePaiement,
      acheteurId: this.selectedAcheteurId,
      typeAcheteur: this.typeAcheteur,
      vendeurId: this.vendeurId,
      modePaiement: this.modePaiement,
      statut: this.facture.statut || 'BROUILLON',
      lignes: this.lignesFacture.map(l => ({ produitId: l.produitId, quantite: l.quantite }))
    };
    this.factureService.createFacture(request).subscribe({
      next: (factureCreee) => {
        this.messageService.add({
          severity: 'success',
          summary: 'Succès',
          detail: 'Facture créée avec succès'
        });
        this.isLoading = false;
        this.router.navigate(['/dashboard/factures', factureCreee.id]);
      },
      error: (error) => {
        console.error('Erreur:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Erreur',
          detail: getHttpErrorMessage(error, 'Impossible de créer la facture')
        });
        this.isLoading = false;
      }
    });
  }

  /**
   * Imprime la facture
   */
  imprimerFacture(): void {
    if (!this.facture) return;
    window.print();
    this.messageService.add({
      severity: 'info',
      summary: 'Impression',
      detail: 'Préparation de l\'impression...'
    });
  }

  /**
   * Vérifie si la facture peut être modifiée
   */
  peutModifier(): boolean {
    return this.facture?.statut === 'BROUILLON' || this.facture?.statut === 'EN_ATTENTE';
  }

  /**
   * Label de l'acheteur sélectionné (pour le template - évite arrow function)
   */
  get selectedAcheteurRaisonSociale(): string {
    if (!this.selectedAcheteurId || !this.clients?.length) return 'Sélectionnez un client';
    const c = this.clients.find((x: any) => x.id === this.selectedAcheteurId);
    return c?.raisonSociale || 'Sélectionnez un client';
  }
}