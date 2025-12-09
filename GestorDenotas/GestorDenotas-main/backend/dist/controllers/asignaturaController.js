"use strict";
// backend/src/controllers/asignaturaController.ts
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const asignaturaService_1 = require("../services/asignaturaService");
const router = (0, express_1.Router)();
// GET /api/asignaturas
router.get("/", async (_req, res, next) => {
    try {
        const asignaturas = await (0, asignaturaService_1.getAllAsignaturas)();
        res.json({
            success: true,
            data: { asignaturas }
        });
    }
    catch (err) {
        next(err);
    }
});
// GET /api/asignaturas/:id
router.get("/:id", async (req, res, next) => {
    try {
        const id = Number(req.params.id);
        const asignatura = await (0, asignaturaService_1.getAsignaturaById)(id);
        res.json({
            success: true,
            data: { asignatura }
        });
    }
    catch (err) {
        next(err);
    }
});
// POST /api/asignaturas
router.post("/", async (req, res, next) => {
    try {
        const { nombre } = req.body;
        const nueva = await (0, asignaturaService_1.createAsignatura)({ nombre });
        res.status(201).json({
            success: true,
            data: { asignatura: nueva }
        });
    }
    catch (err) {
        next(err);
    }
});
// PUT /api/asignaturas/:id
router.put("/:id", async (req, res, next) => {
    try {
        const id = Number(req.params.id);
        const { nombre } = req.body;
        const actualizada = await (0, asignaturaService_1.updateAsignatura)(id, { nombre });
        res.json({
            success: true,
            data: { asignatura: actualizada }
        });
    }
    catch (err) {
        next(err);
    }
});
// DELETE /api/asignaturas/:id
router.delete("/:id", async (req, res, next) => {
    try {
        const id = Number(req.params.id);
        await (0, asignaturaService_1.deleteAsignatura)(id);
        res.status(204).send();
    }
    catch (err) {
        next(err);
    }
});
// --- RUTAS OBSOLETAS ELIMINADAS ---
// (Se eliminaron las rutas POST y DELETE para /:id/profesores)
exports.default = router;
