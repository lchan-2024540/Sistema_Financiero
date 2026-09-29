import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import {
  listarClientes,
  obtenerCliente,
  crearCliente,
  actualizarCliente,
  desactivarCliente,
} from '../controllers/clientesController';

const router = Router();

router.get('/', asyncHandler(listarClientes));
router.get('/:id', asyncHandler(obtenerCliente));
router.post('/', asyncHandler(crearCliente));
router.put('/:id', asyncHandler(actualizarCliente));
router.patch('/:id', asyncHandler(actualizarCliente));
router.delete('/:id', asyncHandler(desactivarCliente));

export default router;
