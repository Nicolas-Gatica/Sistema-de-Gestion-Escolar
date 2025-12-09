"use strict";
// backend/src/controllers/gradeController.ts
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const gradeService_1 = require("../services/gradeService");
const router = (0, express_1.Router)();
// POST /api/grades
router.post("/", async (req, res, next) => {
    try {
        // CORREGIDO: Recibe 'estudiante_uuid' y ya no 'profesorId'
        const { estudiante_uuid, asignaturaId, valor } = req.body;
        const nuevaNota = await (0, gradeService_1.addGrade)(estudiante_uuid, // String (UUID)
        Number(asignaturaId), Number(valor)
        // Se eliminó profesorId
        );
        res.status(201).json({ success: true, data: { calificacion: nuevaNota } });
    }
    catch (err) {
        next(err);
    }
});
// GET /api/grades/estudiante/:estudianteUuid
// CORREGIDO: La ruta ahora espera el UUID
router.get("/estudiante/:estudianteUuid", async (req, res, next) => {
    try {
        const estudianteUuid = req.params.estudianteUuid; // Es un string
        const notas = await (0, gradeService_1.getGrades)(estudianteUuid); // Pasamos el string
        res.json({ success: true, data: { calificaciones: notas } });
    }
    catch (err) {
        next(err);
    }
});
// PUT /api/grades/:id
router.put("/:id", async (req, res, next) => {
    try {
        const id = Number(req.params.id);
        const { valor, asignaturaId } = req.body; // CORREGIDO: Se quitó profesorId
        const calificacionActualizada = await (0, gradeService_1.updateGrade)(id, {
            valor: valor ? Number(valor) : undefined,
            asignaturaId: asignaturaId ? Number(asignaturaId) : undefined,
            // profesorId eliminado
        });
        res.json({ success: true, data: { calificacion: calificacionActualizada } });
    }
    catch (err) {
        next(err);
    }
});
// --- (Otras rutas GET y DELETE se mantienen) ---
router.get("/", async (_req, res, next) => {
    try {
        const calificaciones = await (0, gradeService_1.getEstadisticasCalificaciones)();
        res.json({ success: true, data: { estadisticas: calificaciones } });
    }
    catch (err) {
        next(err);
    }
});
router.get("/all", async (_req, res, next) => {
    try {
        const calificaciones = await (0, gradeService_1.getAllGrades)();
        res.json({ success: true, data: { calificaciones } });
    }
    catch (err) {
        next(err);
    }
});
router.get("/asignatura/:asignaturaId", async (req, res, next) => {
    try {
        const asignaturaId = Number(req.params.asignaturaId);
        const notas = await (0, gradeService_1.getGradesByAsignatura)(asignaturaId);
        res.json({ success: true, data: { calificaciones: notas } });
    }
    catch (err) {
        next(err);
    }
});
router.get("/profesor/:profesorId", async (req, res, next) => {
    try {
        const profesorId = Number(req.params.profesorId);
        const notas = await (0, gradeService_1.getGradesByProfesor)(profesorId);
        res.json({ success: true, data: { calificaciones: notas } });
    }
    catch (err) {
        next(err);
    }
});
router.get("/id/:id", async (req, res, next) => {
    try {
        const id = Number(req.params.id);
        const calificacion = await (0, gradeService_1.getGradeById)(id);
        res.json({ success: true, data: { calificacion } });
    }
    catch (err) {
        next(err);
    }
});
router.delete("/:id", async (req, res, next) => {
    try {
        const id = Number(req.params.id);
        await (0, gradeService_1.deleteGrade)(id);
        res.status(204).send();
    }
    catch (err) {
        next(err);
    }
});
exports.default = router;
