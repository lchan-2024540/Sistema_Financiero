import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { requiereAutenticacion, requiereRol } from '../middlewares/autenticacion';
import {
  listarMovimientos,
  obtenerMovimientosPorCuenta,
  reporteResumenOperaciones,
} from '../controllers/movimientosController';

const router = Router();

// Listado global y reportes: solo personal del banco.
router.get('/', requiereAutenticacion, requiereRol('administrador', 'cajero'), asyncHandler(listarMovimientos));
router.get(
  '/reportes/resumen',
  requiereAutenticacion,
  requiereRol('administrador', 'cajero'),
  asyncHandler(reporteResumenOperaciones)
);
// Historial de una cuenta: el personal ve cualquiera; un cliente solo las suyas.
router.get('/:id_cuenta', requiereAutenticacion, asyncHandler(obtenerMovimientosPorCuenta));

export default router;
