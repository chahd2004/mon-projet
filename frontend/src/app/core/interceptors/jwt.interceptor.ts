import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);

  // Routes publiques — pas de token
  const publicRoutes = ['/auth/login', '/auth/register'];
  const isPublic = publicRoutes.some(route => req.url.includes(route));

  if (isPublic) {
    return next(req);
  }

  // Routes protégées — attacher le token
  const token = localStorage.getItem('jwt_token');

  const authReq = token
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 && !router.url.includes('/login')) {
        localStorage.removeItem('jwt_token');
        localStorage.removeItem('current_user');
        router.navigate(['/login']);
      }
      return throwError(() => error);
    })
  );
};