"use strict";
/**
 * ========================================
 * MIDDLEWARE DE AUTENTICACIÓN (Migrado a Supabase)
 * ========================================
 *
 * Maneja la verificación de tokens JWT de Supabase y los permisos
 * basados en la tabla 'perfiles'.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAuth = exports.requireEstudiante = exports.requireAdminOrProfesor = exports.requireProfesor = exports.requireAdmin = exports.requirePermission = exports.requireRole = exports.authenticateToken = void 0;
const supabase_1 = require("../config/supabase"); // Usamos el cliente Admin
const errors_1 = require("../config/errors");
const authService_1 = require("../services/authService");
/**
 * Middleware para autenticar tokens JWT de Supabase
 *
 * Verifica que el token sea válido y obtiene el rol de la tabla 'perfiles'
 */
const authenticateToken = async (req, res, next) => {
    try {
        // 1. Obtener token del header
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return next(errors_1.createError.unauthorized('Token de acceso requerido'));
        }
        const token = authHeader.substring(7); // Remover 'Bearer '
        // 2. Verificar el token con Supabase
        // Esto valida el token y devuelve el usuario de 'auth.users'
        const { data: { user: authUser }, error: authError } = await supabase_1.supabase.auth.getUser(token);
        if (authError || !authUser) {
            return next(errors_1.createError.unauthorized('Token inválido o expirado'));
        }
        // 3. Obtener el ROL del usuario desde la tabla 'perfiles'
        const { data: perfil, error: perfilError } = await supabase_1.supabase
            .from('perfiles')
            .select('rol, nombre_completo') // Usamos nombre_completo (con guion bajo)
            .eq('id', authUser.id)
            .single();
        if (perfilError || !perfil) {
            return next(errors_1.createError.forbidden('Perfil no encontrado para este usuario.'));
        }
        // 4. (Opcional) Buscar el ID numérico (de Estudiante o Profesor)
        // Esto es más complejo y podemos omitirlo si solo necesitamos el rol
        // 5. Agregar usuario al request
        req.user = {
            id: 0, // TODO: Este ID numérico ya no es relevante si usamos UUID
            uuid: authUser.id,
            email: authUser.email || '',
            role: perfil.rol,
            nombre: perfil.nombre_completo || 'Usuario',
        };
        next();
    }
    catch (error) {
        next(errors_1.createError.unauthorized('Token inválido'));
    }
};
exports.authenticateToken = authenticateToken;
/**
 * Middleware para verificar roles específicos
 */
const requireRole = (roles) => {
    return (req, _res, next) => {
        if (!req.user) {
            return next(errors_1.createError.unauthorized('Usuario no autenticado'));
        }
        if (!roles.includes(req.user.role)) {
            return next(errors_1.createError.forbidden('Acceso denegado: permisos insuficientes'));
        }
        next();
    };
};
exports.requireRole = requireRole;
/**
 * Middleware para verificar permisos específicos
 */
const requirePermission = (resource, action) => {
    return (req, _res, next) => {
        if (!req.user) {
            return next(errors_1.createError.unauthorized('Usuario no autenticado'));
        }
        if (!(0, authService_1.hasPermission)(req.user.role, resource, action)) {
            return next(errors_1.createError.forbidden(`Acceso denegado: no tiene permisos para ${action} en ${resource}`));
        }
        next();
    };
};
exports.requirePermission = requirePermission;
// --- Middleware Específicos (Usan la nueva lógica) ---
exports.requireAdmin = (0, exports.requireRole)(['admin']);
exports.requireProfesor = (0, exports.requireRole)(['profesor']);
exports.requireAdminOrProfesor = (0, exports.requireRole)(['admin', 'profesor']);
exports.requireEstudiante = (0, exports.requireRole)(['estudiante']);
exports.requireAuth = (0, exports.requireRole)(['admin', 'profesor', 'estudiante']);
