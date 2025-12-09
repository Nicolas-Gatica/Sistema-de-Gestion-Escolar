// backend/src/services/courseService.ts
import { courseRepository } from "../repositories/courseRepository";
import { createError } from "../config/errors";

export async function getAllCourses() {
  try {
    return await courseRepository.findAll();
  } catch (error) {
    throw createError.internal('Error al obtener cursos');
  }
}

export async function getCourseById(id: number) {
  try {
    const course = await courseRepository.findById(id);
    if (!course) {
      throw createError.notFound('Curso no encontrado');
    }
    return course;
  } catch (error) {
    if (error instanceof Error && error.message === 'Curso no encontrado') {
      throw error;
    }
    throw createError.internal('Error al obtener curso');
  }
}

export async function createCourse(data: {
  nombre: string;
  jefeId: number;
}) {
  // Validaciones básicas
  if (!data.nombre || data.nombre.trim().length === 0) {
    throw createError.validation('El nombre del curso es requerido');
  }
  if (data.jefeId <= 0) {
    throw createError.validation('ID de jefe de curso inválido');
  }

  try {
    return await courseRepository.create(data);
  } catch (error) {
    throw createError.internal('Error al crear curso');
  }
}

export async function updateCourse(
  id: number,
  data: {
    nombre?: string;
    jefeId?: number;
  }
) {
  try {
    // Verificar que el curso existe
    await getCourseById(id);

    // Validaciones básicas
    if (data.nombre && data.nombre.trim().length === 0) {
      throw createError.validation('El nombre del curso no puede estar vacío');
    }
    if (data.jefeId && data.jefeId <= 0) {
      throw createError.validation('ID de jefe de curso inválido');
    }

    return await courseRepository.update(id, data);
  } catch (error) {
    if (error instanceof Error && error.message.includes('Curso no encontrado')) {
      throw error;
    }
    if (error instanceof Error && error.message.includes('El nombre del curso')) {
      throw error;
    }
    if (error instanceof Error && error.message.includes('ID de jefe de curso')) {
      throw error;
    }
    throw createError.internal('Error al actualizar curso');
  }
}

export async function deleteCourse(id: number) {
  try {
    // Verificar que el curso existe
    await getCourseById(id);

    return await courseRepository.delete(id);
  } catch (error) {
    if (error instanceof Error && error.message.includes('Curso no encontrado')) {
      throw error;
    }
    throw createError.internal('Error al eliminar curso');
  }
}

export async function addAsignaturaToCourse(cursoId: number, asignaturaId: number) {
  try {
    // Verificar que el curso existe
    await getCourseById(cursoId);

    return await courseRepository.addAsignatura(cursoId, asignaturaId);
  } catch (error) {
    if (error instanceof Error && error.message.includes('Curso no encontrado')) {
      throw error;
    }
    throw createError.internal('Error al agregar asignatura al curso');
  }
}

export async function removeAsignaturaFromCourse(cursoId: number, asignaturaId: number) {
  try {
    // Verificar que el curso existe
    await getCourseById(cursoId);

    return await courseRepository.removeAsignatura(cursoId, asignaturaId);
  } catch (error) {
    if (error instanceof Error && error.message.includes('Curso no encontrado')) {
      throw error;
    }
    throw createError.internal('Error al remover asignatura del curso');
  }
}

export async function getCoursesByProfesor(profesorId: number) {
  if (!profesorId || profesorId <= 0) {
    throw createError.validation('ID de profesor inválido');
  }
  
  try {
    return await courseRepository.findByProfesor(profesorId);
  } catch (error) {
    throw createError.internal('Error al obtener cursos por profesor');
  }
}

export async function getCoursesByEstudiante(estudianteId: number) {
  if (!estudianteId || estudianteId <= 0) {
    throw createError.validation('ID de estudiante inválido');
  }
  
  try {
    return await courseRepository.findByEstudiante(estudianteId);
  } catch (error) {
    throw createError.internal('Error al obtener cursos por estudiante');
  }
}
