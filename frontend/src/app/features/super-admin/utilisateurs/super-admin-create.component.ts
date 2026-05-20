import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { CardModule } from 'primeng/card';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { SuperAdminUserService, CreateSuperAdminRequest } from '../../../core/services/super-admin-user.service';

@Component({
  selector: 'app-super-admin-create',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    ButtonModule,
    InputTextModule,
    CardModule,
    ToastModule,
    TranslateModule
  ],
  providers: [MessageService],
  templateUrl: './super-admin-create.component.html',
  styleUrl: './super-admin-create.component.scss'
})
export class SuperAdminCreateComponent implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private messageService = inject(MessageService);
  private superAdminUserService = inject(SuperAdminUserService);
  private translate = inject(TranslateService);

  createForm!: FormGroup;
  isLoading = false;

  ngOnInit(): void {
    this.initForm();
  }

  private initForm(): void {
    this.createForm = this.fb.group({
      prenom: ['', [Validators.required, Validators.minLength(2)]],
      nom: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      telephone: ['', [Validators.required, Validators.minLength(8)]],
      motDePasse: ['', [Validators.required, Validators.minLength(8)]],
      confirmationMotDePasse: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });
  }

  private passwordMatchValidator(form: FormGroup): {[key: string]: any} | null {
    const motDePasse = form.get('motDePasse')?.value;
    const confirmation = form.get('confirmationMotDePasse')?.value;
    return motDePasse === confirmation ? null : { passwordMismatch: true };
  }

  save(): void {
    if (!this.createForm.valid) {
      this.messageService.add({
        severity: 'error',
        summary: this.translate.instant('TOAST.ERROR'),
        detail: this.translate.instant('COMMON.FILL_ALL_FIELDS')
      });
      return;
    }

    this.isLoading = true;
    const formValue = this.createForm.getRawValue();
    const request: CreateSuperAdminRequest = {
      prenom: formValue.prenom,
      nom: formValue.nom,
      email: formValue.email,
      telephone: formValue.telephone,
      password: formValue.motDePasse
    };

    this.superAdminUserService.createSuperAdmin(request).subscribe({
      next: (response) => {
        this.isLoading = false;
        this.messageService.add({
          severity: 'success',
          summary: this.translate.instant('TOAST.SUCCESS'),
          detail: this.translate.instant('SUPER_ADMIN.USERS.MSGS.CREATE_SUCCESS')
        });
        setTimeout(() => {
          this.router.navigate(['/super-admin/users']);
        }, 1500);
      },
      error: (error) => {
        this.isLoading = false;
        const errorMessage = error?.error?.message || this.translate.instant('SUPER_ADMIN.USERS.MSGS.CREATE_ERROR');
        this.messageService.add({
          severity: 'error',
          summary: this.translate.instant('TOAST.ERROR'),
          detail: errorMessage
        });
      }
    });
  }

  cancel(): void {
    this.router.navigate(['/super-admin/users']);
  }
}
