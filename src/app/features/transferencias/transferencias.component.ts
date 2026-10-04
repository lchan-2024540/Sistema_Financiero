import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { ConfirmService } from '../../core/services/confirm.service';
import { CuentasService } from '../../core/services/cuentas.service';
import { TransferenciasService } from '../../core/services/transferencias.service';
import { Cuenta, RespuestaTransferencia, TransferenciaInput } from '../../core/models/modelos';

/**
 * Pantalla de transferencias para los tres roles:
 *  - administrador / cajero: eligen cualquier cuenta de origen y de destino.
 *  - cliente: solo ve sus cuentas como origen y escribe el número de la cuenta destino.
 */
@Component({
  selector: 'app-transferencias',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './transferencias.component.html',
  styleUrl: './transferencias.component.css',
})
export class TransferenciasComponent implements OnInit {
  private fb = inject(FormBuilder);
  private cuentasService = inject(CuentasService);
  private transferenciasService = inject(TransferenciasService);
  private confirmService = inject(ConfirmService);
  authService = inject(AuthService);

  esCliente = this.authService.tieneRol('cliente');

  cuentas = signal<Cuenta[]>([]);
  cargando = signal(true);
  enviando = signal(false);
  errorMensaje = signal<string | null>(null);
  resultado = signal<RespuestaTransferencia | null>(null);

  // Solo las cuentas activas pueden operar.
  cuentasActivas = computed(() => this.cuentas().filter((c) => c.estado === 'activa'));

  formulario = this.fb.group({
    origen: [null as number | null, [Validators.required]],
    destino: [null as number | null],
    numeroDestino: [''],
    monto: [null as number | null, [Validators.required, Validators.min(0.01)]],
  });

  ngOnInit(): void {
    // Cada rol necesita un campo de destino distinto.
    const campoDestino = this.formulario.get(this.esCliente ? 'numeroDestino' : 'destino')!;
    campoDestino.addValidators(Validators.required);
    campoDestino.updateValueAndValidity();

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

  /** Cuentas que se pueden elegir como destino (todas las activas menos la de origen). */
  cuentasDestino(): Cuenta[] {
    const origen = this.formulario.get('origen')?.value;
    return this.cuentasActivas().filter((c) => c.id_cuenta !== origen);
  }

  cuentaPorId(id: number | null | undefined): Cuenta | undefined {
    return this.cuentas().find((c) => c.id_cuenta === id);
  }

  etiquetaCuenta(c: Cuenta): string {
    const titular = this.esCliente ? '' : ` — ${c.cliente_nombre} ${c.cliente_apellido}`;
    return `${c.numero_cuenta}${titular} (${this.formatearMoneda(c.saldo)})`;
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
    const origen = this.cuentaPorId(v.origen);
    const monto = Number(v.monto);

    this.errorMensaje.set(null);
    this.resultado.set(null);

    if (origen && monto > Number(origen.saldo)) {
      this.errorMensaje.set(
        `Saldo insuficiente. Saldo disponible: ${this.formatearMoneda(origen.saldo)}.`
      );
      return;
    }

    const datos: TransferenciaInput = { id_cuenta_origen: v.origen!, monto };
    let descripcionDestino: string;
    if (this.esCliente) {
      datos.numero_cuenta_destino = v.numeroDestino!.trim();
      descripcionDestino = `la cuenta ${datos.numero_cuenta_destino}`;
    } else {
      datos.id_cuenta_destino = v.destino!;
      const destino = this.cuentaPorId(v.destino);
      descripcionDestino = destino
        ? `${destino.numero_cuenta} (${destino.cliente_nombre} ${destino.cliente_apellido})`
        : `la cuenta #${v.destino}`;
    }

    const confirmado = await this.confirmService.confirmar({
      titulo: 'Confirmar transferencia',
      mensaje:
        `¿Transferir ${this.formatearMoneda(monto)} desde ${origen?.numero_cuenta} ` +
        `hacia ${descripcionDestino}?`,
      textoConfirmar: 'Transferir',
    });
    if (!confirmado) return;

    this.enviando.set(true);
    this.transferenciasService.transferir(datos).subscribe({
      next: (respuesta) => {
        this.enviando.set(false);
        this.resultado.set(respuesta);
        this.formulario.reset({ origen: null, destino: null, numeroDestino: '', monto: null });
        this.cargarCuentas();
      },
      error: (err) => {
        this.enviando.set(false);
        this.errorMensaje.set(err.error?.error ?? 'No se pudo realizar la transferencia.');
      },
    });
  }
}
