import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FileUploadModule } from 'primeng/fileupload';
import { InputTextModule } from 'primeng/inputtext';
import { SignatureService } from '../../core/services/signature.service';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-signature',
  standalone: true,
  imports: [CommonModule, FormsModule, FileUploadModule, InputTextModule, TranslateModule],
  templateUrl: './signature.component.html',
  styleUrls: ['./signature.component.scss']
})
export class SignatureComponent {

  @Input() factureId: number = 0;
  @Output() onComplete = new EventEmitter<void>();

  fichier: File | null = null;
  motDePasse: string = '';
  loading: boolean = false;
  message: string = '';
  erreur: boolean = false;
  success: boolean = false;

  constructor(
    private signatureService: SignatureService,
    private translate: TranslateService
  ) {}

  onFichierSelect(event: any): void {
    this.fichier = event.files?.[0] ?? null;
    this.message = '';
  }

  async signer(): Promise<void> {
    if (!this.fichier || !this.motDePasse) {
      this.erreur = true;
      this.message = this.translate.instant('SIGNATURE.ERROR_MSG');
      return;
    }

    this.loading = true;
    try {
      // Appel direct au backend : envoi du .p12 + mot de passe + factureId
      const response: any = await this.signatureService.signerFactureBackend(
        this.fichier,
        this.motDePasse,
        this.factureId
      );

      if (response && response.success) {
        this.message = this.translate.instant('SIGNATURE.SUCCESS_MSG');
        this.erreur = false;
        this.success = true;
      } else {
        this.message = response?.message || 'Erreur inconnue';
        this.erreur = true;
      }
    } catch (err: any) {
      console.error('SignatureComponent: ERREUR:', err);
      this.message = 'Erreur : ' + (err?.message ?? err?.toString() ?? 'Erreur inconnue');
      this.erreur = true;
    } finally {
      this.loading = false;
      this.motDePasse = ''; // effacer le mot de passe de la mémoire
      // Optionnel : réinitialiser le fichier sélectionné
      // this.fichier = null;
    }
  }

  annuler(): void {
    this.fichier = null;
    this.motDePasse = '';
    this.message = '';
    this.erreur = false;
    this.success = false;
    this.onComplete.emit();
  }

  onOk(): void {
    this.onComplete.emit();
  }
}