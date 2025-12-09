// backend/src/repositories/observacionRepository.ts
import { supabase } from "../config/supabase";
import { createError } from '../config/errors';

// Interfaz (basada en el esquema de Supabase)
type EstadoObservacion = "negativa" | "neutro" | "positiva";

interface ObservacionData {
  estudiante_uuid: string; // Cambio clave: de estudianteId (num) a UUID (string)
  profesorId: number;
  texto: string;
  estado?: EstadoObservacion;
}

export const observacionRepository = {
  
  findAll: async () => {
    const { data, error } = await supabase
      .from('Observacion')
      .select(`
        *,
        Estudiante ( nombre, apellido ),
        Profesor ( nombre, apellido )
      `)
      .order('id', { ascending: false });

    if (error) throw createError.internal(error.message);
    return data;
  },

  findById: async (id: number) => {
    const { data, error } = await supabase
      .from('Observacion')
      .select(`
        *,
        Estudiante ( nombre, apellido ),
        Profesor ( nombre, apellido )
      `)
      .eq('id', id)
      .single();

    if (error) throw createError.internal(error.message);
    if (!data) throw createError.notFound('Observación no encontrada');
    return data;
  },

  /**
   * Busca por UUID de estudiante
   */
  findByEstudiante: async (estudianteUuid: string) => {
    const { data, error } = await supabase
      .from('Observacion')
      .select(`
        *,
        Profesor ( nombre, apellido )
      `)
      .eq('estudiante_uuid', estudianteUuid)
      .order('id', { ascending: false });

    if (error) throw createError.internal(error.message);
    return data;
  },

  /**
   * Busca por ID numérico de Profesor
   */
  findByProfesor: async (profesorId: number) => {
    const { data, error } = await supabase
      .from('Observacion')
      .select(`
        *,
        Estudiante ( nombre, apellido )
      `)
      .eq('profesorId', profesorId)
      .order('id', { ascending: false });

    if (error) throw createError.internal(error.message);
    return data;
  },

  create: async (data: ObservacionData) => {
    const { data: newData, error } = await supabase
      .from('Observacion')
      .insert(data)
      .select(`
        *,
        Estudiante ( nombre, apellido ),
        Profesor ( nombre, apellido )
      `)
      .single();

    if (error) throw createError.internal(error.message);
    return newData;
  },

  update: async (id: number, data: { texto?: string; estado?: EstadoObservacion }) => {
    const { data: updatedData, error } = await supabase
      .from('Observacion')
      .update(data)
      .eq('id', id)
      .select(`
        *,
        Estudiante ( nombre, apellido ),
        Profesor ( nombre, apellido )
      `)
      .single();

    if (error) throw createError.internal(error.message);
    return updatedData;
  },

  delete: async (id: number) => {
    const { error } = await supabase
      .from('Observacion')
      .delete()
      .eq('id', id);

    if (error) throw createError.internal(error.message);
    return { success: true };
  },
};