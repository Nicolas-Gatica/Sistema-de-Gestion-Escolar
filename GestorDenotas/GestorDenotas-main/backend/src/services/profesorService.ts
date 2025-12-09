import { profesorRepository } from "../repositories/profesorRepository";
import { createError } from "../config/errors";

// Interfaz para los datos (Debe coincidir con la del repositorio)
interface ProfesorData {
  nombre: string;
  apellido: string;
  email: string;
  user_uuid: string;
  edad?: number;
  sexo?: string;
}

export async function getAllProfesores() {
  try {
    return await profesorRepository.findAll();
  } catch (error) {
    throw createError.internal('Error al obtener profesores');
  }
}

export async function getProfesorById(id: number) {
  try {
    const profesor = await profesorRepository.findById(id);
    if (!profesor) {
      throw createError.notFound('Profesor no encontrado');
    }
    return profesor;
  } catch (error: any) {
    if (error instanceof Error && error.message === 'Profesor no encontrado') {
      throw error;
    }
    throw createError.internal('Error al obtener profesor');
  }
}

/**
 * CORREGIDO: La función 'create' ahora acepta el objeto 'ProfesorData' completo
 * (El controlador 'profesorController' es quien llama a esto con los datos correctos)
 */
export async function createProfesor(data: ProfesorData) {
  // Validaciones
  if (!data.nombre || !data.apellido) {
    throw createError.validation('Nombre y apellido son requeridos');
  }
  if (!data.email) {
    throw createError.validation('Email es requerido');
  }
  if (!data.user_uuid) {
    throw createError.validation('user_uuid es requerido');
  }

  try {
    return await profesorRepository.create(data);
  } catch (error) {
    throw createError.internal('Error al crear profesor');
  }
}

/**
 * CORREGIDO: La actualización ahora acepta Partial<ProfesorData>
 */
export async function updateProfesor(
  id: number,
  data: Partial<ProfesorData> // Permite actualizar cualquier campo
) {
  try {
    await getProfesorById(id); // Verificar que existe

    if (data.edad && (data.edad < 18 || data.edad > 80)) {
      throw createError.validation('La edad debe estar entre 18 y 80 años');
    }
    if (data.sexo && !["M", "F"].includes(data.sexo)) {
      throw createError.validation('El sexo debe ser "M" o "F"');
    }

    return await profesorRepository.update(id, data);
  } catch (error: any) {
    // ... (Manejo de errores)
    throw createError.internal('Error al actualizar profesor');
  }
}

export async function deleteProfesor(id: number) {
  try {
    await getProfesorById(id); // Verificar que existe
    return await profesorRepository.delete(id);
  } catch (error: any) {
    if (error instanceof Error && error.message.includes('Profesor no encontrado')) {
      throw error;
    }
    throw createError.internal('Error al eliminar profesor');
  }
}

// --- FUNCIONES OBSOLETAS ELIMINADAS ---
// (addAsignaturaToProfesor y removeAsignaturaFromProfesor eliminadas)