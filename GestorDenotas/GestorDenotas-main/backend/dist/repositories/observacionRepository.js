"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.observacionRepository = void 0;
// backend/src/repositories/observacionRepository.ts
const supabase_1 = require("../config/supabase");
const errors_1 = require("../config/errors");
exports.observacionRepository = {
    findAll: async () => {
        const { data, error } = await supabase_1.supabase
            .from('Observacion')
            .select(`
        *,
        Estudiante ( nombre, apellido ),
        Profesor ( nombre, apellido )
      `)
            .order('id', { ascending: false });
        if (error)
            throw errors_1.createError.internal(error.message);
        return data;
    },
    findById: async (id) => {
        const { data, error } = await supabase_1.supabase
            .from('Observacion')
            .select(`
        *,
        Estudiante ( nombre, apellido ),
        Profesor ( nombre, apellido )
      `)
            .eq('id', id)
            .single();
        if (error)
            throw errors_1.createError.internal(error.message);
        if (!data)
            throw errors_1.createError.notFound('Observación no encontrada');
        return data;
    },
    /**
     * Busca por UUID de estudiante
     */
    findByEstudiante: async (estudianteUuid) => {
        const { data, error } = await supabase_1.supabase
            .from('Observacion')
            .select(`
        *,
        Profesor ( nombre, apellido )
      `)
            .eq('estudiante_uuid', estudianteUuid)
            .order('id', { ascending: false });
        if (error)
            throw errors_1.createError.internal(error.message);
        return data;
    },
    /**
     * Busca por ID numérico de Profesor
     */
    findByProfesor: async (profesorId) => {
        const { data, error } = await supabase_1.supabase
            .from('Observacion')
            .select(`
        *,
        Estudiante ( nombre, apellido )
      `)
            .eq('profesorId', profesorId)
            .order('id', { ascending: false });
        if (error)
            throw errors_1.createError.internal(error.message);
        return data;
    },
    create: async (data) => {
        const { data: newData, error } = await supabase_1.supabase
            .from('Observacion')
            .insert(data)
            .select(`
        *,
        Estudiante ( nombre, apellido ),
        Profesor ( nombre, apellido )
      `)
            .single();
        if (error)
            throw errors_1.createError.internal(error.message);
        return newData;
    },
    update: async (id, data) => {
        const { data: updatedData, error } = await supabase_1.supabase
            .from('Observacion')
            .update(data)
            .eq('id', id)
            .select(`
        *,
        Estudiante ( nombre, apellido ),
        Profesor ( nombre, apellido )
      `)
            .single();
        if (error)
            throw errors_1.createError.internal(error.message);
        return updatedData;
    },
    delete: async (id) => {
        const { error } = await supabase_1.supabase
            .from('Observacion')
            .delete()
            .eq('id', id);
        if (error)
            throw errors_1.createError.internal(error.message);
        return { success: true };
    },
};
