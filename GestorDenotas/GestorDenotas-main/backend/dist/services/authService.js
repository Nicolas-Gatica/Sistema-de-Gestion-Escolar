"use strict";
/**
 * ========================================
 * SERVICIO DE AUTENTICACIÓN (Migrado a Supabase)
 * ========================================
 * * Este servicio ahora se enfoca en consultar perfiles de Supabase
 * y manejar la lógica de permisos (Matriz de Roles) que ya tenías.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.hasPermission = exports.getProfileByEmail = void 0;
// Importamos el cliente de Supabase (el que tiene la llave maestra)
const supabase_1 = require("../config/supabase");
/**
 * Obtiene el perfil del usuario desde Supabase usando su email
 * Esta función es USADA por el LOGIN del frontend.
 */
const getProfileByEmail = async (email) => {
    const { data, error } = await supabase_1.supabase
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
exports.getProfileByEmail = getProfileByEmail;
/**
 * Función para verificar si un usuario tiene permisos para acceder a un recurso
 * * @param role - Rol del usuario ('admin', 'profesor', 'estudiante')
 * @param resource - Recurso al que se quiere acceder (ej: 'calificaciones')
 * @param action - Acción que se quiere realizar (ej: 'create')
 * @returns boolean - True si tiene permisos
 */
const hasPermission = (role, resource, action) => {
    // Matriz de permisos por rol (RF1.2)
    const permissions = {
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
    if (!rolePermissions)
        return false;
    const resourcePermissions = rolePermissions[resource];
    if (!resourcePermissions)
        return false;
    return resourcePermissions.includes(action);
};
exports.hasPermission = hasPermission;
// --- Funciones de Prisma eliminadas ---
// (authenticateAdmin, authenticateProfesor, authenticateEstudiante, etc.
//  ya no se usan porque la autenticación se maneja con Supabase Auth
//  y la creación de usuarios con profesorController)
