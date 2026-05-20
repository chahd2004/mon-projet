import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { DropdownModule } from 'primeng/dropdown';
import { CardModule } from 'primeng/card';
import { ClientService } from '../../../core/services/client.service';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { ErrorHandlerService } from '../../../core/services/error-handler.service';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-client-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ButtonModule,
    InputTextModule,
    DropdownModule,
    CardModule,
    ToastModule
  ],
  templateUrl: './client-form.component.html',
  styleUrl: './client-form.component.scss',
  providers: [MessageService]
})
export class ClientFormComponent implements OnInit {
  form!: FormGroup;
  isSubmitting = false;

  regionOptions = [
    { label: 'Tunis', value: 'TUNIS' },
    { label: 'Ariana', value: 'ARIANA' },
    { label: 'Ben Arous', value: 'BEN_AROUS' },
    { label: 'Manouba', value: 'MANOUBA' },
    { label: 'Sfax', value: 'SFAX' },
    { label: 'Sousse', value: 'SOUSSE' },
    { label: 'Kairouan', value: 'KAIROUAN' },
    { label: 'Kasserine', value: 'KASSERINE' },
    { label: 'Gafsa', value: 'GAFSA' },
    { label: 'Tozeur', value: 'TOZEUR' },
    { label: 'Kébili', value: 'KEBILI' },
    { label: 'Gabès', value: 'GABES' },
    { label: 'Médenine', value: 'MEDENINE' },
    { label: 'Tataouine', value: 'TATAOUINE' },
    { label: 'Sidi Bouzid', value: 'SIDI_BOUZID' },
    { label: 'Mahdia', value: 'MAHDIA' },
    { label: 'Monastir', value: 'MONASTIR' },
    { label: 'Nabeul', value: 'NABEUL' },
    { label: 'Zaghouan', value: 'ZAGHOUAN' },
    { label: 'Bizerte', value: 'BIZERTE' },
    { label: 'Jendouba', value: 'JENDOUBA' },
    { label: 'Kef', value: 'KEF' },
    { label: 'Siliana', value: 'SILIANA' }
  ];

  fieldErrors: Record<string, string> = {};

  constructor(
    private fb: FormBuilder,
    private clientService: ClientService,
    private messageService: MessageService,
    private errorHandler: ErrorHandlerService,
    private router: Router,
    private authService: AuthService
  ) { }

  ngOnInit(): void {
    this.initForm();
  }

  private initForm(): void {
    this.form = this.fb.group({
      code: ['', [Validators.required]],
      raisonSociale: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      telephone: ['', Validators.required],
      adresse: ['', Validators.required],
      region: ['', Validators.required],
      codePostal: ['', Validators.required],
      contactPrincipal: ['', Validators.required],
      notes: ['']
    });
  }

  save(): void {
    this.fieldErrors = {};
    if (this.form.valid) {
      this.isSubmitting = true;
      const val = this.form.value;
      
      const currentUser = this.authService.currentUser();
      
      this.clientService.createClient({
        raisonSociale: val.raisonSociale,
        email: val.email,
        telephone: val.telephone,
        adresseComplete: val.adresse,
        pays: 'TUNISIE',
        region: val.region,
        userId: currentUser?.id
      }).subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Succès',
            detail: 'Client créé avec succès.'
          });
          setTimeout(() => this.router.navigate(['/clients']), 1500);
        },
        error: (err) => {
          this.isSubmitting = false;
          console.error('❌ Erreur création client:', err);
          
          const payload = err.error;
          if (err.status === 400 && payload) {
            if (payload.errors) {
              if (Array.isArray(payload.errors)) {
                payload.errors.forEach((e: any) => {
                  if (e.field) {
                    this.fieldErrors[e.field] = e.defaultMessage || e.message || 'Valeur invalide';
                  }
                });
              } else if (typeof payload.errors === 'object') {
                Object.keys(payload.errors).forEach(key => {
                  const val = (payload.errors as any)[key];
                  this.fieldErrors[key] = Array.isArray(val) ? String(val[0]) : String(val);
                });
              }
            } else if (Array.isArray(payload.violations)) {
              payload.violations.forEach((v: any) => {
                if (v.field) {
                  this.fieldErrors[v.field] = v.message || 'Valeur invalide';
                }
              });
            } else if (typeof payload === 'object' && !payload.errors && !payload.violations) {
              Object.keys(payload).forEach(key => {
                const val = payload[key];
                this.fieldErrors[key] = Array.isArray(val) ? String(val[0]) : String(val);
              });
            }
          }

          const msg = this.errorHandler.extractErrorMessage(err);
          const fieldCount = Object.keys(this.fieldErrors).length;
          this.messageService.add({
            severity: 'error',
            summary: fieldCount > 0 ? 'Erreur de formulaire' : 'Erreur',
            detail: fieldCount > 0 ? `Veuillez corriger les ${fieldCount} erreurs indiquées.` : msg
          });
        }
      });
    } else {
      this.form.markAllAsTouched();
      this.messageService.add({
        severity: 'warn',
        summary: 'Validation',
        detail: 'Veuillez remplir tous les champs obligatoires.'
      });
    }
  }

  cancel(): void {
    console.log('Cancel');
  }

  getErrorMessage(fieldName: string): string {
    const control = this.form.get(fieldName);
    if (control?.hasError('required')) {
      return `${fieldName} est requis`;
    }
    if (control?.hasError('minlength')) {
      return `${fieldName} doit contenir au moins 3 caractères`;
    }
    if (control?.hasError('email')) {
      return 'Email invalide';
    }
    return '';
  }
}
