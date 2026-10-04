import { Component, ElementRef, HostListener, ViewChild, inject } from '@angular/core';
import { ConfirmService } from '../../core/services/confirm.service';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  templateUrl: './confirm-dialog.component.html',
  styleUrl: './confirm-dialog.component.css',
})
export class ConfirmDialogComponent {
  confirmService = inject(ConfirmService);

  private botonCancelar?: ElementRef<HTMLButtonElement>;
  private botonConfirmar?: ElementRef<HTMLButtonElement>;

  // Al abrirse el diálogo se enfoca un botón: "Cancelar" si la acción es
  // destructiva (para que un Enter accidental no la ejecute), si no "Confirmar".
  @ViewChild('btnCancelar') set cancelar(el: ElementRef<HTMLButtonElement> | undefined) {
    this.botonCancelar = el;
    this.enfocarInicial();
  }
  @ViewChild('btnConfirmar') set confirmar(el: ElementRef<HTMLButtonElement> | undefined) {
    this.botonConfirmar = el;
    this.enfocarInicial();
  }

  private enfocarInicial(): void {
    const activa = this.confirmService.activa();
    if (!activa || !this.botonCancelar || !this.botonConfirmar) return;
    const destino = activa.peligro ? this.botonCancelar : this.botonConfirmar;
    setTimeout(() => destino.nativeElement.focus());
  }

  @HostListener('document:keydown.escape')
  alEscape(): void {
    this.confirmService.responder(false);
  }

  // Mantiene el foco dentro del diálogo (Tab / Shift+Tab alternan entre los 2 botones).
  atraparTab(evento: Event): void {
    const e = evento as KeyboardEvent;
    const a = this.botonCancelar?.nativeElement;
    const b = this.botonConfirmar?.nativeElement;
    if (!a || !b) return;
    const primero = a;
    const ultimo = b;
    if (e.shiftKey && document.activeElement === primero) {
      e.preventDefault();
      ultimo.focus();
    } else if (!e.shiftKey && document.activeElement === ultimo) {
      e.preventDefault();
      primero.focus();
    }
  }
}
