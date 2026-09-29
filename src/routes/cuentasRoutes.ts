import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import {
  listarCuentas,
  obtenerCuenta,
  crearCuenta,
  actualizarEstadoCuenta,
} from '../controllers/cuentasController';

const router = Router();

router.get('/', asyncHandler(listarCuentas));
router.get('/:id', asyncHandler(obtenerCuenta));
router.post('/', asyncHandler(crearCuenta));
router.put('/:id', asyncHandler(actualizarEstadoCuenta));
router.patch('/:id', asyncHandler(actualizarEstadoCuenta));

export default router;
