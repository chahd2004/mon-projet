import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { AuthService } from '../../../core/services/auth.service';
import { RegisterRequest } from '../../../models';

@Component({
  selector: 'app-register-entreprise',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CardModule,
    InputTextModule,
    ButtonModule,
    CheckboxModule,
    ToastModule
  ],
  providers: [MessageService],
  templateUrl: './register-entreprise.component.html',
  styleUrls: ['./register-entreprise.component.scss']
})
export class RegisterEntrepriseComponent implements OnInit {
  private router = inject(Router);
  private messageService = inject(MessageService);
  private authService = inject(AuthService);

  nom: string = '';
  prenom: string = '';
  email: string = '';
  password: string = '';
  confirmPassword: string = '';
  telephone: string = '';
  acceptConditions: boolean = false;
  loading: boolean = false;
  role: 'ENTREPRISE_ADMIN' | 'ENTREPRISE_VIEWER' = 'ENTREPRISE_ADMIN';

  ngOnInit(): void {
    if (this.authService.isLoggedIn()) {
      this.router.navigate(['/dashboard']);
    }
  }

  register(): void {
    if (!this.nom?.trim()) {
      this.messageService.add({ severity: 'warn', summary: 'Validation', detail: 'Veuillez entrer votre nom.' });
      return;
    }
    if (!this.prenom?.trim()) {
      this.messageService.add({ severity: 'warn', summary: 'Validation', detail: 'Veuillez entrer votre prénom.' });
      return;
    }
    if (!this.email?.trim()) {
      this.messageService.add({ severity: 'warn', summary: 'Validation', detail: 'Veuillez entrer votre email.' });
      return;
    }
    if (!this.password?.trim()) {
      this.messageService.add({ severity: 'warn', summary: 'Validation', detail: 'Veuillez entrer votre mot de passe.' });
      return;
    }
    if (this.password !== this.confirmPassword) {
      this.messageService.add({ severity: 'error', summary: 'Validation', detail: 'Les mots de passe ne correspondent pas.' });
      return;
    }
    if (!this.acceptConditions) {
      this.messageService.add({ severity: 'warn', summary: 'Validation', detail: 'Vous devez accepter les conditions d\'utilisation.' });
      return;
    }

    this.loading = true;

    const request: RegisterRequest = {
      nom: this.nom.trim(),
      prenom: this.prenom.trim(),
      email: this.email.trim(),
      password: this.password,
      telephone: this.telephone?.trim() || undefined,
      role: this.role,
      typeUser: null
    };

    this.authService.register(request).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Inscription réussie',
          detail: 'Compte entreprise créé avec succès.'
        });
        setTimeout(() => this.router.navigate(['/dashboard']), 1200);
      },
      error: (err) => {
        this.loading = false;
        const message = err?.error?.message || 'Une erreur est survenue lors de l\'inscription.';
        this.messageService.add({ severity: 'error', summary: 'Erreur d\'inscription', detail: message });
      },
      complete: () => {
        this.loading = false;
      }
    });
  }

  navigateToLogin(): void {
    this.router.navigate(['/login']);
  }

  navigateToHome(): void {
    this.router.navigate(['/']);
  }
}
