import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

/**
 * Agrega "Authorization: Bearer <token>" a toda petición saliente,
 * si hay una sesión activa. Así no hay que repetir esta lógica en
 * cada servicio (clientes, cuentas, etc).
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.obtenerToken();

  if (!token) {
    return next(req);
  }

  const peticionConToken = req.clone({
    setHeaders: { Authorization: `Bearer ${token}` },
  });
  return next(peticionConToken);
};
