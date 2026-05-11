import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = async () => {
  // Guardia principal: si no hay usuario logueado, la app vuelve al login.
  // Esto cumple la idea de "primero decime quien sos" antes de mostrar las pantallas internas.
  const authService = inject(AuthService);
  const router = inject(Router);
  const user = await authService.getCurrentUser();

  return user ? true : router.createUrlTree(['/login']);
};
