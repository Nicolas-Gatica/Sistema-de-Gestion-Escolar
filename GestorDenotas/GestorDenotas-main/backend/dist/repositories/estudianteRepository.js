"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.estudianteRepository = void 0;
// backend/src/repositories/estudianteRepository.ts
const supabase_1 = require("../config/supabase");
const errors_1 = require("../config/errors");
exports.estudianteRepository = {
    /**
     * Busca todos los estudiantes con sus relaciones
     */
    findAll: async () => {
        const { data, error } = await supabase_1.supabase
            .from('Estudiante')
            .select(`
        id,
        nombre,
        apellido,
        foto,
        user_uuid,
        Curso ( id, nombre ),
        Calificacion ( id, valor, Asignatura(nombre) ),
        Observacion ( id, estado, texto ),
        Asistencia ( id, fecha, estado )
      `);
        if (error)
            throw errors_1.createError.internal(error.message);
        // Mapear los nombres para que coincidan con la lógica de Prisma (si es necesario)
        return data?.map(est => ({
            ...est,
            curso: est.Curso,
            calificaciones: est.Calificacion,
            observaciones: est.Observacion,
            asistencias: est.Asistencia
        }));
    },
    /**
     * Busca un estudiante por su ID numérico
     */
    findById: async (id) => {
        const { data, error } = await supabase_1.supabase
            .from('Estudiante')
            .select(`
        id,
        nombre,
        apellido,
        foto,
        user_uuid,
        Curso ( id, nombre ),
        Calificacion ( id, valor, Asignatura(nombre) ),
        Observacion ( id, estado, texto ),
        Asistencia ( id, fecha, estado )
      `)
            .eq('id', id)
            .single();
        if (error)
            throw errors_1.createError.internal(error.message);
        if (!data)
            throw errors_1.createError.notFound('Estudiante no encontrado');
        return {
            ...data,
            curso: data.Curso,
            calificaciones: data.Calificacion,
            observaciones: data.Observacion,
            asistencias: data.Asistencia
        };
    },
    /**
     * Crea un nuevo estudiante (solo en la tabla Estudiante)
     * Nota: La creación de Auth y Perfil se maneja en el Controlador.
     */
    create: async (data) => {
        const { data: newData, error } = await supabase_1.supabase
            .from('Estudiante')
            .insert(data)
            .select(`
        *,
        Curso ( nombre )
      `)
            .single();
        if (error)
            throw errors_1.createError.internal(error.message);
        return { ...newData, curso: newData.Curso };
    },
    /**
     * Actualiza un estudiante por su ID numérico
     */
    update: async (id, data) => {
        const { data: updatedData, error } = await supabase_1.supabase
            .from('Estudiante')
            .update(data)
            .eq('id', id)
            .select(`
        *,
        Curso ( nombre )
      `)
            .single();
        if (error)
            throw errors_1.createError.internal(error.message);
        return { ...updatedData, curso: updatedData.Curso };
    },
    /**
     * Elimina un estudiante por su ID numérico
     * (El borrado de Auth se maneja en el Controlador)
     */
    delete: async (id) => {
        const { error } = await supabase_1.supabase
            .from('Estudiante')
            .delete()
            .eq('id', id);
        if (error)
            throw errors_1.createError.internal(error.message);
        return { success: true };
    },
};
