// backend/src/services/asistenciaService.ts
import { asistenciaRepository } from "../repositories/asistenciaRepository";
import { createError } from "../config/errors";

type EstadoAsistencia = "presente" | "ausente" | "tarde";

export async function getAllAsistencias() {
  try {
    return await asistenciaRepository.findAll();
  } catch (error) {
    throw createError.internal('Error al obtener asistencias');
  }
}

export async function getAsistenciaById(id: number) {
  try {
    const asistencia = await asistenciaRepository.findById(id);
    if (!asistencia) {
      throw createError.notFound('Asistencia no encontrada');
    }
    return asistencia;
  } catch (error: any) {
    if (error instanceof Error && error.message === 'Asistencia no encontrada') {
      throw error;
    }
    throw createError.internal('Error al obtener asistencia');
  }
}

/**
 * CORREGIDO: Ahora busca por UUID (string)
 */
export async function getAsistenciasByEstudiante(estudianteUuid: string) {
  try {
    return await asistenciaRepository.findByEstudiante(estudianteUuid);
  } catch (error) {
    throw createError.internal('Error al obtener asistencias por estudiante');
  }
}

export async function getAsistenciasByFecha(fecha: Date) {
  try {
    return await asistenciaRepository.findByFecha(fecha);
  } catch (error) {
    throw createError.internal('Error al obtener asistencias por fecha');
  }
}

/**
 * CORREGIDO: El 'data' ahora espera 'estudiante_uuid' (string)
 */
export async function createAsistencia(data: {
  estudiante_uuid: string; // <-- CORREGIDO (antes estudianteId)
  fecha: Date;
  estado: EstadoAsistencia;
}) {
  // Validaciones básicas
  if (!data.estudiante_uuid) {
    throw createError.validation('ID de estudiante (uuid) inválido');
  }
  if (!["presente", "ausente", "tarde"].includes(data.estado)) {
    throw createError.validation('Estado de asistencia inválido');
  }
  if (data.fecha > new Date()) {
    throw createError.validation('No se puede registrar asistencia para fechas futuras');
  }

  try {
    // Verificar si ya existe asistencia
    const existingAsistencia = await asistenciaRepository.findByEstudianteAndFecha(
      data.estudiante_uuid, // <-- CORREGIDO (antes estudianteId)
      data.fecha
    );
    if (existingAsistencia) {
      throw createError.conflict('Ya existe un registro de asistencia para este estudiante en esta fecha');
    }

    return await asistenciaRepository.create(data);
  } catch (error: any) {
    if (error instanceof Error && error.message.includes('Ya existe un registro')) {
      throw error;
    }
    throw createError.internal('Error al crear asistencia');
  }
}

export async function updateAsistencia(
  id: number,
  data: {
    fecha?: Date;
    estado?: EstadoAsistencia;
  }
) {
  try {
    await getAsistenciaById(id); // Verificar que la asistencia existe

    // Validaciones
    if (data.estado && !["presente", "ausente", "tarde"].includes(data.estado)) {
      throw createError.validation('Estado de asistencia inválido');
    }
    if (data.fecha && data.fecha > new Date()) {
      throw createError.validation('No se puede registrar asistencia para fechas futuras');
    }

    return await asistenciaRepository.update(id, data);
  } catch (error: any) {
    if (error instanceof Error && error.message.includes('Asistencia no encontrada')) {
      throw error;
    }
    // ... (otros manejos de error)
    throw createError.internal('Error al actualizar asistencia');
  }
}

export async function deleteAsistencia(id: number) {
  try {
    await getAsistenciaById(id); // Verificar que existe
    return await asistenciaRepository.delete(id);
  } catch (error: any) {
    if (error instanceof Error && error.message.includes('Asistencia no encontrada')) {
      throw error;
    }
    throw createError.internal('Error al eliminar asistencia');
  }
}

export async function getEstadisticasAsistencia() {
  try {
    const asistencias = await asistenciaRepository.findAll();
    
    const total = asistencias.length;
    const presentes = asistencias.filter((a: any) => a.estado === "presente").length;
    const ausentes = asistencias.filter((a: any) => a.estado === "ausente").length;
    const tardes = asistencias.filter((a: any) => a.estado === "tarde").length;

    return {
      total,
      presentes,
      ausentes,
      tardes,
      porcentajePresentes: total > 0 ? (presentes / total) * 100 : 0,
      porcentajeAusentes: total > 0 ? (ausentes / total) * 100 : 0,
      porcentajeTardes: total > 0 ? (tardes / total) * 100 : 0,
    };
  } catch (error) {
    throw createError.internal('Error al obtener estadísticas de asistencia');
  }
}