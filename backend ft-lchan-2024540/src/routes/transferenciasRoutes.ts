import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { requiereAutenticacion } from '../middlewares/autenticacion';
import { registrarTransferencia } from '../controllers/transferenciasController';

const router = Router();

router.post('/', requiereAutenticacion, asyncHandler(registrarTransferencia));

export default router;
