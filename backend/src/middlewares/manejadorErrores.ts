import { Request, Response, NextFunction } from 'express';
import { ErrorNegocio } from '../utils/ErrorNegocio';

/**
 * Middleware central de manejo de errores.
 * Todas las rutas usan asyncHandler (ver utils/asyncHandler.ts) para que
 * cualquier error caiga aquí en vez de tumbar el servidor.
 */
export function manejadorErrores(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof ErrorNegocio) {
    res.status(err.statusCode).json({ error: err.message });
    return;
  }

  console.error('Error no controlado:', err);
  res.status(500).json({ error: 'Error interno del servidor.' });
}

/**
 * Middleware para rutas no encontradas (404).
 */
export function rutaNoEncontrada(req: Request, res: Response): void {
  res.status(404).json({ error: `Ruta no encontrada: ${req.method} ${req.originalUrl}` });
}
