import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { pool } from '../config/db';
import { ErrorNegocio } from '../utils/ErrorNegocio';
import { generarToken, PayloadToken } from '../utils/jwt';

// El autoregistro solo admite correos de Gmail u Outlook.
const CORREO_REGEX = /^[^\s@]+@(gmail|outlook)\.com$/i;
const PASSWORD_MIN = 8;
const SALT_ROUNDS = 10;

/** Arma el token y la respuesta común a login y registro. */
function respuestaSesion(usuario: {
  id_usuario: number;
  correo: string;
  rol: PayloadToken['rol'];
  id_cliente?: number | null;
}) {
  const id_cliente = usuario.rol === 'cliente' ? usuario.id_cliente ?? null : null;
  const token = generarToken({
    id_usuario: usuario.id_usuario,
    correo: usuario.correo,
    rol: usuario.rol,
    id_cliente,
  });
  return {
    token,
    usuario: {
      id_usuario: usuario.id_usuario,
      correo: usuario.correo,
      rol: usuario.rol,
      id_cliente,
    },
  };
}

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

  // Un cliente cuyo registro fue desactivado por el banco ya no puede entrar.
  if (usuario.rol === 'cliente') {
    const [clientes]: any = await pool.query('SELECT activo FROM Cliente WHERE id_cliente = ?', [
      usuario.id_cliente,
    ]);
    if (clientes.length === 0 || !clientes[0].activo) {
      throw new ErrorNegocio('Tu cuenta de cliente está desactivada. Contacta al banco.', 403);
    }
  }

  res.json(respuestaSesion(usuario));
}

/**
 * POST /auth/registro
 * Autoregistro de un cliente nuevo: crea en una sola transacción el Cliente
 * y su Usuario (rol "cliente") y devuelve la sesión ya iniciada.
 * Es público a propósito, pero SOLO puede crear el rol "cliente": el rol nunca
 * se lee del body, así nadie puede registrarse como administrador o cajero.
 */
export async function registrar(req: Request, res: Response): Promise<void> {
  const { nombre, apellido, dpi_ficticio, telefono, correo, password } = req.body as {
    nombre?: string;
    apellido?: string;
    dpi_ficticio?: string;
    telefono?: string;
    correo?: string;
    password?: string;
  };

  const texto = (v: unknown) => (typeof v === 'string' ? v.trim() : '');
  const datos = {
    nombre: texto(nombre),
    apellido: texto(apellido),
    dpi_ficticio: texto(dpi_ficticio),
    telefono: texto(telefono) || null,
    correo: texto(correo).toLowerCase(),
  };

  if (!datos.nombre || !datos.apellido || !datos.dpi_ficticio || !datos.correo || !password) {
    throw new ErrorNegocio('Nombre, apellido, DPI ficticio, correo y contraseña son obligatorios.');
  }
  if (!CORREO_REGEX.test(datos.correo)) {
    throw new ErrorNegocio('Solo se permiten correos de Gmail u Outlook (@gmail.com o @outlook.com).');
  }
  if (datos.dpi_ficticio.length < 10) {
    throw new ErrorNegocio('El DPI ficticio debe tener al menos 10 caracteres.');
  }
  if (typeof password !== 'string' || password.length < PASSWORD_MIN) {
    throw new ErrorNegocio(`La contraseña debe tener al menos ${PASSWORD_MIN} caracteres.`);
  }

  const [usuarioExistente]: any = await pool.query('SELECT id_usuario FROM Usuario WHERE correo = ?', [
    datos.correo,
  ]);
  const [clienteExistente]: any = await pool.query(
    'SELECT id_cliente FROM Cliente WHERE correo = ? OR dpi_ficticio = ?',
    [datos.correo, datos.dpi_ficticio]
  );
  if (usuarioExistente.length > 0 || clienteExistente.length > 0) {
    throw new ErrorNegocio('Ya existe un usuario o cliente con ese correo o DPI ficticio.', 409);
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  const conexion = await pool.getConnection();
  try {
    await conexion.beginTransaction();

    const [resCliente]: any = await conexion.query(
      `INSERT INTO Cliente (nombre, apellido, dpi_ficticio, telefono, correo)
       VALUES (?, ?, ?, ?, ?)`,
      [datos.nombre, datos.apellido, datos.dpi_ficticio, datos.telefono, datos.correo]
    );
    const id_cliente: number = resCliente.insertId;

    const [resUsuario]: any = await conexion.query(
      `INSERT INTO Usuario (correo, password_hash, rol, id_cliente)
       VALUES (?, ?, 'cliente', ?)`,
      [datos.correo, passwordHash, id_cliente]
    );

    await conexion.commit();

    res.status(201).json(
      respuestaSesion({
        id_usuario: resUsuario.insertId,
        correo: datos.correo,
        rol: 'cliente',
        id_cliente,
      })
    );
  } catch (error: any) {
    await conexion.rollback();
    // Dos registros simultáneos con el mismo correo/DPI: lo detecta la BD.
    if (error?.code === 'ER_DUP_ENTRY') {
      throw new ErrorNegocio('Ya existe un usuario o cliente con ese correo o DPI ficticio.', 409);
    }
    throw error;
  } finally {
    conexion.release();
  }
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
