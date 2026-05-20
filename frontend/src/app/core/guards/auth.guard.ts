// src/app/core/guards/auth.guard.ts
import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../services/auth.service'; // ← Vérifie ce chemin

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(): boolean {
    const isLoggedIn = this.authService.isLoggedIn();
    console.log('🔒 AuthGuard - Est connecté ?', isLoggedIn);
    
    if (isLoggedIn) {
      console.log('✅ Accès autorisé au dashboard');
      return true;
    } else {
      console.log('❌ Non connecté, redirection vers login');
      this.router.navigate(['/login']);
      return false;
    }
  }
}