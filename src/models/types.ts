export interface Cliente {
  id_cliente: number;
  nombre: string;
  apellido: string;
  dpi_ficticio: string;
  telefono: string | null;
  correo: string;
  activo: boolean;
  fecha_registro: string;
}

export interface ClienteInput {
  nombre: string;
  apellido: string;
  dpi_ficticio: string;
  telefono?: string;
  correo: string;
}

export interface Cuenta {
  id_cuenta: number;
  id_cliente: number;
  id_tipo_cuenta: number;
  numero_cuenta: string;
  saldo: number;
  estado: 'activa' | 'inactiva';
  fecha_apertura: string;
}

export interface CuentaInput {
  id_cliente: number;
  id_tipo_cuenta: number;
  numero_cuenta: string;
  saldo_inicial?: number;
}

export interface TipoCuenta {
  id_tipo_cuenta: number;
  nombre: string;
  tasa_interes: number;
}
