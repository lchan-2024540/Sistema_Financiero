import { Request, Response } from 'express';
import { pool } from '../config/db';
import { ErrorNegocio } from '../utils/ErrorNegocio';

interface OperacionInput {
  id_cuenta: number;
  monto: number;
}

/**
 * Obtiene una cuenta con bloqueo de fila (FOR UPDATE) dentro de una transacción,
 * para evitar condiciones de carrera si llegaran dos operaciones al mismo tiempo
 * sobre la misma cuenta (por ejemplo, dos retiros simultáneos).
 */
async function obtenerCuentaParaActualizar(conexion: any, id_cuenta: number) {
  const [filas]: any = await conexion.query('SELECT * FROM Cuenta WHERE id_cuenta = ? FOR UPDATE', [
    id_cuenta,
  ]);
  if (filas.length === 0) {
    throw new ErrorNegocio('La cuenta indicada no existe.', 404);
  }
  return filas[0];
}

function validarOperacion(datos: Partial<OperacionInput>): void {
  if (!datos.id_cuenta) {
    throw new ErrorNegocio('El campo id_cuenta es obligatorio.');
  }
  if (datos.monto === undefined || datos.monto === null) {
    throw new ErrorNegocio('El campo monto es obligatorio.');
  }
  if (typeof datos.monto !== 'number' || Number.isNaN(datos.monto)) {
    throw new ErrorNegocio('El monto debe ser un número válido.');
  }
  // Regla de negocio: los depósitos y retiros deben ser mayores que cero.
  if (datos.monto <= 0) {
    throw new ErrorNegocio('El monto debe ser mayor que cero.');
  }
}

// POST /depositos
export async function registrarDeposito(req: Request, res: Response): Promise<void> {
  const datos: OperacionInput = req.body;
  validarOperacion(datos);

  const conexion = await pool.getConnection();
  try {
    await conexion.beginTransaction();

    const cuenta = await obtenerCuentaParaActualizar(conexion, datos.id_cuenta);

    // Regla de negocio: una cuenta inactiva no puede realizar operaciones.
    if (cuenta.estado !== 'activa') {
      throw new ErrorNegocio('La cuenta está inactiva y no puede recibir depósitos.');
    }

    const nuevoSaldo = Number(cuenta.saldo) + datos.monto;

    await conexion.query('UPDATE Cuenta SET saldo = ? WHERE id_cuenta = ?', [
      nuevoSaldo,
      datos.id_cuenta,
    ]);

    await conexion.query(
      `INSERT INTO Movimiento (id_cuenta, tipo, monto, saldo_resultante)
       VALUES (?, 'deposito', ?, ?)`,
      [datos.id_cuenta, datos.monto, nuevoSaldo]
    );

    await conexion.commit();
    res.status(201).json({
      mensaje: 'Depósito registrado correctamente.',
      id_cuenta: datos.id_cuenta,
      monto: datos.monto,
      saldo_actual: nuevoSaldo,
    });
  } catch (error) {
    await conexion.rollback();
    throw error;
  } finally {
    conexion.release();
  }
}

// POST /retiros
export async function registrarRetiro(req: Request, res: Response): Promise<void> {
  const datos: OperacionInput = req.body;
  validarOperacion(datos);

  const conexion = await pool.getConnection();
  try {
    await conexion.beginTransaction();

    const cuenta = await obtenerCuentaParaActualizar(conexion, datos.id_cuenta);

    if (cuenta.estado !== 'activa') {
      throw new ErrorNegocio('La cuenta está inactiva y no puede realizar retiros.');
    }

    const saldoActual = Number(cuenta.saldo);

    // Regla de negocio: no se permite retirar un monto mayor al saldo disponible.
    if (datos.monto > saldoActual) {
      throw new ErrorNegocio(
        `Saldo insuficiente. Saldo disponible: ${saldoActual.toFixed(2)}.`
      );
    }

    const nuevoSaldo = saldoActual - datos.monto;

    await conexion.query('UPDATE Cuenta SET saldo = ? WHERE id_cuenta = ?', [
      nuevoSaldo,
      datos.id_cuenta,
    ]);

    await conexion.query(
      `INSERT INTO Movimiento (id_cuenta, tipo, monto, saldo_resultante)
       VALUES (?, 'retiro', ?, ?)`,
      [datos.id_cuenta, datos.monto, nuevoSaldo]
    );

    await conexion.commit();
    res.status(201).json({
      mensaje: 'Retiro registrado correctamente.',
      id_cuenta: datos.id_cuenta,
      monto: datos.monto,
      saldo_actual: nuevoSaldo,
    });
  } catch (error) {
    await conexion.rollback();
    throw error;
  } finally {
    conexion.release();
  }
}
