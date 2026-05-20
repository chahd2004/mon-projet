import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { AvatarModule } from 'primeng/avatar';
import { AuthService } from '../../../core/services/auth.service';
import { EmetteurService } from '../../../core/services/emetteur.service';
import { signal, effect } from '@angular/core';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, ButtonModule, AvatarModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent {
  authService = inject(AuthService);
  private emetteurService = inject(EmetteurService);

  currentUser = this.authService.currentUser;
  raisonSociale = signal<string | null>(null);

  constructor() {
    effect(() => {
      const user = this.currentUser();
      if (user?.emetteurId) {
        this.emetteurService.getEmetteurById(user.emetteurId).subscribe({
          next: (emetteur) => {
            this.raisonSociale.set(emetteur?.raisonSociale || null);
          },
          error: () => this.raisonSociale.set(null)
        });
      } else {
        this.raisonSociale.set(null);
      }
    });
  }

  getInitials(): string {
    const user = this.currentUser();
    if (!user) return '?';
    const prenom = user.prenom?.[0] || '';
    const nom = user.nom?.[0] || '';
    return (prenom + nom).toUpperCase();
  }
}
