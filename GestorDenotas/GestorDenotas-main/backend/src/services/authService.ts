/**
 * ========================================
 * SERVICIO DE AUTENTICACIÓN (Migrado a Supabase)
 * ========================================
 * * Este servicio ahora se enfoca en consultar perfiles de Supabase
 * y manejar la lógica de permisos (Matriz de Roles) que ya tenías.
 */

// Importamos el cliente de Supabase (el que tiene la llave maestra)
import { supabase } from '../config/supabase'; 
import { createError } from '../config/errors';

// Tipos de usuario (los roles que defines en tu tabla 'perfiles')
export type UserRole = 'admin' | 'profesor' | 'estudiante';

// Interfaz para datos de usuario autenticado
export interface AuthenticatedUser {
  id: number; // ID numérico de la tabla (Profesor, Estudiante)
  uuid: string; // UUID de Supabase Auth
  email: string;
  role: UserRole;
  nombre: string;
  apellido?: string;
  profesorId?: number;
  estudianteId?: number;
}

/**
 * Obtiene el perfil del usuario desde Supabase usando su email
 * Esta función es USADA por el LOGIN del frontend.
 */
export const getProfileByEmail = async (email: string) => {
  const { data, error } = await supabase
    .from("perfiles")
    .select("*")
    .eq("email", email)
    .single();

  if (error) {
    console.error("Error obteniendo perfil desde Supabase:", error);
    return null;
  }

  return data;
};

/**
 * Función para verificar si un usuario tiene permisos para acceder a un recurso
 * * @param role - Rol del usuario ('admin', 'profesor', 'estudiante')
 * @param resource - Recurso al que se quiere acceder (ej: 'calificaciones')
 * @param action - Acción que se quiere realizar (ej: 'create')
 * @returns boolean - True si tiene permisos
 */
export const hasPermission = (role: UserRole, resource: string, action: string): boolean => {
  
  // Matriz de permisos por rol (RF1.2)
  const permissions: Record<string, Record<string, string[]>> = {
    admin: {
      estudiantes: ['read', 'create', 'update', 'delete'],
      profesores: ['read', 'create', 'update', 'delete'],
      cursos: ['read', 'create', 'update', 'delete'],
      asignaturas: ['read', 'create', 'update', 'delete'],
      calificaciones: ['read', 'create', 'update', 'delete'],
      asistencias: ['read', 'create', 'update', 'delete'],
      observaciones: ['read', 'create', 'update', 'delete'],
      usuarios: ['read', 'create', 'update', 'delete'],
      reportes: ['read', 'export'],
      backup: ['read', 'create', 'restore']
    },
    profesor: {
      estudiantes: ['read'],
      cursos: ['read'],
      asignaturas: ['read'],
      calificaciones: ['read', 'create', 'update', 'delete'], // Profesores pueden borrar notas
      asistencias: ['read', 'create', 'update', 'delete'], // Profesores pueden borrar asistencia
      observaciones: ['read', 'create', 'update', 'delete'], // Profesores pueden borrar anotaciones
      reportes: ['read']
    },
    estudiante: {
      calificaciones: ['read'],
      asistencias: ['read'],
      observaciones: ['read'],
      horario: ['read'],
      perfil: ['read']
    }
  };

  const rolePermissions = permissions[role];
  if (!rolePermissions) return false;

  const resourcePermissions = rolePermissions[resource];
  if (!resourcePermissions) return false;

  return resourcePermissions.includes(action);
};

// --- Funciones de Prisma eliminadas ---
// (authenticateAdmin, authenticateProfesor, authenticateEstudiante, etc.
//  ya no se usan porque la autenticación se maneja con Supabase Auth
//  y la creación de usuarios con profesorController)