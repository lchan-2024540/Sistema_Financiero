import { Component, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
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

  constructor(private clientesService: ClientesService) {}

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

  desactivar(cliente: Cliente): void {
    const confirmado = confirm(
      `¿Desactivar a ${cliente.nombre} ${cliente.apellido}? Sus datos no se eliminarán.`
    );
    if (!confirmado) return;

    this.clientesService.desactivar(cliente.id_cliente).subscribe({
      next: () => this.cargarClientes(),
      error: () => this.errorMensaje.set('No se pudo desactivar al cliente.'),
    });
  }
}
