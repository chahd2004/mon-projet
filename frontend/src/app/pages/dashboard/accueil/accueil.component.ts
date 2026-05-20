// src/app/pages/dashboard/accueil/accueil.component.ts
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

import { FactureService } from '../../../core/services/facture.service';
import { AuthService } from '../../../core/services/auth.service';
import { EmetteurService } from '../../../core/services/emetteur.service';
import { UserRole } from '../../../models/enums';
import { signal, effect } from '@angular/core';

import { TranslateModule } from '@ngx-translate/core';

import { ChatWidgetComponent } from '../../../shared/components/chat-widget/chat-widget.component';

@Component({
  selector: 'app-accueil',
  standalone: true,
  imports: [CommonModule, RouterModule, ButtonModule, TooltipModule, ToastModule, TranslateModule, ChatWidgetComponent],
  providers: [MessageService],
  templateUrl: './accueil.component.html',
  styleUrls: ['./accueil.component.scss']
})
export class AccueilComponent {
  private factureService = inject(FactureService);
  private authService    = inject(AuthService);
  private emetteurService = inject(EmetteurService);
  private messageService = inject(MessageService);

  totalFactures: number = 0;
  pendingDemandes: number = 3;
  raisonSociale = signal<string | null>(null);

  get role(): UserRole | null {
    return this.authService.currentUser()?.role ?? null;
  }

  hasRole(role: UserRole): boolean {
    return this.authService.hasRole(role);
  }

  hasAnyRole(roles: readonly UserRole[]): boolean {
    return this.authService.hasAnyRole(roles);
  }

  get isViewer(): boolean {
    return this.hasRole('ENTREPRISE_VIEWER');
  }

  get userLabel(): string {
    const user = this.authService.currentUser();
    if (!user) return 'Utilisateur';
    return `${user.prenom ?? ''} ${user.nom ?? ''}`.trim() || user.email;
  }

  get roleLabel(): string {
    const map: Record<UserRole, string> = {
      SUPER_ADMIN: 'Super Admin',
      ENTREPRISE_ADMIN: 'Entreprise Admin',
      ENTREPRISE_MANAGER: 'Manager',
      ENTREPRISE_VIEWER: 'Consultant',
      CLIENT: 'Client',
      EMETTEUR: 'Emetteur'
    };

    return this.role ? map[this.role] : 'Utilisateur';
  }

  constructor() {
    this.loadTotalFactures();
    effect(() => {
      const user = this.authService.currentUser();
      if (user?.emetteurId) {
        this.emetteurService.getEmetteurById(user.emetteurId).subscribe({
          next: (emetteur) => this.raisonSociale.set(emetteur?.raisonSociale || null),
          error: () => this.raisonSociale.set(null)
        });
      } else {
        this.raisonSociale.set(null);
      }
    });
  }

  loadTotalFactures(): void {
    this.factureService.getFactures(1, 1).subscribe({
      next: (response: any) => { this.totalFactures = response.total || 0; },
      error: () => { this.totalFactures = 0; }
    });
  }

  logout(): void {
    this.messageService.add({ severity: 'info', summary: 'Déconnexion', detail: 'Vous êtes déconnecté' });
    this.authService.logout();
  }
}