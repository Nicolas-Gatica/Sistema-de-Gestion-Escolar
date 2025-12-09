"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.asignaturaRepository = void 0;
const supabase_1 = require("../config/supabase"); // Importamos Supabase
const errors_1 = require("../config/errors");
exports.asignaturaRepository = {
    /**
     * Busca todas las asignaturas
     */
    findAll: async () => {
        const { data, error } = await supabase_1.supabase
            .from('Asignatura')
            .select(`
        id,
        nombre,
        Horario ( 
          cursoId, 
          profesorId,
          Curso ( nombre ),
          Profesor ( nombre, apellido )
        )
      `)
            .order('nombre');
        if (error)
            throw errors_1.createError.internal(error.message);
        return data;
    },
    /**
     * Busca una asignatura por ID
     */
    findById: async (id) => {
        const { data, error } = await supabase_1.supabase
            .from('Asignatura')
            .select('*') // O un select más detallado si es necesario
            .eq('id', id)
            .single();
        if (error)
            throw errors_1.createError.internal(error.message);
        if (!data)
            throw errors_1.createError.notFound('Asignatura no encontrada');
        return data;
    },
    /**
     * Crea una nueva asignatura
     */
    create: async (data) => {
        const { data: newData, error } = await supabase_1.supabase
            .from('Asignatura')
            .insert(data)
            .select()
            .single();
        if (error)
            throw errors_1.createError.internal(error.message);
        return newData;
    },
    /**
     * Actualiza una asignatura
     */
    update: async (id, data) => {
        const { data: updatedData, error } = await supabase_1.supabase
            .from('Asignatura')
            .update(data)
            .eq('id', id)
            .select()
            .single();
        if (error)
            throw errors_1.createError.internal(error.message);
        return updatedData;
    },
    /**
     * Elimina una asignatura
     */
    delete: async (id) => {
        const { error } = await supabase_1.supabase
            .from('Asignatura')
            .delete()
            .eq('id', id);
        if (error)
            throw errors_1.createError.internal(error.message);
        return { success: true };
    },
    // --- Funciones Obsoletas (Manejadas por 'Horario') ---
    // Las funciones addProfesor y removeProfesor ya no aplican aquí
    // porque la relación ahora vive en la tabla Horario.
    // Las dejamos comentadas por referencia.
    /*
    addProfesor: (asignaturaId: number, profesorId: number) =>
      // Lógica antigua de Prisma...
    */
};
