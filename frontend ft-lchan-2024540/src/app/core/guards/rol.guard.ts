import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { Rol } from '../models/modelos';

/**
 * Restringe una ruta a ciertos roles. Ejemplo:
 *   canActivate: [rolGuard('administrador', 'cajero')]
 * Si el usuario no tiene el rol, se le manda a /cuentas, que existe para todos.
 * (La seguridad real está en el backend; esto solo evita mostrar pantallas
 * que el rol no puede usar.)
 */
export function rolGuard(...roles: Rol[]): CanActivateFn {
  return () => {
    const authService = inject(AuthService);
    const router = inject(Router);

    if (authService.tieneRol(...roles)) {
      return true;
    }
    return router.createUrlTree(['/cuentas']);
  };
}
