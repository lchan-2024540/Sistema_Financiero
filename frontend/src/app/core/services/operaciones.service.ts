import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../config';
import { OperacionInput, RespuestaOperacion } from '../models/modelos';

@Injectable({ providedIn: 'root' })
export class OperacionesService {
  constructor(private http: HttpClient) {}

  depositar(datos: OperacionInput): Observable<RespuestaOperacion> {
    return this.http.post<RespuestaOperacion>(`${API_BASE_URL}/depositos`, datos);
  }

  retirar(datos: OperacionInput): Observable<RespuestaOperacion> {
    return this.http.post<RespuestaOperacion>(`${API_BASE_URL}/retiros`, datos);
  }
}
