import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';


import { FactureService } from '../../core/services/facture.service';
import { ProduitService } from '../../core/services/produit.service';
import { Facture } from '../../models/facture.model';
import { Produit } from '../../models/produit.model';
import { Avoir, AvoirType as ModelAvoirType } from '../../models/avoir.model';
import { AvoirService } from '../../core/services/avoir.service';

type AvoirType = 'AVOIR TOTAL' | 'AVOIR PARTIEL';

interface AvoirDetailLigne {
  produitId: number;
  designation: string;
  quantite: number;
  prixHT: number;
  tauxTVA: number;
  total: number;
}

@Component({
  selector: 'app-avoir-detail',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './avoir-detail.component.html',
  styleUrls: ['./avoir-detail.component.scss']
})
export class AvoirDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly factureService = inject(FactureService);
  private readonly produitService = inject(ProduitService);
  private readonly avoirService = inject(AvoirService);

  loading = false;
  errorMessage = '';
  infoMessage = '';

  avoirId = 0;
  avoir: Avoir | null = null;
  sourceFacture: Facture | null = null;
  editMode = false;

  lignes: AvoirDetailLigne[] = [];

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.avoirId = Number(params['id'] || 0);
      this.editMode = this.router.url.includes('/edit/');
      
      if (this.avoirId) {
        this.loadDetail();
      } else {
        this.errorMessage = 'Identifiant d avoir invalide.';
      }
    });
  }

  retour(): void {
    this.router.navigate(['/avoirs']);
  }

  get referenceAvoir(): string {
    return this.avoir?.numAvoir || '-';
  }

  get clientNom(): string {
    return this.avoir?.nomAcheteur || '-';
  }

  get factureSourceRef(): string {
    if (this.sourceFacture?.numFact) {
      return this.sourceFacture.numFact;
    }

    return this.extractFactureReference(this.avoir) || '-';
  }

  get dateCreation(): string {
    return this.avoir?.dateCreation || '';
  }

  get typeAvoir(): AvoirType {
    if (!this.lignes.length || !this.sourceFacture?.lignes?.length) {
      return 'AVOIR PARTIEL';
    }

    const sourceCount = this.sourceFacture.lignes.length;
    const avoirCount = this.avoir?.lignes?.length || 0;

    if (avoirCount >= sourceCount) {
      return 'AVOIR TOTAL';
    }

    return 'AVOIR PARTIEL';
  }

  get motifAffichage(): string {
    return this.avoir?.motif || `Annulation de la facture ${this.factureSourceRef}`;
  }

  get totalHT(): number {
    return this.lignes.reduce((sum, ligne) => sum + ligne.prixHT * ligne.quantite, 0);
  }

  get totalTVA(): number {
    return this.lignes.reduce((sum, ligne) => {
      const ht = ligne.prixHT * ligne.quantite;
      return sum + ht * (ligne.tauxTVA / 100);
    }, 0);
  }

  get totalTTC(): number {
    return this.lignes.reduce((sum, ligne) => sum + ligne.total, 0);
  }

  get factureInitiale(): number {
    return Number(this.sourceFacture?.totalTTC || this.avoir?.totalTTC || 0);
  }

  get nouveauSolde(): number {
    return Math.max(0, this.factureInitiale - this.totalTTC);
  }

  get statusLabel(): string {
    const raw = (this.avoir?.statut || '').toUpperCase();

    if (raw === 'BROUILLON') {
      return 'DRAFT';
    }

    if (raw === 'EN_ATTENTE') {
      return 'SENT';
    }

    return raw || '-';
  }

  get statusClass(): string {
    const value = this.statusLabel;

    if (value === 'DRAFT') {
      return 'draft';
    }

    if (value === 'SENT') {
      return 'sent';
    }

    if (value === 'APPLIED') {
      return 'applied';
    }

    return 'default';
  }

  get statusHint(): string {
    if (this.statusLabel === 'DRAFT') {
      return "L'avoir est en brouillon. Vous pouvez modifier les lignes pour un avoir partiel.";
    }

    if (this.statusLabel === 'SENT') {
      return 'Avoir envoye. En attente d application.';
    }

    if (this.statusLabel === 'APPLIED') {
      return 'Avoir applique a la facture source.';
    }

    return 'Statut de l avoir.';
  }

  modifier(): void {
    this.router.navigate(['/avoirs/edit', this.avoirId]);
  }

  supprimer(): void {
    if (confirm('Êtes-vous sûr de vouloir supprimer cet avoir ?')) {
      this.loading = true;
      this.avoirService.deleteAvoir(this.avoirId).subscribe({
        next: () => {
          this.loading = false;
          this.router.navigate(['/avoirs']);
        },
        error: (err) => {
          this.loading = false;
          this.errorMessage = 'Erreur lors de la suppression de l\'avoir.';
        }
      });
    }
  }

  valider(): void {
    this.loading = true;
    this.avoirService.validerAvoir(this.avoirId).subscribe({
      next: (res: Avoir) => {
        this.avoir = res;
        this.loading = false;
        this.infoMessage = 'Avoir validé avec succès.';
        this.loadDetail(); // Refresh to see changes
      },
      error: (err: any) => {
        this.loading = false;
        this.errorMessage = 'Erreur lors de la validation.';
      }
    });
  }

  envoyer(): void {
    this.loading = true;
    this.avoirService.envoyerAvoir(this.avoirId).subscribe({
      next: (res: Avoir) => {
        this.avoir = res;
        this.loading = false;
        this.infoMessage = 'Avoir envoyé au client avec succès.';
        this.loadDetail();
      },
      error: (err: any) => {
        this.loading = false;
        this.errorMessage = 'Erreur lors de l\'envoi.';
      }
    });
  }



  annulerEdition(): void {
    this.editMode = false;
    this.router.navigate(['/avoirs/view', this.avoirId]);
    this.loadDetail(); // Rétablir les valeurs d'origine
  }

  enregistrer(): void {
    if (!this.avoir) return;
    
    this.loading = true;
    const request = {
      motif: this.avoir.motif,
      type: this.avoir.type,
      lignes: this.lignes.map(l => ({
        produitId: l.produitId,
        quantite: l.quantite
      }))
    };

    this.avoirService.updateAvoir(this.avoirId, request).subscribe({
      next: (res) => {
        this.avoir = res;
        this.loading = false;
        this.editMode = false;
        this.infoMessage = 'Avoir mis à jour avec succès.';
        this.router.navigate(['/avoirs/view', this.avoirId]);
        this.loadDetail();
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = 'Erreur lors de la mise à jour de l\'avoir.';
      }
    });
  }



  private loadDetail(): void {
    this.loading = true;
    this.errorMessage = '';

    forkJoin([
      this.avoirService.getAvoirById(this.avoirId),
      this.factureService.getAll().pipe(catchError(() => of([] as Facture[]))),
      this.produitService.getProduits().pipe(catchError(() => of([] as Produit[])))
    ]).subscribe({
      next: ([avoir, factures, produits]) => {
        // Remapping legacy 'APPLIED' status to 'SENT'
        if (avoir && (avoir.statut as string) === 'APPLIED') {
          avoir.statut = 'SENT' as any;
        }
        this.avoir = avoir;

        const produitsMap = (produits || []).reduce<Record<number, Produit>>((acc, item) => {
          acc[item.id] = item;
          return acc;
        }, {});

        const sourceRef = this.extractFactureReference(avoir);
        if (sourceRef) {
          this.sourceFacture = (factures || []).find(item => (item.numFact || '').toUpperCase() === sourceRef.toUpperCase()) || null;
        }

        const groupedMap = new Map<number, AvoirDetailLigne>();
        (avoir.lignes || []).forEach((ligne: any) => {
          const produit = produitsMap[ligne.produitId];
          const quantite = Number(ligne.quantite || 0);
          const prixHT = Number(ligne.prixUnitaire || produit?.prixUnitaire || 0);
          const tauxTVA = Number(produit?.tauxTVA || 0);
          const ht = prixHT * quantite;
          const totalLine = ht + ht * (tauxTVA / 100);

          if (groupedMap.has(ligne.produitId)) {
            const existing = groupedMap.get(ligne.produitId)!;
            existing.quantite += quantite;
            existing.total += totalLine;
          } else {
            groupedMap.set(ligne.produitId, {
              produitId: ligne.produitId,
              designation: ligne.produitDesignation || produit?.designation || `Produit #${ligne.produitId}`,
              quantite,
              prixHT,
              tauxTVA,
              total: totalLine
            });
          }
        });

        this.lignes = Array.from(groupedMap.values());
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.errorMessage = 'Impossible de charger le detail de l avoir.';
      }
    });
  }

  private extractFactureReference(item: any): string {
    if (!item) {
      return '';
    }

    const candidates = [item.reference_unique, item.reference_ttn, (item as any).factureSourceNum]
      .map(value => (value || '').trim())
      .filter(value => !!value);

    const linked = candidates.find(value => {
      const upper = value.toUpperCase();
      return upper.includes('FACT') || upper.includes('FAC-');
    });

    return linked || '';
  }

  private isAvoir(item: Facture): boolean {
    const numero = (item.numFact || '').trim().toUpperCase();
    return numero.startsWith('AV-') || numero.startsWith('AV/') || numero.includes('AVOIR');
  }
}
