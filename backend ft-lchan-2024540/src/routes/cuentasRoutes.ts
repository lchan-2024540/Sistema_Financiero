import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { requiereAutenticacion, requiereRol } from '../middlewares/autenticacion';
import {
  listarCuentas,
  obtenerCuenta,
  crearCuenta,
  actualizarEstadoCuenta,
  listarTiposCuenta,
} from '../controllers/cuentasController';

const router = Router();

router.use(requiereAutenticacion);

// Consultas: el personal ve todas las cuentas; un cliente solo ve las suyas
// (el filtro se aplica dentro del controlador).
router.get('/', asyncHandler(listarCuentas));
router.get('/:id', asyncHandler(obtenerCuenta));

// Alta y cambio de estado: solo personal del banco.
router.post('/', requiereRol('administrador', 'cajero'), asyncHandler(crearCuenta));
router.put('/:id', requiereRol('administrador', 'cajero'), asyncHandler(actualizarEstadoCuenta));
router.patch('/:id', requiereRol('administrador', 'cajero'), asyncHandler(actualizarEstadoCuenta));

// GET /tipos-cuenta (catálogo para el formulario de nueva cuenta)
export const tiposCuentaRouter = Router();
tiposCuentaRouter.get(
  '/',
  requiereAutenticacion,
  requiereRol('administrador', 'cajero'),
  asyncHandler(listarTiposCuenta)
);

export default router;
