import { Component, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CuentasService } from '../../../core/services/cuentas.service';
import { Cuenta } from '../../../core/models/modelos';

@Component({
  selector: 'app-cuentas-lista',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './cuentas-lista.component.html',
  styleUrl: './cuentas-lista.component.css',
})
export class CuentasListaComponent implements OnInit {
  cuentas = signal<Cuenta[]>([]);
  cargando = signal(true);
  errorMensaje = signal<string | null>(null);

  constructor(private cuentasService: CuentasService) {}

  ngOnInit(): void {
    this.cargarCuentas();
  }

  cargarCuentas(): void {
    this.cargando.set(true);
    this.cuentasService.listar().subscribe({
      next: (datos) => {
        this.cuentas.set(datos);
        this.cargando.set(false);
      },
      error: () => {
        this.errorMensaje.set('No se pudieron cargar las cuentas.');
        this.cargando.set(false);
      },
    });
  }

  alternarEstado(cuenta: Cuenta): void {
    const nuevoEstado = cuenta.estado === 'activa' ? 'inactiva' : 'activa';
    const confirmado = confirm(
      `¿Cambiar la cuenta ${cuenta.numero_cuenta} a "${nuevoEstado}"?`
    );
    if (!confirmado) return;

    this.cuentasService.cambiarEstado(cuenta.id_cuenta, nuevoEstado).subscribe({
      next: () => this.cargarCuentas(),
      error: () => this.errorMensaje.set('No se pudo cambiar el estado de la cuenta.'),
    });
  }

  formatearMoneda(valor: number): string {
    return new Intl.NumberFormat('es-GT', { style: 'currency', currency: 'GTQ' }).format(
      Number(valor)
    );
  }
}
