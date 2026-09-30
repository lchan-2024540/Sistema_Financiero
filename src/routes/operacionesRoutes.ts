import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { requiereAutenticacion } from '../middlewares/autenticacion';
import { registrarDeposito, registrarRetiro } from '../controllers/operacionesController';

const depositosRouter = Router();
depositosRouter.post('/', requiereAutenticacion, asyncHandler(registrarDeposito));

const retirosRouter = Router();
retirosRouter.post('/', requiereAutenticacion, asyncHandler(registrarRetiro));

export { depositosRouter, retirosRouter };
