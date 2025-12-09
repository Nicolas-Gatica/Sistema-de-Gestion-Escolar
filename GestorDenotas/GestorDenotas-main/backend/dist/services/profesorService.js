"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllProfesores = getAllProfesores;
exports.getProfesorById = getProfesorById;
exports.createProfesor = createProfesor;
exports.updateProfesor = updateProfesor;
exports.deleteProfesor = deleteProfesor;
const profesorRepository_1 = require("../repositories/profesorRepository");
const errors_1 = require("../config/errors");
async function getAllProfesores() {
    try {
        return await profesorRepository_1.profesorRepository.findAll();
    }
    catch (error) {
        throw errors_1.createError.internal('Error al obtener profesores');
    }
}
async function getProfesorById(id) {
    try {
        const profesor = await profesorRepository_1.profesorRepository.findById(id);
        if (!profesor) {
            throw errors_1.createError.notFound('Profesor no encontrado');
        }
        return profesor;
    }
    catch (error) {
        if (error instanceof Error && error.message === 'Profesor no encontrado') {
            throw error;
        }
        throw errors_1.createError.internal('Error al obtener profesor');
    }
}
/**
 * CORREGIDO: La función 'create' ahora acepta el objeto 'ProfesorData' completo
 * (El controlador 'profesorController' es quien llama a esto con los datos correctos)
 */
async function createProfesor(data) {
    // Validaciones
    if (!data.nombre || !data.apellido) {
        throw errors_1.createError.validation('Nombre y apellido son requeridos');
    }
    if (!data.email) {
        throw errors_1.createError.validation('Email es requerido');
    }
    if (!data.user_uuid) {
        throw errors_1.createError.validation('user_uuid es requerido');
    }
    try {
        return await profesorRepository_1.profesorRepository.create(data);
    }
    catch (error) {
        throw errors_1.createError.internal('Error al crear profesor');
    }
}
/**
 * CORREGIDO: La actualización ahora acepta Partial<ProfesorData>
 */
async function updateProfesor(id, data // Permite actualizar cualquier campo
) {
    try {
        await getProfesorById(id); // Verificar que existe
        if (data.edad && (data.edad < 18 || data.edad > 80)) {
            throw errors_1.createError.validation('La edad debe estar entre 18 y 80 años');
        }
        if (data.sexo && !["M", "F"].includes(data.sexo)) {
            throw errors_1.createError.validation('El sexo debe ser "M" o "F"');
        }
        return await profesorRepository_1.profesorRepository.update(id, data);
    }
    catch (error) {
        // ... (Manejo de errores)
        throw errors_1.createError.internal('Error al actualizar profesor');
    }
}
async function deleteProfesor(id) {
    try {
        await getProfesorById(id); // Verificar que existe
        return await profesorRepository_1.profesorRepository.delete(id);
    }
    catch (error) {
        if (error instanceof Error && error.message.includes('Profesor no encontrado')) {
            throw error;
        }
        throw errors_1.createError.internal('Error al eliminar profesor');
    }
}
// --- FUNCIONES OBSOLETAS ELIMINADAS ---
// (addAsignaturaToProfesor y removeAsignaturaFromProfesor eliminadas)
