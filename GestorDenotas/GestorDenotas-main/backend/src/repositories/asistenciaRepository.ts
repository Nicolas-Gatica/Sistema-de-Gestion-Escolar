import { supabase } from "../config/supabase";
import { createError } from '../config/errors';

// Definimos el tipo de estado (basado en tu BD de Supabase, no en Prisma)
type EstadoAsistencia = "presente" | "ausente" | "tarde";

interface AsistenciaData {
  estudiante_uuid: string; // En Supabase usamos el UUID
  fecha: Date | string;
  estado: EstadoAsistencia;
}

export const asistenciaRepository = {
  
  findAll: async () => {
    const { data, error } = await supabase
      .from('Asistencia')
      .select(`
        *,
        Estudiante ( nombre, apellido, Curso ( nombre ) )
      `)
      .order('fecha', { ascending: false });
      
    if (error) throw createError.internal(error.message);
    return data;
  },

  findById: async (id: number) => {
    const { data, error } = await supabase
      .from('Asistencia')
      .select(`
        *,
        Estudiante ( nombre, apellido, Curso ( nombre ) )
      `)
      .eq('id', id)
      .single();

    if (error) throw createError.internal(error.message);
    if (!data) throw createError.notFound('Asistencia no encontrada');
    return data;
  },

  // Busca por el UUID del estudiante, no por el ID numérico
  findByEstudiante: async (estudianteUuid: string) => {
    const { data, error } = await supabase
      .from('Asistencia')
      .select(`
        *,
        Estudiante ( nombre, apellido, Curso ( nombre ) )
      `)
      .eq('estudiante_uuid', estudianteUuid)
      .order('fecha', { ascending: false });

    if (error) throw createError.internal(error.message);
    return data;
  },

  findByFecha: async (fecha: Date) => {
    // Busca en la fecha exacta (Supabase maneja 'date' correctamente)
    const fechaString = fecha.toISOString().split('T')[0];
    
    const { data, error } = await supabase
      .from('Asistencia')
      .select(`
        *,
        Estudiante ( nombre, apellido, Curso ( nombre ) )
      `)
      .eq('fecha', fechaString);

    if (error) throw createError.internal(error.message);
    return data;
  },

  create: async (data: AsistenciaData) => {
    const { data: newData, error } = await supabase
      .from('Asistencia')
      .insert(data)
      .select()
      .single();

    if (error) throw createError.internal(error.message);
    return newData;
  },

  update: async (id: number, data: Partial<AsistenciaData>) => {
    const { data: updatedData, error } = await supabase
      .from('Asistencia')
      .update(data)
      .eq('id', id)
      .select()
      .single();

    if (error) throw createError.internal(error.message);
    return updatedData;
  },

  delete: async (id: number) => {
    const { error } = await supabase
      .from('Asistencia')
      .delete()
      .eq('id', id);

    if (error) throw createError.internal(error.message);
    return { success: true };
  },

  // Equivalente a tu 'findByEstudianteAndFecha'
  findByEstudianteAndFecha: async (estudianteUuid: string, fecha: Date) => {
    const fechaString = fecha.toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('Asistencia')
      .select('*')
      .eq('estudiante_uuid', estudianteUuid)
      .eq('fecha', fechaString)
      .limit(1) // findFirst
      .single(); // Devuelve un objeto o null

    if (error && error.code !== 'PGRST116') { // PGRST116 = 0 filas, lo cual no es un error
        throw createError.internal(error.message);
    }
    return data; // Retorna el objeto o null
  },
};