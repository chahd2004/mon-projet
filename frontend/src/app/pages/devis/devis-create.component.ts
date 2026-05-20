import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { switchMap } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

import { ClientService } from '../../core/services/client.service';
import { ProduitService } from '../../core/services/produit.service';
import { DevisService } from '../../core/services/devis.service';
import { AuthService } from '../../core/services/auth.service';
import { Client, ClientRequest, RegionTunisie } from '../../models/client.model';
import { Produit } from '../../models/produit.model';
import { Devis, DevisRequest } from '../../models/devis.model';

interface DevisLineForm {
  produitId: number | null;
  quantite: number;
}

@Component({
  selector: 'app-devis-create',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  templateUrl: './devis-create.component.html',
  styleUrls: ['./devis-create.component.scss']
})
export class DevisCreateComponent implements OnInit {
  private readonly clientService = inject(ClientService);
  private readonly produitService = inject(ProduitService);
  private readonly devisService = inject(DevisService);
  private readonly authService = inject(AuthService);
  private readonly translate = inject(TranslateService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly http = inject(HttpClient);

  private langSub?: any;

  clients: Client[] = [];
  produits: Produit[] = [];

  clientId: number | null = null;
  vendeurSelected: any = null;
  dateEmission: Date | string = new Date();
  dateValidite: Date | string | null = null;
  editId: number | null = null;

  lignes: DevisLineForm[] = [{ produitId: null, quantite: 1 }];

  remiseGlobalePercent = 0;
  fraisPort = 0;

  loading = false;
  errorMessage = '';
  displayClientModal = false;
  clientSaving = false;
  clientModalError = '';

  clientForm: Partial<ClientRequest> = {
    raisonSociale: '',
    email: '',
    telephone: '',
    adresseComplete: '',
    pays: 'TUNISIE',
    region: 'TUNIS'
  };

  regions: any[] = [];

  get isEditMode(): boolean {
    return this.editId !== null;
  }

  ngOnInit(): void {
    const editIdParam = this.route.snapshot.queryParamMap.get('editId');
    const parsedId = Number(editIdParam || 0);
    this.editId = parsedId > 0 ? parsedId : null;

    this.initTranslations();
    this.loadData();
  }

  private initTranslations(): void {
    this.updateOptions();
    this.langSub = this.translate.onLangChange.subscribe(() => {
      this.updateOptions();
    });
  }

  private updateOptions(): void {
    this.regions = [
      { label: this.translate.instant('DASHBOARD.REGIONS.TUNIS'), value: 'TUNIS' },
      { label: this.translate.instant('DASHBOARD.REGIONS.ARIANA'), value: 'ARIANA' },
      { label: this.translate.instant('DASHBOARD.REGIONS.BEN_AROUS'), value: 'BEN_AROUS' },
      { label: this.translate.instant('DASHBOARD.REGIONS.MANOUBA'), value: 'MANOUBA' },
      { label: this.translate.instant('DASHBOARD.REGIONS.NABEUL'), value: 'NABEUL' },
      { label: this.translate.instant('DASHBOARD.REGIONS.ZAGHOUAN'), value: 'ZAGHOUAN' },
      { label: this.translate.instant('DASHBOARD.REGIONS.BIZERTE'), value: 'BIZERTE' },
      { label: this.translate.instant('DASHBOARD.REGIONS.BEJA'), value: 'BEJA' },
      { label: this.translate.instant('DASHBOARD.REGIONS.JENDOUBA'), value: 'JENDOUBA' },
      { label: this.translate.instant('DASHBOARD.REGIONS.KEF'), value: 'KEF' },
      { label: this.translate.instant('DASHBOARD.REGIONS.SILIANA'), value: 'SILIANA' },
      { label: this.translate.instant('DASHBOARD.REGIONS.SOUSSE'), value: 'SOUSSE' },
      { label: this.translate.instant('DASHBOARD.REGIONS.MONASTIR'), value: 'MONASTIR' },
      { label: this.translate.instant('DASHBOARD.REGIONS.MAHDIA'), value: 'MAHDIA' },
      { label: this.translate.instant('DASHBOARD.REGIONS.SFAX'), value: 'SFAX' },
      { label: this.translate.instant('DASHBOARD.REGIONS.KAIROUAN'), value: 'KAIROUAN' },
      { label: this.translate.instant('DASHBOARD.REGIONS.KASSERINE'), value: 'KASSERINE' },
      { label: this.translate.instant('DASHBOARD.REGIONS.SIDI_BOUZID'), value: 'SIDI_BOUZID' },
      { label: this.translate.instant('DASHBOARD.REGIONS.GABES'), value: 'GABES' },
      { label: this.translate.instant('DASHBOARD.REGIONS.MEDENINE'), value: 'MEDENINE' },
      { label: this.translate.instant('DASHBOARD.REGIONS.TATAOUINE'), value: 'TATAOUINE' },
      { label: this.translate.instant('DASHBOARD.REGIONS.GAFSA'), value: 'GAFSA' },
      { label: this.translate.instant('DASHBOARD.REGIONS.TOZEUR'), value: 'TOZEUR' },
      { label: this.translate.instant('DASHBOARD.REGIONS.KEBILI'), value: 'KEBILI' }
    ];
  }

  retourAuxDevis(): void {
    this.router.navigate(['/devis']);
  }

  ouvrirNouveauClientModal(): void {
    this.clientModalError = '';
    this.displayClientModal = true;
  }

  fermerNouveauClientModal(): void {
    this.displayClientModal = false;
    this.clientModalError = '';
    this.resetClientForm();
  }

  private resetClientForm(): void {
    this.clientForm = {
      raisonSociale: '',
      email: '',
      telephone: '',
      adresseComplete: '',
      pays: 'TUNISIE',
      region: 'TUNIS'
    };
  }

  sauvegarderNouveauClient(): void {
    const raisonSociale = this.clientForm.raisonSociale?.trim();
    const email = this.clientForm.email?.trim();
    const telephone = this.clientForm.telephone?.trim();
    const adresseComplete = this.clientForm.adresseComplete?.trim();
    const pays = this.clientForm.pays?.trim() || 'TUNISIE';
    const region = this.clientForm.region;

    if (!raisonSociale || !email || !telephone || !adresseComplete || !region) {
      this.clientModalError = 'Veuillez renseigner tous les champs obligatoires.';
      return;
    }

    if (!/^[0-9]{8}$/.test(telephone)) {
      this.clientModalError = 'Le telephone doit contenir exactement 8 chiffres.';
      return;
    }

    const payload: ClientRequest = {
      code: this.generateClientCode(),
      raisonSociale,
      email,
      telephone,
      adresseComplete,
      pays,
      region
    };

    this.clientSaving = true;
    this.clientModalError = '';

    this.clientService.createClient(payload).subscribe({
      next: (created) => {
        this.clientSaving = false;
        this.clients = [...this.clients, created];
        this.clientId = created.id;
        this.fermerNouveauClientModal();
      },
      error: (error) => {
        this.clientSaving = false;
        this.clientModalError = error?.error?.message || 'Impossible de creer le client.';
      }
    });
  }

  loadData(): void {
    this.loading = true;
    this.errorMessage = '';

    this.clientService.getClients().subscribe({
      next: (clients) => {
        this.clients = clients || [];
        this.produitService.getProduits().subscribe({
          next: (produits) => {
            this.produits = produits || [];
            this.loadConnectedVendeur();
            if (this.editId) {
              this.loadDevisForEdit(this.editId);
            } else {
              this.loading = false;
            }
          },
          error: () => {
            this.loading = false;
            this.errorMessage = 'Impossible de charger les produits.';
          }
        });
      },
      error: () => {
        this.loading = false;
        this.errorMessage = 'Impossible de charger les clients.';
      }
    });
  }

  private loadConnectedVendeur(): void {
    const user = this.authService.currentUser();
    const vendeurId = user?.emetteurId || user?.entrepriseId;
    if (vendeurId) {
      this.http.get<any>(`${environment.apiUrl}/emetteurs/${vendeurId}`).subscribe({
        next: (v) => this.vendeurSelected = v
      });
    }
  }

  ajouterLigne(): void {
    this.lignes.push({ produitId: null, quantite: 1 });
  }

  supprimerLigne(index: number): void {
    this.lignes.splice(index, 1);
    if (!this.lignes.length) {
      this.ajouterLigne();
    }
  }

  getProduit(line: DevisLineForm): Produit | null {
    if (!line.produitId) {
      return null;
    }

    return this.produits.find(p => p.id === line.produitId) ?? null;
  }

  getLigneMontantHT(line: DevisLineForm): number {
    const produit = this.getProduit(line);
    if (!produit) {
      return 0;
    }

    return (produit.prixUnitaire || 0) * (line.quantite || 0);
  }

  getLigneMontantTVA(line: DevisLineForm): number {
    const produit = this.getProduit(line);
    if (!produit) {
      return 0;
    }

    return this.getLigneMontantHT(line) * ((produit.tauxTVA || 0) / 100);
  }

  getLigneMontantTTC(line: DevisLineForm): number {
    return this.getLigneMontantHT(line) + this.getLigneMontantTVA(line);
  }

  get totalHT(): number {
    const base = this.lignes.reduce((sum, line) => sum + this.getLigneMontantHT(line), 0);
    return Math.max(0, base);
  }

  get totalTVA(): number {
    const baseTVA = this.lignes.reduce((sum, line) => sum + this.getLigneMontantTVA(line), 0);
    const ratio = this.lignes.reduce((sum, line) => sum + this.getLigneMontantHT(line), 0);
    if (ratio <= 0) {
      return 0;
    }
    const totalAfterGlobalDiscount = this.totalHT;
    return (baseTVA * totalAfterGlobalDiscount) / ratio;
  }

  get totalTTC(): number {
    return this.totalHT + this.totalTVA + 0.5;
  }

  private loadDevisForEdit(id: number): void {
    this.devisService.getById(id).subscribe({
      next: (devis) => {
        this.clientId = devis.acheteurId ?? null;
        this.dateEmission = devis.dateCreation || this.toDateOnly(new Date());
        this.dateValidite = devis.dateValidite ?? null;

        this.lignes = (devis.lignes || []).map(line => ({
          produitId: line.produitId ?? null,
          quantite: Math.max(1, Number(line.quantite || 1))
        }));

        if (!this.lignes.length) {
          this.lignes = [{ produitId: null, quantite: 1 }];
        }

        if (devis.vendeurId) {
          this.http.get<any>(`${environment.apiUrl}/emetteurs/${devis.vendeurId}`).subscribe({
            next: (v) => this.vendeurSelected = v
          });
        }

        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.errorMessage = 'Impossible de charger le devis a modifier.';
      }
    });
  }

  private buildPayload(): DevisRequest | null {
    const currentUser = this.authService.currentUser();
    const vendeurId = currentUser?.emetteurId;

    if (!this.clientId) {
      this.errorMessage = 'Veuillez selectionner un client.';
      return null;
    }

    if (!vendeurId) {
      this.errorMessage = 'Aucun emetteur associe au compte connecte.';
      return null;
    }

    const lignes = this.lignes
      .filter(line => !!line.produitId && line.quantite > 0)
      .map(line => ({
        produitId: Number(line.produitId),
        quantite: Number(line.quantite)
      }));

    if (!lignes.length) {
      this.errorMessage = 'Ajoutez au moins une ligne produit valide.';
      return null;
    }

    return {
      dateCreation: this.toDateOnly(this.dateEmission),
      acheteurId: this.clientId,
      typeAcheteur: 'CLIENT',
      vendeurId,
      dateValidite: this.dateValidite ? this.toDateOnly(this.dateValidite) : null,
      lignes
    };
  }

  enregistrerBrouillon(): void {
    const payload = this.buildPayload();
    if (!payload) {
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    const request$ = this.editId
      ? this.devisService.update(this.editId, payload)
      : this.devisService.create(payload);

    request$.subscribe({
      next: (created) => {
        this.loading = false;
        this.router.navigate(['/devis']);
      },
      error: (error) => {
        this.loading = false;
        this.errorMessage = error?.error?.message || 'Erreur lors de l\'enregistrement du devis.';
      }
    });
  }

  creerEtEnvoyer(): void {
    const payload = this.buildPayload();
    if (!payload) {
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    const request$ = this.editId
      ? this.devisService.update(this.editId, payload)
      : this.devisService.create(payload);

    request$
      .pipe(switchMap((saved: Devis) => this.devisService.envoyer(saved.id)))
      .subscribe({
        next: () => {
          this.loading = false;
          this.router.navigate(['/devis']);
        },
        error: (error) => {
          this.loading = false;
          this.errorMessage = error?.error?.message || 'Erreur lors de la mise a jour/envoi du devis.';
        }
      });
  }

  private toDateOnly(date: Date | string): string {
    if (typeof date === 'string') {
      // input[type=date] returns YYYY-MM-DD
      return /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : this.toDateOnly(new Date(date));
    }

    if (Number.isNaN(date.getTime())) {
      return this.toDateOnly(new Date());
    }

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private generateClientCode(): string {
    return `CL-${Date.now().toString().slice(-8)}`;
  }

  ngOnDestroy(): void {
    if (this.langSub) {
      this.langSub.unsubscribe();
    }
  }
}
