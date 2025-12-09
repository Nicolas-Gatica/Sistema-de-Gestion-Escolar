"use strict";
/**
 * ========================================
 * SERVICIO DE GESTIÓN DE HORARIOS (Migrado a Supabase)
 * ========================================
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.createSala = exports.getAllSalas = exports.deleteHorario = exports.updateHorario = exports.createHorario = exports.getHorariosByProfesor = exports.getHorariosByCurso = exports.getAllHorarios = void 0;
const supabase_1 = require("../config/supabase");
const errors_1 = require("../config/errors");
/**
 * Obtiene todos los horarios con sus relaciones
 */
const getAllHorarios = async () => {
    try {
        const { data: horarios, error } = await supabase_1.supabase
            .from('Horario')
            .select(`
        id,
        diaSemana,
        horaInicio,
        horaFin,
        Curso ( id, nombre ),
        Asignatura ( id, nombre ),
        Profesor ( id, nombre, apellido )
      `)
            .order('diaSemana', { ascending: true })
            .order('horaInicio', { ascending: true });
        if (error)
            throw error;
        return horarios || [];
    }
    catch (error) {
        throw errors_1.createError.internal(`Error al obtener horarios: ${error.message}`);
    }
};
exports.getAllHorarios = getAllHorarios;
/**
 * Obtiene horarios por ID de curso
 */
const getHorariosByCurso = async (cursoId) => {
    try {
        const { data: horarios, error } = await supabase_1.supabase
            .from('Horario')
            .select(`
        id, diaSemana, horaInicio, horaFin,
        Asignatura ( id, nombre ),
        Profesor ( id, nombre, apellido )
      `)
            .eq('cursoId', cursoId)
            .order('diaSemana')
            .order('horaInicio');
        if (error)
            throw error;
        return horarios || [];
    }
    catch (error) {
        throw errors_1.createError.internal(`Error al obtener horarios del curso: ${error.message}`);
    }
};
exports.getHorariosByCurso = getHorariosByCurso;
/**
 * Obtiene horarios por ID de profesor
 */
const getHorariosByProfesor = async (profesorId) => {
    try {
        const { data: horarios, error } = await supabase_1.supabase
            .from('Horario')
            .select(`
        id, diaSemana, horaInicio, horaFin,
        Curso ( id, nombre ),
        Asignatura ( id, nombre )
      `)
            .eq('profesorId', profesorId)
            .order('diaSemana')
            .order('horaInicio');
        if (error)
            throw error;
        return horarios || [];
    }
    catch (error) {
        throw errors_1.createError.internal(`Error al obtener horarios del profesor: ${error.message}`);
    }
};
exports.getHorariosByProfesor = getHorariosByProfesor;
/**
 * Crea un nuevo horario
 */
const createHorario = async (horarioData) => {
    try {
        if (!horarioData.cursoId || !horarioData.asignaturaId || !horarioData.profesorId) {
            throw errors_1.createError.validation('Datos del horario incompletos');
        }
        const { data: nuevoHorario, error } = await supabase_1.supabase
            .from('Horario')
            .insert(horarioData)
            .select()
            .single();
        if (error)
            throw error;
        return nuevoHorario;
    }
    catch (error) {
        throw errors_1.createError.internal(`Error al crear horario: ${error.message}`);
    }
};
exports.createHorario = createHorario;
/**
 * Actualiza un horario
 */
const updateHorario = async (id, horarioData) => {
    try {
        const { data: horarioActualizado, error } = await supabase_1.supabase
            .from('Horario')
            .update(horarioData)
            .eq('id', id)
            .select()
            .single();
        if (error)
            throw error;
        if (!horarioActualizado)
            throw errors_1.createError.notFound('Horario no encontrado');
        return horarioActualizado;
    }
    catch (error) {
        throw errors_1.createError.internal(`Error al actualizar horario: ${error.message}`);
    }
};
exports.updateHorario = updateHorario;
/**
 * Elimina un horario
 */
const deleteHorario = async (id) => {
    try {
        const { error } = await supabase_1.supabase
            .from('Horario')
            .delete()
            .eq('id', id);
        if (error)
            throw error;
    }
    catch (error) {
        throw errors_1.createError.internal(`Error al eliminar horario: ${error.message}`);
    }
};
exports.deleteHorario = deleteHorario;
// --- Funciones de Sala (Obsoletas) ---
// La gestión de salas no está en el esquema de Supabase,
// por lo que estas funciones se eliminan o comentan.
const getAllSalas = async () => {
    console.warn("Función getAllSalas no aplicable. Tabla 'Sala' no existe en Supabase.");
    return [];
};
exports.getAllSalas = getAllSalas;
const createSala = async (salaData) => {
    console.warn("Función createSala no aplicable. Tabla 'Sala' no existe en Supabase.");
    return {};
};
exports.createSala = createSala;
