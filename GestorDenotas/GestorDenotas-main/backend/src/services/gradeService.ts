// backend/src/services/gradeService.ts
import { gradeRepository } from "../repositories/gradeRepository";
import { createError } from "../config/errors";

/**
 * Registra una nueva calificación.
 * CORREGIDO: Usa estudiante_uuid (string) y elimina profesorId.
 */
export async function addGrade(
  estudiante_uuid: string, // <-- CORREGIDO (antes estudianteId)
  asignaturaId: number,
  // profesorId ya no es necesario aquí, se infiere del Horario
  valor: number
) {
  // Validaciones básicas
  if (!estudiante_uuid) {
    throw createError.validation('ID de estudiante (uuid) inválido');
  }
  if (asignaturaId <= 0) {
    throw createError.validation('ID de asignatura inválido');
  }
  if (valor < 1.0 || valor > 7.0) {
    throw createError.validation('La calificación debe estar entre 1.0 y 7.0');
  }

  try {
    return await gradeRepository.create({
      estudiante_uuid,
      asignaturaId,
      valor,
    });
  } catch (error) {
    throw createError.internal('Error al crear calificación');
  }
}

/**
 * Obtiene todas las calificaciones de un estudiante.
 * CORREGIDO: Busca por UUID (string)
 */
export async function getGrades(estudiante_uuid: string) {
  if (!estudiante_uuid) {
    throw createError.validation('ID de estudiante (uuid) inválido');
  }

  try {
    const calificaciones = await gradeRepository.findByEstudiante(estudiante_uuid);
    return calificaciones || [];
  } catch (error) {
    throw createError.internal('Error al obtener calificaciones del estudiante');
  }
}

/**
 * Obtiene todas las calificaciones del sistema.
 */
export async function getAllGrades() {
  try {
    return await gradeRepository.findAll();
  } catch (error) {
    throw createError.internal('Error al obtener todas las calificaciones');
  }
}

export async function getGradeById(id: number) {
  if (id <= 0) {
    throw createError.validation('ID de calificación inválido');
  }
  
  try {
    const grade = await gradeRepository.findById(id);
    if (!grade) {
      throw createError.notFound('Calificación no encontrada');
    }
    return grade;
  } catch (error: any) {
    if (error instanceof Error && error.message === 'Calificación no encontrada') {
      throw error;
    }
    throw createError.internal('Error al obtener calificación');
  }
}

/**
 * Actualiza una calificación.
 * CORREGIDO: Se elimina profesorId.
 */
export async function updateGrade(
  id: number,
  data: {
    valor?: number;
    asignaturaId?: number;
    // profesorId?: number; // <-- ELIMINADO
  }
) {
  try {
    await getGradeById(id); // Verificar que existe

    if (data.valor && (data.valor < 1.0 || data.valor > 7.0)) {
      throw createError.validation('La calificación debe estar entre 1.0 y 7.0');
    }
    if (data.asignaturaId && data.asignaturaId <= 0) {
      throw createError.validation('ID de asignatura inválido');
    }

    return await gradeRepository.update(id, data);
  } catch (error: any) {
    // ... (Manejo de errores)
    throw createError.internal('Error al actualizar calificación');
  }
}

export async function deleteGrade(id: number) {
  try {
    await getGradeById(id); // Verificar que existe
    return await gradeRepository.delete(id);
  } catch (error: any) {
    if (error instanceof Error && error.message.includes('Calificación no encontrada')) {
      throw error;
    }
    throw createError.internal('Error al eliminar calificación');
  }
}

export async function getGradesByAsignatura(asignaturaId: number) {
  if (asignaturaId <= 0) {
    throw createError.validation('ID de asignatura inválido');
  }
  try {
    return await gradeRepository.findByAsignatura(asignaturaId);
  } catch (error) {
    throw createError.internal('Error al obtener calificaciones por asignatura');
  }
}

export async function getGradesByProfesor(profesorId: number) {
  if (profesorId <= 0) {
    throw createError.validation('ID de profesor inválido');
  }
  try {
    return await gradeRepository.findByProfesor(profesorId);
  } catch (error) {
    throw createError.internal('Error al obtener calificaciones por profesor');
  }
}

export async function getEstadisticasCalificaciones() {
  try {
    const calificaciones = await gradeRepository.findAll();
    
    const total = calificaciones.length;
    const promedio = total > 0 ? calificaciones.reduce((sum: number, g: any) => sum + g.valor, 0) / total : 0;
    const aprobadas = calificaciones.filter((g: any) => g.valor >= 4.0).length;
    const reprobadas = calificaciones.filter((g: any) => g.valor < 4.0).length;

    return {
      total,
      promedio,
      aprobadas,
      reprobadas,
      porcentajeAprobacion: total > 0 ? (aprobadas / total) * 100 : 0,
    };
  } catch (error) {
    throw createError.internal('Error al obtener estadísticas de calificaciones');
  }
}