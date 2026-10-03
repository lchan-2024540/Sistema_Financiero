import { Component, OnInit, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { CuentasService, TipoCuenta } from '../../../core/services/cuentas.service';
import { ClientesService } from '../../../core/services/clientes.service';
import { Cliente } from '../../../core/models/modelos';

@Component({
  selector: 'app-cuenta-form',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './cuenta-form.component.html',
  styleUrl: './cuenta-form.component.css',
})
export class CuentaFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private cuentasService = inject(CuentasService);
  private clientesService = inject(ClientesService);
  private router = inject(Router);

  cargandoListas = signal(true);
  guardando = signal(false);
  errorMensaje = signal<string | null>(null);

  clientes = signal<Cliente[]>([]);
  tiposCuenta = signal<TipoCuenta[]>([]);

  formulario = this.fb.group({
    id_cliente: [null as number | null, [Validators.required]],
    id_tipo_cuenta: [null as number | null, [Validators.required]],
    numero_cuenta: ['', [Validators.required]],
    saldo_inicial: [0, [Validators.min(0)]],
  });

  ngOnInit(): void {
    // Solo se pueden abrir cuentas a clientes activos.
    forkJoin({
      clientes: this.clientesService.listar(),
      tipos: this.cuentasService.listarTiposCuenta(),
    }).subscribe({
      next: ({ clientes, tipos }) => {
        this.clientes.set(clientes.filter((c) => c.activo));
        this.tiposCuenta.set(tipos);
        this.cargandoListas.set(false);
      },
      error: () => {
        this.errorMensaje.set('No se pudieron cargar los clientes/tipos de cuenta.');
        this.cargandoListas.set(false);
      },
    });
  }

  enviar(): void {
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }

    this.guardando.set(true);
    this.errorMensaje.set(null);

    const valores = this.formulario.getRawValue();

    this.cuentasService
      .crear({
        id_cliente: valores.id_cliente!,
        id_tipo_cuenta: valores.id_tipo_cuenta!,
        numero_cuenta: valores.numero_cuenta!,
        saldo_inicial: valores.saldo_inicial ?? 0,
      })
      .subscribe({
        next: () => this.router.navigate(['/cuentas']),
        error: (err) => {
          this.guardando.set(false);
          this.errorMensaje.set(err.error?.error ?? 'No se pudo crear la cuenta.');
        },
      });
  }
}
