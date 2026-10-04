import { Component, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ConfirmService } from '../../../core/services/confirm.service';
import { ClientesService } from '../../../core/services/clientes.service';
import { Cliente } from '../../../core/models/modelos';

@Component({
  selector: 'app-clientes-lista',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './clientes-lista.component.html',
  styleUrl: './clientes-lista.component.css',
})
export class ClientesListaComponent implements OnInit {
  clientes = signal<Cliente[]>([]);
  cargando = signal(true);
  errorMensaje = signal<string | null>(null);

  constructor(
    private clientesService: ClientesService,
    private confirmService: ConfirmService
  ) {}

  ngOnInit(): void {
    this.cargarClientes();
  }

  cargarClientes(): void {
    this.cargando.set(true);
    this.clientesService.listar().subscribe({
      next: (datos) => {
        this.clientes.set(datos);
        this.cargando.set(false);
      },
      error: () => {
        this.errorMensaje.set('No se pudieron cargar los clientes.');
        this.cargando.set(false);
      },
    });
  }

  async reactivar(cliente: Cliente): Promise<void> {
    const confirmado = await this.confirmService.confirmar({
      titulo: 'Reactivar cliente',
      mensaje: `¿Reactivar a ${cliente.nombre} ${cliente.apellido}? Podrá volver a operar con normalidad.`,
      textoConfirmar: 'Reactivar',
    });
    if (!confirmado) return;

    this.errorMensaje.set(null);
    this.clientesService.reactivar(cliente.id_cliente).subscribe({
      next: () => this.cargarClientes(),
      error: (err) =>
        this.errorMensaje.set(err.error?.error ?? 'No se pudo reactivar al cliente.'),
    });
  }

  async desactivar(cliente: Cliente): Promise<void> {
    const confirmado = await this.confirmService.confirmar({
      titulo: 'Desactivar cliente',
      mensaje: `¿Desactivar a ${cliente.nombre} ${cliente.apellido}? Sus datos no se eliminarán.`,
      textoConfirmar: 'Desactivar',
      peligro: true,
    });
    if (!confirmado) return;

    this.clientesService.desactivar(cliente.id_cliente).subscribe({
      next: () => this.cargarClientes(),
      error: () => this.errorMensaje.set('No se pudo desactivar al cliente.'),
    });
  }
}
