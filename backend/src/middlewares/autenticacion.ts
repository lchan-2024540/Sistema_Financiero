import { Request, Response, NextFunction } from 'express';
import { verificarToken, PayloadToken, Rol } from '../utils/jwt';
import { ErrorNegocio } from '../utils/ErrorNegocio';

// Extiende el tipo Request de Express para poder guardar el usuario autenticado
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      usuario?: PayloadToken;
    }
  }
}

/**
 * Middleware de autenticación: exige un header "Authorization: Bearer <token>".
 * Si el token es válido, guarda los datos del usuario en req.usuario.
 * Se usa para proteger rutas como /depositos, /retiros, /transferencias, etc.
 */
export function requiereAutenticacion(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;

  if (!header || !header.startsWith('Bearer ')) {
    throw new ErrorNegocio('No se proporcionó un token de autenticación.', 401);
  }

  const token = header.slice('Bearer '.length);

  try {
    req.usuario = verificarToken(token);
    next();
  } catch {
    throw new ErrorNegocio('Token inválido o expirado. Inicia sesión de nuevo.', 401);
  }
}

/**
 * Middleware de control de acceso por rol.
 * Ejemplo de uso: requiereRol('administrador', 'cajero') deja pasar solo al personal
 * del banco (los usuarios con rol "cliente" reciben 403).
 * Debe usarse DESPUÉS de requiereAutenticacion.
 */
export function requiereRol(...rolesPermitidos: Rol[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.usuario || !rolesPermitidos.includes(req.usuario.rol)) {
      throw new ErrorNegocio('No tienes permisos para realizar esta acción.', 403);
    }
    next();
  };
}
