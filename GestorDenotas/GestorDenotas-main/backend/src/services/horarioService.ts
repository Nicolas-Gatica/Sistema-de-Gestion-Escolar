/**
 * ========================================
 * SERVICIO DE GESTIÓN DE HORARIOS (Migrado a Supabase)
 * ========================================
 */

import { supabase } from '../config/supabase';
import { createError } from '../config/errors';

// Interfaces (Basadas en tu esquema de Supabase)
export interface HorarioData {
  cursoId: number;
  asignaturaId: number;
  profesorId: number;
  diaSemana: number;
  horaInicio: string;
  horaFin: string;
  // 'salaId' no está en tu esquema de Supabase
}

export interface HorarioCompleto {
  id: number;
  diaSemana: number;
  horaInicio: string;
  horaFin: string;
  Curso?: { nombre: string };
  Asignatura?: { nombre: string };
  Profesor?: { nombre: string, apellido: string };
}

/**
 * Obtiene todos los horarios con sus relaciones
 */
export const getAllHorarios = async (): Promise<any[]> => {
  try {
    const { data: horarios, error } = await supabase
      .from('Horario')
      .select(`
        id,
        diaSemana,
        horaInicio,
        horaFin,
        Curso ( id, nombre ),
        Asignatura ( id, nombre ),
        Profesor ( id, nombre, apellido )
      `)
      .order('diaSemana', { ascending: true })
      .order('horaInicio', { ascending: true });

    if (error) throw error;
    return horarios || [];
  } catch (error: any) {
    throw createError.internal(`Error al obtener horarios: ${error.message}`);
  }
};

/**
 * Obtiene horarios por ID de curso
 */
export const getHorariosByCurso = async (cursoId: number): Promise<any[]> => {
  try {
    const { data: horarios, error } = await supabase
      .from('Horario')
      .select(`
        id, diaSemana, horaInicio, horaFin,
        Asignatura ( id, nombre ),
        Profesor ( id, nombre, apellido )
      `)
      .eq('cursoId', cursoId)
      .order('diaSemana')
      .order('horaInicio');

    if (error) throw error;
    return horarios || [];
  } catch (error: any) {
    throw createError.internal(`Error al obtener horarios del curso: ${error.message}`);
  }
};

/**
 * Obtiene horarios por ID de profesor
 */
export const getHorariosByProfesor = async (profesorId: number): Promise<any[]> => {
  try {
    const { data: horarios, error } = await supabase
      .from('Horario')
      .select(`
        id, diaSemana, horaInicio, horaFin,
        Curso ( id, nombre ),
        Asignatura ( id, nombre )
      `)
      .eq('profesorId', profesorId)
      .order('diaSemana')
      .order('horaInicio');

    if (error) throw error;
    return horarios || [];
  } catch (error: any) {
    throw createError.internal(`Error al obtener horarios del profesor: ${error.message}`);
  }
};

/**
 * Crea un nuevo horario
 */
export const createHorario = async (horarioData: HorarioData): Promise<any> => {
  try {
    if (!horarioData.cursoId || !horarioData.asignaturaId || !horarioData.profesorId) {
      throw createError.validation('Datos del horario incompletos');
    }

    const { data: nuevoHorario, error } = await supabase
      .from('Horario')
      .insert(horarioData)
      .select()
      .single();

    if (error) throw error;
    return nuevoHorario;
  } catch (error: any) {
    throw createError.internal(`Error al crear horario: ${error.message}`);
  }
};

/**
 * Actualiza un horario
 */
export const updateHorario = async (id: number, horarioData: Partial<HorarioData>): Promise<any> => {
  try {
    const { data: horarioActualizado, error } = await supabase
      .from('Horario')
      .update(horarioData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    if (!horarioActualizado) throw createError.notFound('Horario no encontrado');

    return horarioActualizado;
  } catch (error: any) {
    throw createError.internal(`Error al actualizar horario: ${error.message}`);
  }
};

/**
 * Elimina un horario
 */
export const deleteHorario = async (id: number): Promise<void> => {
  try {
    const { error } = await supabase
      .from('Horario')
      .delete()
      .eq('id', id);

    if (error) throw error;
  } catch (error: any) {
    throw createError.internal(`Error al eliminar horario: ${error.message}`);
  }
};

// --- Funciones de Sala (Obsoletas) ---
// La gestión de salas no está en el esquema de Supabase,
// por lo que estas funciones se eliminan o comentan.
export const getAllSalas = async (): Promise<any[]> => {
  console.warn("Función getAllSalas no aplicable. Tabla 'Sala' no existe en Supabase.");
  return [];
};

export const createSala = async (salaData: any): Promise<any> => {
  console.warn("Función createSala no aplicable. Tabla 'Sala' no existe en Supabase.");
  return {};
};