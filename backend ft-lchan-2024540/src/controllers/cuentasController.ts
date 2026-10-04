import { Request, Response } from 'express';
import { pool } from '../config/db';
import { ErrorNegocio } from '../utils/ErrorNegocio';
import { CuentaInput } from '../models/types';

// GET /cuentas -> lista todas las cuentas
export async function listarCuentas(req: Request, res: Response): Promise<void> {
  // Un cliente solo ve sus propias cuentas; el personal ve todas.
  const soloDelCliente = req.usuario?.rol === 'cliente';
  if (soloDelCliente && !req.usuario?.id_cliente) {
    res.json([]);
    return;
  }

  const [filas] = await pool.query(
    `SELECT c.id_cuenta, c.numero_cuenta, c.saldo, c.estado, c.fecha_apertura,
            cl.id_cliente, cl.nombre AS cliente_nombre, cl.apellido AS cliente_apellido,
            tc.nombre AS tipo_cuenta
     FROM Cuenta c
     JOIN Cliente cl ON cl.id_cliente = c.id_cliente
     JOIN TipoCuenta tc ON tc.id_tipo_cuenta = c.id_tipo_cuenta
     ${soloDelCliente ? 'WHERE c.id_cliente = ?' : ''}
     ORDER BY c.id_cuenta`,
    soloDelCliente ? [req.usuario!.id_cliente] : []
  );
  res.json(filas);
}

// GET /cuentas/:id -> obtiene una cuenta por id (incluye saldo)
export async function obtenerCuenta(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const [filas]: any = await pool.query(
    `SELECT c.*, cl.nombre AS cliente_nombre, cl.apellido AS cliente_apellido
     FROM Cuenta c
     JOIN Cliente cl ON cl.id_cliente = c.id_cliente
     WHERE c.id_cuenta = ?`,
    [id]
  );

  // Para un cliente, una cuenta ajena se trata como inexistente.
  if (
    filas.length === 0 ||
    (req.usuario?.rol === 'cliente' && filas[0].id_cliente !== req.usuario.id_cliente)
  ) {
    throw new ErrorNegocio('Cuenta no encontrada.', 404);
  }
  res.json(filas[0]);
}

// GET /tipos-cuenta -> catálogo de tipos de cuenta
export async function listarTiposCuenta(_req: Request, res: Response): Promise<void> {
  const [filas] = await pool.query(
    'SELECT id_tipo_cuenta, nombre, tasa_interes FROM TipoCuenta ORDER BY id_tipo_cuenta'
  );
  res.json(filas);
}

// POST /cuentas -> crea una cuenta asociada a un cliente existente
export async function crearCuenta(req: Request, res: Response): Promise<void> {
  const datos: CuentaInput = req.body;

  if (!datos.id_cliente || !datos.id_tipo_cuenta || !datos.numero_cuenta) {
    throw new ErrorNegocio(
      'Los campos id_cliente, id_tipo_cuenta y numero_cuenta son obligatorios.'
    );
  }

  const saldoInicial = datos.saldo_inicial ?? 0;
  if (saldoInicial < 0) {
    throw new ErrorNegocio('El saldo inicial no puede ser negativo.');
  }

  // Regla de negocio: una cuenta debe pertenecer a un cliente existente y activo
  const [cliente]: any = await pool.query(
    'SELECT id_cliente, activo FROM Cliente WHERE id_cliente = ?',
    [datos.id_cliente]
  );
  if (cliente.length === 0) {
    throw new ErrorNegocio('El cliente indicado no existe.', 404);
  }
  if (!cliente[0].activo) {
    throw new ErrorNegocio('No se puede crear una cuenta para un cliente desactivado.');
  }

  const [tipoCuenta]: any = await pool.query(
    'SELECT id_tipo_cuenta FROM TipoCuenta WHERE id_tipo_cuenta = ?',
    [datos.id_tipo_cuenta]
  );
  if (tipoCuenta.length === 0) {
    throw new ErrorNegocio('El tipo de cuenta indicado no existe.', 404);
  }

  const [numeroExistente]: any = await pool.query(
    'SELECT id_cuenta FROM Cuenta WHERE numero_cuenta = ?',
    [datos.numero_cuenta]
  );
  if (numeroExistente.length > 0) {
    throw new ErrorNegocio('Ya existe una cuenta con ese número.', 409);
  }

  const [resultado]: any = await pool.query(
    `INSERT INTO Cuenta (id_cliente, id_tipo_cuenta, numero_cuenta, saldo)
     VALUES (?, ?, ?, ?)`,
    [datos.id_cliente, datos.id_tipo_cuenta, datos.numero_cuenta, saldoInicial]
  );

  const [filas]: any = await pool.query('SELECT * FROM Cuenta WHERE id_cuenta = ?', [
    resultado.insertId,
  ]);
  res.status(201).json(filas[0]);
}

// PUT/PATCH /cuentas/:id -> actualiza el estado de una cuenta (activa/inactiva)
export async function actualizarEstadoCuenta(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const { estado } = req.body as { estado?: string };

  if (estado !== 'activa' && estado !== 'inactiva') {
    throw new ErrorNegocio('El estado debe ser "activa" o "inactiva".');
  }

  const [existente]: any = await pool.query('SELECT * FROM Cuenta WHERE id_cuenta = ?', [id]);
  if (existente.length === 0) {
    throw new ErrorNegocio('Cuenta no encontrada.', 404);
  }

  await pool.query('UPDATE Cuenta SET estado = ? WHERE id_cuenta = ?', [estado, id]);
  const [filas]: any = await pool.query('SELECT * FROM Cuenta WHERE id_cuenta = ?', [id]);
  res.json(filas[0]);
}
