import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { requiereAutenticacion } from '../middlewares/autenticacion';
import {
  listarCuentas,
  obtenerCuenta,
  crearCuenta,
  actualizarEstadoCuenta,
} from '../controllers/cuentasController';

const router = Router();

router.get('/', asyncHandler(listarCuentas));
router.get('/:id', asyncHandler(obtenerCuenta));
router.post('/', requiereAutenticacion, asyncHandler(crearCuenta));
router.put('/:id', requiereAutenticacion, asyncHandler(actualizarEstadoCuenta));
router.patch('/:id', requiereAutenticacion, asyncHandler(actualizarEstadoCuenta));

export default router;
