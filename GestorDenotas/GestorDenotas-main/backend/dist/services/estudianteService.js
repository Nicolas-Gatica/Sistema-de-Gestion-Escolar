"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllEstudiantes = getAllEstudiantes;
exports.getEstudianteById = getEstudianteById;
exports.createEstudiante = createEstudiante;
exports.updateEstudiante = updateEstudiante;
exports.deleteEstudiante = deleteEstudiante;
// backend/src/services/estudianteService.ts
const estudianteRepository_1 = require("../repositories/estudianteRepository");
const errors_1 = require("../config/errors");
async function getAllEstudiantes() {
    try {
        return await estudianteRepository_1.estudianteRepository.findAll();
    }
    catch (error) {
        throw errors_1.createError.internal('Error al obtener estudiantes');
    }
}
async function getEstudianteById(id) {
    try {
        const estudiante = await estudianteRepository_1.estudianteRepository.findById(id);
        if (!estudiante) {
            throw errors_1.createError.notFound('Estudiante no encontrado');
        }
        return estudiante;
    }
    catch (error) {
        if (error instanceof Error && error.message === 'Estudiante no encontrado') {
            throw error;
        }
        throw errors_1.createError.internal('Error al obtener estudiante');
    }
}
async function createEstudiante(data) {
    // Validaciones básicas
    if (!data.nombre || !data.apellido) {
        throw errors_1.createError.validation('Nombre y apellido son requeridos');
    }
    if (data.edad < 3 || data.edad > 25) {
        throw errors_1.createError.validation('La edad debe estar entre 3 y 25 años');
    }
    if (!["M", "F"].includes(data.sexo)) {
        throw errors_1.createError.validation('El sexo debe ser "M" o "F"');
    }
    if (data.cursoId <= 0) {
        throw errors_1.createError.validation('ID de curso inválido');
    }
    try {
        return await estudianteRepository_1.estudianteRepository.create(data);
    }
    catch (error) {
        throw errors_1.createError.internal('Error al crear estudiante');
    }
}
async function updateEstudiante(id, data) {
    try {
        // Verificar que el estudiante existe
        await getEstudianteById(id);
        // Validaciones básicas
        if (data.edad && (data.edad < 3 || data.edad > 25)) {
            throw errors_1.createError.validation('La edad debe estar entre 3 y 25 años');
        }
        if (data.sexo && !["M", "F"].includes(data.sexo)) {
            throw errors_1.createError.validation('El sexo debe ser "M" o "F"');
        }
        return await estudianteRepository_1.estudianteRepository.update(id, data);
    }
    catch (error) {
        if (error instanceof Error && error.message.includes('Estudiante no encontrado')) {
            throw error;
        }
        if (error instanceof Error && error.message.includes('La edad debe estar')) {
            throw error;
        }
        if (error instanceof Error && error.message.includes('El sexo debe ser')) {
            throw error;
        }
        throw errors_1.createError.internal('Error al actualizar estudiante');
    }
}
async function deleteEstudiante(id) {
    try {
        // Verificar que el estudiante existe
        await getEstudianteById(id);
        return await estudianteRepository_1.estudianteRepository.delete(id);
    }
    catch (error) {
        if (error instanceof Error && error.message.includes('Estudiante no encontrado')) {
            throw error;
        }
        throw errors_1.createError.internal('Error al eliminar estudiante');
    }
}
