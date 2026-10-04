import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { login, logout, registrar } from '../controllers/authController';

const router = Router();

router.post('/login', asyncHandler(login));
router.post('/registro', asyncHandler(registrar));
router.post('/logout', asyncHandler(logout));

export default router;
