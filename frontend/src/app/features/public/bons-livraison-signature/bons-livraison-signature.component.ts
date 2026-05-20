import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { BonLivraisonService } from '../../../core/services/bon-livraison.service';
import { SignatureService } from '../../../core/services/signature.service';
import { BonLivraison } from '../../../models/bon-livraison.model';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

// PrimeNG
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { FileUploadModule } from 'primeng/fileupload';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

@Component({
  selector: 'app-bons-livraison-signature',
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
  templateUrl: './bons-livraison-signature.component.html',
  styleUrls: ['./bons-livraison-signature.component.scss']
})
export class BonsLivraisonSignatureComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly blService = inject(BonLivraisonService);
  private readonly signatureService = inject(SignatureService);
  private readonly translate = inject(TranslateService);

  // BL data
  bonLivraison: BonLivraison | null = null;
  loading = true;
  errorMessage = '';

  // Form state
  selectedFile: File | null = null;
  selectedFileName = '';
  password = '';
  signing = false;
  signatureReussie = false;
  dejaSigne = false;

  ngOnInit(): void {
    const ref = this.route.snapshot.paramMap.get('ref') || '';
    if (!ref) {
      this.loading = false;
      this.errorMessage = this.translate.instant('PUBLIC_SIGNATURE.NOT_FOUND_BL');
      return;
    }
    this.resolveBL(ref);
  }

  private resolveBL(ref: string): void {
    this.loading = true;
    this.blService.getPublicByRef(ref).subscribe({
      next: (bl) => {
        this.bonLivraison = bl;
        if (this.bonLivraison.statut === 'SIGNED_CLIENT') {
          this.dejaSigne = true;
        }
        this.loading = false;
      },
      error: () => {
        this.errorMessage = this.translate.instant('PUBLIC_SIGNATURE.NOT_FOUND_BL');
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
    if (!this.bonLivraison || !this.selectedFile || !this.canSign()) return;

    this.signing = true;
    this.errorMessage = '';

    try {
      // 1. Récupérer le XML brut
      const xmlBrut = await this.signatureService.getXmlBrutBLPublic(this.bonLivraison.id);

      // 2. Signer localement
      const xmlSigne = await this.signatureService.signerXAdES(
        this.selectedFile,
        this.password,
        xmlBrut,
        this.bonLivraison.id
      );

      // 3. Envoyer le XML signé
      await this.signatureService.envoyerXmlSigneBLPublic(this.bonLivraison.id, xmlSigne);

      this.signing = false;
      this.signatureReussie = true;

    } catch (err: any) {
      this.signing = false;
      this.errorMessage = err?.message || 'Erreur lors de la signature. Vérifiez votre certificat et mot de passe.';
      console.error('Signature error:', err);
    }
  }

  fermer(): void {
    window.close();
  }
}
