/**
 * ========================================
 * CONTROLADOR DE HEALTH CHECKS (Migrado a Supabase)
 * ========================================
 */

import { Router, Request, Response, NextFunction } from 'express';
import { supabase } from '../config/supabase'; // Importamos Supabase (ya no Prisma)
import { 
  getSystemMetrics, 
  getMetricsHistory, 
  calculateAvailability, 
  isSystemHealthy 
} from '../middleware/monitoring'; // Asumiendo que monitoring.ts también será migrado

const router = Router();

/**
 * GET /api/health/basic
 * Health check básico (para load balancers)
 * Ahora verifica la conexión con Supabase
 */
router.get('/basic', async (_req: Request, res: Response) => {
  try {
    // Verificación rápida de Supabase: Contar 1 fila de la tabla más pequeña (Asignatura)
    const { error } = await supabase.from('Asignatura').select('id', { count: 'exact', head: true }).limit(1);
    
    if (error) throw error;
    
    res.status(200).json({ 
      success: true,
      data: {
        status: 'OK',
        database: 'Supabase Connected',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
      }
    });
  } catch (error) {
    res.status(503).json({ 
      status: 'ERROR',
      timestamp: new Date().toISOString(),
      error: 'Supabase connection failed'
    });
  }
});

/**
 * GET /api/health/database
 * Estado de la base de datos (Supabase)
 */
router.get('/database', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const startTime = Date.now();
    
    // Verificar conexión (igual que en /basic)
    const { error: queryError } = await supabase.from('Asignatura').select('id', { count: 'exact', head: true }).limit(1);
    if (queryError) throw queryError;
    
    const responseTime = Date.now() - startTime;
    
    // Obtener estadísticas de la base de datos (Contar filas)
    const [estudiantes, profesores, cursos, calificaciones] = await Promise.all([
      supabase.from('Estudiante').select('id', { count: 'exact', head: true }),
      supabase.from('Profesor').select('id', { count: 'exact', head: true }),
      supabase.from('Curso').select('id', { count: 'exact', head: true }),
      supabase.from('Calificacion').select('id', { count: 'exact', head: true })
    ]);
    
    res.json({
      status: 'CONNECTED',
      responseTime: `${responseTime}ms`,
      timestamp: new Date().toISOString(),
      statistics: {
        estudiantes: estudiantes.count ?? 0,
        profesores: profesores.count ?? 0,
        cursos: cursos.count ?? 0,
        calificaciones: calificaciones.count ?? 0
      },
      performance: {
        excellent: responseTime < 150, // Supabase es más lento que SQLite local
        good: responseTime < 500,
        acceptable: responseTime < 1000,
        slow: responseTime >= 1000
      }
    });
  } catch (error: any) {
    res.status(503).json({
      status: 'DISCONNECTED',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

// --- OTRAS RUTAS (Dependen de 'monitoring.ts') ---
// Dejamos estas rutas comentadas por ahora, ya que 'monitoring.ts'
// también importa Prisma y fallará en la compilación.
// Debemos arreglar 'monitoring.ts' primero para habilitarlas.

/*
router.get('/detailed', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const metrics = await getSystemMetrics();
    // ... (resto de tu lógica que usa 'monitoring')
  } catch (error) {
    next(error);
  }
});

router.get('/metrics', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const metrics = await getSystemMetrics();
    // ... (resto de tu lógica)
  } catch (error) {
    next(error);
  }
});
*/

export default router;