import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { DropdownModule } from 'primeng/dropdown';
import { CardModule } from 'primeng/card';
import { CalendarModule } from 'primeng/calendar';
import { TableModule } from 'primeng/table';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

import { FactureService } from '../../../core/services/facture.service';
import { ClientService } from '../../../core/services/client.service';
import { ProduitService } from '../../../core/services/produit.service';
import { Client } from '../../../models/client.model';
import { Produit } from '../../../models/produit.model';
import { FactureRequest } from '../../../models/facture.model';

@Component({
  selector: 'app-facture-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ButtonModule,
    InputTextModule,
    InputNumberModule,
    DropdownModule,
    CardModule,
    CalendarModule,
    ToastModule,
    TableModule
  ],
  providers: [MessageService],
  templateUrl: './facture-form.component.html',
  styleUrl: './facture-form.component.scss'
})
export class FactureFormComponent implements OnInit {
  form!: FormGroup;
  isSubmitting = false;

  clients: Client[] = [];
  produits: Produit[] = [];

  clientOptions: { label: string; value: number }[] = [];
  produitOptions: { label: string; value: number; prix: number; tva: number }[] = [];

  modePaiementOptions = [
    { label: 'Virement', value: 'VIREMENT' },
    { label: 'Chèque', value: 'CHEQUE' },
    { label: 'Espèces', value: 'ESPECES' },
    { label: 'Carte', value: 'CARTE' }
  ];

  constructor(
    private fb: FormBuilder,
    private factureService: FactureService,
    private clientService: ClientService,
    private produitService: ProduitService,
    private router: Router,
    private messageService: MessageService
  ) { }

  ngOnInit(): void {
    this.initForm();
    this.loadClients();
    this.loadProduits();
  }

  private initForm(): void {
    const today = new Date().toISOString().split('T')[0];
    const in30Days = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    this.form = this.fb.group({
      acheteurId: [null, Validators.required],
      typeAcheteur: ['CLIENT'],
      dateEmission: [today, Validators.required],
      datePaiement: [in30Days, Validators.required],
      modePaiement: ['', Validators.required],
      lignes: this.fb.array([])
    });

    this.addLigne();
  }

  private loadClients(): void {
    this.clientService.getClients().subscribe({
      next: (clients) => {
        this.clients = clients;
        this.clientOptions = clients.map(c => ({
          label: c.raisonSociale,
          value: c.id
        }));
      },
      error: (err) => console.error('Erreur chargement clients:', err)
    });
  }

  private loadProduits(): void {
    this.produitService.getProduits().subscribe({
      next: (produits) => {
        this.produits = produits;
        this.produitOptions = produits.map(p => ({
          label: `${p.designation} (${p.prixUnitaire} TND)`,
          value: p.id,
          prix: p.prixUnitaire,
          tva: p.tauxTVA
        }));
      },
      error: (err) => console.error('Erreur chargement produits:', err)
    });
  }

  get lignes(): FormArray {
    return this.form.get('lignes') as FormArray;
  }

  addLigne(): void {
    this.lignes.push(
      this.fb.group({
        produitId: [null, Validators.required],
        quantite: [1, [Validators.required, Validators.min(1)]]
      })
    );
  }

  removeLigne(index: number): void {
    if (this.lignes.length > 1) {
      this.lignes.removeAt(index);
    }
  }

  onProduitChange(index: number): void {
    // La quantité reste modifiable par l'utilisateur
    const ligne = this.lignes.at(index);
    const produitId = ligne.get('produitId')?.value;
    if (!produitId) return;
    // On pourrait afficher le prix ici si besoin
  }

  getProduitLabel(index: number): string {
    const ligne = this.lignes.at(index);
    const produitId = ligne.get('produitId')?.value;
    const opt = this.produitOptions.find(p => p.value === produitId);
    return opt ? `Prix: ${opt.prix} TND | TVA: ${opt.tva}%` : '';
  }

  calculateTotal(): number {
    let total = 0;
    this.lignes.controls.forEach(ctrl => {
      const produitId = ctrl.get('produitId')?.value;
      const quantite = ctrl.get('quantite')?.value || 0;
      const opt = this.produitOptions.find(p => p.value === produitId);
      if (opt) {
        const ht = opt.prix * quantite;
        total += ht * (1 + opt.tva / 100);
      }
    });
    return Math.round(total * 100) / 100;
  }

  save(): void {
    if (this.form.invalid || this.lignes.length === 0) {
      this.form.markAllAsTouched();
      this.messageService.add({ severity: 'warn', summary: 'Formulaire incomplet', detail: 'Veuillez remplir tous les champs obligatoires.' });
      return;
    }

    this.isSubmitting = true;

    const formVal = this.form.value;
    const payload: FactureRequest = {
      acheteurId: formVal.acheteurId,
      typeAcheteur: formVal.typeAcheteur,
      vendeurId: 0, // Le backend écrase avec l'entreprise de l'utilisateur connecté
      dateEmission: formVal.dateEmission,
      datePaiement: formVal.datePaiement,
      modePaiement: formVal.modePaiement,
      lignes: formVal.lignes.map((l: any) => ({
        produitId: l.produitId,
        quantite: l.quantite
      }))
    };

    this.factureService.createFacture(payload).subscribe({
      next: (facture) => {
        this.isSubmitting = false;
        this.messageService.add({
          severity: 'success',
          summary: 'Facture créée',
          detail: `La facture ${facture.numFact} a été créée avec succès.`
        });
        setTimeout(() => this.router.navigate(['/entreprise-admin/factures']), 1500);
      },
      error: (err) => {
        this.isSubmitting = false;
        const msg = err?.error?.message || err?.message || 'Erreur lors de la création de la facture.';
        this.messageService.add({ severity: 'error', summary: 'Erreur', detail: msg });
        console.error('Erreur création facture:', err);
      }
    });
  }

  cancel(): void {
    this.router.navigate(['/entreprise-admin/factures']);
  }
}
