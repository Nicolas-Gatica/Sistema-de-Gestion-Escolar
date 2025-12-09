"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.logout = exports.verifyToken = exports.login = void 0;
const express_1 = require("express");
// import { authenticateUser, invalidateToken, getUserFromToken } from '../services/authService'; // <-- ELIMINADO (Funciones obsoletas)
const router = (0, express_1.Router)();
/**
 * POST /api/auth/login
 * Esta ruta ya no se usa activamente, el login se maneja en el frontend.
 */
const login = async (req, res, next) => {
    try {
        // La lógica de authenticateUser() fue eliminada porque dependía de Prisma.
        // El login ahora se maneja en el frontend con supabase.auth.signInWithPassword()
        res.status(501).json({
            success: false,
            message: 'Not Implemented: El login se maneja en el cliente (frontend).'
        });
    }
    catch (error) {
        next(error);
    }
};
exports.login = login;
/**
 * GET /api/auth/verify
 * Esta ruta ya no se usa, la verificación se maneja en el frontend.
 */
const verifyToken = async (req, res, next) => {
    try {
        // La lógica de getUserFromToken() fue eliminada porque dependía de Prisma.
        res.status(501).json({
            success: false,
            message: 'Not Implemented: La verificación se maneja en el cliente (frontend).'
        });
    }
    catch (error) {
        next(error);
    }
};
exports.verifyToken = verifyToken;
/**
 * POST /api/auth/logout
 * Esta ruta ya no se usa, el logout se maneja en el frontend.
 */
const logout = async (req, res, next) => {
    try {
        res.status(200).json({
            success: true,
            message: 'Logout manejado por el cliente.'
        });
    }
    catch (error) {
        next(error);
    }
};
exports.logout = logout;
// Conectamos las funciones al router
router.post('/login', exports.login);
router.get('/verify', exports.verifyToken);
router.post('/logout', exports.logout);
exports.default = router;
