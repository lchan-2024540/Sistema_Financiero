import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../config';
import { Cuenta, CuentaInput } from '../models/modelos';

export interface TipoCuenta {
  id_tipo_cuenta: number;
  nombre: string;
  tasa_interes: number;
}

@Injectable({ providedIn: 'root' })
export class CuentasService {
  constructor(private http: HttpClient) {}

  listar(): Observable<Cuenta[]> {
    return this.http.get<Cuenta[]>(`${API_BASE_URL}/cuentas`);
  }

  obtener(id: number): Observable<Cuenta> {
    return this.http.get<Cuenta>(`${API_BASE_URL}/cuentas/${id}`);
  }

  crear(datos: CuentaInput): Observable<Cuenta> {
    return this.http.post<Cuenta>(`${API_BASE_URL}/cuentas`, datos);
  }

  cambiarEstado(id: number, estado: 'activa' | 'inactiva'): Observable<Cuenta> {
    return this.http.patch<Cuenta>(`${API_BASE_URL}/cuentas/${id}`, { estado });
  }

  listarTiposCuenta(): Observable<TipoCuenta[]> {
    return this.http.get<TipoCuenta[]>(`${API_BASE_URL}/tipos-cuenta`);
  }
}
