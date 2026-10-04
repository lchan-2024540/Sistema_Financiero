import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { requiereAutenticacion } from '../middlewares/autenticacion';
import { registrarTransferencia } from '../controllers/transferenciasController';

const router = Router();

// Cualquier usuario autenticado (administrador, cajero o cliente) puede transferir;
// las restricciones por rol (un cliente solo desde sus cuentas) están en el controlador.
router.post('/', requiereAutenticacion, asyncHandler(registrarTransferencia));

export default router;
