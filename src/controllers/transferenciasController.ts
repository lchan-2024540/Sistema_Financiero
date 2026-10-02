import { Request, Response } from 'express';
import { pool } from '../config/db';
import { ErrorNegocio } from '../utils/ErrorNegocio';

interface TransferenciaInput {
  id_cuenta_origen: number;
  id_cuenta_destino: number;
  monto: number;
}

// POST /transferencias
export async function registrarTransferencia(req: Request, res: Response): Promise<void> {
  const datos: TransferenciaInput = req.body;

  if (!datos.id_cuenta_origen || !datos.id_cuenta_destino) {
    throw new ErrorNegocio('Los campos id_cuenta_origen e id_cuenta_destino son obligatorios.');
  }
  if (datos.monto === undefined || datos.monto === null || typeof datos.monto !== 'number') {
    throw new ErrorNegocio('El campo monto es obligatorio y debe ser numérico.');
  }
  if (datos.monto <= 0) {
    throw new ErrorNegocio('El monto debe ser mayor que cero.');
  }
  // Regla de negocio: no se debe permitir transferir hacia la misma cuenta.
  if (datos.id_cuenta_origen === datos.id_cuenta_destino) {
    throw new ErrorNegocio('No se puede transferir hacia la misma cuenta.');
  }

  const conexion = await pool.getConnection();
  try {
    await conexion.beginTransaction();

    // Se bloquean ambas filas (FOR UPDATE) para evitar condiciones de carrera
    // si llegaran dos transferencias simultáneas sobre las mismas cuentas.
    const [origenFilas]: any = await conexion.query(
      'SELECT * FROM Cuenta WHERE id_cuenta = ? FOR UPDATE',
      [datos.id_cuenta_origen]
    );
    const [destinoFilas]: any = await conexion.query(
      'SELECT * FROM Cuenta WHERE id_cuenta = ? FOR UPDATE',
      [datos.id_cuenta_destino]
    );

    if (origenFilas.length === 0 || destinoFilas.length === 0) {
      throw new ErrorNegocio('Alguna de las cuentas indicadas no existe.', 404);
    }

    const origen = origenFilas[0];
    const destino = destinoFilas[0];

    // Regla de negocio: la cuenta origen debe tener cuenta origen y destino válidas
    // y ambas deben estar activas (una cuenta inactiva no puede operar).
    if (origen.estado !== 'activa' || destino.estado !== 'activa') {
      throw new ErrorNegocio('Ambas cuentas deben estar activas para transferir.');
    }

    const saldoOrigen = Number(origen.saldo);

    // Regla de negocio: la cuenta origen debe disponer del saldo suficiente.
    if (datos.monto > saldoOrigen) {
      throw new ErrorNegocio(`Saldo insuficiente. Saldo disponible: ${saldoOrigen.toFixed(2)}.`);
    }

    const nuevoSaldoOrigen = saldoOrigen - datos.monto;
    const nuevoSaldoDestino = Number(destino.saldo) + datos.monto;

    await conexion.query('UPDATE Cuenta SET saldo = ? WHERE id_cuenta = ?', [
      nuevoSaldoOrigen,
      datos.id_cuenta_origen,
    ]);
    await conexion.query('UPDATE Cuenta SET saldo = ? WHERE id_cuenta = ?', [
      nuevoSaldoDestino,
      datos.id_cuenta_destino,
    ]);

    await conexion.query(
      `INSERT INTO Transferencia (id_cuenta_origen, id_cuenta_destino, monto)
       VALUES (?, ?, ?)`,
      [datos.id_cuenta_origen, datos.id_cuenta_destino, datos.monto]
    );

    // Cada operación queda registrada con fecha, tipo, monto y cuentas involucradas:
    // se registra un movimiento de salida en la cuenta origen...
    await conexion.query(
      `INSERT INTO Movimiento (id_cuenta, tipo, monto, saldo_resultante)
       VALUES (?, 'transferencia_salida', ?, ?)`,
      [datos.id_cuenta_origen, datos.monto, nuevoSaldoOrigen]
    );
    // ...y uno de entrada en la cuenta destino.
    await conexion.query(
      `INSERT INTO Movimiento (id_cuenta, tipo, monto, saldo_resultante)
       VALUES (?, 'transferencia_entrada', ?, ?)`,
      [datos.id_cuenta_destino, datos.monto, nuevoSaldoDestino]
    );

    await conexion.commit();
    res.status(201).json({
      mensaje: 'Transferencia registrada correctamente.',
      id_cuenta_origen: datos.id_cuenta_origen,
      id_cuenta_destino: datos.id_cuenta_destino,
      monto: datos.monto,
      saldo_origen_actual: nuevoSaldoOrigen,
      saldo_destino_actual: nuevoSaldoDestino,
    });
  } catch (error) {
    await conexion.rollback();
    throw error;
  } finally {
    conexion.release();
  }
}
