import { Component, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  cargando = signal(false);
  errorMensaje = signal<string | null>(null);

  formulario = this.fb.group({
    correo: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
  });

  enviar(): void {
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }

    this.cargando.set(true);
    this.errorMensaje.set(null);

    const { correo, password } = this.formulario.getRawValue();

    this.authService.login(correo!, password!).subscribe({
      next: () => {
        this.cargando.set(false);
        this.router.navigate(['/clientes']);
      },
      error: (err) => {
        this.cargando.set(false);
        this.errorMensaje.set(
          err.error?.error ?? 'No se pudo iniciar sesión. Intenta de nuevo.'
        );
      },
    });
  }
}
