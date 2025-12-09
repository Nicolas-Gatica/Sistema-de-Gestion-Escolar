/**
 * ========================================
 * SERVICIO DE ANÁLISIS (MIGRADO A SUPABASE)
 * ========================================
 */

import { supabase } from '../config/supabase'; // Usamos el nuevo cliente Supabase
import { createError } from '../config/errors';

// --- DEFINICIÓN DE TIPOS (Para eliminar errores 'any') ---
interface Calificacion { 
    valor: number; 
    fecha: string; 
    asignaturaId: number; 
    Asignatura?: { nombre: string }; // Relación opcional
}
interface Asistencia { estado: string; }
interface Observacion { estado: string; }

/**
 * Lógica de cálculo de riesgo (La misma que usa el frontend)
 * (RF3.3)
 */
const calcularRiesgo = (
    promedio: number, 
    asistenciaPct: number, 
    positivas: number, 
    negativas: number
) => {
    const notaPct = Math.max(0, Math.min(100, (promedio / 7.0) * 100));
    
    const totalObs = positivas + negativas;
    const comportamientoPct = totalObs === 0 ? 100 : (positivas / totalObs) * 100;
    
    const pesos = { nota: 0.5, asistencia: 0.3, comportamiento: 0.2 };
    const puntajeExito = (notaPct * pesos.nota) + (asistenciaPct * pesos.asistencia) + (comportamientoPct * pesos.comportamiento);

    let probReprobar = 100.0 - puntajeExito;

    // Penalizaciones (lógica del frontend)
    if (promedio < 4.0) probReprobar += 25;
    if (asistenciaPct < 85) probReprobar += 15;
    probReprobar = Math.max(0, Math.min(100, probReprobar));

    let estadoRiesgo: string;
    if (probReprobar > 70) estadoRiesgo = "alto";
    else if (probReprobar > 40) estadoRiesgo = "medio";
    else estadoRiesgo = "bajo";

    return {
        probabilidadReprobacion: probReprobar.toFixed(1),
        estadoRiesgo: estadoRiesgo,
    };
};

/**
 * Analiza el rendimiento completo de UN estudiante (RF3.1, RF3.3)
 */
export const analizarRendimientoEstudiante = async (estudianteId: number) => {
    
    // 1. Obtener el UUID del estudiante desde su ID numérico
    const { data: estData, error: estError } = await supabase
        .from('Estudiante')
        .select('user_uuid, nombre, apellido, Curso(nombre)')
        .eq('id', estudianteId)
        .single();

    if (estError || !estData) throw createError.notFound('Estudiante no encontrado');
    const userUuid = estData.user_uuid;

    // 2. Obtener todos los datos del estudiante en paralelo
    const [notasRes, asisRes, obsRes] = await Promise.all([
        supabase.from('Calificacion').select<any, Calificacion>('valor, fecha, asignaturaId, Asignatura(nombre)').eq('estudiante_uuid', userUuid),
        supabase.from('Asistencia').select<any, Asistencia>('estado').eq('estudiante_uuid', userUuid),
        supabase.from('Observacion').select<any, Observacion>('estado').eq('estudiante_uuid', userUuid)
    ]);

    if (notasRes.error || asisRes.error || obsRes.error) {
        throw createError.internal("Error al consultar datos del estudiante");
    }

    const calificaciones: Calificacion[] = notasRes.data || [];
    const asistencias: Asistencia[] = asisRes.data || [];
    const observaciones: Observacion[] = obsRes.data || [];

    // 3. Procesar Calificaciones
    let sumaTotal = 0;
    const asignaturasMap: { [key: string]: { suma: number, count: number, id: number } } = {};

    calificaciones.forEach((cal: Calificacion) => {
        const nombreAsig = (cal as any).Asignatura?.nombre || 'Desconocida';
        if (!asignaturasMap[nombreAsig]) {
            asignaturasMap[nombreAsig] = { suma: 0, count: 0, id: cal.asignaturaId };
        }
        asignaturasMap[nombreAsig].suma += cal.valor;
        asignaturasMap[nombreAsig].count += 1;
        sumaTotal += cal.valor;
    });

    const promedioGeneral = calificaciones.length > 0 ? (sumaTotal / calificaciones.length) : 0;
    
    const calificacionesPorAsignatura = Object.keys(asignaturasMap).map(key => ({
        nombreAsignatura: key,
        promedio: (asignaturasMap[key].suma / asignaturasMap[key].count).toFixed(1),
        count: asignaturasMap[key].count
    }));

    const asignaturasAprobadas = calificacionesPorAsignatura.filter(a => parseFloat(a.promedio) >= 4.0).length;
    const asignaturasReprobadas = calificacionesPorAsignatura.filter(a => parseFloat(a.promedio) < 4.0).length;
    const tasaAprobacion = (asignaturasAprobadas / (asignaturasAprobadas + asignaturasReprobadas)) * 100;

    // 4. Procesar Asistencia
    const totalDias = asistencias.length;
    const diasPresente = asistencias.filter((a: Asistencia) => a.estado === 'presente').length;
    const asistenciaPct = totalDias > 0 ? (diasPresente / totalDias) * 100 : 100;

    // 5. Procesar Conducta
    const positivas = observaciones.filter((o: Observacion) => o.estado === 'positiva').length;
    const negativas = observaciones.filter((o: Observacion) => o.estado === 'negativa').length;

    // 6. Calcular Riesgo
    const riesgo = calcularRiesgo(promedioGeneral, asistenciaPct, positivas, negativas);

    // 7. Procesar historial mensual (RF3.1)
    const notasPorMes: { [key: string]: { suma: number, count: number, mes: string, año: number } } = {};
    calificaciones.forEach((cal: Calificacion) => {
          const fecha = new Date(cal.fecha);
          const mes = fecha.toLocaleString('es-CL', { month: 'long' });
          const año = fecha.getFullYear();
          const mesKey = `${año}-${fecha.getMonth()}`; // Clave para ordenar

          if (!notasPorMes[mesKey]) {
              notasPorMes[mesKey] = { suma: 0, count: 0, mes: mes, año: año };
          }
          notasPorMes[mesKey].suma += cal.valor;
          notasPorMes[mesKey].count += 1;
    });

    const historialMensual = Object.keys(notasPorMes).map(key => ({
          ...notasPorMes[key],
          promedio: (notasPorMes[key].suma / notasPorMes[key].count).toFixed(1)
    }));
    
    // (Faltaría lógica de tendencia, la dejamos 'estable' por ahora)
    const tendencia = 'estable';
    
    // CORRECCIÓN: Acceso seguro a la relación de Curso
    const cursoData: any = estData.Curso; 
    const nombreCurso = cursoData?.nombre || 'Sin curso';

    return {
        estudianteId: estudianteId,
        nombre: estData.nombre,
        apellido: estData.apellido,
        curso: nombreCurso,
        promedioGeneral: promedioGeneral.toFixed(1),
        asistenciaPct: asistenciaPct.toFixed(0),
        anotacionesPositivas: positivas,
        anotacionesNegativas: negativas,
        calificacionesPorAsignatura,
        riesgoReprobacion: riesgo.estadoRiesgo,
        probabilidadReprobacion: riesgo.probabilidadReprobacion,
        historialMensual,
        tasaAprobacion: isNaN(tasaAprobacion) ? 100 : tasaAprobacion,
        asignaturasAprobadas,
        asignaturasReprobadas,
        tendencia
    };
};

/**
 * Analiza las estadísticas de UN curso (RF3.2)
 */
export const analizarEstadisticasCurso = async (cursoId: number, año: number) => {
    
    const { data: estudiantes, error: estError } = await supabase
        .from('Estudiante')
        .select('user_uuid')
        .eq('cursoId', cursoId);
    
    if (estError) throw estError;
    if (!estudiantes || estudiantes.length === 0) {
        return { message: "Curso sin estudiantes" }; // Curso vacío
    }

    const uuids = estudiantes.map((est: { user_uuid: string }) => est.user_uuid);

    const [notasRes, asisRes] = await Promise.all([
        supabase.from('Calificacion').select<any, Calificacion>('valor, fecha, Asignatura(nombre)').in('estudiante_uuid', uuids),
        supabase.from('Asistencia').select<any, Asistencia>('estado').in('estudiante_uuid', uuids)
    ]);

    const calificaciones: Calificacion[] = notasRes.data || [];
    const asistencias: Asistencia[] = asisRes.data || [];
    
    const promedioGeneral = calificaciones.length > 0
        ? calificaciones.reduce((sum: number, cal: Calificacion) => sum + cal.valor, 0) / calificaciones.length
        : 0;
    
    const totalDias = asistencias.length;
    const diasPresente = asistencias.filter((a: Asistencia) => a.estado === 'presente').length;
    const tasaAsistencia = totalDias > 0 ? (diasPresente / totalDias) * 100 : 100;
    
    return {
        cursoId: cursoId,
        año: año,
        nombreCurso: "Datos de Prueba (Migrado)",
        promedioGeneral: promedioGeneral.toFixed(1),
        tasaAprobacion: 0,
        tasaAsistencia: tasaAsistencia.toFixed(0),
        estudiantesEnRiesgo: 0,
        totalEstudiantes: estudiantes.length,
        topAsignaturas: [],
        distribucionCalificaciones: {},
        tendenciaAnual: []
    };
    
};


/**
 * (Otras funciones que estaban en tu controlador)
 * --- CORRECCIÓN: AÑADIR 'EXPORT' ---
 */
export const calcularProbabilidadReprobacion = (analisis: any): number => {
    return parseFloat(analisis.probabilidadReprobacion);
};

export const identificarFactoresRiesgo = (analisis: any): string[] => {
    const factores: string[] = [];
    if (analisis.promedioGeneral < 4.5) factores.push('Promedio general bajo');
    if (analisis.asistenciaPct < 85) factores.push('Baja asistencia');
    if (analisis.anotacionesNegativas > analisis.anotacionesPositivas) factores.push('Conducta negativa');
    return factores;
};

export const generarRecomendaciones = (analisis: any): string[] => {
    const recomendaciones: string[] = [];
    if (analisis.riesgoReprobacion === 'alto') {
        recomendaciones.push('Acción: Programar reunión con apoderados.');
    } else if (analisis.riesgoReprobacion === 'medio') {
        recomendaciones.push('Recomendación: Monitorear de cerca.');
    }
    return recomendaciones;
};

export const obtenerTendenciasGenerales = async (año: number): Promise<any> => {
    console.log(`Obteniendo tendencias para ${año}`);
    return {
        promedioGeneralSistema: 5.2,
        tasaAprobacionGeneral: 78.5,
    };
};