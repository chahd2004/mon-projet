import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule, ButtonModule, CardModule],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent {
  private router = inject(Router);
  private authService = inject(AuthService);

  navigateToLogin(): void {
    this.router.navigate(['/login']);
  }

  navigateToRegister(): void {
    if (this.authService.isLoggedIn() && this.authService.hasAnyRole(['SUPER_ADMIN', 'ENTREPRISE_ADMIN', 'EMETTEUR'])) {
      this.router.navigate(['/registerclient']);
      return;
    }

    this.router.navigate(['/register']);
  }

  navigateToDemande(): void {
    this.router.navigate(['/demande']);
  }

  navigateToAdmin(): void {
    if (this.authService.isLoggedIn() && this.authService.hasRole('SUPER_ADMIN')) {
      this.router.navigate(['/super-admin/users']);
      return;
    }

    this.router.navigate(['/login'], {
      queryParams: { returnUrl: '/super-admin/users' }
    });
  }
}
