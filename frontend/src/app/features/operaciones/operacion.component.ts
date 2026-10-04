import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { ConfirmService } from '../../core/services/confirm.service';
import { CuentasService } from '../../core/services/cuentas.service';
import { OperacionesService } from '../../core/services/operaciones.service';
import { Cuenta, RespuestaOperacion } from '../../core/models/modelos';

type TipoOperacion = 'deposito' | 'retiro';

/**
 * Pantalla única para depósitos y retiros (solo personal del banco).
 * El tipo se define en la ruta: data: { tipo: 'deposito' | 'retiro' }.
 */
@Component({
  selector: 'app-operacion',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './operacion.component.html',
  styleUrl: './operacion.component.css',
})
export class OperacionComponent implements OnInit {
  private fb = inject(FormBuilder);
  private ruta = inject(ActivatedRoute);
  private cuentasService = inject(CuentasService);
  private operacionesService = inject(OperacionesService);
  private confirmService = inject(ConfirmService);

  tipo: TipoOperacion = this.ruta.snapshot.data['tipo'] === 'retiro' ? 'retiro' : 'deposito';
  esRetiro = this.tipo === 'retiro';

  titulo = this.esRetiro ? 'Retiros' : 'Depósitos';
  descripcion = this.esRetiro
    ? 'Retira dinero de una cuenta. El monto no puede superar el saldo disponible.'
    : 'Agrega dinero al saldo de una cuenta.';
  textoBoton = this.esRetiro ? 'Retirar' : 'Depositar';

  cuentas = signal<Cuenta[]>([]);
  cargando = signal(true);
  enviando = signal(false);
  errorMensaje = signal<string | null>(null);
  resultado = signal<RespuestaOperacion | null>(null);
  numeroCuentaResultado = signal('');

  cuentasActivas = computed(() => this.cuentas().filter((c) => c.estado === 'activa'));

  formulario = this.fb.group({
    cuenta: [null as number | null, [Validators.required]],
    monto: [null as number | null, [Validators.required, Validators.min(0.01)]],
  });

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

  cuentaPorId(id: number | null | undefined): Cuenta | undefined {
    return this.cuentas().find((c) => c.id_cuenta === id);
  }

  etiquetaCuenta(c: Cuenta): string {
    return `${c.numero_cuenta} — ${c.cliente_nombre} ${c.cliente_apellido} (${this.formatearMoneda(c.saldo)})`;
  }

  formatearMoneda(valor: number): string {
    return new Intl.NumberFormat('es-GT', { style: 'currency', currency: 'GTQ' }).format(
      Number(valor)
    );
  }

  async enviar(): Promise<void> {
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }

    const v = this.formulario.getRawValue();
    const cuenta = this.cuentaPorId(v.cuenta);
    const monto = Number(v.monto);

    this.errorMensaje.set(null);
    this.resultado.set(null);

    if (this.esRetiro && cuenta && monto > Number(cuenta.saldo)) {
      this.errorMensaje.set(
        `Saldo insuficiente. Saldo disponible: ${this.formatearMoneda(cuenta.saldo)}.`
      );
      return;
    }

    const confirmado = await this.confirmService.confirmar({
      titulo: this.esRetiro ? 'Confirmar retiro' : 'Confirmar depósito',
      mensaje:
        `¿${this.esRetiro ? 'Retirar' : 'Depositar'} ${this.formatearMoneda(monto)} ` +
        `${this.esRetiro ? 'de' : 'en'} la cuenta ${cuenta?.numero_cuenta}?`,
      textoConfirmar: this.textoBoton,
    });
    if (!confirmado) return;

    const datos = { id_cuenta: v.cuenta!, monto };
    const peticion = this.esRetiro
      ? this.operacionesService.retirar(datos)
      : this.operacionesService.depositar(datos);

    this.enviando.set(true);
    peticion.subscribe({
      next: (respuesta) => {
        this.enviando.set(false);
        this.numeroCuentaResultado.set(cuenta?.numero_cuenta ?? '');
        this.resultado.set(respuesta);
        this.formulario.reset({ cuenta: null, monto: null });
        this.cargarCuentas();
      },
      error: (err) => {
        this.enviando.set(false);
        this.errorMensaje.set(
          err.error?.error ?? `No se pudo realizar el ${this.esRetiro ? 'retiro' : 'depósito'}.`
        );
      },
    });
  }
}
