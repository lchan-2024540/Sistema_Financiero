import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { API_BASE_URL } from '../config';
import { RegistroInput, RespuestaLogin, Rol, UsuarioAutenticado } from '../models/modelos';

const CLAVE_STORAGE = 'banco_academico_sesion';

@Injectable({ providedIn: 'root' })
export class AuthService {
  // Signal con el usuario actual (null si no hay sesión). La UI reacciona
  // automáticamente a cambios aquí (ver shared/layout).
  usuarioActual = signal<UsuarioAutenticado | null>(this.leerUsuarioGuardado());

  constructor(private http: HttpClient) {}

  login(correo: string, password: string): Observable<RespuestaLogin> {
    return this.http
      .post<RespuestaLogin>(`${API_BASE_URL}/auth/login`, { correo, password })
      .pipe(tap((respuesta) => this.guardarSesion(respuesta)));
  }

  /** Autoregistro de un cliente nuevo; deja la sesión iniciada. */
  registrar(datos: RegistroInput): Observable<RespuestaLogin> {
    return this.http
      .post<RespuestaLogin>(`${API_BASE_URL}/auth/registro`, datos)
      .pipe(tap((respuesta) => this.guardarSesion(respuesta)));
  }

  /** true si el usuario actual tiene alguno de los roles indicados. */
  tieneRol(...roles: Rol[]): boolean {
    const usuario = this.usuarioActual();
    return !!usuario && roles.includes(usuario.rol);
  }

  /** true para administrador y cajero (personal del banco). */
  esPersonal(): boolean {
    return this.tieneRol('administrador', 'cajero');
  }

  private guardarSesion(respuesta: RespuestaLogin): void {
    localStorage.setItem(
      CLAVE_STORAGE,
      JSON.stringify({ token: respuesta.token, usuario: respuesta.usuario })
    );
    this.usuarioActual.set(respuesta.usuario);
  }

  logout(): void {
    // El "cierre de sesión" real con JWT ocurre aquí: se borra el token
    // guardado en el navegador. El backend no necesita saberlo (ver
    // docs/api-endpoints.md para la explicación completa).
    this.http.post(`${API_BASE_URL}/auth/logout`, {}).subscribe({
      error: () => {
        /* aunque falle la llamada, igual cerramos sesión localmente */
      },
    });
    localStorage.removeItem(CLAVE_STORAGE);
    this.usuarioActual.set(null);
  }

  obtenerToken(): string | null {
    const datos = localStorage.getItem(CLAVE_STORAGE);
    if (!datos) return null;
    try {
      return JSON.parse(datos).token ?? null;
    } catch {
      return null;
    }
  }

  estaAutenticado(): boolean {
    return this.obtenerToken() !== null;
  }

  private leerUsuarioGuardado(): UsuarioAutenticado | null {
    const datos = localStorage.getItem(CLAVE_STORAGE);
    if (!datos) return null;
    try {
      return JSON.parse(datos).usuario ?? null;
    } catch {
      return null;
    }
  }
}
