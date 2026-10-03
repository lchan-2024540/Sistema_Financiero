import { Component, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ClientesService } from '../../../core/services/clientes.service';

@Component({
  selector: 'app-cliente-form',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './cliente-form.component.html',
  styleUrl: './cliente-form.component.css',
})
export class ClienteFormComponent {
  private fb = inject(FormBuilder);
  private clientesService = inject(ClientesService);
  private router = inject(Router);

  guardando = signal(false);
  errorMensaje = signal<string | null>(null);

  // El backend solo acepta correos de Gmail u Outlook (ver clientesController.ts).
  formulario = this.fb.group({
    nombre: ['', [Validators.required]],
    apellido: ['', [Validators.required]],
    dpi_ficticio: ['', [Validators.required, Validators.minLength(10)]],
    telefono: [''],
    correo: [
      '',
      [Validators.required, Validators.pattern(/^[^\s@]+@(gmail\.com|outlook\.com)$/i)],
    ],
  });

  enviar(): void {
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }

    this.guardando.set(true);
    this.errorMensaje.set(null);

    const valores = this.formulario.getRawValue();

    this.clientesService
      .crear({
        nombre: valores.nombre!,
        apellido: valores.apellido!,
        dpi_ficticio: valores.dpi_ficticio!,
        telefono: valores.telefono || undefined,
        correo: valores.correo!,
      })
      .subscribe({
        next: () => this.router.navigate(['/clientes']),
        error: (err) => {
          this.guardando.set(false);
          this.errorMensaje.set(err.error?.error ?? 'No se pudo registrar el cliente.');
        },
      });
  }
}
