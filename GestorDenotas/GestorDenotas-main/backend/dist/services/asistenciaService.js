"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllAsistencias = getAllAsistencias;
exports.getAsistenciaById = getAsistenciaById;
exports.getAsistenciasByEstudiante = getAsistenciasByEstudiante;
exports.getAsistenciasByFecha = getAsistenciasByFecha;
exports.createAsistencia = createAsistencia;
exports.updateAsistencia = updateAsistencia;
exports.deleteAsistencia = deleteAsistencia;
exports.getEstadisticasAsistencia = getEstadisticasAsistencia;
// backend/src/services/asistenciaService.ts
const asistenciaRepository_1 = require("../repositories/asistenciaRepository");
const errors_1 = require("../config/errors");
async function getAllAsistencias() {
    try {
        return await asistenciaRepository_1.asistenciaRepository.findAll();
    }
    catch (error) {
        throw errors_1.createError.internal('Error al obtener asistencias');
    }
}
async function getAsistenciaById(id) {
    try {
        const asistencia = await asistenciaRepository_1.asistenciaRepository.findById(id);
        if (!asistencia) {
            throw errors_1.createError.notFound('Asistencia no encontrada');
        }
        return asistencia;
    }
    catch (error) {
        if (error instanceof Error && error.message === 'Asistencia no encontrada') {
            throw error;
        }
        throw errors_1.createError.internal('Error al obtener asistencia');
    }
}
/**
 * CORREGIDO: Ahora busca por UUID (string)
 */
async function getAsistenciasByEstudiante(estudianteUuid) {
    try {
        return await asistenciaRepository_1.asistenciaRepository.findByEstudiante(estudianteUuid);
    }
    catch (error) {
        throw errors_1.createError.internal('Error al obtener asistencias por estudiante');
    }
}
async function getAsistenciasByFecha(fecha) {
    try {
        return await asistenciaRepository_1.asistenciaRepository.findByFecha(fecha);
    }
    catch (error) {
        throw errors_1.createError.internal('Error al obtener asistencias por fecha');
    }
}
/**
 * CORREGIDO: El 'data' ahora espera 'estudiante_uuid' (string)
 */
async function createAsistencia(data) {
    // Validaciones básicas
    if (!data.estudiante_uuid) {
        throw errors_1.createError.validation('ID de estudiante (uuid) inválido');
    }
    if (!["presente", "ausente", "tarde"].includes(data.estado)) {
        throw errors_1.createError.validation('Estado de asistencia inválido');
    }
    if (data.fecha > new Date()) {
        throw errors_1.createError.validation('No se puede registrar asistencia para fechas futuras');
    }
    try {
        // Verificar si ya existe asistencia
        const existingAsistencia = await asistenciaRepository_1.asistenciaRepository.findByEstudianteAndFecha(data.estudiante_uuid, // <-- CORREGIDO (antes estudianteId)
        data.fecha);
        if (existingAsistencia) {
            throw errors_1.createError.conflict('Ya existe un registro de asistencia para este estudiante en esta fecha');
        }
        return await asistenciaRepository_1.asistenciaRepository.create(data);
    }
    catch (error) {
        if (error instanceof Error && error.message.includes('Ya existe un registro')) {
            throw error;
        }
        throw errors_1.createError.internal('Error al crear asistencia');
    }
}
async function updateAsistencia(id, data) {
    try {
        await getAsistenciaById(id); // Verificar que la asistencia existe
        // Validaciones
        if (data.estado && !["presente", "ausente", "tarde"].includes(data.estado)) {
            throw errors_1.createError.validation('Estado de asistencia inválido');
        }
        if (data.fecha && data.fecha > new Date()) {
            throw errors_1.createError.validation('No se puede registrar asistencia para fechas futuras');
        }
        return await asistenciaRepository_1.asistenciaRepository.update(id, data);
    }
    catch (error) {
        if (error instanceof Error && error.message.includes('Asistencia no encontrada')) {
            throw error;
        }
        // ... (otros manejos de error)
        throw errors_1.createError.internal('Error al actualizar asistencia');
    }
}
async function deleteAsistencia(id) {
    try {
        await getAsistenciaById(id); // Verificar que existe
        return await asistenciaRepository_1.asistenciaRepository.delete(id);
    }
    catch (error) {
        if (error instanceof Error && error.message.includes('Asistencia no encontrada')) {
            throw error;
        }
        throw errors_1.createError.internal('Error al eliminar asistencia');
    }
}
async function getEstadisticasAsistencia() {
    try {
        const asistencias = await asistenciaRepository_1.asistenciaRepository.findAll();
        const total = asistencias.length;
        const presentes = asistencias.filter((a) => a.estado === "presente").length;
        const ausentes = asistencias.filter((a) => a.estado === "ausente").length;
        const tardes = asistencias.filter((a) => a.estado === "tarde").length;
        return {
            total,
            presentes,
            ausentes,
            tardes,
            porcentajePresentes: total > 0 ? (presentes / total) * 100 : 0,
            porcentajeAusentes: total > 0 ? (ausentes / total) * 100 : 0,
            porcentajeTardes: total > 0 ? (tardes / total) * 100 : 0,
        };
    }
    catch (error) {
        throw errors_1.createError.internal('Error al obtener estadísticas de asistencia');
    }
}
