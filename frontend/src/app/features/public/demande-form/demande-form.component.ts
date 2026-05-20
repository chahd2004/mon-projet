import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { DropdownModule } from 'primeng/dropdown';
import { MessageService } from 'primeng/api';
import { CreateDemandeRequest, REGIONS_TUNISIE } from '../../../models';
import { DemandeService } from '../../../core/services/demande.service';

@Component({
  selector: 'app-demande-form',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CardModule,
    InputTextModule,
    InputTextareaModule,
    ButtonModule,
    ToastModule,
    DropdownModule
  ],
  providers: [MessageService],
  templateUrl: './demande-form.component.html',
  styleUrls: ['./demande-form.component.scss']
})
export class DemandeFormComponent {
  private router = inject(Router);
  private messageService = inject(MessageService);
  private demandeService = inject(DemandeService);

  // Informations entreprise
  code: string = '';
  raisonSociale: string = '';
  matriculeFiscal: string = '';
  formeJuridique: string = '';
  email: string = '';
  telephone: string = '';
  adresseComplete: string = '';
  region: string = '';
  siteWeb: string = '';
  iban: string = '';
  banque: string = '';

  // Informations responsable
  nomResponsable: string = '';
  prenomResponsable: string = '';
  fonctionResponsable: string = '';
  
  fieldErrors: Record<string, string> = {};


  loading: boolean = false;
  private readonly emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  private readonly telephoneRegex = /^[0-9+\s-]{8,20}$/;

  regions = REGIONS_TUNISIE.map(r => ({
    label: r.replace(/_/g, ' ').toUpperCase(), // Formate: SIDI_BOUZID -> SIDI BOUZID
    value: r
  }));

  formeJuridiqueOptions = [
    { label: 'SARL - Société à Responsabilité Limitée', value: 'SARL' },
    { label: 'SA - Société Anonyme', value: 'SA' },
    { label: 'SUARL - Société Unipersonnelle à Responsabilité Limitée', value: 'SUARL' },
    { label: 'SNC - Société en Nom Collectif', value: 'SNC' },
    { label: 'SCS - Société en Commandite Simple', value: 'SCS' },
    { label: 'SCA - Société en Commandite par Actions', value: 'SCA' },
    { label: 'EI - Entreprise Individuelle', value: 'EI' },
    { label: 'Société Civile', value: 'SOCIETE_CIVILE' }
  ];

  submitDemande(): void {
    this.fieldErrors = {};
    const errors: string[] = [];

    // Validation Locale
    if (!this.code?.trim()) {
      this.fieldErrors['code'] = 'Le code de l\'entreprise est requis.';
      errors.push(this.fieldErrors['code']);
    }

    if (!this.raisonSociale?.trim()) {
      this.fieldErrors['raisonSociale'] = 'La raison sociale est requise.';
      errors.push(this.fieldErrors['raisonSociale']);
    }

    if (!this.matriculeFiscal?.trim()) {
      this.fieldErrors['matriculeFiscal'] = 'Le matricule fiscal est requis.';
      errors.push(this.fieldErrors['matriculeFiscal']);
    }

    if (!this.formeJuridique) {
      this.fieldErrors['formeJuridique'] = 'La forme juridique est requise.';
      errors.push(this.fieldErrors['formeJuridique']);
    }

    if (!this.email?.trim()) {
      this.fieldErrors['email'] = 'L\'email est requis.';
      errors.push(this.fieldErrors['email']);
    } else if (!this.emailRegex.test(this.email.trim())) {
      this.fieldErrors['email'] = 'Le format de l\'email est invalide.';
      errors.push(this.fieldErrors['email']);
    }

    if (!this.adresseComplete?.trim()) {
      this.fieldErrors['adresseComplete'] = 'L\'adresse complète est requise.';
      errors.push(this.fieldErrors['adresseComplete']);
    }

    if (!this.region) {
      this.fieldErrors['region'] = 'La région est requise.';
      errors.push(this.fieldErrors['region']);
    }

    if (!this.nomResponsable?.trim()) {
      this.fieldErrors['nomResponsable'] = 'Le nom du responsable est requis.';
      errors.push(this.fieldErrors['nomResponsable']);
    }

    if (!this.prenomResponsable?.trim()) {
      this.fieldErrors['prenomResponsable'] = 'Le prénom du responsable est requis.';
      errors.push(this.fieldErrors['prenomResponsable']);
    }

    if (!this.fonctionResponsable?.trim()) {
      this.fieldErrors['fonctionResponsable'] = 'La fonction du responsable est requise.';
      errors.push(this.fieldErrors['fonctionResponsable']);
    }

    const cleanedPhone = this.telephone?.trim();
    if (cleanedPhone && !this.telephoneRegex.test(cleanedPhone)) {
      this.fieldErrors['telephone'] = 'Le numéro de téléphone est invalide.';
      errors.push(this.fieldErrors['telephone']);
    }

    if (errors.length > 0) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Formulaire incomplet',
        detail: 'Veuillez corriger les erreurs dans le formulaire.'
      });
      return;
    }

    this.loading = true;

    const request: CreateDemandeRequest = {
      code: this.code.trim(),
      raisonSociale: this.raisonSociale.trim(),
      matriculeFiscal: this.matriculeFiscal.trim(),
      email: this.email.trim(),
      adresseComplete: this.adresseComplete.trim(),
      region: this.region,
      nomResponsable: this.nomResponsable.trim(),
      prenomResponsable: this.prenomResponsable.trim(),
      fonctionResponsable: this.fonctionResponsable.trim(),
      formeJuridique: this.formeJuridique,
      telephone: cleanedPhone || undefined,
      siteWeb: this.siteWeb?.trim() || undefined,
      iban: this.iban?.trim() || undefined,
      banque: this.banque?.trim() || undefined
    };

    const requestCompat: any = {
      ...request,
      pays: 'TUNISIE',
      nomRepresentant: request.nomResponsable,
      prenomRepresentant: request.prenomResponsable,
      fonctionRepresentant: request.fonctionResponsable
    };

    this.demandeService.soumettreDemande(requestCompat).subscribe({
      next: (response) => {
        this.messageService.add({
          severity: 'success',
          summary: 'Demande soumise',
          detail: 'Votre demande d\'entreprise a été reçue.'
        });

        setTimeout(() => {
          this.router.navigate(['/demande/statut'], {
            queryParams: { email: this.email }
          });
        }, 2000);
      },
      error: (err) => {
        this.loading = false;
        console.error('❌ Erreur soumission:', err);
        
        // Tentative de parsing des erreurs par champ si c'est un 400
        const payload = err.error;
        console.log('📦 Raw error payload from backend:', payload);
        
        if (err.status === 400 && payload) {
          const mapBackendKey = (key: string): string => {
            const mapping: Record<string, string> = {
              'nomRepresentant': 'nomResponsable',
              'prenomRepresentant': 'prenomResponsable',
              'fonctionRepresentant': 'fonctionResponsable',
              'adresseComplete': 'adresseComplete',
              'matricule_fiscal': 'matriculeFiscal',
              'raison_sociale': 'raisonSociale',
              'forme_juridique': 'formeJuridique',
              'code_entreprise': 'code'
            };
            return mapping[key] || key;
          };

          if (payload.errors) {
            if (Array.isArray(payload.errors)) {
              payload.errors.forEach((e: any) => {
                if (e.field) {
                  const targetField = mapBackendKey(e.field);
                  this.fieldErrors[targetField] = e.defaultMessage || e.message || 'Valeur invalide';
                }
              });
            } else if (typeof payload.errors === 'object') {
              Object.keys(payload.errors).forEach(key => {
                const targetField = mapBackendKey(key);
                const val = (payload.errors as any)[key];
                this.fieldErrors[targetField] = Array.isArray(val) ? String(val[0]) : String(val);
              });
            }
          } else if (Array.isArray(payload.violations)) {
            payload.violations.forEach((v: any) => {
              if (v.field) {
                const targetField = mapBackendKey(v.field);
                this.fieldErrors[targetField] = v.message || 'Valeur invalide';
              }
            });
          } else if (typeof payload === 'object' && !payload.errors && !payload.violations) {
            Object.keys(payload).forEach(key => {
              const targetField = mapBackendKey(key);
              const val = payload[key];
              this.fieldErrors[targetField] = Array.isArray(val) ? String(val[0]) : String(val);
            });
          }
          console.log('✅ Final fieldErrors mapping:', this.fieldErrors);
        }

        const message = this.extractApiError(err, 'Une erreur est survenue lors de la soumission.');
        
        // Gestion spécifique de l'erreur d'email déjà utilisé
        if (message.includes('email') && (message.includes('utilisé') || message.includes('existe déjà'))) {
          this.fieldErrors['email'] = message;
        }

        const fieldCount = Object.keys(this.fieldErrors).length;
        
        this.messageService.add({
          severity: 'error',
          summary: fieldCount > 0 ? 'Erreur de formulaire' : 'Erreur',
          detail: fieldCount > 1 
            ? `Veuillez corriger les ${fieldCount} erreurs indiquées.` 
            : message // Affiche le message spécifique s'il n'y a qu'une erreur ou aucune erreur par champ
        });
      },
      complete: () => {
        this.loading = false;
      }
    });
  }

  navigateToHome(): void {
    this.router.navigate(['/']);
  }

  private extractApiError(err: any, fallback: string): string {
    const payload = err?.error;

    if (typeof payload === 'string' && payload.trim()) {
      return payload;
    }

    if (Array.isArray(payload?.errors) && payload.errors.length > 0) {
      const first = payload.errors[0];
      if (typeof first === 'string') {
        return first;
      }
      if (first?.defaultMessage) {
        return first.defaultMessage;
      }
      if (first?.message) {
        return first.message;
      }
      if (first?.field && (first?.defaultMessage || first?.message)) {
        return `${first.field}: ${first.defaultMessage || first.message}`;
      }
    }

    if (Array.isArray(payload?.violations) && payload.violations.length > 0) {
      const firstViolation = payload.violations[0];
      if (typeof firstViolation === 'string') {
        return firstViolation;
      }
      if (firstViolation?.message) {
        return firstViolation.message;
      }
    }

    if (payload?.message) {
      return payload.message;
    }

    if (payload && typeof payload === 'object') {
      const firstKey = Object.keys(payload)[0];
      if (firstKey) {
        const firstValue = payload[firstKey];
        if (Array.isArray(firstValue) && firstValue.length > 0) {
          return `${firstKey}: ${String(firstValue[0])}`;
        }
        if (typeof firstValue === 'string' && firstValue.trim()) {
          return `${firstKey}: ${firstValue}`;
        }
      }
    }

    if (payload?.error) {
      return payload.error;
    }

    if (err?.message) {
      return err.message;
    }

    return fallback;
  }
}
