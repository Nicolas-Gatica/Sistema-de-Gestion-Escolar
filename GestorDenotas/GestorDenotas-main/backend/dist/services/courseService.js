"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllCourses = getAllCourses;
exports.getCourseById = getCourseById;
exports.createCourse = createCourse;
exports.updateCourse = updateCourse;
exports.deleteCourse = deleteCourse;
exports.addAsignaturaToCourse = addAsignaturaToCourse;
exports.removeAsignaturaFromCourse = removeAsignaturaFromCourse;
exports.getCoursesByProfesor = getCoursesByProfesor;
exports.getCoursesByEstudiante = getCoursesByEstudiante;
// backend/src/services/courseService.ts
const courseRepository_1 = require("../repositories/courseRepository");
const errors_1 = require("../config/errors");
async function getAllCourses() {
    try {
        return await courseRepository_1.courseRepository.findAll();
    }
    catch (error) {
        throw errors_1.createError.internal('Error al obtener cursos');
    }
}
async function getCourseById(id) {
    try {
        const course = await courseRepository_1.courseRepository.findById(id);
        if (!course) {
            throw errors_1.createError.notFound('Curso no encontrado');
        }
        return course;
    }
    catch (error) {
        if (error instanceof Error && error.message === 'Curso no encontrado') {
            throw error;
        }
        throw errors_1.createError.internal('Error al obtener curso');
    }
}
async function createCourse(data) {
    // Validaciones básicas
    if (!data.nombre || data.nombre.trim().length === 0) {
        throw errors_1.createError.validation('El nombre del curso es requerido');
    }
    if (data.jefeId <= 0) {
        throw errors_1.createError.validation('ID de jefe de curso inválido');
    }
    try {
        return await courseRepository_1.courseRepository.create(data);
    }
    catch (error) {
        throw errors_1.createError.internal('Error al crear curso');
    }
}
async function updateCourse(id, data) {
    try {
        // Verificar que el curso existe
        await getCourseById(id);
        // Validaciones básicas
        if (data.nombre && data.nombre.trim().length === 0) {
            throw errors_1.createError.validation('El nombre del curso no puede estar vacío');
        }
        if (data.jefeId && data.jefeId <= 0) {
            throw errors_1.createError.validation('ID de jefe de curso inválido');
        }
        return await courseRepository_1.courseRepository.update(id, data);
    }
    catch (error) {
        if (error instanceof Error && error.message.includes('Curso no encontrado')) {
            throw error;
        }
        if (error instanceof Error && error.message.includes('El nombre del curso')) {
            throw error;
        }
        if (error instanceof Error && error.message.includes('ID de jefe de curso')) {
            throw error;
        }
        throw errors_1.createError.internal('Error al actualizar curso');
    }
}
async function deleteCourse(id) {
    try {
        // Verificar que el curso existe
        await getCourseById(id);
        return await courseRepository_1.courseRepository.delete(id);
    }
    catch (error) {
        if (error instanceof Error && error.message.includes('Curso no encontrado')) {
            throw error;
        }
        throw errors_1.createError.internal('Error al eliminar curso');
    }
}
async function addAsignaturaToCourse(cursoId, asignaturaId) {
    try {
        // Verificar que el curso existe
        await getCourseById(cursoId);
        return await courseRepository_1.courseRepository.addAsignatura(cursoId, asignaturaId);
    }
    catch (error) {
        if (error instanceof Error && error.message.includes('Curso no encontrado')) {
            throw error;
        }
        throw errors_1.createError.internal('Error al agregar asignatura al curso');
    }
}
async function removeAsignaturaFromCourse(cursoId, asignaturaId) {
    try {
        // Verificar que el curso existe
        await getCourseById(cursoId);
        return await courseRepository_1.courseRepository.removeAsignatura(cursoId, asignaturaId);
    }
    catch (error) {
        if (error instanceof Error && error.message.includes('Curso no encontrado')) {
            throw error;
        }
        throw errors_1.createError.internal('Error al remover asignatura del curso');
    }
}
async function getCoursesByProfesor(profesorId) {
    if (!profesorId || profesorId <= 0) {
        throw errors_1.createError.validation('ID de profesor inválido');
    }
    try {
        return await courseRepository_1.courseRepository.findByProfesor(profesorId);
    }
    catch (error) {
        throw errors_1.createError.internal('Error al obtener cursos por profesor');
    }
}
async function getCoursesByEstudiante(estudianteId) {
    if (!estudianteId || estudianteId <= 0) {
        throw errors_1.createError.validation('ID de estudiante inválido');
    }
    try {
        return await courseRepository_1.courseRepository.findByEstudiante(estudianteId);
    }
    catch (error) {
        throw errors_1.createError.internal('Error al obtener cursos por estudiante');
    }
}
