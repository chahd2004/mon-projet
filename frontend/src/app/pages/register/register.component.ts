// src/app/pages/register/register.component.ts
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

// PrimeNG Modules
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

// Services
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-register',
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
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']
})
export class RegisterComponent {
  private router = inject(Router);
  private messageService = inject(MessageService);
  private authService = inject(AuthService);

  // Propriétés du formulaire
  prenom: string = '';
  nom: string = '';
  pays: string = 'TN';
  email: string = '';
  password: string = '';
  codePartenaire: string = '';
  acceptConditions: boolean = false;

  // Messages d'erreur
  passwordError: string = '';
  errorMessage: string = '';
  loading: boolean = false;

  /**
   * Validation du mot de passe
   */
  validatePassword(): boolean {
    if (!this.password) {
      this.passwordError = 'Le mot de passe est obligatoire';
      return false;
    }

    if (this.password.length < 8) {
      this.passwordError = 'Le mot de passe doit contenir au moins 8 caractères';
      return false;
    }

    // Vérifie la présence de lettres, chiffres et symboles
    const hasLetter = /[a-zA-Z]/.test(this.password);
    const hasNumber = /[0-9]/.test(this.password);
    const hasSymbol = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(this.password);

    if (!hasLetter || !hasNumber || !hasSymbol) {
      this.passwordError = 'Le mot de passe doit contenir un mélange de lettres, chiffres et symboles';
      return false;
    }

    this.passwordError = '';
    return true;
  }

  /**
   * Inscription
   */
  register(): void {
    // Réinitialiser les messages d'erreur
    this.errorMessage = '';

    // Validation des champs obligatoires
    if (!this.prenom || !this.nom) {
      this.errorMessage = 'Veuillez remplir tous les champs obligatoires';
      return;
    }

    if (!this.email) {
      this.errorMessage = 'L\'email est obligatoire';
      return;
    }

    // Validation du format email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.email)) {
      this.errorMessage = 'Veuillez entrer un email valide';
      return;
    }

    // Validation du mot de passe
    if (!this.validatePassword()) {
      return;
    }

    if (!this.acceptConditions) {
      this.errorMessage = 'Vous devez accepter les conditions d\'utilisation';
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    this.authService.register({
      nom: this.nom.trim(),
      prenom: this.prenom.trim(),
      email: this.email.trim(),
      password: this.password,
      typeUser: 'CLIENT',
      telephone: undefined
    }).subscribe({
      next: (response) => {
        this.messageService.add({
          severity: 'success',
          summary: 'Compte créé',
          detail: response?.token ? 'Bienvenue ! Vous êtes connecté.' : 'Inscription réussie ! Connectez-vous.'
        });
        this.router.navigate(response?.token ? ['/dashboard'] : ['/login']);
      },
      error: (err) => {
        this.loading = false;
        const msg = err?.error?.message ?? err?.error?.error ?? (typeof err?.error === 'string' ? err.error : null) ?? err?.message;
        this.errorMessage = msg || 'Erreur lors de l\'inscription. Veuillez réessayer.';
        this.messageService.add({
          severity: 'error',
          summary: 'Erreur d\'inscription',
          detail: this.errorMessage
        });
      },
      complete: () => {
        this.loading = false;
      }
    });
  }

  /**
   * Redirection vers la page de connexion
   */
  goToLogin(): void {
    this.router.navigate(['/login']);
  }
}