import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { requiereAutenticacion, requiereRol } from '../middlewares/autenticacion';
import { registrarDeposito, registrarRetiro } from '../controllers/operacionesController';

// Depósitos y retiros se hacen en ventanilla: solo personal del banco.
const depositosRouter = Router();
depositosRouter.post(
  '/',
  requiereAutenticacion,
  requiereRol('administrador', 'cajero'),
  asyncHandler(registrarDeposito)
);

const retirosRouter = Router();
retirosRouter.post(
  '/',
  requiereAutenticacion,
  requiereRol('administrador', 'cajero'),
  asyncHandler(registrarRetiro)
);

export { depositosRouter, retirosRouter };
