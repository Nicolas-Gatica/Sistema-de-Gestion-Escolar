"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllAsignaturas = getAllAsignaturas;
exports.getAsignaturaById = getAsignaturaById;
exports.createAsignatura = createAsignatura;
exports.updateAsignatura = updateAsignatura;
exports.deleteAsignatura = deleteAsignatura;
const asignaturaRepository_1 = require("../repositories/asignaturaRepository");
const errors_1 = require("../config/errors");
async function getAllAsignaturas() {
    try {
        // Llama a la nueva función findAll (Supabase)
        return await asignaturaRepository_1.asignaturaRepository.findAll();
    }
    catch (error) {
        throw errors_1.createError.internal('Error al obtener asignaturas');
    }
}
async function getAsignaturaById(id) {
    try {
        // Llama a la nueva función findById (Supabase)
        const asignatura = await asignaturaRepository_1.asignaturaRepository.findById(id);
        if (!asignatura) {
            throw errors_1.createError.notFound('Asignatura no encontrada');
        }
        return asignatura;
    }
    catch (error) {
        if (error instanceof Error && error.message === 'Asignatura no encontrada') {
            throw error;
        }
        throw errors_1.createError.internal('Error al obtener asignatura');
    }
}
async function createAsignatura(data) {
    if (!data.nombre || data.nombre.trim().length === 0) {
        throw errors_1.createError.validation('El nombre de la asignatura es requerido');
    }
    try {
        // Llama a la nueva función create (Supabase)
        return await asignaturaRepository_1.asignaturaRepository.create(data);
    }
    catch (error) {
        throw errors_1.createError.internal('Error al crear asignatura');
    }
}
async function updateAsignatura(id, data) {
    try {
        await getAsignaturaById(id); // Verificar que existe
        if (data.nombre && data.nombre.trim().length === 0) {
            throw errors_1.createError.validation('El nombre de la asignatura no puede estar vacío');
        }
        // Llama a la nueva función update (Supabase)
        return await asignaturaRepository_1.asignaturaRepository.update(id, data);
    }
    catch (error) {
        if (error instanceof Error && (error.message.includes('Asignatura no encontrada') || error.message.includes('El nombre de la asignatura'))) {
            throw error;
        }
        throw errors_1.createError.internal('Error al actualizar asignatura');
    }
}
async function deleteAsignatura(id) {
    try {
        await getAsignaturaById(id); // Verificar que existe
        // Llama a la nueva función delete (Supabase)
        return await asignaturaRepository_1.asignaturaRepository.delete(id);
    }
    catch (error) {
        if (error instanceof Error && error.message.includes('Asignatura no encontrada')) {
            throw error;
        }
        throw errors_1.createError.internal('Error al eliminar asignatura');
    }
}
// --- FUNCIONES OBSOLETAS ELIMINADAS ---
// Las funciones addProfesorToAsignatura y removeProfesorFromAsignatura
// ya no se manejan aquí, sino en el 'horarioService' o 'horarioRepository'
// porque la relación Profesor <-> Asignatura ahora vive en la tabla Horario.
