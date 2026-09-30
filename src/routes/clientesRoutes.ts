import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { requiereAutenticacion } from '../middlewares/autenticacion';
import {
  listarClientes,
  obtenerCliente,
  crearCliente,
  actualizarCliente,
  desactivarCliente,
} from '../controllers/clientesController';

const router = Router();

// Consultas: públicas (requieren estar autenticado en la práctica, ya que
// el frontend siempre habrá hecho login antes, pero no se exige aquí).
router.get('/', asyncHandler(listarClientes));
router.get('/:id', asyncHandler(obtenerCliente));

// Escritura: requiere sesión iniciada (control de acceso).
router.post('/', requiereAutenticacion, asyncHandler(crearCliente));
router.put('/:id', requiereAutenticacion, asyncHandler(actualizarCliente));
router.patch('/:id', requiereAutenticacion, asyncHandler(actualizarCliente));
router.delete('/:id', requiereAutenticacion, asyncHandler(desactivarCliente));

export default router;
