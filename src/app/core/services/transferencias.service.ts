import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../config';
import { RespuestaTransferencia, TransferenciaInput } from '../models/modelos';

@Injectable({ providedIn: 'root' })
export class TransferenciasService {
  constructor(private http: HttpClient) {}

  transferir(datos: TransferenciaInput): Observable<RespuestaTransferencia> {
    return this.http.post<RespuestaTransferencia>(`${API_BASE_URL}/transferencias`, datos);
  }
}
