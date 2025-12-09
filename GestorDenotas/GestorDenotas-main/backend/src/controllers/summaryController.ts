/**
 * ========================================
 * CONTROLADOR DE RESUMEN Y ESTADÍSTICAS (Migrado a Supabase)
 * ========================================
 *
 * Maneja la generación de resúmenes y estadísticas generales
 * del sistema de gestión escolar para dashboards y reportes.
 */

import { Router, Request, Response, NextFunction } from "express";
import { supabase } from "../config/supabase"; // Importamos Supabase

const router = Router();

// GET /api/summary - Obtener resumen general del sistema
router.get("/", async (_req: Request, res: Response, next: NextFunction) => {
  try {
    
    // Obtener estadísticas generales (Conteo de filas)
    const [
      { count: totalEstudiantes },
      { count: totalProfesores },
      { count: totalCursos },
      { count: totalAsignaturas },
      { count: totalCalificaciones },
      { count: totalAsistencias },
      { count: totalObservaciones }
    ] = await Promise.all([
      supabase.from('Estudiante').select('*', { count: 'exact', head: true }),
      supabase.from('Profesor').select('*', { count: 'exact', head: true }),
      supabase.from('Curso').select('*', { count: 'exact', head: true }),
      supabase.from('Asignatura').select('*', { count: 'exact', head: true }),
      supabase.from('Calificacion').select('*', { count: 'exact', head: true }),
      supabase.from('Asistencia').select('*', { count: 'exact', head: true }),
      supabase.from('Observacion').select('*', { count: 'exact', head: true })
    ]);

    // Obtener promedio de calificaciones
    const { data: calificaciones, error: notasError } = await supabase
        .from('Calificacion')
        .select('valor');
    
    if (notasError) throw notasError;

    const promedioGeneral = (calificaciones && calificaciones.length > 0)
        ? calificaciones.reduce((sum: number, cal: {valor: number}) => sum + cal.valor, 0) / calificaciones.length 
        : 0;

    // Obtener estadísticas de asistencia
    const { data: asistencias, error: asisError } = await supabase
        .from('Asistencia')
        .select('estado');
    
    if (asisError) throw asisError;

    const totalAsistenciasCount = asistencias ? asistencias.length : 0;
    const asistenciasPresentes = asistencias ? asistencias.filter(a => a.estado === 'presente').length : 0;
    const asistenciasAusentes = asistencias ? asistencias.filter(a => a.estado === 'ausente').length : 0;
    const asistenciasTardes = asistencias ? asistencias.filter(a => a.estado === 'tarde').length : 0;

    const tasaAsistencia = totalAsistenciasCount > 0 
      ? ((asistenciasPresentes + asistenciasTardes) / totalAsistenciasCount) * 100 
      : 0;

    // Obtener top 5 asignaturas por promedio
    // En Supabase, esto se hace llamando a una Función PostgreSQL (RPC)
    // o trayendo los datos y procesándolos (más fácil por ahora)

    const { data: notasAgrupadas, error: groupError } = await supabase
        .from('Calificacion')
        .select('valor, Asignatura ( nombre )');
    
    if (groupError) throw groupError;

    const mapAsignaturas: { [key: string]: { suma: number, count: number } } = {};
    if (notasAgrupadas) {
        notasAgrupadas.forEach((n: any) => {
            const nombre = n.Asignatura?.nombre || 'Desconocida';
            if (!mapAsignaturas[nombre]) mapAsignaturas[nombre] = { suma: 0, count: 0 };
            mapAsignaturas[nombre].suma += n.valor;
            mapAsignaturas[nombre].count += 1;
        });
    }

    const formattedTopAsignaturas = Object.keys(mapAsignaturas)
        .map(nombre => ({
            nombre: nombre,
            promedio: (mapAsignaturas[nombre].suma / mapAsignaturas[nombre].count)
        }))
        .sort((a, b) => b.promedio - a.promedio) // Ordenar de mayor a menor
        .slice(0, 5); // Tomar los primeros 5

    // Respuesta que coincide con el frontend
    const summary = {
      totalEstudiantes,
      totalProfesores,
      totalCursos,
      totalAsignaturas,
      totalCalificaciones,
      totalAsistencias,
      totalObservaciones,
      promedioGeneral,
      tasaAsistencia,
      topAsignaturas: formattedTopAsignaturas
    };

    res.json(summary);
  } catch (err) {
    next(err);
  }
});

export default router;