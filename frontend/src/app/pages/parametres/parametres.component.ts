// src/app/pages/parametres/parametres.component.ts
import { Component, OnInit, inject } from '@angular/core';
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
import { DropdownModule } from 'primeng/dropdown';
import { AvatarModule } from 'primeng/avatar';
import { FileUploadModule } from 'primeng/fileupload';
import { TabViewModule } from 'primeng/tabview';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService } from 'primeng/api';
import { ConfirmationService } from 'primeng/api';

@Component({
  selector: 'app-parametres',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CardModule,
    ButtonModule,
    InputTextModule,
    PasswordModule,
    DividerModule,
    ToastModule,
    ConfirmDialogModule,
    SelectButtonModule,
    InputSwitchModule,
    DropdownModule,
    AvatarModule,
    FileUploadModule,
    TabViewModule,
    TooltipModule
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './parametres.component.html',
  styleUrls: ['./parametres.component.scss']
})
export class ParametresComponent implements OnInit {
  private router = inject(Router);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);

  // ===== 1. PROFIL UTILISATEUR =====
  userProfile = {
    nom: 'Admin',
    prenom: '',
    email: 'admin@example.com',
    avatar: '',
    role: 'Administrateur',
    dateCreation: '01/01/2024',
    derniereConnexion: new Date()
  };

  // ===== 2. SÉCURITÉ =====
  passwordData = {
    ancien: '',
    nouveau: '',
    confirmation: ''
  };
  
  twoFA = {
    active: false,
    methode: 'app' // 'app' | 'sms' | 'email'
  };
  
  sessions = [
    { device: 'Chrome - Windows', location: 'Tunis, Tunisie', lastActive: new Date(), current: true },
    { device: 'Firefox - MacOS', location: 'Sfax, Tunisie', lastActive: new Date(Date.now() - 86400000), current: false },
    { device: 'Mobile - Android', location: 'Sousse, Tunisie', lastActive: new Date(Date.now() - 172800000), current: false }
  ];

  // ===== 3. PRÉFÉRENCES =====
  preferences = {
    langue: 'fr',
    devise: 'TND',
    formatDate: 'dd/MM/yyyy',
    theme: 'systeme',
    notifications: {
      email: true,
      sms: false,
      desktop: true,
      marketing: false
    }
  };

  // ===== 4. INFORMATIONS SOCIÉTÉ =====
  societeInfo = {
    raison_sociale: 'TRADENET',
    adresse: '123 Rue de la Liberté, Tunis',
    email: 'contact@tradenet.com.tn',
    telephone: '71 86 11 41',
    matricule_fiscal: '750230XAM001',
    rc: 'B11 260100',
    iban: 'TN59 1000 1234 5678 9012 3456',
    banque: 'Banque de Tunisie',
    forme_juridique: 'SARL',
    capitale: '200000'
  };

  // Options pour les sélecteurs
  langues = [
    { label: 'Français', value: 'fr' },
    { label: 'العربية', value: 'ar' },
    { label: 'English', value: 'en' }
  ];

  devises = [
    { label: 'TND', value: 'TND' },
    { label: 'EUR', value: 'EUR' },
    { label: 'USD', value: 'USD' }
  ];

  formatsDate = [
    { label: 'DD/MM/YYYY', value: 'dd/MM/yyyy' },
    { label: 'MM/DD/YYYY', value: 'MM/dd/yyyy' },
    { label: 'YYYY-MM-DD', value: 'yyyy-MM-dd' }
  ];

  themes = [
    { label: 'Clair', value: 'clair' },
    { label: 'Sombre', value: 'sombre' },
    { label: 'Système', value: 'systeme' }
  ];

  ngOnInit(): void {
    this.loadUserData();
  }

  loadUserData(): void {
    // Charger les données depuis l'API
  }

  // ===== PROFIL =====
  sauvegarderProfil(): void {
    this.messageService.add({
      severity: 'success',
      summary: 'Succès',
      detail: 'Profil mis à jour avec succès'
    });
  }

  onAvatarUpload(event: any): void {
    this.messageService.add({
      severity: 'info',
      summary: 'Avatar',
      detail: 'Avatar téléchargé avec succès'
    });
  }

  // ===== SÉCURITÉ =====
  changerMotDePasse(): void {
    if (!this.passwordData.ancien || !this.passwordData.nouveau || !this.passwordData.confirmation) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Attention',
        detail: 'Veuillez remplir tous les champs'
      });
      return;
    }

    if (this.passwordData.nouveau !== this.passwordData.confirmation) {
      this.messageService.add({
        severity: 'error',
        summary: 'Erreur',
        detail: 'Les mots de passe ne correspondent pas'
      });
      return;
    }

    if (this.passwordData.nouveau.length < 8) {
      this.messageService.add({
        severity: 'error',
        summary: 'Erreur',
        detail: 'Le mot de passe doit contenir au moins 8 caractères'
      });
      return;
    }

    this.messageService.add({
      severity: 'success',
      summary: 'Succès',
      detail: 'Mot de passe modifié avec succès'
    });

    this.passwordData = { ancien: '', nouveau: '', confirmation: '' };
  }

  activer2FA(): void {
    this.confirmationService.confirm({
      message: 'Activer l\'authentification à deux facteurs renforcera la sécurité de votre compte.',
      header: 'Activer la 2FA',
      icon: 'pi pi-shield',
      accept: () => {
        this.twoFA.active = true;
        this.messageService.add({
          severity: 'success',
          summary: 'Succès',
          detail: '2FA activée avec succès'
        });
      }
    });
  }

  deconnecterAppareil(session: any): void {
    this.confirmationService.confirm({
      message: `Déconnecter l'appareil "${session.device}" ?`,
      header: 'Confirmation',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.sessions = this.sessions.filter(s => s !== session);
        this.messageService.add({
          severity: 'success',
          summary: 'Succès',
          detail: 'Appareil déconnecté'
        });
      }
    });
  }

  // ===== SOCIÉTÉ =====
  sauvegarderSociete(): void {
    this.messageService.add({
      severity: 'success',
      summary: 'Succès',
      detail: 'Informations société mises à jour'
    });
  }

  // ===== PRÉFÉRENCES =====
  sauvegarderPreferences(): void {
    this.messageService.add({
      severity: 'success',
      summary: 'Succès',
      detail: 'Préférences enregistrées'
    });
  }

  // ===== ZONE DE DANGER =====
  confirmReset(): void {
    this.confirmationService.confirm({
      message: 'Êtes-vous absolument sûr de vouloir réinitialiser TOUS les paramètres ?',
      header: '⚠️ ZONE DE DANGER ⚠️',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'OUI, TOUT RÉINITIALISER',
      rejectLabel: 'NON, ANNULER',
      acceptButtonStyleClass: 'p-button-danger',
      rejectButtonStyleClass: 'p-button-text',
      
      accept: () => {
        // Réinitialiser à zéro
        this.resetToDefaults();
        this.messageService.add({
          severity: 'success',
          summary: 'Réinitialisation',
          detail: 'Tous les paramètres ont été réinitialisés'
        });
      }
    });
  }

  cancelReset(): void {
    this.messageService.add({
      severity: 'info',
      summary: 'Annulé',
      detail: 'La réinitialisation a été annulée'
    });
  }

  resetToDefaults(): void {
    this.userProfile = {
      nom: '',
      prenom: '',
      email: '',
      avatar: '',
      role: 'Utilisateur',
      dateCreation: new Date().toLocaleDateString(),
      derniereConnexion: new Date()
    };
    
    this.preferences = {
      langue: 'fr',
      devise: 'TND',
      formatDate: 'dd/MM/yyyy',
      theme: 'systeme',
      notifications: { email: true, sms: false, desktop: true, marketing: false }
    };
  }

  // ===== ACTIONS GLOBALES =====
  retourDashboard(): void {
    this.router.navigate(['/dashboard']);
  }

  annulerTout(): void {
    this.confirmationService.confirm({
      message: 'Annuler toutes les modifications non enregistrées ?',
      header: 'Confirmation',
      icon: 'pi pi-question-circle',
      accept: () => {
        this.loadUserData();
        this.messageService.add({
          severity: 'info',
          summary: 'Annulé',
          detail: 'Modifications annulées'
        });
      }
    });
  }
}