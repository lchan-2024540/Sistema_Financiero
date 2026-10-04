import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'clave-secreta-academica-sistema-bancario';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '8h';

export type Rol = 'administrador' | 'cajero' | 'cliente';

export interface PayloadToken {
  id_usuario: number;
  correo: string;
  rol: Rol;
  /** Solo para el rol "cliente": id del Cliente al que pertenece el usuario. */
  id_cliente?: number | null;
}

/** Genera un token firmado a partir de los datos del usuario autenticado. */
export function generarToken(payload: PayloadToken): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN } as jwt.SignOptions);
}

/** Verifica y decodifica un token. Lanza si es inválido o expiró. */
export function verificarToken(token: string): PayloadToken {
  return jwt.verify(token, JWT_SECRET) as PayloadToken;
}
