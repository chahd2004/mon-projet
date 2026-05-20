// src/app/pages/login/login.component.ts
import { Component, inject, OnInit } from '@angular/core';
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
  selector: 'app-login',
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
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
  private router = inject(Router);
  private messageService = inject(MessageService);
  private authService = inject(AuthService);

  // Propriétés - Initialisées vides (pas de valeurs mockées)
  email: string = '';
  password: string = '';
  rememberMe: boolean = false;
  loading: boolean = false;

  ngOnInit(): void {
    // Optionnel : Vérifier si l'utilisateur est déjà connecté
    if (this.authService.isLoggedIn()) {
      this.router.navigate(['/dashboard']);
    }
  }

  /**
   * Connexion - Appel API réel au backend
   */
  login(): void {
    // Validation des champs
    if (!this.email?.trim()) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Champ requis',
        detail: 'Veuillez entrer votre email.'
      });
      return;
    }
    if (!this.password?.trim()) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Champ requis',
        detail: 'Veuillez entrer votre mot de passe.'
      });
      return;
    }

    this.loading = true;

    this.authService.login({
      email: this.email.trim(),
      password: this.password
    }).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Connexion réussie',
          detail: 'Bienvenue !'
        });
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.loading = false;
        const msg = err?.error?.message ?? err?.error?.error ?? err?.error?.detail
          ?? (typeof err?.error === 'string' ? err.error : null) ?? err?.message;
        const message = msg || (err?.status === 500
          ? 'Erreur serveur. Vérifiez que le backend gère bien les champs null (type_user, telephone).'
          : 'Email ou mot de passe incorrect.');
        this.messageService.add({
          severity: 'error',
          summary: 'Erreur de connexion',
          detail: message
        });
      },
      complete: () => {
        this.loading = false;
      }
    });
  }
  /**
   * Redirection vers l'inscription
   */
  goToRegister(event: Event): void {
    event.preventDefault();
    this.router.navigate(['/register']);
  }

  /**
   * Mot de passe oublié
   */
  forgotPassword(event: Event): void {
    event.preventDefault();
    this.messageService.add({
      severity: 'info',
      summary: 'Mot de passe oublié',
      detail: 'Fonctionnalité à venir...'
    });
  }
}