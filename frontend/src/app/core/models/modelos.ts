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
  cliente_nombre?: string;
  cliente_apellido?: string;
  tipo_cuenta?: string;
}

export interface CuentaInput {
  id_cliente: number;
  id_tipo_cuenta: number;
  numero_cuenta: string;
  saldo_inicial?: number;
}

export type Rol = 'administrador' | 'cajero' | 'cliente';

export interface UsuarioAutenticado {
  id_usuario: number;
  correo: string;
  rol: Rol;
  id_cliente?: number | null;
}

export interface RegistroInput {
  nombre: string;
  apellido: string;
  dpi_ficticio: string;
  telefono?: string;
  correo: string;
  password: string;
}

export interface TransferenciaInput {
  id_cuenta_origen: number;
  id_cuenta_destino?: number;
  numero_cuenta_destino?: string;
  monto: number;
}

export interface RespuestaTransferencia {
  mensaje: string;
  id_cuenta_origen: number;
  id_cuenta_destino: number;
  numero_cuenta_origen: string;
  numero_cuenta_destino: string;
  titular_destino: string;
  monto: number;
  saldo_origen_actual: number;
  saldo_destino_actual: number;
}

export interface RespuestaLogin {
  token: string;
  usuario: UsuarioAutenticado;
}

export interface OperacionInput {
  id_cuenta: number;
  monto: number;
}

export interface RespuestaOperacion {
  mensaje: string;
  id_cuenta: number;
  monto: number;
  saldo_actual: number;
}
