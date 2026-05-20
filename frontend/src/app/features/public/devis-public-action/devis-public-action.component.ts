import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { DevisService } from '../../../core/services/devis.service';
import { Devis } from '../../../models/devis.model';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

@Component({
  selector: 'app-devis-public-action',
  standalone: true,
  imports: [
    CommonModule,
    ButtonModule,
    ToastModule,
    TranslateModule
  ],
  providers: [MessageService],
  templateUrl: './devis-public-action.component.html',
  styleUrls: ['./devis-public-action.component.scss']
})
export class DevisPublicActionComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly devisService = inject(DevisService);
  private readonly translate = inject(TranslateService);

  devis: Devis | null = null;
  loading = true;
  errorMessage = '';

  processing = false;
  actionReussie = false;
  dejaTraite = false;
  actionType: 'ACCEPTED' | 'REJECTED' | null = null;

  ngOnInit(): void {
    const ref = this.route.snapshot.paramMap.get('ref') || '';
    if (!ref) {
      this.loading = false;
      this.errorMessage = "Devis introuvable.";
      return;
    }
    this.resolveDevis(ref);
  }

  private resolveDevis(ref: string): void {
    this.loading = true;
    this.devisService.getPublicByRef(ref).subscribe({
      next: (devis) => {
        this.devis = devis;
        if (this.devis.statut === 'ACCEPTED' || this.devis.statut === 'REJECTED') {
          this.dejaTraite = true;
          this.actionType = this.devis.statut;
        } else if (this.devis.statut !== 'SENT') {
          this.errorMessage = "Ce devis n'est pas en attente d'approbation.";
        }
        this.loading = false;
      },
      error: () => {
        this.errorMessage = "Devis introuvable.";
        this.loading = false;
      }
    });
  }

  accepter(): void {
    if (!this.devis) return;
    this.processing = true;
    this.errorMessage = '';

    this.devisService.accepterPublic(this.devis.id).subscribe({
      next: () => {
        this.processing = false;
        this.actionReussie = true;
        this.actionType = 'ACCEPTED';
      },
      error: (err) => {
        this.processing = false;
        this.errorMessage = err?.message || "Erreur lors de l'acceptation du devis.";
      }
    });
  }

  rejeter(): void {
    if (!this.devis) return;
    const raison = window.prompt(this.translate.instant('DEVIS.MSGS.REJECT_REASON_PROMPT') || 'Saisir la raison du rejet:');
    if (!raison || !raison.trim()) return;

    this.processing = true;
    this.errorMessage = '';

    this.devisService.rejeterPublic(this.devis.id, raison.trim()).subscribe({
      next: () => {
        this.processing = false;
        this.actionReussie = true;
        this.actionType = 'REJECTED';
      },
      error: (err) => {
        this.processing = false;
        this.errorMessage = err?.message || "Erreur lors du rejet du devis.";
      }
    });
  }

  fermer(): void {
    window.close();
  }
}
