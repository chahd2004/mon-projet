// src/app/pages/facture/facture.component.ts
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import jsPDF from 'jspdf';

// PrimeNG
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { ToastModule } from 'primeng/toast';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { DropdownModule } from 'primeng/dropdown';
import { CalendarModule } from 'primeng/calendar';
import { TooltipModule } from 'primeng/tooltip';
import { TableModule } from 'primeng/table';
import { MessageService } from 'primeng/api';
import { TagModule } from 'primeng/tag';
import { DividerModule } from 'primeng/divider';
import { TranslateModule } from '@ngx-translate/core';
import { AuthService } from '../../core/services/auth.service';
import { ErrorHandlerService } from '../../core/services/error-handler.service';
import { AvoirService } from '../../core/services/avoir.service';
import { EmetteurService } from '../../core/services/emetteur.service';
import { TranslateService } from '@ngx-translate/core';
import { Facture, StatutFacture } from '../../models/facture.model';

// QR Code
import { QRCodeComponent } from 'angularx-qrcode';

import { environment } from '../../../environments/environment';
import { FactureRefreshService } from '../../core/services/facture-refresh.service';

const DEFAULT_VENDEUR_ID = 1;

interface Emetteur {
  id: number;
  raisonSociale: string;
  email?: string;
  telephone?: string;
  adresseComplete?: string;
  matriculeFiscal?: string;
  code?: string;
}

interface Client {
  id: number;
  raisonSociale: string;
  email?: string;
  telephone?: string;
  adresseComplete?: string;
}

interface Produit {
  id: number;
  reference: string;
  designation: string;
  prixUnitaire: number;
  tauxTVA: number;
}

interface LigneFacture {
  produitId: number;
  produitLabel: string;
  quantite: number;
  prixUnitaire: number;
  tauxTVA: number;
  montantHT: number;
  montantTVA: number;
  montantTTC: number;
}

@Component({
  selector: 'app-facture',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    ButtonModule, CardModule, ToastModule,
    InputTextModule, InputNumberModule,
    DropdownModule, CalendarModule,
    TooltipModule, TableModule, TagModule, DividerModule,
    TranslateModule,
    QRCodeComponent
  ],
  providers: [MessageService],
  templateUrl: './facture.component.html',
  styleUrls: ['./facture.component.scss']
})
export class FactureComponent implements OnInit {
  private http = inject(HttpClient);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private emetteurService = inject(EmetteurService);
  private translate = inject(TranslateService);
  private messageService = inject(MessageService);
  private authService = inject(AuthService);
  private errorHandler = inject(ErrorHandlerService);
  private avoirService = inject(AvoirService);
  private factureRefresh = inject(FactureRefreshService);

  // ===== MODE =====
  mode: 'view' | 'edit' | 'create' = 'create';
  factureId: number | null = null;

  get isViewMode(): boolean { return this.mode === 'view'; }
  get isEditMode(): boolean { return this.mode === 'edit'; }
  get isCreateMode(): boolean { return this.mode === 'create'; }
  get isViewer(): boolean { return this.authService.hasRole('ENTREPRISE_VIEWER'); }

  get pageTitle(): string {
    if (this.mode === 'view') return this.translate.instant('FACTURES.ACTIONS.VIEW') + ' ' + this.translate.instant('FACTURE.TITLE');
    if (this.mode === 'edit') return this.translate.instant('FACTURES.ACTIONS.EDIT') + ' ' + this.translate.instant('FACTURE.TITLE');
    return this.translate.instant('FACTURES.NEW');
  }

  // ===== QR CODE =====
  get qrUrl(): string {
    const id = this.factureId ?? 'UNKNOWN';
    const baseUrl = environment.qrBaseUrl || window.location.origin;
    return `${baseUrl}/public/facture/${id}`;
  }

  // ===== DONNÉES =====
  emetteurs: Emetteur[] = [];
  clients: Client[] = [];
  produits: Produit[] = [];
  vendeurSelectionne: Emetteur | null = null;
  acheteurSelectionne: Client | Emetteur | null = null;

  // ===== FORMULAIRE =====
  dateEmission: Date = new Date();
  datePaiement: Date = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  numFact: string = '';
  vendeurId: number = DEFAULT_VENDEUR_ID;
  acheteurId: number | null = null;
  typeAcheteur: 'CLIENT' | 'EMETTEUR' = 'CLIENT';
  modePaiement: string = 'VIREMENT';
  statut: string = 'DRAFT';
  referenceTtn: string = '';
  previousStatut: string = '';

  get acheteurMatricule(): string | undefined {
    if (this.acheteurSelectionne && 'matriculeFiscal' in this.acheteurSelectionne) {
      return (this.acheteurSelectionne as Emetteur).matriculeFiscal;
    }
    return undefined;
  }
  lignes: LigneFacture[] = [];

  produitSelectionne: Produit | null = null;
  quantiteAjout: number = 1;

  typeAcheteurOptions: any[] = [];
  modePaiementOptions: any[] = [];
  statutOptions: any[] = [];

  loading = false;
  minDatePaiement: Date = new Date();

  private langChangeSub?: any;

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    const modeParam = this.route.snapshot.queryParamMap.get('mode');

    if (!idParam || idParam === 'nouvelle') {
      this.mode = 'create';
    } else {
      this.factureId = Number(idParam);
      this.mode = modeParam === 'edit' ? 'edit' : 'view';
    }

    if (this.isViewer && this.mode === 'edit') {
      this.mode = 'view';
    }

    this.initTranslations();
    this.loadEmetteurs();
    this.loadClients();
    this.loadProduits();
  }

  initTranslations(): void {
    this.langChangeSub = this.translate.onLangChange.subscribe(() => {
      this.initOptions();
    });
    this.initOptions();
  }

  initOptions(): void {
    this.typeAcheteurOptions = [
      { label: this.translate.instant('FACTURE.BUYER_TYPES.CLIENT'), value: 'CLIENT' },
      { label: this.translate.instant('FACTURE.BUYER_TYPES.EMETTEUR'), value: 'EMETTEUR' }
    ];
    this.modePaiementOptions = [
      { label: this.translate.instant('FACTURE.PAYMENT_METHODS.VIREMENT'), value: 'VIREMENT' },
      { label: this.translate.instant('FACTURE.PAYMENT_METHODS.CHEQUE'), value: 'CHEQUE' },
      { label: this.translate.instant('FACTURE.PAYMENT_METHODS.ESPECES'), value: 'ESPECES' },
      { label: this.translate.instant('FACTURE.PAYMENT_METHODS.CARTE'), value: 'CARTE' }
    ];
    this.statutOptions = [
      { label: this.translate.instant('STATUS.DRAFT'), value: 'DRAFT' },
      { label: this.translate.instant('STATUS.SIGNED'), value: 'SIGNED' },
      { label: this.translate.instant('STATUS.SENT'), value: 'SENT' },
      { label: this.translate.instant('STATUS.PAID'), value: 'PAID' },
      { label: this.translate.instant('STATUS.REJECTED'), value: 'REJECTED' },
      { label: this.translate.instant('STATUS.CANCELLED'), value: 'CANCELLED' }
    ];
  }

  // ===== CHARGEMENTS =====
  loadEmetteurs(): void {
    const connectedUser = this.authService.currentUser();
    const connectedId = connectedUser?.emetteurId || connectedUser?.entrepriseId || DEFAULT_VENDEUR_ID;

    this.http.get<Emetteur[]>(`${environment.apiUrl}/emetteurs`).subscribe({
      next: (data) => {
        this.emetteurs = data;

        // Par défaut, on prend l'ID du compte connecté pour une nouvelle facture
        if (this.isCreateMode && !this.vendeurSelectionne) {
          const vendeur = data.find(e => e.id === connectedId);
          if (vendeur) {
            this.vendeurSelectionne = vendeur;
            this.vendeurId = vendeur.id;
          }
        }

        if ((this.isEditMode || this.isViewMode) && this.factureId) {
          this.loadFacture(this.factureId);
        }
      },
      error: (err) => this.messageService.add({ severity: 'warn', summary: 'Attention', detail: this.errorHandler.extractErrorMessage(err) })
    });
  }

  loadClients(): void {
    this.http.get<Client[]>(`${environment.apiUrl}/clients`).subscribe({
      next: (data) => { this.clients = data; this.onAcheteurChange(); },
      error: (err) => this.messageService.add({ severity: 'warn', summary: 'Attention', detail: this.errorHandler.extractErrorMessage(err) })
    });
  }

  loadProduits(): void {
    this.http.get<Produit[]>(`${environment.apiUrl}/produits`).subscribe({
      next: (data) => this.produits = data,
      error: (err) => this.messageService.add({ severity: 'warn', summary: 'Attention', detail: this.errorHandler.extractErrorMessage(err) })
    });
  }

  loadFacture(id: number): void {
    this.loading = true;
    this.http.get<any>(`${environment.apiUrl}/factures/${id}`).subscribe({
      next: (facture) => {
        this.numFact = facture.numFact ?? '';
        this.statut = facture.statut ?? 'DRAFT';
        this.referenceTtn = facture.reference_ttn ?? '';
        this.previousStatut = facture.previousStatut ?? facture.previous_statut ?? '';
        this.modePaiement = facture.modePaiement ?? 'VIREMENT';
        this.typeAcheteur = facture.typeAcheteur ?? 'CLIENT';
        this.vendeurId = facture.vendeurId ?? DEFAULT_VENDEUR_ID;
        this.acheteurId = facture.acheteurId ?? null;

        if (facture.dateEmission) this.dateEmission = new Date(facture.dateEmission);
        if (facture.datePaiement) this.datePaiement = new Date(facture.datePaiement);

        this.vendeurSelectionne = this.emetteurs.find(e => e.id === this.vendeurId) ?? null;
        if (!this.vendeurSelectionne && this.vendeurId) {
          // Si l'émetteur n'est pas dans la liste initiale, on le charge spécifiquement
          this.http.get<Emetteur>(`${environment.apiUrl}/emetteurs/${this.vendeurId}`).subscribe({
            next: (e) => this.vendeurSelectionne = e
          });
        }
        this.onAcheteurChange();

        if (facture.lignes && Array.isArray(facture.lignes)) {
          this.lignes = facture.lignes.map((l: any) => this.mapLigne(l));
        }
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        this.messageService.add({ severity: 'error', summary: 'Erreur', detail: this.errorHandler.extractErrorMessage(err) });
      }
    });
  }

  private mapLigne(l: any): LigneFacture {
    const produit = this.produits.find(p => p.id === (l.produitId ?? l.produit?.id));
    const prixUnit = this.safeNum(l.prixUnitaire ?? l.prix_unitaire ?? produit?.prixUnitaire);
    const quantite = this.safeNum(l.quantite ?? l.qte ?? 1);
    const tauxTVA = this.safeNum(l.tauxTVA ?? l.taux_tva ?? produit?.tauxTVA ?? 0);
    const ht = prixUnit * quantite;
    const tva = ht * (tauxTVA / 100);
    const ttc = ht + tva;
    const label = produit
      ? `${produit.reference} — ${produit.designation}`
      : (l.produitLabel ?? l.designation ?? l.libelle ?? `Produit #${l.produitId}`);
    return {
      produitId: l.produitId ?? l.produit?.id ?? 0,
      produitLabel: label,
      quantite,
      prixUnitaire: prixUnit,
      tauxTVA,
      montantHT: this.safeNum(l.montantHT ?? l.montant_ht) || ht,
      montantTVA: this.safeNum(l.montantTVA ?? l.montant_tva) || tva,
      montantTTC: this.safeNum(l.montantTTC ?? l.montant_ttc) || ttc,
    };
  }

  private safeNum(val: any): number {
    const n = Number(val);
    return isNaN(n) ? 0 : n;
  }

  // ===== SÉLECTIONS =====
  onVendeurChange(): void {
    this.vendeurSelectionne = this.emetteurs.find(e => e.id === this.vendeurId) ?? null;
  }

  onAcheteurChange(): void {
    if (!this.acheteurId) return;
    if (this.typeAcheteur === 'CLIENT') {
      this.acheteurSelectionne = this.clients.find(c => c.id === this.acheteurId) ?? null;
    } else {
      this.acheteurSelectionne = this.emetteurs.find(e => e.id === this.acheteurId) ?? null;
    }
  }

  onTypeAcheteurChange(): void {
    this.acheteurId = null;
    this.acheteurSelectionne = null;
  }

  onDateEmissionChange(): void {
    this.minDatePaiement = new Date(this.dateEmission);
    if (this.datePaiement < this.dateEmission) {
      this.datePaiement = new Date(this.dateEmission.getTime() + 30 * 24 * 60 * 60 * 1000);
    }
  }

  onStatutChange(): void {
    // Déclenche la mise à jour des boutons d'action en fonction du nouveau statut
    // Optionnellement : sauvegarde automatique si souhaité
  }

  // ===== LIGNES =====
  get acheteurOptions(): { label: string; value: number }[] {
    const clients_labels = this.clients.map(c => ({ label: c.raisonSociale, value: c.id }));
    const emetteurs_labels = this.emetteurs.map(e => ({ label: e.raisonSociale, value: e.id }));
    if (this.typeAcheteur === 'CLIENT') return clients_labels;
    return emetteurs_labels;
  }

  get produitOptions(): { label: string; value: number }[] {
    return this.produits.map(p => ({
      label: `${p.reference} — ${p.designation} (${this.formatPrix(p.prixUnitaire)})`,
      value: p.id
    }));
  }

  ajouterLigne(): void {
    if (!this.acheteurId) {
      this.messageService.add({ severity: 'warn', summary: 'Acheteur requis', detail: "Sélectionnez un acheteur avant d'ajouter des lignes" });
      return;
    }
    if (!this.produitSelectionne) {
      this.messageService.add({ severity: 'warn', summary: 'Produit requis', detail: 'Sélectionnez un produit' });
      return;
    }
    const p = this.produitSelectionne;
    const ht = this.safeNum(p.prixUnitaire) * this.safeNum(this.quantiteAjout);
    const tva = ht * (this.safeNum(p.tauxTVA) / 100);
    this.lignes.push({
      produitId: p.id,
      produitLabel: `${p.reference} — ${p.designation}`,
      quantite: this.quantiteAjout,
      prixUnitaire: p.prixUnitaire,
      tauxTVA: p.tauxTVA,
      montantHT: ht,
      montantTVA: tva,
      montantTTC: ht + tva
    });
    this.produitSelectionne = null;
    this.quantiteAjout = 1;
  }

  supprimerLigne(index: number): void { this.lignes.splice(index, 1); }

  onProduitSelect(produitId: number): void {
    this.produitSelectionne = this.produits.find(p => p.id === produitId) ?? null;
  }

  // ===== TOTAUX =====
  get totalHT(): number { return this.lignes.reduce((s, l) => s + this.safeNum(l.montantHT), 0); }
  get totalTVA(): number { return this.lignes.reduce((s, l) => s + this.safeNum(l.montantTVA), 0); }
  get totalTTC(): number { return this.lignes.reduce((s, l) => s + this.safeNum(l.montantTTC), 0); }
  get droitTimbre(): number { return 0.500; }

  // ===== SAUVEGARDE =====
  sauvegarder(): void {
    if (this.loading) return;
    if (!this.acheteurId) {
      this.messageService.add({ severity: 'error', summary: 'Erreur', detail: 'Sélectionnez un acheteur' });
      return;
    }
    if (this.lignes.length === 0) {
      this.messageService.add({ severity: 'error', summary: 'Erreur', detail: 'Ajoutez au moins une ligne de produit' });
      return;
    }
    this.loading = true;
    const payload = {
      dateEmission: this.formatDate(this.dateEmission),
      datePaiement: this.formatDate(this.datePaiement),
      acheteurId: this.acheteurId,
      typeAcheteur: this.typeAcheteur,
      vendeurId: this.vendeurId,
      modePaiement: this.modePaiement,
      statut: this.toBackendStatut(this.statut),
      lignes: this.lignes.map(l => ({ produitId: l.produitId, quantite: l.quantite }))
    };

    const request$ = this.isEditMode && this.factureId
      ? this.http.put(`${environment.apiUrl}/factures/${this.factureId}`, payload)
      : this.http.post(`${environment.apiUrl}/factures`, payload);

    request$.subscribe({
      next: () => {
        this.loading = false;
        this.messageService.add({
          severity: 'success', summary: this.translate.instant('TOAST.SUCCESS'),
          detail: this.isEditMode ? this.translate.instant('FACTURES.MSGS.SAVE_SUCCESS_EDIT') : this.translate.instant('FACTURES.MSGS.SAVE_SUCCESS_ADD')
        });
        this.factureRefresh.notifyRefresh();
        setTimeout(() => this.router.navigate(['/factures']), 1500);
      },
      error: (err) => {
        this.loading = false;
        this.messageService.add({ severity: 'error', summary: 'Erreur', detail: this.errorHandler.extractErrorMessage(err) });
      }
    });
  }

  // ===== ACTIONS TRANSITIONS STATUT =====

  // ✅ DRAFT → SIGNED
  signerFacture(): void {
    if (!this.factureId) return;
    this.http.put<any>(`${environment.apiUrl}/factures/${this.factureId}/signer`, {}).subscribe({
      next: (f) => {
        this.statut = this.normalizeFrontStatut(f.statut);
        this.messageService.add({ severity: 'success', summary: this.translate.instant('STATUS.SIGNED'), detail: this.translate.instant('SIGNATURE.SUCCESS_MSG') });
      },
      error: (err) => this.messageService.add({ severity: 'error', summary: 'Erreur', detail: this.errorHandler.extractErrorMessage(err) })
    });
  }

  // ✅ SIGNED → SENT
  envoyerFacture(): void {
    if (!this.factureId) return;
    this.http.put<any>(`${environment.apiUrl}/factures/${this.factureId}/envoyer`, {}).subscribe({
      next: (f) => {
        this.statut = this.normalizeFrontStatut(f.statut);
        this.messageService.add({ severity: 'success', summary: this.translate.instant('STATUS.SENT'), detail: this.translate.instant('FACTURES.MSGS.EMIT_SUCCESS') });
      },
      error: (err) => this.messageService.add({ severity: 'error', summary: 'Erreur', detail: this.errorHandler.extractErrorMessage(err) })
    });
  }

  // ✅ SENT → PAID
  marquerPayee(): void {
    if (!this.factureId) return;
    this.http.put<any>(`${environment.apiUrl}/factures/${this.factureId}/payer`, {}).subscribe({
      next: (f) => {
        this.statut = this.normalizeFrontStatut(f.statut);
        this.messageService.add({ severity: 'success', summary: this.translate.instant('STATUS.PAID'), detail: this.translate.instant('FACTURES.MSGS.PAY_SUCCESS') });
      },
      error: (err) => this.messageService.add({ severity: 'error', summary: 'Erreur', detail: this.errorHandler.extractErrorMessage(err) })
    });
  }

  // ✅ SIGNED/SENT → REJECTED
  rejeterFacture(): void {
    if (!this.factureId) return;
    const raison = prompt('Raison du rejet :');
    if (!raison || raison.trim() === '') return;
    this.http.put<any>(`${environment.apiUrl}/factures/${this.factureId}/rejeter`, { raison }).subscribe({
      next: (f) => {
        this.statut = this.normalizeFrontStatut(f.statut);
        this.messageService.add({ severity: 'warn', summary: this.translate.instant('STATUS.REJECTED'), detail: this.translate.instant('FACTURES.MSGS.REJECT_SUCCESS') });
      },
      error: (err) => this.messageService.add({ severity: 'error', summary: 'Erreur', detail: this.errorHandler.extractErrorMessage(err) })
    });
  }

  // ✅ SIGNED/SENT → CANCELLED + Crée automatiquement un AVOIR TOTAL
  annulerFacture(): void {
    if (!this.factureId) return;

    this.loading = true;
    const url = `${environment.apiUrl}/factures/${this.factureId}/annuler`;

    this.http.put<any>(url, {}).subscribe({
      next: (res) => {
        this.loading = false;
        this.messageService.add({
          severity: 'success',
          summary: this.translate.instant('FACTURES.MSGS.CANCEL_SUCCESS'),
          detail: this.translate.instant('FACTURES.MSGS.CANCEL_SUCCESS')
        });

        // Rediriger vers la liste des avoirs après 1.5 secondes
        setTimeout(() => this.router.navigate(['/avoirs']), 1500);
      },
      error: (err) => {
        this.loading = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Erreur',
          detail: 'Erreur lors de l\'annulation de la facture.'
        });
      }
    });
  }

  // ✅ REJECTED → DRAFT
  retourBrouillon(): void {
    if (!this.factureId) return;
    this.http.put<any>(`${environment.apiUrl}/factures/${this.factureId}/retour-brouillon`, {}).subscribe({
      next: (f) => {
        this.statut = this.normalizeFrontStatut(f.statut);
        this.messageService.add({ severity: 'info', summary: this.translate.instant('STATUS.DRAFT'), detail: this.translate.instant('FACTURES.MSGS.DRAFT_SUCCESS') });
      },
      error: (err) => this.messageService.add({ severity: 'error', summary: 'Erreur', detail: this.errorHandler.extractErrorMessage(err) })
    });
  }

  passerEnModeEdition(): void {
    if (this.isViewer) return;
    this.mode = 'edit';
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { mode: 'edit' },
      replaceUrl: true
    });
  }

  // ===== QR CANVAS → IMG =====
  private convertirQrCanvasEnImg(container: Element): void {
    const canvas = container.querySelector('canvas') as HTMLCanvasElement;
    if (canvas) {
      const img = document.createElement('img');
      img.src = canvas.toDataURL('image/png');
      img.width = 90; img.height = 90;
      img.style.cssText = 'display:block;border-radius:6px;';
      canvas.parentNode?.replaceChild(img, canvas);
    }
  }

  imprimer(): void {
    const recu = document.querySelector('.recu-wrapper');
    if (recu) this.convertirQrCanvasEnImg(recu);
    window.print();
  }

  // ===== TÉLÉCHARGER PDF =====
  async telechargerPdfTexte(): Promise<void> {
    const fileName = this.normaliserNomFichier(`Facture_${this.numFact || 'export'}`, 'Facture_export');
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const v = this.vendeurSelectionne;
    const a = this.acheteurSelectionne;
    let y = 20;

    doc.setFillColor(30, 64, 175);
    doc.roundedRect(20, 14, 12, 12, 2, 2, 'F');
    doc.setDrawColor(255, 255, 255); doc.setLineWidth(0.5);
    doc.roundedRect(23.2, 16.4, 5.6, 7.2, 0.7, 0.7, 'S');
    doc.line(27.2, 16.4, 28.8, 18); doc.line(27.2, 18, 28.8, 18);
    doc.line(24.1, 19.2, 27.9, 19.2); doc.line(24.1, 20.7, 27.4, 20.7); doc.line(24.1, 22.2, 26.8, 22.2);

    doc.setFontSize(13); doc.setFont('helvetica', 'bold'); doc.setTextColor(30, 41, 59);
    doc.text('FacturePro — Gestion & Facturation', 36, y); y += 6;
    doc.setFontSize(9); doc.setFont('helvetica', 'normal'); doc.setTextColor(100, 116, 139);
    doc.text(v?.raisonSociale ?? '', 36, y); y += 5;
    if (v?.adresseComplete) { doc.text(v.adresseComplete, 36, y); y += 5; }
    if (v?.telephone || v?.email) { doc.text(`${v?.telephone ?? ''} | ${v?.email ?? ''}`, 36, y); y += 5; }
    doc.text(`MF : ${v?.matriculeFiscal ?? 'N/A'}`, 36, y);

    doc.setFontSize(30); doc.setFont('helvetica', 'bold'); doc.setTextColor(30, 64, 175);
    doc.text('FACTURE', 190, 22, { align: 'right' });
    doc.setFontSize(10); doc.setFont('helvetica', 'normal'); doc.setTextColor(100, 116, 139);
    doc.text(`N° ${this.numFact || '—'}`, 190, 30, { align: 'right' });

    const qrCanvas = document.querySelector('.recu-qr-block canvas') as HTMLCanvasElement;
    if (qrCanvas) { doc.addImage(qrCanvas.toDataURL('image/png'), 'PNG', 165, 33, 25, 25); }

    y = 55;
    doc.setDrawColor(226, 232, 240); doc.setLineWidth(0.3); doc.line(20, y, 190, y); y += 8;
    doc.setFontSize(7); doc.setFont('helvetica', 'bold'); doc.setTextColor(100, 116, 139);
    doc.text("DATE D'EMISSION", 20, y); doc.text("DATE DE PAIEMENT", 75, y); doc.text("MODE DE PAIEMENT", 130, y); y += 5;
    doc.setFontSize(10); doc.setFont('helvetica', 'bold'); doc.setTextColor(30, 41, 59);
    doc.text(this.dateEmission.toLocaleDateString('fr-TN'), 20, y);
    doc.text(this.datePaiement.toLocaleDateString('fr-TN'), 75, y);
    doc.text(this.formatModePaiement(this.modePaiement), 130, y); y += 10;

    doc.setFontSize(7); doc.setFont('helvetica', 'bold'); doc.setTextColor(100, 116, 139);
    doc.text('FACTURE A', 20, y); y += 5;
    doc.setFontSize(11); doc.setFont('helvetica', 'bold'); doc.setTextColor(30, 41, 59);
    doc.text(a?.raisonSociale ?? '—', 20, y); y += 5;
    doc.setFontSize(9); doc.setFont('helvetica', 'normal'); doc.setTextColor(100, 116, 139);
    if (a?.adresseComplete) { doc.text(a.adresseComplete, 20, y); y += 5; }
    if (a?.email) { doc.text(a.email, 20, y); y += 5; }
    if ((a as any)?.telephone) { doc.text((a as any).telephone, 20, y); y += 5; }
    y += 3;

    doc.setDrawColor(226, 232, 240); doc.line(20, y, 190, y); y += 8;
    doc.setFillColor(30, 41, 59); doc.rect(20, y, 170, 8, 'F');
    doc.setTextColor(255, 255, 255); doc.setFontSize(7.5); doc.setFont('helvetica', 'bold');
    doc.text('#', 22, y + 5.5); doc.text('Designation', 30, y + 5.5);
    doc.text('Qte', 100, y + 5.5, { align: 'right' }); doc.text('Prix HT', 118, y + 5.5, { align: 'right' });
    doc.text('TVA%', 133, y + 5.5, { align: 'right' }); doc.text('Mnt HT', 153, y + 5.5, { align: 'right' });
    doc.text('Total TTC', 190, y + 5.5, { align: 'right' }); y += 8;

    doc.setFont('helvetica', 'normal'); doc.setTextColor(30, 41, 59);
    this.lignes.forEach((ligne, i) => {
      if (i % 2 === 0) { doc.setFillColor(250, 251, 252); doc.rect(20, y, 170, 7, 'F'); }
      doc.setFontSize(8);
      doc.text(`${i + 1}`, 22, y + 5);
      doc.text(ligne.produitLabel.slice(0, 38), 30, y + 5);
      doc.text(`${ligne.quantite}`, 100, y + 5, { align: 'right' });
      doc.text(this.formatPrix(ligne.prixUnitaire), 118, y + 5, { align: 'right' });
      doc.text(`${ligne.tauxTVA}%`, 133, y + 5, { align: 'right' });
      doc.text(this.formatPrix(ligne.montantHT), 153, y + 5, { align: 'right' });
      doc.text(this.formatPrix(ligne.montantTTC), 190, y + 5, { align: 'right' });
      y += 7;
    });

    y += 5; doc.setDrawColor(226, 232, 240); doc.line(20, y, 190, y); y += 8;
    doc.setFontSize(8); doc.setFont('helvetica', 'bold'); doc.setTextColor(30, 41, 59);
    doc.text(v?.raisonSociale ?? '', 20, y); y += 5;
    doc.setFont('helvetica', 'normal'); doc.setTextColor(100, 116, 139);
    doc.text(`Matricule fiscal : ${v?.matriculeFiscal ?? 'N/A'}`, 20, y); y += 5;
    doc.text('Merci pour votre confiance.', 20, y);

    let ty = y - 10;
    const totaux: [string, string][] = [
      ['Total H.T.', this.formatPrix(this.totalHT)],
      ['TVA', this.formatPrix(this.totalTVA)],
      ['Droit de Timbre', this.formatPrix(this.droitTimbre)],
    ];
    totaux.forEach(([label, val]) => {
      doc.setFontSize(9); doc.setFont('helvetica', 'normal'); doc.setTextColor(100, 116, 139);
      doc.text(label, 130, ty);
      doc.setFont('helvetica', 'bold'); doc.setTextColor(30, 41, 59);
      doc.text(val, 190, ty, { align: 'right' }); ty += 7;
    });

    doc.setFillColor(30, 41, 59); doc.rect(120, ty, 70, 10, 'F');
    doc.setTextColor(255, 255, 255); doc.setFontSize(9); doc.setFont('helvetica', 'bold');
    doc.text('TOTAL T.T.C', 124, ty + 7);
    doc.text(this.formatPrix(this.totalTTC + this.droitTimbre), 190, ty + 7, { align: 'right' }); ty += 14;

    doc.setFontSize(8); doc.setFont('helvetica', 'italic'); doc.setTextColor(100, 116, 139);
    const lignesMontant = doc.splitTextToSize(this.montantEnLettres(this.totalTTC + this.droitTimbre), 70);
    doc.text(lignesMontant, 155, ty, { align: 'center' });

    doc.setFillColor(30, 41, 59); doc.rect(0, 285, 210, 12, 'F');
    doc.setTextColor(180, 180, 180); doc.setFontSize(7); doc.setFont('helvetica', 'normal');
    doc.text(`${v?.raisonSociale ?? ''} — MF : ${v?.matriculeFiscal ?? 'N/A'} — ${v?.email ?? ''}`, 105, 292, { align: 'center' });

    const savedWithPicker = await this.enregistrerPdfAvecChoixEmplacement(doc, fileName);
    if (!savedWithPicker) { doc.save(fileName); }
  }

  // ===== HELPERS =====
  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  private normaliserNomFichier(nomSaisi: string, fallback: string): string {
    let nom = nomSaisi.trim().replace(/[<>:"/\\|?*\x00-\x1F]/g, '').replace(/\s+/g, ' ');
    if (!nom) nom = fallback;
    if (!nom.toLowerCase().endsWith('.pdf')) nom += '.pdf';
    return nom;
  }

  private async enregistrerPdfAvecChoixEmplacement(doc: jsPDF, fileName: string): Promise<boolean> {
    const picker = (window as any).showSaveFilePicker;
    if (typeof picker !== 'function') return false;
    try {
      const handle = await picker({ suggestedName: fileName, types: [{ description: 'Document PDF', accept: { 'application/pdf': ['.pdf'] } }] });
      const writable = await handle.createWritable();
      await writable.write(doc.output('blob'));
      await writable.close();
      return true;
    } catch (error: any) {
      if (error?.name === 'AbortError') return true;
      return false;
    }
  }

  formatPrix(v: any): string {
    const n = this.safeNum(v);
    const parts = n.toFixed(3).split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    return parts.join(',') + ' TND';
  }

  formatModePaiement(mode: string): string {
    return this.modePaiementOptions.find(o => o.value === mode)?.label ?? mode;
  }

  formatStatut(statut: string): string {
    return this.translate.instant('STATUS.' + statut);
  }

  getStatutSeverity(statut: string): 'success' | 'warning' | 'danger' | 'info' | 'secondary' {
    const map: Record<string, any> = {
      PAID: 'success', PAYEE: 'success', SIGNED: 'success',
      EN_ATTENTE: 'warning', BROUILLON: 'warning', DRAFT: 'warning',
      EN_RETARD: 'danger', REJECTED: 'danger',
      ANNULEE: 'secondary', CANCELLED: 'secondary',
      SENT: 'info', EMISE: 'info'
    };
    return map[statut] ?? 'info';
  }

  retourListe(): void { this.router.navigate(['/factures']); }

  // ===== MONTANT EN LETTRES =====
  montantEnLettres(valeur: number): string {
    if (isNaN(valeur) || valeur < 0) return '';
    const dinars = Math.floor(valeur);
    const millimes = Math.round((valeur - dinars) * 1000);
    const dinarStr = dinars > 0 ? `${this._nombreEnLettres(dinars)} ${dinars === 1 ? 'dinar' : 'dinars'}` : '';
    const millimeStr = millimes > 0 ? `${this._nombreEnLettres(millimes)} ${millimes === 1 ? 'millime' : 'millimes'}` : '';
    if (dinarStr && millimeStr) return `${dinarStr} et ${millimeStr}`;
    if (dinarStr) return dinarStr;
    if (millimeStr) return millimeStr;
    return 'zero dinar';
  }

  private _nombreEnLettres(n: number): string {
    if (n === 0) return 'zero';
    const unites = ['', 'un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf',
      'dix', 'onze', 'douze', 'treize', 'quatorze', 'quinze', 'seize', 'dix-sept', 'dix-huit', 'dix-neuf'];
    const dizaines = ['', '', 'vingt', 'trente', 'quarante', 'cinquante', 'soixante', 'soixante', 'quatre-vingt', 'quatre-vingt'];
    const _dizaine = (n: number): string => {
      if (n < 20) return unites[n];
      const d = Math.floor(n / 10); const u = n % 10;
      if (d === 7) return u === 1 ? 'soixante et onze' : `soixante-${unites[10 + u]}`;
      if (d === 9) return u === 0 ? 'quatre-vingt-dix' : `quatre-vingt-${unites[10 + u]}`;
      if (d === 8) return u === 0 ? 'quatre-vingts' : `quatre-vingt-${unites[u]}`;
      const liaison = (u === 1 && d !== 8) ? ' et ' : '-';
      return u === 0 ? dizaines[d] : `${dizaines[d]}${liaison}${unites[u]}`;
    };
    const _centaine = (n: number): string => {
      const c = Math.floor(n / 100); const r = n % 100;
      if (c === 0) return _dizaine(r);
      const centStr = c === 1 ? 'cent' : `${unites[c]} cent${r === 0 && c > 1 ? 's' : ''}`;
      return r === 0 ? centStr : `${centStr} ${_dizaine(r)}`;
    };
    const _millier = (n: number): string => {
      const m = Math.floor(n / 1000); const r = n % 1000;
      let result = '';
      if (m > 0) result = m === 1 ? 'mille' : `${_centaine(m)} mille`;
      if (r > 0) result = result ? `${result} ${_centaine(r)}` : _centaine(r);
      return result;
    };
    const _million = (n: number): string => {
      const m = Math.floor(n / 1_000_000); const r = n % 1_000_000;
      let result = '';
      if (m > 0) result = `${_centaine(m)} million${m > 1 ? 's' : ''}`;
      if (r > 0) result = result ? `${result} ${_millier(r)}` : _millier(r);
      return result || _millier(n);
    };
    const lettres = n >= 1_000_000 ? _million(n) : _millier(n);
    return lettres.charAt(0).toUpperCase() + lettres.slice(1);
  }

  private normalizeFrontStatut(statut: string): string {
    const value = (statut || '').toUpperCase();
    const map: Record<string, string> = {
      // Legacy mappings
      BROUILLON: 'DRAFT',
      EMISE: 'SENT',
      PAYEE: 'PAID',
      ANNULEE: 'CANCELLED',
      // Backend statuts (1:1 passthrough)
      DRAFT: 'DRAFT',
      SIGNED: 'SIGNED',
      SENT: 'SENT',
      PAID: 'PAID',
      REJECTED: 'REJECTED',
      CANCELLED: 'CANCELLED'
    };

    return map[value] || value || 'DRAFT';
  }

  ngOnDestroy(): void {
    if (this.langChangeSub) {
      this.langChangeSub.unsubscribe();
    }
  }

  private toBackendStatut(statut: string): string {
    const value = (statut || '').toUpperCase();
    const map: Record<string, string> = {
      BROUILLON: 'DRAFT',
      EMISE: 'SENT',
      PAYEE: 'PAID',
      ANNULEE: 'CANCELLED',
      EN_ATTENTE: 'SENT',
      DRAFT: 'DRAFT',
      SENT: 'SENT',
      PAID: 'PAID',
      CANCELLED: 'CANCELLED'
    };

    return map[value] || value || 'DRAFT';
  }
}