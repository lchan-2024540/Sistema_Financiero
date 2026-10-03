import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { login, logout } from '../controllers/authController';

const router = Router();

router.post('/login', asyncHandler(login));
router.post('/logout', asyncHandler(logout));

export default router;
