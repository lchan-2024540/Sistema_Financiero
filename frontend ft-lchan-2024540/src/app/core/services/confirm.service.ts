import { Injectable, signal } from '@angular/core';

export interface OpcionesConfirmacion {
  titulo: string;
  mensaje: string;
  textoConfirmar?: string;
  textoCancelar?: string;
  /** Acción destructiva: el botón de confirmar se pinta en rojo. */
  peligro?: boolean;
}

interface ConfirmacionActiva extends OpcionesConfirmacion {
  resolver: (confirmado: boolean) => void;
}

/**
 * Reemplazo del confirm() del navegador (ese cuadro que dice "localhost dice").
 * Muestra un diálogo dentro de la propia aplicación (ver
 * shared/confirm-dialog) y devuelve una promesa con la decisión:
 *
 *   if (!(await this.confirmService.confirmar({ titulo: '...', mensaje: '...' }))) return;
 */
@Injectable({ providedIn: 'root' })
export class ConfirmService {
  readonly activa = signal<ConfirmacionActiva | null>(null);

  confirmar(opciones: OpcionesConfirmacion): Promise<boolean> {
    // Si ya había un diálogo abierto, se descarta como "cancelado".
    this.activa()?.resolver(false);
    return new Promise<boolean>((resolver) => {
      this.activa.set({ ...opciones, resolver });
    });
  }

  responder(confirmado: boolean): void {
    const actual = this.activa();
    if (!actual) return;
    this.activa.set(null);
    actual.resolver(confirmado);
  }
}
