import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { AuthService } from '../../../core/services/auth.service';
import { LoginRequest } from '../../../models';

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
  private route = inject(ActivatedRoute);
  private messageService = inject(MessageService);
  private authService = inject(AuthService);

  email: string = '';
  password: string = '';
  rememberMe: boolean = false;
  loading: boolean = false;
  recentEmails: string[] = [];
  private readonly REMEMBER_ME_KEY = 'remember_me_email';
  private readonly RECENT_EMAILS_KEY = 'recent_login_emails';

  get isAdminContext(): boolean {
    const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
    return !!returnUrl && returnUrl.startsWith('/super-admin');
  }

  ngOnInit(): void {
    const savedEmail = localStorage.getItem(this.REMEMBER_ME_KEY);
    if (savedEmail) {
      this.email = savedEmail;
      this.rememberMe = true;
    }

    const storedRecent = localStorage.getItem(this.RECENT_EMAILS_KEY);
    if (storedRecent) {
      try {
        this.recentEmails = JSON.parse(storedRecent);
      } catch (e) {
        this.recentEmails = [];
      }
    }
  }

  login(): void {
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

    const request: LoginRequest = {
      email: this.email.trim(),
      password: this.password
    };
    console.log('🚀 Tentative de connexion pour:', request.email);

    this.authService.login(request).subscribe({
      next: (response) => {
        console.log('✅ Connexion réussie, réponse:', response);
        
        // Gérer le "Se souvenir de moi"
        if (this.rememberMe) {
          localStorage.setItem(this.REMEMBER_ME_KEY, this.email.trim());
        } else {
          localStorage.removeItem(this.REMEMBER_ME_KEY);
        }

        // Ajouter à la liste des emails récents
        this.addToRecentEmails(this.email.trim());

        const redirectUrl = this.getPostLoginRedirectUrl();
        this.messageService.add({
          severity: 'success',
          summary: 'Connexion réussie',
          detail: 'Redirection vers le tableau de bord...'
        });
        setTimeout(() => {
          this.router.navigateByUrl(redirectUrl);
        }, 1500);
      },
      error: (err) => {
        console.error('❌ Erreur de connexion:', err);
        this.loading = false;
        const message = err?.error?.message || 'Identifiants incorrects';
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

  navigateToRegister(): void {
    if (this.isAdminContext) {
      this.router.navigate(['/super-admin/register']);
      return;
    }
    this.router.navigate(['/register']);
  }

  navigateToHome(): void {
    this.router.navigate(['/']);
  }

  private getPostLoginRedirectUrl(): string {
    if (this.authService.requiresPasswordChange()) {
      return '/change-password';
    }

    const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
    if (returnUrl?.startsWith('/super-admin')) {
      return this.authService.hasRole('SUPER_ADMIN') ? returnUrl : '/dashboard';
    }

    if (this.authService.hasRole('SUPER_ADMIN')) {
      return '/super-admin/users';
    }

    if (this.authService.hasRole('ENTREPRISE_ADMIN') || this.authService.hasRole('ENTREPRISE_MANAGER')) {
      return returnUrl || '/dashboard';
    }

    if (this.authService.hasRole('ENTREPRISE_VIEWER')) {
      return returnUrl || '/dashboard';
    }
    return returnUrl || '/dashboard';
  }

  private addToRecentEmails(email: string): void {
    if (!email) return;
    
    // Filtrer pour éviter les doublons
    let emails = this.recentEmails.filter(e => e.toLowerCase() !== email.toLowerCase());
    
    // Ajouter au début
    emails.unshift(email);
    
    // Limiter à 5
    emails = emails.slice(0, 5);
    
    this.recentEmails = emails;
    localStorage.setItem(this.RECENT_EMAILS_KEY, JSON.stringify(this.recentEmails));
  }
}
