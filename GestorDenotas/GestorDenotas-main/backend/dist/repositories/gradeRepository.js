"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.gradeRepository = void 0;
// backend/src/repositories/gradeRepository.ts
const supabase_1 = require("../config/supabase");
const errors_1 = require("../config/errors");
exports.gradeRepository = {
    /**
     * Crea una nueva calificación
     */
    create: async (data) => {
        const { data: newData, error } = await supabase_1.supabase
            .from('Calificacion')
            .insert(data)
            .select(`
        *,
        Estudiante ( nombre, apellido ),
        Asignatura ( nombre )
      `)
            .single();
        if (error)
            throw errors_1.createError.internal(error.message);
        return newData;
    },
    /**
     * Busca calificaciones por UUID de estudiante
     */
    findByEstudiante: async (estudianteUuid) => {
        const { data, error } = await supabase_1.supabase
            .from('Calificacion')
            .select(`
        *,
        Asignatura ( nombre )
      `)
            .eq('estudiante_uuid', estudianteUuid)
            .order('fecha', { ascending: false });
        if (error)
            throw errors_1.createError.internal(error.message);
        return data;
    },
    /**
     * Busca una calificación por su ID numérico
     */
    findById: async (id) => {
        const { data, error } = await supabase_1.supabase
            .from('Calificacion')
            .select(`
        *,
        Estudiante ( nombre, apellido ),
        Asignatura ( nombre )
      `)
            .eq('id', id)
            .single();
        if (error)
            throw errors_1.createError.internal(error.message);
        if (!data)
            throw errors_1.createError.notFound('Calificación no encontrada');
        return data;
    },
    /**
     * Actualiza una calificación
     */
    update: async (id, data) => {
        const { data: updatedData, error } = await supabase_1.supabase
            .from('Calificacion')
            .update(data)
            .eq('id', id)
            .select(`
        *,
        Estudiante ( nombre, apellido ),
        Asignatura ( nombre )
      `)
            .single();
        if (error)
            throw errors_1.createError.internal(error.message);
        return updatedData;
    },
    /**
     * Elimina una calificación
     */
    delete: async (id) => {
        const { error } = await supabase_1.supabase
            .from('Calificacion')
            .delete()
            .eq('id', id);
        if (error)
            throw errors_1.createError.internal(error.message);
        return { success: true };
    },
    /**
     * Busca calificaciones por ID de Asignatura
     */
    findByAsignatura: async (asignaturaId) => {
        const { data, error } = await supabase_1.supabase
            .from('Calificacion')
            .select(`
        *,
        Estudiante ( nombre, apellido )
      `)
            .eq('asignaturaId', asignaturaId)
            .order('fecha', { ascending: false });
        if (error)
            throw errors_1.createError.internal(error.message);
        return data;
    },
    /**
     * Busca calificaciones por ID de Profesor (Lógica Compleja)
     * (Requiere buscar primero en Horario)
     */
    findByProfesor: async (profesorId) => {
        // 1. Encontrar qué asignaturas y cursos da este profesor
        const { data: horarioData, error: horarioError } = await supabase_1.supabase
            .from('Horario')
            .select('asignaturaId, cursoId')
            .eq('profesorId', profesorId);
        if (horarioError)
            throw horarioError;
        if (!horarioData || horarioData.length === 0)
            return []; // Profesor no tiene clases
        const asignaturaIds = [...new Set(horarioData.map(h => h.asignaturaId))];
        // 2. Buscar notas de esas asignaturas
        const { data, error } = await supabase_1.supabase
            .from('Calificacion')
            .select(`
            *,
            Estudiante ( nombre, apellido ),
            Asignatura ( nombre )
        `)
            .in('asignaturaId', asignaturaIds);
        if (error)
            throw errors_1.createError.internal(error.message);
        return data;
    },
    /**
     * Busca TODAS las calificaciones
     */
    findAll: async () => {
        const { data, error } = await supabase_1.supabase
            .from('Calificacion')
            .select(`
        *,
        Estudiante ( nombre, apellido ),
        Asignatura ( nombre )
      `)
            .order('fecha', { ascending: false });
        if (error)
            throw errors_1.createError.internal(error.message);
        return data;
    },
};
