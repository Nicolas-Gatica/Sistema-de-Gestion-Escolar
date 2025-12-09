"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.profesorRepository = void 0;
// backend/src/repositories/profesorRepository.ts
const supabase_1 = require("../config/supabase");
const errors_1 = require("../config/errors");
exports.profesorRepository = {
    findAll: async () => {
        const { data, error } = await supabase_1.supabase
            .from('Profesor')
            .select(`
        *,
        Curso!jefeId ( id, nombre ),
        Horario ( Asignatura ( id, nombre ) ),
        Observacion ( id, texto, estado )
      `);
        if (error)
            throw errors_1.createError.internal(error.message);
        // Mapear los nombres para que coincidan con la lógica de Prisma
        return data?.map(p => ({
            ...p,
            jefeDeCurso: p.Curso, // Renombrar para compatibilidad
            // Mapear asignaturas únicas desde el horario
            asignaturas: [...new Set(p.Horario.map((h) => h.Asignatura?.nombre))],
            observaciones: p.Observacion,
            // Calificaciones no está directamente vinculada al profesor en Supabase
            calificaciones: []
        }));
    },
    findById: async (id) => {
        const { data, error } = await supabase_1.supabase
            .from('Profesor')
            .select(`
        *,
        Curso!jefeId ( id, nombre ),
        Horario ( Asignatura ( id, nombre ) ),
        Observacion ( id, texto, estado )
      `)
            .eq('id', id)
            .single();
        if (error)
            throw errors_1.createError.internal(error.message);
        if (!data)
            throw errors_1.createError.notFound('Profesor no encontrado');
        return {
            ...data,
            jefeDeCurso: data.Curso,
            asignaturas: [...new Set(data.Horario.map((h) => h.Asignatura?.nombre))],
            observaciones: data.Observacion,
            calificaciones: []
        };
    },
    create: async (data) => {
        const { data: newData, error } = await supabase_1.supabase
            .from('Profesor')
            .insert(data)
            .select()
            .single();
        if (error)
            throw errors_1.createError.internal(error.message);
        return newData;
    },
    update: async (id, data) => {
        const { data: updatedData, error } = await supabase_1.supabase
            .from('Profesor')
            .update(data)
            .eq('id', id)
            .select()
            .single();
        if (error)
            throw errors_1.createError.internal(error.message);
        return updatedData;
    },
    delete: async (id) => {
        const { error } = await supabase_1.supabase
            .from('Profesor')
            .delete()
            .eq('id', id);
        if (error)
            throw errors_1.createError.internal(error.message);
        return { success: true };
    },
    // --- Funciones Obsoletas ---
    addAsignatura: (profesorId, asignaturaId) => {
        console.warn("Función obsoleta. Asignar profesor/asignatura en la tabla 'Horario'.");
        return Promise.resolve();
    },
    removeAsignatura: (profesorId, asignaturaId) => {
        console.warn("Función obsoleta. Eliminar profesor/asignatura de la tabla 'Horario'.");
        return Promise.resolve();
    },
};
