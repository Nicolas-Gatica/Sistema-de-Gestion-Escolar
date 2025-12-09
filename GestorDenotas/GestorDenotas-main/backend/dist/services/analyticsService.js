"use strict";
/**
 * ========================================
 * SERVICIO DE ANÁLISIS (MIGRADO A SUPABASE)
 * ========================================
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.obtenerTendenciasGenerales = exports.generarRecomendaciones = exports.identificarFactoresRiesgo = exports.calcularProbabilidadReprobacion = exports.analizarEstadisticasCurso = exports.analizarRendimientoEstudiante = void 0;
const supabase_1 = require("../config/supabase"); // Usamos el nuevo cliente Supabase
const errors_1 = require("../config/errors");
/**
 * Lógica de cálculo de riesgo (La misma que usa el frontend)
 * (RF3.3)
 */
const calcularRiesgo = (promedio, asistenciaPct, positivas, negativas) => {
    const notaPct = Math.max(0, Math.min(100, (promedio / 7.0) * 100));
    const totalObs = positivas + negativas;
    const comportamientoPct = totalObs === 0 ? 100 : (positivas / totalObs) * 100;
    const pesos = { nota: 0.5, asistencia: 0.3, comportamiento: 0.2 };
    const puntajeExito = (notaPct * pesos.nota) + (asistenciaPct * pesos.asistencia) + (comportamientoPct * pesos.comportamiento);
    let probReprobar = 100.0 - puntajeExito;
    // Penalizaciones (lógica del frontend)
    if (promedio < 4.0)
        probReprobar += 25;
    if (asistenciaPct < 85)
        probReprobar += 15;
    probReprobar = Math.max(0, Math.min(100, probReprobar));
    let estadoRiesgo;
    if (probReprobar > 70)
        estadoRiesgo = "alto";
    else if (probReprobar > 40)
        estadoRiesgo = "medio";
    else
        estadoRiesgo = "bajo";
    return {
        probabilidadReprobacion: probReprobar.toFixed(1),
        estadoRiesgo: estadoRiesgo,
    };
};
/**
 * Analiza el rendimiento completo de UN estudiante (RF3.1, RF3.3)
 */
const analizarRendimientoEstudiante = async (estudianteId) => {
    // 1. Obtener el UUID del estudiante desde su ID numérico
    const { data: estData, error: estError } = await supabase_1.supabase
        .from('Estudiante')
        .select('user_uuid, nombre, apellido, Curso(nombre)')
        .eq('id', estudianteId)
        .single();
    if (estError || !estData)
        throw errors_1.createError.notFound('Estudiante no encontrado');
    const userUuid = estData.user_uuid;
    // 2. Obtener todos los datos del estudiante en paralelo
    const [notasRes, asisRes, obsRes] = await Promise.all([
        supabase_1.supabase.from('Calificacion').select('valor, fecha, asignaturaId, Asignatura(nombre)').eq('estudiante_uuid', userUuid),
        supabase_1.supabase.from('Asistencia').select('estado').eq('estudiante_uuid', userUuid),
        supabase_1.supabase.from('Observacion').select('estado').eq('estudiante_uuid', userUuid)
    ]);
    if (notasRes.error || asisRes.error || obsRes.error) {
        throw errors_1.createError.internal("Error al consultar datos del estudiante");
    }
    const calificaciones = notasRes.data || [];
    const asistencias = asisRes.data || [];
    const observaciones = obsRes.data || [];
    // 3. Procesar Calificaciones
    let sumaTotal = 0;
    const asignaturasMap = {};
    calificaciones.forEach((cal) => {
        const nombreAsig = cal.Asignatura?.nombre || 'Desconocida';
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
    const diasPresente = asistencias.filter((a) => a.estado === 'presente').length;
    const asistenciaPct = totalDias > 0 ? (diasPresente / totalDias) * 100 : 100;
    // 5. Procesar Conducta
    const positivas = observaciones.filter((o) => o.estado === 'positiva').length;
    const negativas = observaciones.filter((o) => o.estado === 'negativa').length;
    // 6. Calcular Riesgo
    const riesgo = calcularRiesgo(promedioGeneral, asistenciaPct, positivas, negativas);
    // 7. Procesar historial mensual (RF3.1)
    const notasPorMes = {};
    calificaciones.forEach((cal) => {
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
    const cursoData = estData.Curso;
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
exports.analizarRendimientoEstudiante = analizarRendimientoEstudiante;
/**
 * Analiza las estadísticas de UN curso (RF3.2)
 */
const analizarEstadisticasCurso = async (cursoId, año) => {
    const { data: estudiantes, error: estError } = await supabase_1.supabase
        .from('Estudiante')
        .select('user_uuid')
        .eq('cursoId', cursoId);
    if (estError)
        throw estError;
    if (!estudiantes || estudiantes.length === 0) {
        return { message: "Curso sin estudiantes" }; // Curso vacío
    }
    const uuids = estudiantes.map((est) => est.user_uuid);
    const [notasRes, asisRes] = await Promise.all([
        supabase_1.supabase.from('Calificacion').select('valor, fecha, Asignatura(nombre)').in('estudiante_uuid', uuids),
        supabase_1.supabase.from('Asistencia').select('estado').in('estudiante_uuid', uuids)
    ]);
    const calificaciones = notasRes.data || [];
    const asistencias = asisRes.data || [];
    const promedioGeneral = calificaciones.length > 0
        ? calificaciones.reduce((sum, cal) => sum + cal.valor, 0) / calificaciones.length
        : 0;
    const totalDias = asistencias.length;
    const diasPresente = asistencias.filter((a) => a.estado === 'presente').length;
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
exports.analizarEstadisticasCurso = analizarEstadisticasCurso;
/**
 * (Otras funciones que estaban en tu controlador)
 * --- CORRECCIÓN: AÑADIR 'EXPORT' ---
 */
const calcularProbabilidadReprobacion = (analisis) => {
    return parseFloat(analisis.probabilidadReprobacion);
};
exports.calcularProbabilidadReprobacion = calcularProbabilidadReprobacion;
const identificarFactoresRiesgo = (analisis) => {
    const factores = [];
    if (analisis.promedioGeneral < 4.5)
        factores.push('Promedio general bajo');
    if (analisis.asistenciaPct < 85)
        factores.push('Baja asistencia');
    if (analisis.anotacionesNegativas > analisis.anotacionesPositivas)
        factores.push('Conducta negativa');
    return factores;
};
exports.identificarFactoresRiesgo = identificarFactoresRiesgo;
const generarRecomendaciones = (analisis) => {
    const recomendaciones = [];
    if (analisis.riesgoReprobacion === 'alto') {
        recomendaciones.push('Acción: Programar reunión con apoderados.');
    }
    else if (analisis.riesgoReprobacion === 'medio') {
        recomendaciones.push('Recomendación: Monitorear de cerca.');
    }
    return recomendaciones;
};
exports.generarRecomendaciones = generarRecomendaciones;
const obtenerTendenciasGenerales = async (año) => {
    console.log(`Obteniendo tendencias para ${año}`);
    return {
        promedioGeneralSistema: 5.2,
        tasaAprobacionGeneral: 78.5,
    };
};
exports.obtenerTendenciasGenerales = obtenerTendenciasGenerales;
