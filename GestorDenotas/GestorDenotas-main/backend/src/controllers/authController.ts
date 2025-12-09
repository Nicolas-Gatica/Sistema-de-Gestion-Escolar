/**
 * ========================================
 * CONTROLADOR DE AUTENTICACIÓN (MIGRADO)
 * ========================================
 *
 * Funcionalidad de Login/Logout/Verify movida al Frontend
 * (usando el cliente de Supabase en React).
 *
 * Este controlador se mantiene como placeholder para las rutas
 * pero la lógica principal de creación de usuarios está en profesorController.
 */

import { Request, Response, NextFunction, Router } from 'express';
// import { prisma } from '../config/prisma'; // <-- ELIMINADO (Causa del error)
import { createError } from '../config/errors';
// import { authenticateUser, invalidateToken, getUserFromToken } from '../services/authService'; // <-- ELIMINADO (Funciones obsoletas)

const router = Router();

/**
 * POST /api/auth/login
 * Esta ruta ya no se usa activamente, el login se maneja en el frontend.
 */
export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // La lógica de authenticateUser() fue eliminada porque dependía de Prisma.
    // El login ahora se maneja en el frontend con supabase.auth.signInWithPassword()
    res.status(501).json({ 
        success: false, 
        message: 'Not Implemented: El login se maneja en el cliente (frontend).' 
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/auth/verify
 * Esta ruta ya no se usa, la verificación se maneja en el frontend.
 */
export const verifyToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // La lógica de getUserFromToken() fue eliminada porque dependía de Prisma.
    res.status(501).json({ 
        success: false, 
        message: 'Not Implemented: La verificación se maneja en el cliente (frontend).' 
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/auth/logout
 * Esta ruta ya no se usa, el logout se maneja en el frontend.
 */
export const logout = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    res.status(200).json({ 
      success: true, 
      message: 'Logout manejado por el cliente.'
    });
  } catch (error) {
    next(error);
  }
};

// Conectamos las funciones al router
router.post('/login', login);
router.get('/verify', verifyToken);
router.post('/logout', logout);

export default router;