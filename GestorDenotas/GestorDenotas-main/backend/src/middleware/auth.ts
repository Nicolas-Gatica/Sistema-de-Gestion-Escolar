/**
 * ========================================
 * MIDDLEWARE DE AUTENTICACIÓN (Migrado a Supabase)
 * ========================================
 *
 * Maneja la verificación de tokens JWT de Supabase y los permisos
 * basados en la tabla 'perfiles'.
 */

import { Request, Response, NextFunction } from 'express';
import { supabase } from '../config/supabase'; // Usamos el cliente Admin
import { createError } from '../config/errors';
import { hasPermission, UserRole, AuthenticatedUser } from '../services/authService';

// Extender la interfaz Request para incluir el usuario autenticado
declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

/**
 * Middleware para autenticar tokens JWT de Supabase
 *
 * Verifica que el token sea válido y obtiene el rol de la tabla 'perfiles'
 */
export const authenticateToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // 1. Obtener token del header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(createError.unauthorized('Token de acceso requerido'));
    }
    const token = authHeader.substring(7); // Remover 'Bearer '

    // 2. Verificar el token con Supabase
    // Esto valida el token y devuelve el usuario de 'auth.users'
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !authUser) {
      return next(createError.unauthorized('Token inválido o expirado'));
    }

    // 3. Obtener el ROL del usuario desde la tabla 'perfiles'
    const { data: perfil, error: perfilError } = await supabase
        .from('perfiles')
        .select('rol, nombre_completo') // Usamos nombre_completo (con guion bajo)
        .eq('id', authUser.id)
        .single();
    
    if (perfilError || !perfil) {
        return next(createError.forbidden('Perfil no encontrado para este usuario.'));
    }

    // 4. (Opcional) Buscar el ID numérico (de Estudiante o Profesor)
    // Esto es más complejo y podemos omitirlo si solo necesitamos el rol
    
    // 5. Agregar usuario al request
    req.user = {
        id: 0, // TODO: Este ID numérico ya no es relevante si usamos UUID
        uuid: authUser.id,
        email: authUser.email || '',
        role: perfil.rol as UserRole,
        nombre: perfil.nombre_completo || 'Usuario',
    };
    
    next();
  } catch (error) {
    next(createError.unauthorized('Token inválido'));
  }
};

/**
 * Middleware para verificar roles específicos
 */
export const requireRole = (roles: string[]) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(createError.unauthorized('Usuario no autenticado'));
    }
    if (!roles.includes(req.user.role)) {
      return next(createError.forbidden('Acceso denegado: permisos insuficientes'));
    }
    next();
  };
};

/**
 * Middleware para verificar permisos específicos
 */
export const requirePermission = (resource: string, action: string) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(createError.unauthorized('Usuario no autenticado'));
    }
    
    if (!hasPermission(req.user.role, resource, action)) {
      return next(createError.forbidden(`Acceso denegado: no tiene permisos para ${action} en ${resource}`));
    }
    
    next();
  };
};

// --- Middleware Específicos (Usan la nueva lógica) ---
export const requireAdmin = requireRole(['admin']);
export const requireProfesor = requireRole(['profesor']);
export const requireAdminOrProfesor = requireRole(['admin', 'profesor']);
export const requireEstudiante = requireRole(['estudiante']);
export const requireAuth = requireRole(['admin', 'profesor', 'estudiante']);