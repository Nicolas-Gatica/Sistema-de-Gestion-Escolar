// services/analyticsPredictionService.js

/**
 * @name promedioAPorcentaje
 * @description Convierte un promedio (en la escala chilena 1.0-7.0) a porcentaje (0-100).
 * @param {number} promedio - Promedio del alumno (ej: 5.2).
 * @param {number} [maxNota=7.0] - Nota máxima posible.
 * @returns {number} Porcentaje de la nota.
 */
const promedioAPorcentaje = (promedio, maxNota = 7.0) => {
    if (maxNota <= 0) {
        // En un entorno de servidor, lanzamos un error que debe ser capturado
        throw new Error("La nota máxima debe ser mayor que 0.");
    }
    
    // Convertir el promedio a porcentaje
    const porcentaje = (promedio / maxNota) * 100;
    
    // Asegurar que el valor esté entre 0 y 100
    return Math.min(100.0, Math.max(0.0, porcentaje));
};


/**
 * @name calcularComportamiento
 * @description Calcula el porcentaje de "buen" comportamiento basado en anotaciones.
 * @param {number} positivas - Cantidad de anotaciones positivas.
 * @param {number} negativas - Cantidad de anotaciones negativas.
 * @returns {number} Porcentaje de comportamiento (0-100).
 */
const calcularComportamiento = (positivas, negativas) => {
    const total = positivas + negativas;
    
    // Si no hay anotaciones, se asume un 100% de buen comportamiento
    if (total === 0) {
        return 100.0;
    }
    
    // Cálculo: (Positivas / Total) * 100
    const comportamiento = (positivas / total) * 100;
    
    return parseFloat(comportamiento.toFixed(2));
};

/**
 * @name determinarRiesgoCualitativo
 * @description Asigna un estado de riesgo cualitativo basado en la probabilidad de reprobación.
 * @param {number} probReprobar - Probabilidad calculada (0-100).
 * @returns {{riesgo: string, emoji: string}} Objeto con el estado y un emoji.
 */
const determinarRiesgoCualitativo = (probReprobar) => {
    if (probReprobar > 70) {
        return { riesgo: "alto", emoji: "😟" };
    }
    if (probReprobar > 40) {
        return { riesgo: "medio", emoji: "⚠️" };
    }
    return { riesgo: "bajo", emoji: "😊" };
};


/**
 * @name evaluarRendimiento
 * @description Implementa el algoritmo de riesgo ponderado (RF3.3).
 * @param {{promedio: number, asistencia: number, positivas: number, negativas: number}} data - Datos del alumno.
 * @param {object} [pesos] - Pesos de ponderación.
 * @returns {object} Resultado del análisis predictivo.
 */
const evaluarRendimiento = (data, pesos = null) => {
    const defaultPesos = { nota: 0.5, asistencia: 0.3, comportamiento: 0.2 };
    const finalPesos = pesos || defaultPesos;

    // 1. Convertir promedio a porcentaje (basado en maxNota=7.0, estándar chileno)
    const notaPct = promedioAPorcentaje(data.promedio);
    
    // 2. Calcular comportamiento
    const comportamientoPct = calcularComportamiento(data.positivas, data.negativas);
    
    // 3. Asegurar que asistencia esté entre 0 y 100
    const asistenciaAjustada = Math.max(0.0, Math.min(100.0, data.asistencia));

    // 4. Calcular puntaje ponderado (el rendimiento)
    const puntajeTotal = (
        notaPct * finalPesos.nota +
        asistenciaAjustada * finalPesos.asistencia +
        comportamientoPct * finalPesos.comportamiento
    );

    // 5. Probabilidad de reprobar (inversa al puntaje de rendimiento)
    const probReprobar = 100.0 - puntajeTotal;
    const probReprobarAjustada = parseFloat(Math.max(0.0, Math.min(100.0, probReprobar)).toFixed(2));

    // 6. Determinar estado cualitativo
    const estadoCualitativo = determinarRiesgoCualitativo(probReprobarAjustada);

    return {
        puntajeRendimiento: parseFloat(puntajeTotal.toFixed(2)),
        probabilidadReprobacion: probReprobarAjustada,
        riesgoReprobacion: estadoCualitativo.riesgo,
        estadoCualitativo: `${estadoCualitativo.riesgo.toUpperCase()} probabilidad de reprobar ${estadoCualitativo.emoji}`,
        metricas: {
            notaPct: parseFloat(notaPct.toFixed(2)),
            comportamientoPct,
            asistenciaPct: asistenciaAjustada
        }
    };
};

module.exports = {
    evaluarRendimiento,
    promedioAPorcentaje,
    calcularComportamiento,
    determinarRiesgoCualitativo
};