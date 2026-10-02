import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { requiereAutenticacion } from '../middlewares/autenticacion';
import {
  listarMovimientos,
  obtenerMovimientosPorCuenta,
  reporteResumenOperaciones,
} from '../controllers/movimientosController';

const router = Router();

router.get('/', requiereAutenticacion, asyncHandler(listarMovimientos));
router.get('/reportes/resumen', requiereAutenticacion, asyncHandler(reporteResumenOperaciones));
router.get('/:id_cuenta', requiereAutenticacion, asyncHandler(obtenerMovimientosPorCuenta));

export default router;
