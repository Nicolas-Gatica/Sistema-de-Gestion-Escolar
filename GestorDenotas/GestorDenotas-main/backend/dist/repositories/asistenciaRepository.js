"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.asistenciaRepository = void 0;
const supabase_1 = require("../config/supabase");
const errors_1 = require("../config/errors");
exports.asistenciaRepository = {
    findAll: async () => {
        const { data, error } = await supabase_1.supabase
            .from('Asistencia')
            .select(`
        *,
        Estudiante ( nombre, apellido, Curso ( nombre ) )
      `)
            .order('fecha', { ascending: false });
        if (error)
            throw errors_1.createError.internal(error.message);
        return data;
    },
    findById: async (id) => {
        const { data, error } = await supabase_1.supabase
            .from('Asistencia')
            .select(`
        *,
        Estudiante ( nombre, apellido, Curso ( nombre ) )
      `)
            .eq('id', id)
            .single();
        if (error)
            throw errors_1.createError.internal(error.message);
        if (!data)
            throw errors_1.createError.notFound('Asistencia no encontrada');
        return data;
    },
    // Busca por el UUID del estudiante, no por el ID numérico
    findByEstudiante: async (estudianteUuid) => {
        const { data, error } = await supabase_1.supabase
            .from('Asistencia')
            .select(`
        *,
        Estudiante ( nombre, apellido, Curso ( nombre ) )
      `)
            .eq('estudiante_uuid', estudianteUuid)
            .order('fecha', { ascending: false });
        if (error)
            throw errors_1.createError.internal(error.message);
        return data;
    },
    findByFecha: async (fecha) => {
        // Busca en la fecha exacta (Supabase maneja 'date' correctamente)
        const fechaString = fecha.toISOString().split('T')[0];
        const { data, error } = await supabase_1.supabase
            .from('Asistencia')
            .select(`
        *,
        Estudiante ( nombre, apellido, Curso ( nombre ) )
      `)
            .eq('fecha', fechaString);
        if (error)
            throw errors_1.createError.internal(error.message);
        return data;
    },
    create: async (data) => {
        const { data: newData, error } = await supabase_1.supabase
            .from('Asistencia')
            .insert(data)
            .select()
            .single();
        if (error)
            throw errors_1.createError.internal(error.message);
        return newData;
    },
    update: async (id, data) => {
        const { data: updatedData, error } = await supabase_1.supabase
            .from('Asistencia')
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
            .from('Asistencia')
            .delete()
            .eq('id', id);
        if (error)
            throw errors_1.createError.internal(error.message);
        return { success: true };
    },
    // Equivalente a tu 'findByEstudianteAndFecha'
    findByEstudianteAndFecha: async (estudianteUuid, fecha) => {
        const fechaString = fecha.toISOString().split('T')[0];
        const { data, error } = await supabase_1.supabase
            .from('Asistencia')
            .select('*')
            .eq('estudiante_uuid', estudianteUuid)
            .eq('fecha', fechaString)
            .limit(1) // findFirst
            .single(); // Devuelve un objeto o null
        if (error && error.code !== 'PGRST116') { // PGRST116 = 0 filas, lo cual no es un error
            throw errors_1.createError.internal(error.message);
        }
        return data; // Retorna el objeto o null
    },
};
