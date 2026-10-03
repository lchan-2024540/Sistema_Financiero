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

export interface UsuarioAutenticado {
  id_usuario: number;
  correo: string;
  rol: 'administrador' | 'cajero';
}

export interface RespuestaLogin {
  token: string;
  usuario: UsuarioAutenticado;
}
