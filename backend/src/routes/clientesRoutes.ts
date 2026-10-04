import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { requiereAutenticacion, requiereRol } from '../middlewares/autenticacion';
import {
  listarClientes,
  obtenerCliente,
  crearCliente,
  actualizarCliente,
  desactivarCliente,
  reactivarCliente,
} from '../controllers/clientesController';

const router = Router();

// La gestión de clientes es solo para el personal del banco (administrador y
// cajero). Los usuarios con rol "cliente" no pueden listar ni modificar clientes.
router.use(requiereAutenticacion, requiereRol('administrador', 'cajero'));

router.get('/', asyncHandler(listarClientes));
router.get('/:id', asyncHandler(obtenerCliente));
router.post('/', asyncHandler(crearCliente));
router.put('/:id', asyncHandler(actualizarCliente));
router.patch('/:id', asyncHandler(actualizarCliente));
router.delete('/:id', asyncHandler(desactivarCliente));
router.patch('/:id/reactivar', asyncHandler(reactivarCliente));

export default router;
