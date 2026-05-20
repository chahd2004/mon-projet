import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { ADMIN_ROLES, UserRole } from '../../models/enums';

export const authGuard: CanActivateFn = (_route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isLoggedIn()) {
    router.navigate(['/login'], {
      queryParams: { returnUrl: state.url }
    });
    return false;
  }

  if (authService.requiresPasswordChange() && state.url !== '/change-password') {
    router.navigate(['/change-password']);
    return false;
  }

  return true;

};

export const roleGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isLoggedIn()) {
    router.navigate(['/login'], {
      queryParams: { returnUrl: state.url }
    });
    return false;
  }

  if (authService.requiresPasswordChange() && state.url !== '/change-password') {
    router.navigate(['/change-password']);
    return false;
  }

  const roles = route.data?.['roles'] as UserRole[] | undefined;
  if (!roles?.length) return true;

  if (authService.hasAnyRole(roles)) return true;

  router.navigate(['/dashboard']);
  return false;
};

export const adminGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.hasAnyRole(ADMIN_ROLES)) return true;

  router.navigate(['/dashboard']);
  return false;
};

export const clientGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.hasRole('CLIENT')) return true;

  router.navigate(['/dashboard']);
  return false;
};

export const emetteurGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.hasRole('EMETTEUR')) return true;

  router.navigate(['/dashboard']);
  return false;
};

export const guestGuard: CanActivateFn = () => {
  // Permet l'accès à login/register pour tous (connectés ou pas)
  return true;
};

export const firstLoginGuard: CanActivateFn = (_route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isLoggedIn()) {
    router.navigate(['/login'], {
      queryParams: { returnUrl: state.url }
    });
    return false;
  }

  return true;
};