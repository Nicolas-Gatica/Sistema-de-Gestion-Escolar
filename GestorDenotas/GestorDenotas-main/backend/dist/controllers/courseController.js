"use strict";
/**
 * ========================================
 * CONTROLADOR DE CURSOS
 * ========================================
 *
 * Este controlador maneja todas las operaciones CRUD relacionadas con los cursos
 * del sistema de gestión escolar.
 *
 * Funcionalidades principales:
 * - CRUD completo de cursos (Crear, Leer, Actualizar, Eliminar)
 * - Gestión del plan de estudio (asignaturas por curso)
 * - Asignación de jefe de curso
 * - Consulta de cursos por profesor o estudiante
 * - Gestión de estudiantes inscritos en cursos
 *
 * Endpoints disponibles:
 * - GET /api/courses - Listar todos los cursos
 * - GET /api/courses/:id - Obtener curso específico
 * - POST /api/courses - Crear nuevo curso
 * - PUT /api/courses/:id - Actualizar curso
 * - DELETE /api/courses/:id - Eliminar curso
 * - POST /api/courses/:id/asignaturas - Agregar asignatura al curso
 * - DELETE /api/courses/:id/asignaturas/:asignaturaId - Quitar asignatura del curso
 * - GET /api/courses/profesor/:profesorId - Cursos por profesor
 * - GET /api/courses/estudiante/:estudianteId - Cursos por estudiante
 */
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const courseService_1 = require("../services/courseService");
const router = (0, express_1.Router)();
// GET /api/courses - Obtener todos los cursos
router.get("/", async (_req, res, next) => {
    try {
        const courses = await (0, courseService_1.getAllCourses)();
        res.json({
            success: true,
            data: { courses }
        });
    }
    catch (err) {
        next(err);
    }
});
// GET /api/courses/:id - Obtener curso por ID
router.get("/:id", async (req, res, next) => {
    try {
        const id = Number(req.params.id);
        const course = await (0, courseService_1.getCourseById)(id);
        res.json({
            success: true,
            data: { course }
        });
    }
    catch (err) {
        next(err);
    }
});
// POST /api/courses - Crear nuevo curso
router.post("/", async (req, res, next) => {
    try {
        const { nombre, jefeId } = req.body;
        const nuevoCurso = await (0, courseService_1.createCourse)({
            nombre,
            jefeId: Number(jefeId),
        });
        res.status(201).json({
            success: true,
            data: { course: nuevoCurso }
        });
    }
    catch (err) {
        next(err);
    }
});
// PUT /api/courses/:id - Actualizar curso
router.put("/:id", async (req, res, next) => {
    try {
        const id = Number(req.params.id);
        const { nombre, jefeId } = req.body;
        const courseActualizado = await (0, courseService_1.updateCourse)(id, {
            nombre,
            jefeId: jefeId ? Number(jefeId) : undefined,
        });
        res.json({
            success: true,
            data: { course: courseActualizado }
        });
    }
    catch (err) {
        next(err);
    }
});
// DELETE /api/courses/:id - Eliminar curso
router.delete("/:id", async (req, res, next) => {
    try {
        const id = Number(req.params.id);
        await (0, courseService_1.deleteCourse)(id);
        res.status(204).send();
    }
    catch (err) {
        next(err);
    }
});
// POST /api/courses/:id/asignaturas - Agregar asignatura a curso
router.post("/:id/asignaturas", async (req, res, next) => {
    try {
        const courseId = Number(req.params.id);
        const { asignaturaId } = req.body;
        await (0, courseService_1.addAsignaturaToCourse)(courseId, asignaturaId);
        res.status(201).json({
            success: true,
            data: { message: "Asignatura agregada al curso" }
        });
    }
    catch (err) {
        next(err);
    }
});
// DELETE /api/courses/:id/asignaturas/:asignaturaId - Remover asignatura de curso
router.delete("/:id/asignaturas/:asignaturaId", async (req, res, next) => {
    try {
        const courseId = Number(req.params.id);
        const asignaturaId = Number(req.params.asignaturaId);
        await (0, courseService_1.removeAsignaturaFromCourse)(courseId, asignaturaId);
        res.status(204).send();
    }
    catch (err) {
        next(err);
    }
});
// GET /api/courses/profesor/:profesorId - Obtener cursos por profesor
router.get("/profesor/:profesorId", async (req, res, next) => {
    try {
        const profesorId = Number(req.params.profesorId);
        const courses = await (0, courseService_1.getCoursesByProfesor)(profesorId);
        res.json({
            success: true,
            data: { courses }
        });
    }
    catch (err) {
        next(err);
    }
});
// GET /api/courses/estudiante/:estudianteId - Obtener cursos por estudiante
router.get("/estudiante/:estudianteId", async (req, res, next) => {
    try {
        const estudianteId = Number(req.params.estudianteId);
        const courses = await (0, courseService_1.getCoursesByEstudiante)(estudianteId);
        res.json({
            success: true,
            data: { courses }
        });
    }
    catch (err) {
        next(err);
    }
});
exports.default = router;
