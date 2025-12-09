// backend/src/services/observacionService.ts
import { observacionRepository } from "../repositories/observacionRepository";
import { createError } from "../config/errors";

type EstadoObservacion = "negativa" | "neutro" | "positiva";

export const observacionService = {
  
  findAll: async () => {
    try {
      return await observacionRepository.findAll();
    } catch (error) {
      throw createError.internal('Error al obtener observaciones');
    }
  },
  
  findById: async (id: number) => {
    try {
      const observacion = await observacionRepository.findById(id);
      if (!observacion) {
        throw createError.notFound('Observación no encontrada');
      }
      return observacion;
    } catch (error: any) {
      if (error instanceof Error && error.message === 'Observación no encontrada') {
        throw error;
      }
      throw createError.internal('Error al obtener observación');
    }
  },
  
  /**
   * CORREGIDO: Busca por UUID (string) en lugar de ID (number)
   */
  findByEstudiante: async (estudianteUuid: string) => {
    try {
      return await observacionRepository.findByEstudiante(estudianteUuid);
    } catch (error) {
      throw createError.internal('Error al obtener observaciones por estudiante');
    }
  },
  
  findByProfesor: async (profesorId: number) => {
    try {
      return await observacionRepository.findByProfesor(profesorId);
    } catch (error) {
      throw createError.internal('Error al obtener observaciones por profesor');
    }
  },
  
  /**
   * CORREGIDO: El 'data' ahora espera 'estudiante_uuid' (string)
   */
  create: async (data: { 
    estudiante_uuid: string; // <-- CORREGIDO
    profesorId: number; 
    texto: string; 
    estado?: EstadoObservacion 
  }) => {
    if (!data.texto || data.texto.trim().length === 0) {
      throw createError.validation('El texto de la observación es requerido');
    }
    if (data.estado && !["negativa", "neutro", "positiva"].includes(data.estado)) {
      throw createError.validation('Estado de observación inválido');
    }
    
    try {
      return await observacionRepository.create(data);
    } catch (error) {
      throw createError.internal('Error al crear observación');
    }
  },
  
  update: async (id: number, data: { texto?: string; estado?: EstadoObservacion }) => {
    try {
      await observacionService.findById(id); // Verificar que existe
      
      if (data.texto && data.texto.trim().length === 0) {
        throw createError.validation('El texto de la observación no puede estar vacío');
      }
      if (data.estado && !["negativa", "neutro", "positiva"].includes(data.estado)) {
        throw createError.validation('Estado de observación inválido');
      }
      
      return await observacionRepository.update(id, data);
    } catch (error: any) {
      // ... (Manejo de errores)
      throw createError.internal('Error al actualizar observación');
    }
  },
  
  delete: async (id: number) => {
    try {
      await observacionService.findById(id); // Verificar que existe
      return await observacionRepository.delete(id);
    } catch (error: any) {
      if (error instanceof Error && error.message.includes('Observación no encontrada')) {
        throw error;
      }
      throw createError.internal('Error al eliminar observación');
    }
  },
};