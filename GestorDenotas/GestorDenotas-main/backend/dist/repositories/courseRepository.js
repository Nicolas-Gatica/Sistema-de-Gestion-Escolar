"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.courseRepository = void 0;
const supabase_1 = require("../config/supabase");
const errors_1 = require("../config/errors");
exports.courseRepository = {
    /**
     * Busca todos los cursos
     */
    findAll: async () => {
        const { data, error } = await supabase_1.supabase
            .from('Curso')
            .select(`
        id,
        nombre,
        jefeId,
        Profesor ( nombre, apellido ),
        Estudiante ( id, nombre, apellido ),
        Horario ( Asignatura ( nombre ) )
      `)
            .order('nombre');
        if (error)
            throw errors_1.createError.internal(error.message);
        // Procesar para que coincida con la estructura esperada (si es necesario)
        const formattedData = data?.map(curso => ({
            ...curso,
            jefeDeCurso: curso.Profesor, // Renombrar para compatibilidad
            estudiantes: curso.Estudiante,
            planDeEstudio: curso.Horario.map((h) => ({ asignatura: h.Asignatura }))
        }));
        return formattedData;
    },
    /**
     * Busca un curso por ID
     */
    findById: async (id) => {
        const { data, error } = await supabase_1.supabase
            .from('Curso')
            .select(`
        id,
        nombre,
        jefeId,
        Profesor ( nombre, apellido ),
        Estudiante ( id, nombre, apellido ),
        Horario ( Asignatura ( nombre ) )
      `)
            .eq('id', id)
            .single();
        if (error)
            throw errors_1.createError.internal(error.message);
        if (!data)
            throw errors_1.createError.notFound('Curso no encontrado');
        return {
            ...data,
            jefeDeCurso: data.Profesor,
            estudiantes: data.Estudiante,
            planDeEstudio: data.Horario.map((h) => ({ asignatura: h.Asignatura }))
        };
    },
    /**
     * Crea un nuevo curso
     */
    create: async (data) => {
        const { data: newData, error } = await supabase_1.supabase
            .from('Curso')
            .insert(data)
            .select(`
        *,
        Profesor ( nombre, apellido )
      `)
            .single();
        if (error)
            throw errors_1.createError.internal(error.message);
        return { ...newData, jefeDeCurso: newData.Profesor };
    },
    /**
     * Actualiza un curso
     */
    update: async (id, data) => {
        const { data: updatedData, error } = await supabase_1.supabase
            .from('Curso')
            .update(data)
            .eq('id', id)
            .select(`
        *,
        Profesor ( nombre, apellido )
      `)
            .single();
        if (error)
            throw errors_1.createError.internal(error.message);
        return { ...updatedData, jefeDeCurso: updatedData.Profesor };
    },
    /**
     * Elimina un curso
     */
    delete: async (id) => {
        const { error } = await supabase_1.supabase
            .from('Curso')
            .delete()
            .eq('id', id);
        if (error)
            throw errors_1.createError.internal(error.message);
        return { success: true };
    },
    // --- Lógica de Asignaturas (Ahora se maneja en Horario) ---
    addAsignatura: (cursoId, asignaturaId) => {
        // Esta lógica ahora debe crear una entrada en la tabla 'Horario'
        // Requiere día, hora y profesor.
        console.warn("Función 'addAsignatura' obsoleta. Usar 'horarioService' en su lugar.");
        return Promise.resolve();
    },
    removeAsignatura: (cursoId, asignaturaId) => {
        // Esta lógica ahora debe eliminar entradas de 'Horario'
        console.warn("Función 'removeAsignatura' obsoleta. Usar 'horarioService' en su lugar.");
        return Promise.resolve();
    },
    /**
     * Busca cursos por ID de Profesor
     */
    findByProfesor: async (profesorId) => {
        // Busca en la tabla 'Horario' donde el profesorId coincida
        const { data, error } = await supabase_1.supabase
            .from('Horario')
            .select(`
        Curso ( id, nombre, Profesor ( nombre, apellido ) )
      `)
            .eq('profesorId', profesorId);
        if (error)
            throw errors_1.createError.internal(error.message);
        // Filtrar cursos únicos
        const cursosMap = new Map();
        data?.forEach((h) => {
            if (h.Curso && !cursosMap.has(h.Curso.id)) {
                cursosMap.set(h.Curso.id, {
                    ...h.Curso,
                    jefeDeCurso: h.Curso.Profesor
                });
            }
        });
        return Array.from(cursosMap.values());
    },
    /**
     * Busca cursos por ID de Estudiante
     */
    // En backend/src/repositories/courseRepository.ts
    // ... (mantén findAll, findById, create, update, delete, findByProfesor) ...
    /**
     * Busca cursos por ID de Estudiante
     */
    findByEstudiante: async (estudianteId) => {
        const { data, error } = await supabase_1.supabase
            .from('Estudiante')
            .select(`
        Curso ( *, Profesor ( nombre, apellido ) )
      `)
            .eq('id', estudianteId)
            .single();
        if (error)
            throw errors_1.createError.internal(error.message);
        // CORRECCIÓN: Verificar si data.Curso existe
        if (!data || !data.Curso)
            return [];
        // Renombrar la propiedad 'Profesor' (si existe) a 'jefeDeCurso'
        const cursoData = data.Curso;
        const jefeDeCurso = cursoData.Profesor; // Asignar el profesor si existe
        return [{ ...cursoData, jefeDeCurso: jefeDeCurso }];
    },
};
