import { Request, Response } from 'express';
import { pool } from '../config/db';
import { ErrorNegocio } from '../utils/ErrorNegocio';

// GET /movimientos  -> lista todos los movimientos (uso administrativo)
export async function listarMovimientos(_req: Request, res: Response): Promise<void> {
  const [filas] = await pool.query(
    `SELECT m.*, c.numero_cuenta
     FROM Movimiento m
     JOIN Cuenta c ON c.id_cuenta = m.id_cuenta
     ORDER BY m.fecha DESC
     LIMIT 200`
  );
  res.json(filas);
}

// GET /movimientos/:id_cuenta -> historial de una cuenta específica
export async function obtenerMovimientosPorCuenta(req: Request, res: Response): Promise<void> {
  const { id_cuenta } = req.params;

  const [cuenta]: any = await pool.query('SELECT id_cuenta FROM Cuenta WHERE id_cuenta = ?', [
    id_cuenta,
  ]);
  if (cuenta.length === 0) {
    throw new ErrorNegocio('Cuenta no encontrada.', 404);
  }

  const [movimientos] = await pool.query(
    `SELECT id_movimiento, tipo, monto, saldo_resultante, fecha
     FROM Movimiento
     WHERE id_cuenta = ?
     ORDER BY fecha DESC`,
    [id_cuenta]
  );
  res.json(movimientos);
}

// GET /reportes/resumen -> resumen de operaciones agrupado por tipo (módulo Reportes)
export async function reporteResumenOperaciones(_req: Request, res: Response): Promise<void> {
  const [filas] = await pool.query(
    `SELECT tipo, COUNT(*) AS cantidad_operaciones, SUM(monto) AS monto_total
     FROM Movimiento
     GROUP BY tipo`
  );
  res.json(filas);
}
