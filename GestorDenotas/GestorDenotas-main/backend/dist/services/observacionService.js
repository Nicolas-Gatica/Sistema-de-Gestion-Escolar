"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.observacionService = void 0;
// backend/src/services/observacionService.ts
const observacionRepository_1 = require("../repositories/observacionRepository");
const errors_1 = require("../config/errors");
exports.observacionService = {
    findAll: async () => {
        try {
            return await observacionRepository_1.observacionRepository.findAll();
        }
        catch (error) {
            throw errors_1.createError.internal('Error al obtener observaciones');
        }
    },
    findById: async (id) => {
        try {
            const observacion = await observacionRepository_1.observacionRepository.findById(id);
            if (!observacion) {
                throw errors_1.createError.notFound('Observación no encontrada');
            }
            return observacion;
        }
        catch (error) {
            if (error instanceof Error && error.message === 'Observación no encontrada') {
                throw error;
            }
            throw errors_1.createError.internal('Error al obtener observación');
        }
    },
    /**
     * CORREGIDO: Busca por UUID (string) en lugar de ID (number)
     */
    findByEstudiante: async (estudianteUuid) => {
        try {
            return await observacionRepository_1.observacionRepository.findByEstudiante(estudianteUuid);
        }
        catch (error) {
            throw errors_1.createError.internal('Error al obtener observaciones por estudiante');
        }
    },
    findByProfesor: async (profesorId) => {
        try {
            return await observacionRepository_1.observacionRepository.findByProfesor(profesorId);
        }
        catch (error) {
            throw errors_1.createError.internal('Error al obtener observaciones por profesor');
        }
    },
    /**
     * CORREGIDO: El 'data' ahora espera 'estudiante_uuid' (string)
     */
    create: async (data) => {
        if (!data.texto || data.texto.trim().length === 0) {
            throw errors_1.createError.validation('El texto de la observación es requerido');
        }
        if (data.estado && !["negativa", "neutro", "positiva"].includes(data.estado)) {
            throw errors_1.createError.validation('Estado de observación inválido');
        }
        try {
            return await observacionRepository_1.observacionRepository.create(data);
        }
        catch (error) {
            throw errors_1.createError.internal('Error al crear observación');
        }
    },
    update: async (id, data) => {
        try {
            await exports.observacionService.findById(id); // Verificar que existe
            if (data.texto && data.texto.trim().length === 0) {
                throw errors_1.createError.validation('El texto de la observación no puede estar vacío');
            }
            if (data.estado && !["negativa", "neutro", "positiva"].includes(data.estado)) {
                throw errors_1.createError.validation('Estado de observación inválido');
            }
            return await observacionRepository_1.observacionRepository.update(id, data);
        }
        catch (error) {
            // ... (Manejo de errores)
            throw errors_1.createError.internal('Error al actualizar observación');
        }
    },
    delete: async (id) => {
        try {
            await exports.observacionService.findById(id); // Verificar que existe
            return await observacionRepository_1.observacionRepository.delete(id);
        }
        catch (error) {
            if (error instanceof Error && error.message.includes('Observación no encontrada')) {
                throw error;
            }
            throw errors_1.createError.internal('Error al eliminar observación');
        }
    },
};
