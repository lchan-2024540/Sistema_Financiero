/**
 * Error controlado para reglas de negocio (saldo insuficiente, cuenta inactiva,
 * datos inválidos, etc). Se diferencia de un error inesperado del servidor:
 * este sí debe mostrarse al usuario tal cual, con el código HTTP indicado.
 */
export class ErrorNegocio extends Error {
  public statusCode: number;

  constructor(mensaje: string, statusCode: number = 400) {
    super(mensaje);
    this.name = 'ErrorNegocio';
    this.statusCode = statusCode;
  }
}
