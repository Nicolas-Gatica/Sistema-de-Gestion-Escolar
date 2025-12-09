import { asignaturaRepository } from "../repositories/asignaturaRepository";
import { createError } from "../config/errors";

export async function getAllAsignaturas() {
  try {
    // Llama a la nueva función findAll (Supabase)
    return await asignaturaRepository.findAll();
  } catch (error) {
    throw createError.internal('Error al obtener asignaturas');
  }
}

export async function getAsignaturaById(id: number) {
  try {
    // Llama a la nueva función findById (Supabase)
    const asignatura = await asignaturaRepository.findById(id);
    if (!asignatura) {
      throw createError.notFound('Asignatura no encontrada');
    }
    return asignatura;
  } catch (error: any) {
    if (error instanceof Error && error.message === 'Asignatura no encontrada') {
      throw error;
    }
    throw createError.internal('Error al obtener asignatura');
  }
}

export async function createAsignatura(data: { nombre: string }) {
  if (!data.nombre || data.nombre.trim().length === 0) {
    throw createError.validation('El nombre de la asignatura es requerido');
  }

  try {
    // Llama a la nueva función create (Supabase)
    return await asignaturaRepository.create(data);
  } catch (error) {
    throw createError.internal('Error al crear asignatura');
  }
}

export async function updateAsignatura(id: number, data: { nombre?: string }) {
  try {
    await getAsignaturaById(id); // Verificar que existe

    if (data.nombre && data.nombre.trim().length === 0) {
      throw createError.validation('El nombre de la asignatura no puede estar vacío');
    }

    // Llama a la nueva función update (Supabase)
    return await asignaturaRepository.update(id, data);
  } catch (error: any) {
    if (error instanceof Error && (error.message.includes('Asignatura no encontrada') || error.message.includes('El nombre de la asignatura'))) {
      throw error;
    }
    throw createError.internal('Error al actualizar asignatura');
  }
}

export async function deleteAsignatura(id: number) {
  try {
    await getAsignaturaById(id); // Verificar que existe

    // Llama a la nueva función delete (Supabase)
    return await asignaturaRepository.delete(id);
  } catch (error: any) {
    if (error instanceof Error && error.message.includes('Asignatura no encontrada')) {
      throw error;
    }
    throw createError.internal('Error al eliminar asignatura');
  }
}

// --- FUNCIONES OBSOLETAS ELIMINADAS ---
// Las funciones addProfesorToAsignatura y removeProfesorFromAsignatura
// ya no se manejan aquí, sino en el 'horarioService' o 'horarioRepository'
// porque la relación Profesor <-> Asignatura ahora vive en la tabla Horario.