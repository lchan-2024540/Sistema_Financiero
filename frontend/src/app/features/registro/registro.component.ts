import { Component, inject, signal } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

// Solo se admiten correos de Gmail u Outlook.
const CORREO_PERMITIDO = /^[^\s@]+@(gmail|outlook)\.com$/i;

function passwordsIguales(grupo: AbstractControl): ValidationErrors | null {
  const password = grupo.get('password')?.value;
  const confirmar = grupo.get('confirmar')?.value;
  return password === confirmar ? null : { noCoinciden: true };
}

@Component({
  selector: 'app-registro',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './registro.component.html',
  styleUrl: './registro.component.css',
})
export class RegistroComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  cargando = signal(false);
  errorMensaje = signal<string | null>(null);

  formulario = this.fb.group(
    {
      nombre: ['', [Validators.required]],
      apellido: ['', [Validators.required]],
      dpi_ficticio: ['', [Validators.required, Validators.minLength(10)]],
      telefono: [''],
      correo: ['', [Validators.required, Validators.pattern(CORREO_PERMITIDO)]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmar: ['', [Validators.required]],
    },
    { validators: passwordsIguales }
  );

  enviar(): void {
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }

    this.cargando.set(true);
    this.errorMensaje.set(null);

    const v = this.formulario.getRawValue();

    this.authService
      .registrar({
        nombre: v.nombre!.trim(),
        apellido: v.apellido!.trim(),
        dpi_ficticio: v.dpi_ficticio!.trim(),
        telefono: v.telefono?.trim() || undefined,
        correo: v.correo!.trim(),
        password: v.password!,
      })
      .subscribe({
        // El registro deja la sesión iniciada: se entra directo a "Mis cuentas".
        next: () => {
          this.cargando.set(false);
          this.router.navigate(['/cuentas']);
        },
        error: (err) => {
          this.cargando.set(false);
          this.errorMensaje.set(
            err.error?.error ?? 'No se pudo completar el registro. Intenta de nuevo.'
          );
        },
      });
  }
}
