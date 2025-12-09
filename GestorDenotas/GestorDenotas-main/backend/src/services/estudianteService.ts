// backend/src/services/estudianteService.ts
import { estudianteRepository } from "../repositories/estudianteRepository";
import { createError } from "../config/errors";

export async function getAllEstudiantes() {
  try {
    return await estudianteRepository.findAll();
  } catch (error) {
    throw createError.internal('Error al obtener estudiantes');
  }
}

export async function getEstudianteById(id: number) {
  try {
    const estudiante = await estudianteRepository.findById(id);
    if (!estudiante) {
      throw createError.notFound('Estudiante no encontrado');
    }
    return estudiante;
  } catch (error) {
    if (error instanceof Error && error.message === 'Estudiante no encontrado') {
      throw error;
    }
    throw createError.internal('Error al obtener estudiante');
  }
}

export async function createEstudiante(data: {
  nombre: string;
  apellido: string;
  edad: number;
  sexo: string;
  cursoId: number;
}) {
  // Validaciones básicas
  if (!data.nombre || !data.apellido) {
    throw createError.validation('Nombre y apellido son requeridos');
  }
  if (data.edad < 3 || data.edad > 25) {
    throw createError.validation('La edad debe estar entre 3 y 25 años');
  }
  if (!["M", "F"].includes(data.sexo)) {
    throw createError.validation('El sexo debe ser "M" o "F"');
  }
  if (data.cursoId <= 0) {
    throw createError.validation('ID de curso inválido');
  }

  try {
    return await estudianteRepository.create(data);
  } catch (error) {
    throw createError.internal('Error al crear estudiante');
  }
}

export async function updateEstudiante(
  id: number,
  data: {
    nombre?: string;
    apellido?: string;
    edad?: number;
    sexo?: string;
    cursoId?: number;
  }
) {
  try {
    // Verificar que el estudiante existe
    await getEstudianteById(id);

    // Validaciones básicas
    if (data.edad && (data.edad < 3 || data.edad > 25)) {
      throw createError.validation('La edad debe estar entre 3 y 25 años');
    }
    if (data.sexo && !["M", "F"].includes(data.sexo)) {
      throw createError.validation('El sexo debe ser "M" o "F"');
    }

    return await estudianteRepository.update(id, data);
  } catch (error) {
    if (error instanceof Error && error.message.includes('Estudiante no encontrado')) {
      throw error;
    }
    if (error instanceof Error && error.message.includes('La edad debe estar')) {
      throw error;
    }
    if (error instanceof Error && error.message.includes('El sexo debe ser')) {
      throw error;
    }
    throw createError.internal('Error al actualizar estudiante');
  }
}

export async function deleteEstudiante(id: number) {
  try {
    // Verificar que el estudiante existe
    await getEstudianteById(id);

    return await estudianteRepository.delete(id);
  } catch (error) {
    if (error instanceof Error && error.message.includes('Estudiante no encontrado')) {
      throw error;
    }
    throw createError.internal('Error al eliminar estudiante');
  }
}
