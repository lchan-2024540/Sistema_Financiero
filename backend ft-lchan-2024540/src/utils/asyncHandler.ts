import { Request, Response, NextFunction, RequestHandler } from 'express';

/**
 * Envuelve un controlador async para que, si lanza un error, Express lo
 * capture automáticamente y lo mande al manejador central de errores,
 * en vez de tener que escribir try/catch en cada controlador.
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>
): RequestHandler {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
}
