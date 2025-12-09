import { supabase } from "../config/supabase"; // Importamos Supabase
import { createError } from '../config/errors';

// Definimos el tipo para los datos de la asignatura (basado en tu BD)
interface AsignaturaData {
  nombre: string;
}

export const asignaturaRepository = {
  
  /**
   * Busca todas las asignaturas
   */
  findAll: async () => {
    const { data, error } = await supabase
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
      
    if (error) throw createError.internal(error.message);
    return data;
  },

  /**
   * Busca una asignatura por ID
   */
  findById: async (id: number) => {
    const { data, error } = await supabase
      .from('Asignatura')
      .select('*') // O un select más detallado si es necesario
      .eq('id', id)
      .single();

    if (error) throw createError.internal(error.message);
    if (!data) throw createError.notFound('Asignatura no encontrada');
    return data;
  },

  /**
   * Crea una nueva asignatura
   */
  create: async (data: AsignaturaData) => {
    const { data: newData, error } = await supabase
      .from('Asignatura')
      .insert(data)
      .select()
      .single();

    if (error) throw createError.internal(error.message);
    return newData;
  },

  /**
   * Actualiza una asignatura
   */
  update: async (id: number, data: Partial<AsignaturaData>) => {
    const { data: updatedData, error } = await supabase
      .from('Asignatura')
      .update(data)
      .eq('id', id)
      .select()
      .single();

    if (error) throw createError.internal(error.message);
    return updatedData;
  },

  /**
   * Elimina una asignatura
   */
  delete: async (id: number) => {
    const { error } = await supabase
      .from('Asignatura')
      .delete()
      .eq('id', id);

    if (error) throw createError.internal(error.message);
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