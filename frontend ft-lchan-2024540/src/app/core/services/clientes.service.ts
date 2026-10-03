import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../config';
import { Cliente, ClienteInput } from '../models/modelos';

@Injectable({ providedIn: 'root' })
export class ClientesService {
  constructor(private http: HttpClient) {}

  listar(): Observable<Cliente[]> {
    return this.http.get<Cliente[]>(`${API_BASE_URL}/clientes`);
  }

  obtener(id: number): Observable<Cliente> {
    return this.http.get<Cliente>(`${API_BASE_URL}/clientes/${id}`);
  }

  crear(datos: ClienteInput): Observable<Cliente> {
    return this.http.post<Cliente>(`${API_BASE_URL}/clientes`, datos);
  }

  modificar(id: number, datos: Partial<ClienteInput>): Observable<Cliente> {
    return this.http.patch<Cliente>(`${API_BASE_URL}/clientes/${id}`, datos);
  }

  desactivar(id: number): Observable<{ mensaje: string }> {
    return this.http.delete<{ mensaje: string }>(`${API_BASE_URL}/clientes/${id}`);
  }
}
