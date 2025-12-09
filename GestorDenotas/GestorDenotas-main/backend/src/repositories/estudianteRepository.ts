// backend/src/repositories/estudianteRepository.ts
import { supabase } from "../config/supabase";
import { createError } from '../config/errors';

// Interfaz para los datos (basado en tu BD de Supabase, no en Prisma)
interface EstudianteData {
  nombre: string;
  apellido: string;
  edad: number;
  sexo: string;
  cursoId: number;
  user_uuid?: string; // UUID de Auth (opcional al crear)
  foto?: string;
}

export const estudianteRepository = {
  
  /**
   * Busca todos los estudiantes con sus relaciones
   */
  findAll: async () => {
    const { data, error } = await supabase
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
      
    if (error) throw createError.internal(error.message);
    
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
  findById: async (id: number) => {
    const { data, error } = await supabase
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

    if (error) throw createError.internal(error.message);
    if (!data) throw createError.notFound('Estudiante no encontrado');
    
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
  create: async (data: EstudianteData) => {
    const { data: newData, error } = await supabase
      .from('Estudiante')
      .insert(data)
      .select(`
        *,
        Curso ( nombre )
      `)
      .single();

    if (error) throw createError.internal(error.message);
    return { ...newData, curso: newData.Curso };
  },

  /**
   * Actualiza un estudiante por su ID numérico
   */
  update: async (id: number, data: Partial<EstudianteData>) => {
    const { data: updatedData, error } = await supabase
      .from('Estudiante')
      .update(data)
      .eq('id', id)
      .select(`
        *,
        Curso ( nombre )
      `)
      .single();

    if (error) throw createError.internal(error.message);
    return { ...updatedData, curso: updatedData.Curso };
  },

  /**
   * Elimina un estudiante por su ID numérico
   * (El borrado de Auth se maneja en el Controlador)
   */
  delete: async (id: number) => {
    const { error } = await supabase
      .from('Estudiante')
      .delete()
      .eq('id', id);

    if (error) throw createError.internal(error.message);
    return { success: true };
  },
};