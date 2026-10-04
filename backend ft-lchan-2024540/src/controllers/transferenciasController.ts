import { Request, Response } from 'express';
import { pool } from '../config/db';
import { ErrorNegocio } from '../utils/ErrorNegocio';

interface TransferenciaInput {
  id_cuenta_origen: number;
  /** Se puede indicar la cuenta destino por id o por su número de cuenta. */
  id_cuenta_destino?: number;
  numero_cuenta_destino?: string;
  monto: number;
}

/**
 * Permisos de transferencia:
 *  - administrador y cajero: pueden transferir entre cualquier par de cuentas.
 *  - cliente: solo puede sacar dinero de SUS cuentas (el destino puede ser
 *    cualquier cuenta activa del banco).
 */

// POST /transferencias
export async function registrarTransferencia(req: Request, res: Response): Promise<void> {
  const datos: TransferenciaInput = req.body;

  const numeroDestino =
    typeof datos.numero_cuenta_destino === 'string' ? datos.numero_cuenta_destino.trim() : '';

  if (!datos.id_cuenta_origen || (!datos.id_cuenta_destino && !numeroDestino)) {
    throw new ErrorNegocio(
      'Debes indicar la cuenta de origen y la cuenta de destino (id_cuenta_destino o numero_cuenta_destino).'
    );
  }
  if (datos.monto === undefined || datos.monto === null || typeof datos.monto !== 'number') {
    throw new ErrorNegocio('El campo monto es obligatorio y debe ser numérico.');
  }
  if (!Number.isFinite(datos.monto) || datos.monto <= 0) {
    throw new ErrorNegocio('El monto debe ser mayor que cero.');
  }
  // Regla de negocio: no se debe permitir transferir hacia la misma cuenta.
  if (datos.id_cuenta_destino && datos.id_cuenta_origen === datos.id_cuenta_destino) {
    throw new ErrorNegocio('No se puede transferir hacia la misma cuenta.');
  }

  const conexion = await pool.getConnection();
  try {
    await conexion.beginTransaction();

    // Se resuelve la cuenta destino (por id o por número de cuenta).
    let idDestino = datos.id_cuenta_destino;
    if (!idDestino) {
      const [porNumero]: any = await conexion.query(
        'SELECT id_cuenta FROM Cuenta WHERE numero_cuenta = ?',
        [numeroDestino]
      );
      if (porNumero.length === 0) {
        throw new ErrorNegocio('La cuenta de destino indicada no existe.', 404);
      }
      idDestino = porNumero[0].id_cuenta as number;
    }
    if (datos.id_cuenta_origen === idDestino) {
      throw new ErrorNegocio('No se puede transferir hacia la misma cuenta.');
    }

    // Se bloquean ambas filas (FOR UPDATE) para evitar condiciones de carrera
    // si llegaran dos transferencias simultáneas sobre las mismas cuentas.
    // Se bloquean siempre en el mismo orden (por id) para evitar deadlocks
    // cuando dos transferencias cruzadas A→B y B→A ocurren a la vez.
    const [bloqueadas]: any = await conexion.query(
      `SELECT c.*, cl.nombre AS cliente_nombre, cl.apellido AS cliente_apellido
       FROM Cuenta c
       JOIN Cliente cl ON cl.id_cliente = c.id_cliente
       WHERE c.id_cuenta IN (?, ?)
       ORDER BY c.id_cuenta
       FOR UPDATE`,
      [datos.id_cuenta_origen, idDestino]
    );

    const origen = bloqueadas.find((c: any) => Number(c.id_cuenta) === Number(datos.id_cuenta_origen));
    const destino = bloqueadas.find((c: any) => Number(c.id_cuenta) === Number(idDestino));

    // Un cliente no puede mover dinero de cuentas que no son suyas. Se responde
    // 404 (no 403) para no revelar si la cuenta ajena existe.
    if (
      origen &&
      req.usuario?.rol === 'cliente' &&
      origen.id_cliente !== req.usuario.id_cliente
    ) {
      throw new ErrorNegocio('La cuenta de origen no existe o no te pertenece.', 404);
    }

    if (!origen || !destino) {
      throw new ErrorNegocio('Alguna de las cuentas indicadas no existe.', 404);
    }

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
      idDestino,
    ]);

    await conexion.query(
      `INSERT INTO Transferencia (id_cuenta_origen, id_cuenta_destino, monto)
       VALUES (?, ?, ?)`,
      [datos.id_cuenta_origen, idDestino, datos.monto]
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
      [idDestino, datos.monto, nuevoSaldoDestino]
    );

    await conexion.commit();
    res.status(201).json({
      mensaje: 'Transferencia registrada correctamente.',
      id_cuenta_origen: datos.id_cuenta_origen,
      id_cuenta_destino: idDestino,
      numero_cuenta_origen: origen.numero_cuenta,
      numero_cuenta_destino: destino.numero_cuenta,
      titular_destino: `${destino.cliente_nombre} ${destino.cliente_apellido}`,
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
