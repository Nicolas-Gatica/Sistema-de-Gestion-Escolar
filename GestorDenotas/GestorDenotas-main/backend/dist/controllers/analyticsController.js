"use strict";
// backend/src/controllers/analyticsController.ts
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const analyticsService_1 = require("../services/analyticsService"); // <-- Este archivo ya no da error
// import { requireAuth, requirePermission } from '../middleware/auth'; // <-- Comentado (auth.ts también usa Prisma)
const errors_1 = require("../config/errors");
const router = (0, express_1.Router)();
// router.use(requireAuth); // <-- Comentado temporalmente
/**
 * GET /api/analytics/estudiante/:id
 * Análisis completo de un estudiante (RF3.1, RF3.3)
 */
router.get('/estudiante/:id', async (req, res, next) => {
    try {
        const estudianteId = Number(req.params.id);
        if (isNaN(estudianteId)) {
            return next(errors_1.createError.validation('ID de estudiante inválido'));
        }
        const analisis = await (0, analyticsService_1.analizarRendimientoEstudiante)(estudianteId);
        res.json({
            success: true,
            data: { analisis }
        });
    }
    catch (error) {
        next(error);
    }
});
/**
 * GET /api/analytics/curso/:id/año/:año
 * Estadísticas de un curso (RF3.2)
 */
router.get('/curso/:id/año/:año', async (req, res, next) => {
    try {
        const cursoId = Number(req.params.id);
        const año = Number(req.query.año) || new Date().getFullYear();
        if (isNaN(cursoId)) {
            return next(errors_1.createError.validation('ID de curso inválido'));
        }
        const estadisticas = await (0, analyticsService_1.analizarEstadisticasCurso)(cursoId, Number(año));
        res.json({
            success: true,
            data: { estadisticas }
        });
    }
    catch (error) {
        next(error);
    }
});
/**
 * GET /api/analytics/prediccion/:id
 * Obtiene la predicción de riesgo de reprobación
 */
router.get('/prediccion/:id', async (req, res, next) => {
    try {
        const estudianteId = Number(req.params.id);
        if (isNaN(estudianteId)) {
            return next(errors_1.createError.validation('ID de estudiante inválido'));
        }
        const analisis = await (0, analyticsService_1.analizarRendimientoEstudiante)(estudianteId);
        const recomendaciones = (0, analyticsService_1.generarRecomendaciones)(analisis);
        res.json({
            success: true,
            data: {
                prediccion: {
                    riesgoReprobacion: analisis.riesgoReprobacion,
                    probabilidadReprobacion: analisis.probabilidadReprobacion,
                    factoresRiesgo: (0, analyticsService_1.identificarFactoresRiesgo)(analisis),
                    recomendaciones,
                    fechaPrediccion: new Date().toISOString()
                },
                analisis: analisis // Enviamos el análisis completo también
            }
        });
    }
    catch (error) {
        next(error);
    }
});
/**
 * GET /api/analytics/tendencias
 * Obtiene análisis de tendencias generales del sistema
 */
router.get('/tendencias', async (req, res, next) => {
    try {
        const año = Number(req.query.año) || new Date().getFullYear();
        const tendencias = await (0, analyticsService_1.obtenerTendenciasGenerales)(año);
        res.json({
            success: true,
            data: { tendencias }
        });
    }
    catch (error) {
        next(error);
    }
});
// (Se eliminó la ruta /graficos/ ya que la información va en /estudiante/:id)
exports.default = router;
