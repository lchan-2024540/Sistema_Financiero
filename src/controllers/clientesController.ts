import { Request, Response } from 'express';
import { pool } from '../config/db';
import { ErrorNegocio } from '../utils/ErrorNegocio';
import { ClienteInput } from '../models/types';

const CORREO_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Valida los campos obligatorios de un cliente.
 * Se usa tanto al crear como al modificar.
 */
function validarCliente(datos: Partial<ClienteInput>, esCreacion: boolean): void {
  if (esCreacion) {
    if (!datos.nombre || !datos.apellido || !datos.dpi_ficticio || !datos.correo) {
      throw new ErrorNegocio(
        'Los campos nombre, apellido, dpi_ficticio y correo son obligatorios.'
      );
    }
  }
  if (datos.correo && !CORREO_REGEX.test(datos.correo)) {
    throw new ErrorNegocio('El correo proporcionado no tiene un formato válido.');
  }
  if (datos.nombre !== undefined && datos.nombre.trim().length === 0) {
    throw new ErrorNegocio('El nombre no puede estar vacío.');
  }
  if (datos.apellido !== undefined && datos.apellido.trim().length === 0) {
    throw new ErrorNegocio('El apellido no puede estar vacío.');
  }
}

// GET /clientes  -> lista todos los clientes (activos e inactivos)
export async function listarClientes(_req: Request, res: Response): Promise<void> {
  const [filas] = await pool.query(
    'SELECT id_cliente, nombre, apellido, dpi_ficticio, telefono, correo, activo, fecha_registro FROM Cliente ORDER BY id_cliente'
  );
  res.json(filas);
}

// GET /clientes/:id -> obtiene un cliente por id
export async function obtenerCliente(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const [filas]: any = await pool.query('SELECT * FROM Cliente WHERE id_cliente = ?', [id]);

  if (filas.length === 0) {
    throw new ErrorNegocio('Cliente no encontrado.', 404);
  }
  res.json(filas[0]);
}

// POST /clientes -> registra un nuevo cliente
export async function crearCliente(req: Request, res: Response): Promise<void> {
  const datos: ClienteInput = req.body;
  validarCliente(datos, true);

  const [correoExistente]: any = await pool.query(
    'SELECT id_cliente FROM Cliente WHERE correo = ? OR dpi_ficticio = ?',
    [datos.correo, datos.dpi_ficticio]
  );
  if (correoExistente.length > 0) {
    throw new ErrorNegocio('Ya existe un cliente con ese correo o DPI ficticio.', 409);
  }

  const [resultado]: any = await pool.query(
    `INSERT INTO Cliente (nombre, apellido, dpi_ficticio, telefono, correo)
     VALUES (?, ?, ?, ?, ?)`,
    [datos.nombre, datos.apellido, datos.dpi_ficticio, datos.telefono ?? null, datos.correo]
  );

  const [filas]: any = await pool.query('SELECT * FROM Cliente WHERE id_cliente = ?', [
    resultado.insertId,
  ]);
  res.status(201).json(filas[0]);
}

// PUT/PATCH /clientes/:id -> modifica datos de un cliente
export async function actualizarCliente(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const datos: Partial<ClienteInput> = req.body;
  validarCliente(datos, false);

  const [existente]: any = await pool.query('SELECT * FROM Cliente WHERE id_cliente = ?', [id]);
  if (existente.length === 0) {
    throw new ErrorNegocio('Cliente no encontrado.', 404);
  }

  const actual = existente[0];
  await pool.query(
    `UPDATE Cliente SET nombre = ?, apellido = ?, telefono = ?, correo = ?
     WHERE id_cliente = ?`,
    [
      datos.nombre ?? actual.nombre,
      datos.apellido ?? actual.apellido,
      datos.telefono ?? actual.telefono,
      datos.correo ?? actual.correo,
      id,
    ]
  );

  const [filas]: any = await pool.query('SELECT * FROM Cliente WHERE id_cliente = ?', [id]);
  res.json(filas[0]);
}

// DELETE /clientes/:id -> desactivación lógica (no se borra físicamente)
export async function desactivarCliente(req: Request, res: Response): Promise<void> {
  const { id } = req.params;

  const [existente]: any = await pool.query('SELECT * FROM Cliente WHERE id_cliente = ?', [id]);
  if (existente.length === 0) {
    throw new ErrorNegocio('Cliente no encontrado.', 404);
  }

  await pool.query('UPDATE Cliente SET activo = FALSE WHERE id_cliente = ?', [id]);
  res.json({ mensaje: 'Cliente desactivado correctamente.' });
}
