// backend/src/repositories/profesorRepository.ts
import { supabase } from "../config/supabase";
import { createError } from '../config/errors';

// Interfaz (basada en el esquema de Supabase)
interface ProfesorData {
  nombre: string;
  apellido: string;
  email: string;
  user_uuid: string; // UUID de Auth
  edad?: number;
  sexo?: string;
}

export const profesorRepository = {
  
  findAll: async () => {
    const { data, error } = await supabase
      .from('Profesor')
      .select(`
        *,
        Curso!jefeId ( id, nombre ),
        Horario ( Asignatura ( id, nombre ) ),
        Observacion ( id, texto, estado )
      `);
      
    if (error) throw createError.internal(error.message);
    
    // Mapear los nombres para que coincidan con la lógica de Prisma
    return data?.map(p => ({
        ...p,
        jefeDeCurso: p.Curso, // Renombrar para compatibilidad
        // Mapear asignaturas únicas desde el horario
        asignaturas: [...new Set(p.Horario.map((h: any) => h.Asignatura?.nombre))], 
        observaciones: p.Observacion,
        // Calificaciones no está directamente vinculada al profesor en Supabase
        calificaciones: [] 
    }));
  },

  findById: async (id: number) => {
    const { data, error } = await supabase
      .from('Profesor')
      .select(`
        *,
        Curso!jefeId ( id, nombre ),
        Horario ( Asignatura ( id, nombre ) ),
        Observacion ( id, texto, estado )
      `)
      .eq('id', id)
      .single();

    if (error) throw createError.internal(error.message);
    if (!data) throw createError.notFound('Profesor no encontrado');
    
    return {
        ...data,
        jefeDeCurso: data.Curso,
        asignaturas: [...new Set(data.Horario.map((h: any) => h.Asignatura?.nombre))],
        observaciones: data.Observacion,
        calificaciones: []
    };
  },

  create: async (data: ProfesorData) => {
    const { data: newData, error } = await supabase
      .from('Profesor')
      .insert(data)
      .select()
      .single();

    if (error) throw createError.internal(error.message);
    return newData;
  },

  update: async (id: number, data: Partial<ProfesorData>) => {
    const { data: updatedData, error } = await supabase
      .from('Profesor')
      .update(data)
      .eq('id', id)
      .select()
      .single();

    if (error) throw createError.internal(error.message);
    return updatedData;
  },

  delete: async (id: number) => {
    const { error } = await supabase
      .from('Profesor')
      .delete()
      .eq('id', id);

    if (error) throw createError.internal(error.message);
    return { success: true };
  },

  // --- Funciones Obsoletas ---
  addAsignatura: (profesorId: number, asignaturaId: number) => {
    console.warn("Función obsoleta. Asignar profesor/asignatura en la tabla 'Horario'.");
    return Promise.resolve();
  },

  removeAsignatura: (profesorId: number, asignaturaId: number) => {
    console.warn("Función obsoleta. Eliminar profesor/asignatura de la tabla 'Horario'.");
    return Promise.resolve();
  },
};