// backend/src/repositories/gradeRepository.ts
import { supabase } from "../config/supabase";
import { createError } from '../config/errors';

// Interfaz de datos (basada en el esquema de Supabase)
interface GradeData {
  estudiante_uuid: string;
  asignaturaId: number;
  valor: number;
  // 'profesorId' no existe en la tabla Calificacion de Supabase
  fecha?: Date | string; 
}

export const gradeRepository = {
  
  /**
   * Crea una nueva calificación
   */
  create: async (data: GradeData) => {
    const { data: newData, error } = await supabase
      .from('Calificacion')
      .insert(data)
      .select(`
        *,
        Estudiante ( nombre, apellido ),
        Asignatura ( nombre )
      `)
      .single();

    if (error) throw createError.internal(error.message);
    return newData;
  },

  /**
   * Busca calificaciones por UUID de estudiante
   */
  findByEstudiante: async (estudianteUuid: string) => {
    const { data, error } = await supabase
      .from('Calificacion')
      .select(`
        *,
        Asignatura ( nombre )
      `)
      .eq('estudiante_uuid', estudianteUuid)
      .order('fecha', { ascending: false });

    if (error) throw createError.internal(error.message);
    return data;
  },

  /**
   * Busca una calificación por su ID numérico
   */
  findById: async (id: number) => {
    const { data, error } = await supabase
      .from('Calificacion')
      .select(`
        *,
        Estudiante ( nombre, apellido ),
        Asignatura ( nombre )
      `)
      .eq('id', id)
      .single();

    if (error) throw createError.internal(error.message);
    if (!data) throw createError.notFound('Calificación no encontrada');
    return data;
  },

  /**
   * Actualiza una calificación
   */
  update: async (id: number, data: Partial<GradeData>) => {
    const { data: updatedData, error } = await supabase
      .from('Calificacion')
      .update(data)
      .eq('id', id)
      .select(`
        *,
        Estudiante ( nombre, apellido ),
        Asignatura ( nombre )
      `)
      .single();

    if (error) throw createError.internal(error.message);
    return updatedData;
  },

  /**
   * Elimina una calificación
   */
  delete: async (id: number) => {
    const { error } = await supabase
      .from('Calificacion')
      .delete()
      .eq('id', id);

    if (error) throw createError.internal(error.message);
    return { success: true };
  },

  /**
   * Busca calificaciones por ID de Asignatura
   */
  findByAsignatura: async (asignaturaId: number) => {
    const { data, error } = await supabase
      .from('Calificacion')
      .select(`
        *,
        Estudiante ( nombre, apellido )
      `)
      .eq('asignaturaId', asignaturaId)
      .order('fecha', { ascending: false });

    if (error) throw createError.internal(error.message);
    return data;
  },

  /**
   * Busca calificaciones por ID de Profesor (Lógica Compleja)
   * (Requiere buscar primero en Horario)
   */
  findByProfesor: async (profesorId: number) => {
    // 1. Encontrar qué asignaturas y cursos da este profesor
    const { data: horarioData, error: horarioError } = await supabase
        .from('Horario')
        .select('asignaturaId, cursoId')
        .eq('profesorId', profesorId);

    if (horarioError) throw horarioError;
    if (!horarioData || horarioData.length === 0) return []; // Profesor no tiene clases

    const asignaturaIds = [...new Set(horarioData.map(h => h.asignaturaId))];
    
    // 2. Buscar notas de esas asignaturas
    const { data, error } = await supabase
        .from('Calificacion')
        .select(`
            *,
            Estudiante ( nombre, apellido ),
            Asignatura ( nombre )
        `)
        .in('asignaturaId', asignaturaIds);

    if (error) throw createError.internal(error.message);
    return data;
  },

  /**
   * Busca TODAS las calificaciones
   */
  findAll: async () => {
    const { data, error } = await supabase
      .from('Calificacion')
      .select(`
        *,
        Estudiante ( nombre, apellido ),
        Asignatura ( nombre )
      `)
      .order('fecha', { ascending: false });

    if (error) throw createError.internal(error.message);
    return data;
  },
};