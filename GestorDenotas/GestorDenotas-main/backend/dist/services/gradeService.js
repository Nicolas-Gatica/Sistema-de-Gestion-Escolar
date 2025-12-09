"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addGrade = addGrade;
exports.getGrades = getGrades;
exports.getAllGrades = getAllGrades;
exports.getGradeById = getGradeById;
exports.updateGrade = updateGrade;
exports.deleteGrade = deleteGrade;
exports.getGradesByAsignatura = getGradesByAsignatura;
exports.getGradesByProfesor = getGradesByProfesor;
exports.getEstadisticasCalificaciones = getEstadisticasCalificaciones;
// backend/src/services/gradeService.ts
const gradeRepository_1 = require("../repositories/gradeRepository");
const errors_1 = require("../config/errors");
/**
 * Registra una nueva calificación.
 * CORREGIDO: Usa estudiante_uuid (string) y elimina profesorId.
 */
async function addGrade(estudiante_uuid, // <-- CORREGIDO (antes estudianteId)
asignaturaId, 
// profesorId ya no es necesario aquí, se infiere del Horario
valor) {
    // Validaciones básicas
    if (!estudiante_uuid) {
        throw errors_1.createError.validation('ID de estudiante (uuid) inválido');
    }
    if (asignaturaId <= 0) {
        throw errors_1.createError.validation('ID de asignatura inválido');
    }
    if (valor < 1.0 || valor > 7.0) {
        throw errors_1.createError.validation('La calificación debe estar entre 1.0 y 7.0');
    }
    try {
        return await gradeRepository_1.gradeRepository.create({
            estudiante_uuid,
            asignaturaId,
            valor,
        });
    }
    catch (error) {
        throw errors_1.createError.internal('Error al crear calificación');
    }
}
/**
 * Obtiene todas las calificaciones de un estudiante.
 * CORREGIDO: Busca por UUID (string)
 */
async function getGrades(estudiante_uuid) {
    if (!estudiante_uuid) {
        throw errors_1.createError.validation('ID de estudiante (uuid) inválido');
    }
    try {
        const calificaciones = await gradeRepository_1.gradeRepository.findByEstudiante(estudiante_uuid);
        return calificaciones || [];
    }
    catch (error) {
        throw errors_1.createError.internal('Error al obtener calificaciones del estudiante');
    }
}
/**
 * Obtiene todas las calificaciones del sistema.
 */
async function getAllGrades() {
    try {
        return await gradeRepository_1.gradeRepository.findAll();
    }
    catch (error) {
        throw errors_1.createError.internal('Error al obtener todas las calificaciones');
    }
}
async function getGradeById(id) {
    if (id <= 0) {
        throw errors_1.createError.validation('ID de calificación inválido');
    }
    try {
        const grade = await gradeRepository_1.gradeRepository.findById(id);
        if (!grade) {
            throw errors_1.createError.notFound('Calificación no encontrada');
        }
        return grade;
    }
    catch (error) {
        if (error instanceof Error && error.message === 'Calificación no encontrada') {
            throw error;
        }
        throw errors_1.createError.internal('Error al obtener calificación');
    }
}
/**
 * Actualiza una calificación.
 * CORREGIDO: Se elimina profesorId.
 */
async function updateGrade(id, data) {
    try {
        await getGradeById(id); // Verificar que existe
        if (data.valor && (data.valor < 1.0 || data.valor > 7.0)) {
            throw errors_1.createError.validation('La calificación debe estar entre 1.0 y 7.0');
        }
        if (data.asignaturaId && data.asignaturaId <= 0) {
            throw errors_1.createError.validation('ID de asignatura inválido');
        }
        return await gradeRepository_1.gradeRepository.update(id, data);
    }
    catch (error) {
        // ... (Manejo de errores)
        throw errors_1.createError.internal('Error al actualizar calificación');
    }
}
async function deleteGrade(id) {
    try {
        await getGradeById(id); // Verificar que existe
        return await gradeRepository_1.gradeRepository.delete(id);
    }
    catch (error) {
        if (error instanceof Error && error.message.includes('Calificación no encontrada')) {
            throw error;
        }
        throw errors_1.createError.internal('Error al eliminar calificación');
    }
}
async function getGradesByAsignatura(asignaturaId) {
    if (asignaturaId <= 0) {
        throw errors_1.createError.validation('ID de asignatura inválido');
    }
    try {
        return await gradeRepository_1.gradeRepository.findByAsignatura(asignaturaId);
    }
    catch (error) {
        throw errors_1.createError.internal('Error al obtener calificaciones por asignatura');
    }
}
async function getGradesByProfesor(profesorId) {
    if (profesorId <= 0) {
        throw errors_1.createError.validation('ID de profesor inválido');
    }
    try {
        return await gradeRepository_1.gradeRepository.findByProfesor(profesorId);
    }
    catch (error) {
        throw errors_1.createError.internal('Error al obtener calificaciones por profesor');
    }
}
async function getEstadisticasCalificaciones() {
    try {
        const calificaciones = await gradeRepository_1.gradeRepository.findAll();
        const total = calificaciones.length;
        const promedio = total > 0 ? calificaciones.reduce((sum, g) => sum + g.valor, 0) / total : 0;
        const aprobadas = calificaciones.filter((g) => g.valor >= 4.0).length;
        const reprobadas = calificaciones.filter((g) => g.valor < 4.0).length;
        return {
            total,
            promedio,
            aprobadas,
            reprobadas,
            porcentajeAprobacion: total > 0 ? (aprobadas / total) * 100 : 0,
        };
    }
    catch (error) {
        throw errors_1.createError.internal('Error al obtener estadísticas de calificaciones');
    }
}
