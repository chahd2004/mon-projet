// src/app/features/entreprise-admin/collaborateurs/collaborateur-form.component.ts
import { Component, OnInit, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { DropdownModule } from 'primeng/dropdown';
import { CheckboxModule } from 'primeng/checkbox';
import { CardModule } from 'primeng/card';
import { CollaborateurService } from '../../../core/services/collaborateur.service';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { ErrorHandlerService } from '../../../core/services/error-handler.service';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-collaborateur-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ButtonModule,
    InputTextModule,
    DropdownModule,
    CheckboxModule,
    CardModule,
    ToastModule
  ],
  templateUrl: './collaborateur-form.component.html',
  styleUrl: './collaborateur-form.component.scss',
  providers: [MessageService]
})
export class CollaborateurFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private collaborateurService = inject(CollaborateurService);
  private messageService = inject(MessageService);
  private errorHandler = inject(ErrorHandlerService);
  private router = inject(Router);
  private authService = inject(AuthService);

  form!: FormGroup;
  isSubmitting = false;

  roleOptions = [
    { label: 'Consultant', value: 'ENTREPRISE_VIEWER' },
    { label: 'Manager', value: 'ENTREPRISE_MANAGER' },
  ];

  fieldErrors: Record<string, string> = {};
  globalError: string | null = null;

  isReadOnly = computed(() => this.authService.hasRole('ENTREPRISE_VIEWER'));
  get isViewer(): boolean { return this.authService.hasRole('ENTREPRISE_VIEWER'); }

  ngOnInit(): void {
    this.initForm();
    if (this.isViewer) {
      this.form.disable();
    }
  }

  private initForm(): void {
    this.form = this.fb.group({
      prenom: ['', [Validators.required, Validators.minLength(2)]],
      nom: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      telephone: [''],
      role: ['ENTREPRISE_VIEWER', Validators.required]
    });
  }

  save(): void {
    if (this.isViewer) return;
    this.fieldErrors = {};
    if (this.form.valid) {
      this.isSubmitting = true;
      const val = this.form.value;
      
      this.collaborateurService.createCollaborateur({
        email: val.email,
        prenom: val.prenom,
        nom: val.nom,
        fonction: val.role === 'ENTREPRISE_MANAGER' ? 'Manager' : 'Consultant',
        role: val.role,
        telephone: val.telephone || undefined
      }).subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Succès',
            detail: 'Collaborateur invité avec succès.'
          });
          setTimeout(() => this.router.navigate(['/collaborateurs']), 1500);
        },
        error: (err) => {
          this.isSubmitting = false;
          console.error('❌ Erreur creation:', err);
          
          this.fieldErrors = {};
          this.globalError = null;
          
          const payload = err.error;
          
          // 1. Erreurs de validation (400)
          if (err.status === 400 && payload) {
            if (payload.errors) {
              if (Array.isArray(payload.errors)) {
                payload.errors.forEach((e: any) => {
                  if (e.field) this.fieldErrors[e.field] = e.defaultMessage || e.message || 'Valeur invalide';
                });
              } else if (typeof payload.errors === 'object') {
                Object.keys(payload.errors).forEach(key => {
                  const val = (payload.errors as any)[key];
                  this.fieldErrors[key] = Array.isArray(val) ? String(val[0]) : String(val);
                });
              }
            } else if (Array.isArray(payload.violations)) {
              payload.violations.forEach((v: any) => {
                if (v.field) this.fieldErrors[v.field] = v.message || 'Valeur invalide';
              });
            } else if (payload.message) {
              this.globalError = payload.message;
            }
          } 
          // 2. Conflits (409) - ex: Email déjà utilisé
          else if (err.status === 409 || err.status === 400) {
            const errorMsg = payload?.message || "Une erreur est survenue lors de la création.";
            this.globalError = errorMsg;
            if (errorMsg.toLowerCase().includes('email')) {
              this.fieldErrors['email'] = errorMsg;
            }
          }

          const fieldCount = Object.keys(this.fieldErrors).length;
          const msg = this.globalError || (err ? this.errorHandler.extractErrorMessage(err) : 'Erreur inconnue');
          
          this.messageService.add({
            severity: 'error',
            summary: fieldCount > 0 ? 'Erreur de formulaire' : 'Erreur',
            detail: fieldCount > 0 ? `Veuillez corriger les erreurs indiquées.` : msg
          });
        }
      });
    } else {
      this.form.markAllAsTouched();
    }
  }

  cancel(): void {
    this.router.navigate(['/collaborateurs']);
  }

  getErrorMessage(fieldName: string): string {
    const control = this.form.get(fieldName);
    if (control?.hasError('required')) {
      return `${fieldName} est requis`;
    }
    if (control?.hasError('minlength')) {
      return `${fieldName} doit contenir au moins 2 caractères`;
    }
    if (control?.hasError('email')) {
      return 'Email invalide';
    }
    return '';
  }
}
