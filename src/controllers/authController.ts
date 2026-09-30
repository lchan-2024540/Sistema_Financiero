import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { pool } from '../config/db';
import { ErrorNegocio } from '../utils/ErrorNegocio';
import { generarToken } from '../utils/jwt';

/**
 * POST /auth/login
 * Valida credenciales ficticias contra la tabla Usuario y devuelve un JWT.
 */
export async function login(req: Request, res: Response): Promise<void> {
  const { correo, password } = req.body as { correo?: string; password?: string };

  if (!correo || !password) {
    throw new ErrorNegocio('Correo y contraseña son obligatorios.');
  }

  const [filas]: any = await pool.query(
    'SELECT * FROM Usuario WHERE correo = ? AND activo = TRUE',
    [correo]
  );

  // Mensaje genérico a propósito: no revelamos si fue el correo o la
  // contraseña lo que falló, para no dar pistas a quien intente adivinar.
  if (filas.length === 0) {
    throw new ErrorNegocio('Credenciales inválidas.', 401);
  }

  const usuario = filas[0];
  const passwordValida = await bcrypt.compare(password, usuario.password_hash);

  if (!passwordValida) {
    throw new ErrorNegocio('Credenciales inválidas.', 401);
  }

  const token = generarToken({
    id_usuario: usuario.id_usuario,
    correo: usuario.correo,
    rol: usuario.rol,
  });

  res.json({
    token,
    usuario: {
      id_usuario: usuario.id_usuario,
      correo: usuario.correo,
      rol: usuario.rol,
    },
  });
}

/**
 * POST /auth/logout
 * Con JWT sin estado, el "cierre de sesión" real ocurre en el cliente:
 * basta con que el frontend borre el token guardado (localStorage/memoria)
 * y deje de enviarlo. Este endpoint existe para que el flujo sea explícito
 * y quede registrado como evidencia del módulo de autenticación.
 */
export async function logout(_req: Request, res: Response): Promise<void> {
  res.json({ mensaje: 'Sesión cerrada. Elimina el token en el cliente.' });
}
