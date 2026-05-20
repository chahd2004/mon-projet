import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { BonCommandeService } from '../../../core/services/bon-commande.service';
import { FactureService } from '../../../core/services/facture.service';
import { SignatureService } from '../../../core/services/signature.service';
import { BonCommande } from '../../../models/bon-commande.model';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

// PrimeNG
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { FileUploadModule } from 'primeng/fileupload';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

@Component({
  selector: 'app-bon-commande-signature',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    InputTextModule,
    ButtonModule,
    FileUploadModule,
    ToastModule,
    TranslateModule
  ],
  providers: [MessageService],
  templateUrl: './bon-commande-signature.component.html',
  styleUrls: ['./bon-commande-signature.component.scss']
})
export class BonCommandeSignatureComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly bcService = inject(BonCommandeService);
  private readonly factureService = inject(FactureService);
  private readonly signatureService = inject(SignatureService);
  private readonly translate = inject(TranslateService);

  // BC data
  bonCommande: BonCommande | null = null;
  loading = true;
  errorMessage = '';

  // Form state
  selectedFile: File | null = null;
  selectedFileName = '';
  password = '';
  signing = false;
  signatureReussie = false;
  dejaSigne = false;

  // Factures list
  factures: any[] = [];

  ngOnInit(): void {
    const ref = this.route.snapshot.paramMap.get('ref') || '';
    if (!ref) {
      this.loading = false;
      this.errorMessage = this.translate.instant('PUBLIC_SIGNATURE.NOT_FOUND_BC');
      return;
    }
    this.resolveBC(ref);
  }

  private resolveBC(ref: string): void {
    this.loading = true;
    this.bcService.getPublicByRef(ref).subscribe({
      next: (bc) => {
        this.bonCommande = bc;
        if (this.bonCommande.statut === 'SIGNED_CLIENT') {
          this.dejaSigne = true;
        }
        this.loading = false;
      },
      error: () => {
        this.errorMessage = this.translate.instant('PUBLIC_SIGNATURE.NOT_FOUND_BC');
        this.loading = false;
      }
    });
  }

  onFileSelect(event: any): void {
    if (event.files && event.files.length > 0) {
      this.selectedFile = event.files[0];
      this.selectedFileName = this.selectedFile?.name || '';
    }
  }

  canSign(): boolean {
    return !!this.selectedFile && this.password.trim().length > 0 && !this.signing;
  }

  async signer(): Promise<void> {
    if (!this.bonCommande || !this.selectedFile || !this.canSign()) return;

    this.signing = true;
    this.errorMessage = '';

    try {
      // 1. Récupérer le XML brut
      const xmlBrut = await this.signatureService.getXmlBrutBCPublic(this.bonCommande.id);

      // 2. Signer localement
      const xmlSigne = await this.signatureService.signerXAdES(
        this.selectedFile,
        this.password,
        xmlBrut,
        this.bonCommande.id
      );

      // 3. Envoyer le XML signé
      await this.signatureService.envoyerXmlSigneBCPublic(this.bonCommande.id, xmlSigne);

      this.signing = false;
      this.signatureReussie = true;

      // 4. Charger les factures pour les afficher
      this.chargerFactures();

    } catch (err: any) {
      this.signing = false;
      this.errorMessage = err?.message || 'Erreur lors de la signature. Vérifiez votre certificat et mot de passe.';
      console.error('Signature error:', err);
    }
  }

  private chargerFactures(): void {
    this.factureService.getAll().subscribe({
      next: (factures) => {
        this.factures = factures;
      },
      error: (err) => {
        console.error('Erreur chargement factures:', err);
        this.factures = [];
      }
    });
  }

  fermer(): void {
    window.close();
  }
}
