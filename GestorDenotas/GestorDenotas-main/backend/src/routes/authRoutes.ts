import { Router } from 'express';
import { login, verifyToken, logout } from '../controllers/authController';

const router = Router();

router.post('/login', login);
router.post('/verify', verifyToken);
router.post('/logout', logout);

export default router; 