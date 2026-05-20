// src/app/pages/parametres/parametres.component.ts
import { Component, OnInit, inject, Renderer2, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

// PrimeNG Modules
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { DividerModule } from 'primeng/divider';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { SelectButtonModule } from 'primeng/selectbutton';
import { InputSwitchModule } from 'primeng/inputswitch';
import { AvatarModule } from 'primeng/avatar';
import { FileUploadModule } from 'primeng/fileupload';
import { TabViewModule } from 'primeng/tabview';
import { DropdownModule } from 'primeng/dropdown';
import { TooltipModule } from 'primeng/tooltip';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { MessageService, ConfirmationService } from 'primeng/api';
import { AuthService } from '../../core/services/auth.service';
import { EmetteurService } from '../../core/services/emetteur.service';

@Component({
  selector: 'app-parametres',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    CardModule, ButtonModule, InputTextModule, PasswordModule,
    DividerModule, ToastModule, ConfirmDialogModule,
    SelectButtonModule, InputSwitchModule, DropdownModule,
    AvatarModule, FileUploadModule, TabViewModule, TooltipModule,
    TranslateModule
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './parametres.component.html',
  styleUrls: ['./parametres.component.scss']
})
export class ParametresComponent implements OnInit {
  private router              = inject(Router);
  private renderer            = inject(Renderer2);
  private messageService      = inject(MessageService);
  private confirmationService = inject(ConfirmationService);
  private translate           = inject(TranslateService);
  private authService         = inject(AuthService);
  private emetteurService     = inject(EmetteurService);

  get isViewer(): boolean {
    return this.authService.hasRole('ENTREPRISE_VIEWER');
  }

  isReadOnly = computed(() => this.authService.hasRole('ENTREPRISE_VIEWER'));

  // ===== PROFIL =====
  userProfile = {
    nom: '', prenom: '', email: '',
    avatar: '', role: '',
    dateCreation: '', derniereConnexion: new Date()
  };
  fullEmetteur: any = null;

  // ===== SÉCURITÉ =====
  passwordData = { ancien: '', nouveau: '', confirmation: '' };
  twoFA = { active: false, methode: 'app' };
  sessions = [
    { device: 'Chrome - Windows',  location: 'Tunis, Tunisie',  lastActive: new Date(),                       current: true  },
    { device: 'Firefox - MacOS',   location: 'Sfax, Tunisie',   lastActive: new Date(Date.now() - 86400000),  current: false },
    { device: 'Mobile - Android',  location: 'Sousse, Tunisie', lastActive: new Date(Date.now() - 172800000), current: false }
  ];

  // ===== PRÉFÉRENCES =====
  preferences = {
    langue: 'fr',
    devise: 'TND',
    formatDate: 'dd/MM/yyyy',
    theme: 'systeme',
    notifications: { email: true, sms: false, desktop: true, marketing: false }
  };

  // ===== SOCIÉTÉ =====
  societeInfo = {
    raison_sociale: '', adresse: '',
    email: '', telephone: '',
    matricule_fiscal: '', code: '',
    forme_juridique: 'SARL', region: 'TUNIS',
    iban: '', banque: '', site_web: ''
  };

  // ===== OPTIONS =====
  langues     = [{ label: 'Français', value: 'fr' }, { label: 'English', value: 'en' }];
  themes      = [{ label: 'Clair', value: 'clair' }, { label: 'Sombre', value: 'sombre' }, { label: 'Système', value: 'systeme' }];
  
  formesJuridiques = [
    { label: 'SARL', value: 'SARL' }, { label: 'SA', value: 'SA' }, 
    { label: 'SUARL', value: 'SUARL' }, { label: 'PERSONNE_PHYSIQUE', value: 'PERSONNE_PHYSIQUE' }
  ];
  
  regions = [
    { label: 'Tunis', value: 'TUNIS' }, { label: 'Ariana', value: 'ARIANA' },
    { label: 'Ben Arous', value: 'BEN_AROUS' }, { label: 'Manouba', value: 'MANOUBA' },
    { label: 'Sousse', value: 'SOUSSE' }, { label: 'Sfax', value: 'SFAX' },
    { label: 'Bizerte', value: 'BIZERTE' }, { label: 'Gabès', value: 'GABES' }
  ];
  // formatsDate removed from UI

  // ===== INIT =====
  ngOnInit(): void {
    this.translate.addLangs(['fr', 'en']);
    this.translate.setDefaultLang('fr');
    this.loadPreferences();
    this.loadUserData();
  }

  loadUserData(): void {
    const user = this.authService.currentUser();
    if (user) {
      this.userProfile.nom    = user.nom    || '';
      this.userProfile.prenom = user.prenom || '';
      this.userProfile.email  = user.email  || '';
      this.userProfile.role   = user.role   || '';

      // Charger les données de l'émetteur uniquement pour les rôles entreprise
      if (!this.isSuperAdmin()) {
        this.emetteurService.getMyProfile().subscribe({
          next: (emetteur) => {
            this.fullEmetteur = emetteur;
            this.societeInfo.raison_sociale = emetteur.raisonSociale || '';
            this.societeInfo.telephone      = emetteur.telephone      || '';
            this.societeInfo.adresse        = emetteur.adresseComplete || '';
            this.societeInfo.iban           = emetteur.iban            || '';
            this.societeInfo.email          = emetteur.email           || '';
            this.societeInfo.code           = emetteur.code            || '';
            this.societeInfo.matricule_fiscal = emetteur.matriculeFiscal || '';
            this.societeInfo.forme_juridique = emetteur.formeJuridique   || 'SARL';
            this.societeInfo.region          = emetteur.region           || 'TUNIS';
            this.societeInfo.banque          = emetteur.banque           || '';
            this.societeInfo.site_web        = emetteur.siteWeb          || '';
          },
          error: (err) => {
            console.error('Erreur chargement profil entreprise:', err);
            // Fallback silencieux si l'API n'est pas disponible
            if (user.telephone) this.societeInfo.telephone = user.telephone;
          }
        });
      }
    }
  }

  // ===== CHARGER DEPUIS LOCALSTORAGE =====
  private loadPreferences(): void {
    const saved = localStorage.getItem('app_preferences');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        this.preferences = { ...this.preferences, ...parsed };
      } catch {}
    }
    // Appliquer au démarrage
    this.translate.use(this.preferences.langue).subscribe({
      error: () => console.error('Erreur de chargement de la langue au démarrage')
    });
    this.applyLangue(this.preferences.langue, false);
    this.applyTheme(this.preferences.theme, false);
  }

  // ===== LANGUE — appliquée immédiatement =====
  onLangueChange(): void {
    this.translate.use(this.preferences.langue).subscribe({
      next: () => {
        this.applyLangue(this.preferences.langue, true);
        this.savePreferences();
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Erreur',
          detail: `Impossible de charger la langue : ${this.preferences.langue === 'en' ? 'English' : 'Français'}`
        });
      }
    });
  }

  private applyLangue(langue: string, showToast: boolean): void {
    const html = document.documentElement;

    this.renderer.setAttribute(html, 'dir', 'ltr');
    this.renderer.setAttribute(html, 'lang', langue);
    this.renderer.removeClass(document.body, 'rtl');
    document.body.style.fontFamily = '';

    if (showToast) {
      const detail = langue === 'en'
          ? '🇬🇧 Language changed to English'
          : '🇫🇷 Langue changée en Français';
      this.messageService.add({ severity: 'success', summary: 'Langue', detail, life: 3000 });
    }
  }

  // ===== THÈME — appliqué immédiatement =====
  onThemeChange(): void {
    this.applyTheme(this.preferences.theme, true);
    this.savePreferences();
  }

  private applyTheme(theme: string, showToast: boolean): void {
    const body = document.body;
    this.renderer.removeClass(body, 'theme-clair');
    this.renderer.removeClass(body, 'theme-sombre');

    if (theme === 'sombre') {
      this.renderer.addClass(body, 'theme-sombre');
    } else if (theme === 'systeme') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      this.renderer.addClass(body, prefersDark ? 'theme-sombre' : 'theme-clair');
    } else {
      this.renderer.addClass(body, 'theme-clair');
    }

    if (showToast) {
      const label = theme === 'sombre' ? '🌙 Mode sombre' : theme === 'clair' ? '☀️ Mode clair' : '💻 Thème système';
      this.messageService.add({ severity: 'success', summary: 'Thème', detail: `${label} appliqué`, life: 3000 });
    }
  }

  // Devise change removed

  // Format date change removed

  // ===== SAVE TO LOCALSTORAGE =====
  private savePreferences(): void {
    localStorage.setItem('app_preferences', JSON.stringify(this.preferences));
  }

  // ===== HELPERS =====
  isSuperAdmin(): boolean {
    return this.userProfile.role === 'SUPER_ADMIN';
  }

  // ===== PROFIL =====
  sauvegarderProfil(): void {
    const request = {
      nom: this.userProfile.nom,
      prenom: this.userProfile.prenom
    };

    this.authService.updateProfile(request).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: this.translate.instant('TOAST.SUCCESS'),
          detail: this.translate.instant('PARAMETRES.MSGS.PROFILE_SUCCESS') || 'Profil mis à jour'
        });
      },
      error: (err) => {
        this.messageService.add({
          severity: 'error',
          summary: this.translate.instant('TOAST.ERROR'),
          detail: err.error?.message || 'Erreur lors de la mise à jour'
        });
      }
    });
  }

  onAvatarUpload(event: any): void {
    this.messageService.add({ severity: 'info', summary: 'Avatar', detail: 'Avatar téléchargé avec succès' });
  }

  // ===== SÉCURITÉ =====
  changerMotDePasse(): void {
    if (!this.passwordData.ancien || !this.passwordData.nouveau || !this.passwordData.confirmation) {
      this.messageService.add({
        severity: 'warn',
        summary: this.translate.instant('TOAST.WARN'),
        detail: this.translate.instant('PARAMETRES.MSGS.VALIDATION_REQUIRED') || 'Veuillez remplir tous les champs'
      });
      return;
    }
    if (this.passwordData.nouveau !== this.passwordData.confirmation) {
      this.messageService.add({
        severity: 'error',
        summary: this.translate.instant('TOAST.ERROR'),
        detail: this.translate.instant('PARAMETRES.MSGS.PWD_MISMATCH') || 'Les mots de passe ne correspondent pas'
      });
      return;
    }
    if (this.passwordData.nouveau.length < 8) {
      this.messageService.add({
        severity: 'error',
        summary: this.translate.instant('TOAST.ERROR'),
        detail: this.translate.instant('PARAMETRES.MSGS.PWD_MIN_LENGTH') || 'Minimum 8 caractères'
      });
      return;
    }
    this.authService.updatePassword({
      oldPassword: this.passwordData.ancien,
      newPassword: this.passwordData.nouveau,
      confirmPassword: this.passwordData.confirmation
    }).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: this.translate.instant('TOAST.SUCCESS'),
          detail: this.translate.instant('PARAMETRES.MSGS.PWD_SUCCESS') || 'Mot de passe changé'
        });
        this.passwordData = { ancien: '', nouveau: '', confirmation: '' };
      },
      error: (err) => {
        this.messageService.add({
          severity: 'error',
          summary: this.translate.instant('TOAST.ERROR'),
          detail: err.error?.message || 'Erreur lors du changement'
        });
      }
    });
  }

  activer2FA(): void {
    this.confirmationService.confirm({
      message: "Activer l'authentification à deux facteurs renforcera la sécurité de votre compte.",
      header: 'Activer la 2FA', icon: 'pi pi-shield',
      accept: () => {
        this.twoFA.active = true;
        this.messageService.add({ severity: 'success', summary: 'Succès', detail: '2FA activée avec succès' });
      }
    });
  }

  deconnecterAppareil(session: any): void {
    this.confirmationService.confirm({
      message: `Déconnecter l'appareil "${session.device}" ?`,
      header: 'Confirmation', icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.sessions = this.sessions.filter(s => s !== session);
        this.messageService.add({ severity: 'success', summary: 'Succès', detail: 'Appareil déconnecté' });
      }
    });
  }

  // ===== SOCIÉTÉ =====
  sauvegarderSociete(): void {
    const user = this.authService.currentUser();
    if (!user?.emetteurId) {
      this.messageService.add({ severity: 'error', summary: 'Erreur', detail: 'ID Émetteur non trouvé' });
      return;
    }

    const request = {
      ...this.fullEmetteur,
      code: this.societeInfo.code,
      raisonSociale: this.societeInfo.raison_sociale,
      matriculeFiscal: this.societeInfo.matricule_fiscal,
      formeJuridique: this.societeInfo.forme_juridique,
      region: this.societeInfo.region,
      telephone: this.societeInfo.telephone,
      adresseComplete: this.societeInfo.adresse,
      iban: this.societeInfo.iban,
      email: this.societeInfo.email,
      banque: this.societeInfo.banque,
      siteWeb: this.societeInfo.site_web
    };

    this.emetteurService.updateMyProfile(request).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: this.translate.instant('TOAST.SUCCESS'),
          detail: this.translate.instant('PARAMETRES.MSGS.SOCIETE_SUCCESS') || 'Société mise à jour'
        });
      },
      error: (err) => {
        this.messageService.add({
          severity: 'error',
          summary: this.translate.instant('TOAST.ERROR'),
          detail: err.error?.message || 'Erreur lors de la mise à jour de la société'
        });
      }
    });
  }

  // ===== PRÉFÉRENCES =====
  sauvegarderPreferences(): void {
    this.savePreferences();
    this.messageService.add({ severity: 'success', summary: 'Succès', detail: 'Préférences enregistrées' });
  }

  // ===== ZONE DE DANGER =====
  confirmReset(): void {
    this.confirmationService.confirm({
      message: 'Êtes-vous absolument sûr de vouloir réinitialiser TOUS les paramètres ?',
      header: '⚠️ ZONE DE DANGER ⚠️', icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'OUI, TOUT RÉINITIALISER', rejectLabel: 'NON, ANNULER',
      acceptButtonStyleClass: 'p-button-danger', rejectButtonStyleClass: 'p-button-text',
      accept: () => {
        this.resetToDefaults();
        this.messageService.add({ severity: 'success', summary: 'Réinitialisation', detail: 'Tous les paramètres ont été réinitialisés' });
      }
    });
  }

  cancelReset(): void {
    this.messageService.add({ severity: 'info', summary: 'Annulé', detail: 'La réinitialisation a été annulée' });
  }

  resetToDefaults(): void {
    this.preferences = {
      langue: 'fr', devise: 'TND', formatDate: 'dd/MM/yyyy', theme: 'systeme',
      notifications: { email: true, sms: false, desktop: true, marketing: false }
    };
    localStorage.removeItem('app_preferences');
    this.applyLangue('fr', false);
    this.applyTheme('systeme', false);
  }

  // ===== GLOBAL =====
  retourDashboard(): void { this.router.navigate(['/dashboard']); }

  annulerTout(): void {
    this.confirmationService.confirm({
      message: 'Annuler toutes les modifications non enregistrées ?',
      header: 'Confirmation', icon: 'pi pi-question-circle',
      accept: () => {
        this.loadPreferences();
        this.messageService.add({ severity: 'info', summary: 'Annulé', detail: 'Modifications annulées' });
      }
    });
  }
}