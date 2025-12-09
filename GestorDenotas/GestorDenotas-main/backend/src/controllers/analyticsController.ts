// backend/src/controllers/analyticsController.ts

import { Router, Request, Response, NextFunction } from 'express';
import { 
  analizarRendimientoEstudiante, 
  analizarEstadisticasCurso,
  calcularProbabilidadReprobacion,
  identificarFactoresRiesgo,
  generarRecomendaciones,
  obtenerTendenciasGenerales
} from '../services/analyticsService'; // <-- Este archivo ya no da error
// import { requireAuth, requirePermission } from '../middleware/auth'; // <-- Comentado (auth.ts también usa Prisma)
import { createError } from '../config/errors';

const router = Router();

// router.use(requireAuth); // <-- Comentado temporalmente

/**
 * GET /api/analytics/estudiante/:id
 * Análisis completo de un estudiante (RF3.1, RF3.3)
 */
router.get('/estudiante/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const estudianteId = Number(req.params.id);
    if (isNaN(estudianteId)) {
      return next(createError.validation('ID de estudiante inválido'));
    }

    const analisis = await analizarRendimientoEstudiante(estudianteId);
    
    res.json({
      success: true,
      data: { analisis }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/analytics/curso/:id/año/:año
 * Estadísticas de un curso (RF3.2)
 */
router.get('/curso/:id/año/:año', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const cursoId = Number(req.params.id);
    const año = Number(req.query.año) || new Date().getFullYear();
    
    if (isNaN(cursoId)) {
      return next(createError.validation('ID de curso inválido'));
    }

    const estadisticas = await analizarEstadisticasCurso(cursoId, Number(año));
    
    res.json({
      success: true,
      data: { estadisticas }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/analytics/prediccion/:id
 * Obtiene la predicción de riesgo de reprobación
 */
router.get('/prediccion/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const estudianteId = Number(req.params.id);
    
    if (isNaN(estudianteId)) {
      return next(createError.validation('ID de estudiante inválido'));
    }

    const analisis = await analizarRendimientoEstudiante(estudianteId);
    const recomendaciones = generarRecomendaciones(analisis);
    
    res.json({
      success: true,
      data: {
        prediccion: {
          riesgoReprobacion: analisis.riesgoReprobacion,
          probabilidadReprobacion: analisis.probabilidadReprobacion,
          factoresRiesgo: identificarFactoresRiesgo(analisis),
          recomendaciones,
          fechaPrediccion: new Date().toISOString()
        },
        analisis: analisis // Enviamos el análisis completo también
      }
    });
  } catch (error) {
    next(error);
  }
});


/**
 * GET /api/analytics/tendencias
 * Obtiene análisis de tendencias generales del sistema
 */
router.get('/tendencias', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const año = Number(req.query.año) || new Date().getFullYear();
    
    const tendencias = await obtenerTendenciasGenerales(año);
    
    res.json({
      success: true,
      data: { tendencias }
    });
  } catch (error) {
    next(error);
  }
});


// (Se eliminó la ruta /graficos/ ya que la información va en /estudiante/:id)

export default router;