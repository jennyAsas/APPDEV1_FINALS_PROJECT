// src/app/auth.guard.ts (CORRECTED)

import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map } from 'rxjs/operators';
// 👈 FIX: Import the new class name from the correct path
import { AuthService } from './auth.service';

export const adminGuard: CanActivateFn = (route, state) => {
  // 👈 FIX: Inject the correct service name
  const authService = inject(AuthService);
  const router = inject(Router);

  // Use the observable state from the Auth service
  // FIX: TS18046 resolved as authService now has a defined type
  // Only allow users that have the admin custom claim
  return authService.isAdmin$.pipe(
    map((isAdmin) => (isAdmin ? true : router.createUrlTree(['/login']))),
  );
};

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.currentUser$.pipe(
    map((user) => (user ? true : router.createUrlTree(['/login']))),
  );
};
