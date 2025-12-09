"use strict";
// backend/src/controllers/observacionController.ts
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const observacionService_1 = require("../services/observacionService");
const router = (0, express_1.Router)();
// GET /api/observaciones
router.get("/", async (_req, res, next) => {
    try {
        const observaciones = await observacionService_1.observacionService.findAll();
        res.json({ success: true, data: { observaciones } });
    }
    catch (err) {
        next(err);
    }
});
// POST /api/observaciones
router.post("/", async (req, res, next) => {
    try {
        // CORREGIDO: Recibe 'estudiante_uuid'
        const { estudiante_uuid, profesorId, texto, estado } = req.body;
        const nueva = await observacionService_1.observacionService.create({
            estudiante_uuid, // Pasamos el UUID
            profesorId: Number(profesorId),
            texto,
            estado,
        });
        res.status(201).json({ success: true, data: { observacion: nueva } });
    }
    catch (err) {
        next(err);
    }
});
// GET /api/observaciones/estudiante/:estudianteUuid
// CORREGIDO: La ruta ahora espera el UUID
router.get("/estudiante/:estudianteUuid", async (req, res, next) => {
    try {
        const estudianteUuid = req.params.estudianteUuid; // Es un string
        const observaciones = await observacionService_1.observacionService.findByEstudiante(estudianteUuid); // Pasamos el string
        res.json({ success: true, data: { observaciones } });
    }
    catch (err) {
        next(err);
    }
});
// --- (Otras rutas se mantienen igual) ---
// GET /api/observaciones/:id
router.get("/:id", async (req, res, next) => {
    try {
        const id = Number(req.params.id);
        const observacion = await observacionService_1.observacionService.findById(id);
        res.json({ success: true, data: { observacion } });
    }
    catch (err) {
        next(err);
    }
});
// PUT /api/observaciones/:id
router.put("/:id", async (req, res, next) => {
    try {
        const id = Number(req.params.id);
        const { texto, estado } = req.body;
        const observacionActualizada = await observacionService_1.observacionService.update(id, {
            texto,
            estado,
        });
        res.json({ success: true, data: { observacion: observacionActualizada } });
    }
    catch (err) {
        next(err);
    }
});
// DELETE /api/observaciones/:id
router.delete("/:id", async (req, res, next) => {
    try {
        const id = Number(req.params.id);
        await observacionService_1.observacionService.delete(id);
        res.status(204).send();
    }
    catch (err) {
        next(err);
    }
});
// GET /api/observaciones/profesor/:profesorId
router.get("/profesor/:profesorId", async (req, res, next) => {
    try {
        const profesorId = Number(req.params.profesorId);
        const observaciones = await observacionService_1.observacionService.findByProfesor(profesorId);
        res.json({ success: true, data: { observaciones } });
    }
    catch (err) {
        next(err);
    }
});
exports.default = router;
