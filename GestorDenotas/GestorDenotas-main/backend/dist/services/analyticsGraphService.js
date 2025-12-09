// services/analyticsGraphService.js

// Importamos las funciones de ayuda que ya definimos en el Prediction Service (reutilización)
const { promedioAPorcentaje, calcularComportamiento } = require('./analyticsPredictionService');

/**
 * @typedef {Object} PeriodoData
 * @property {string} periodo - Nombre del periodo (ej: "Trimestre 1").
 * @property {number} promedio - Promedio de notas (ej: 5.5).
 * @property {number} asistencia - Porcentaje de asistencia (ej: 92).
 * @property {number} positivas - Cantidad de anotaciones positivas.
 * @property {number} negativas - Cantidad de anotaciones negativas.
 */

/**
 * @name estructurarHistorialGrafico
 * @description Procesa los datos crudos del historial del estudiante y los convierte 
 * en un formato compatible con librerías de gráficos (ej: Chart.js).
 * @param {PeriodoData[]} historialData - Array con los datos de rendimiento por periodo.
 * @returns {object} Datos estructurados para un gráfico de barras múltiples.
 */
const estructurarHistorialGrafico = (historialData) => {
    // Arrays para las etiquetas y los tres datasets del gráfico
    const periodos = [];
    const notasPct = [];
    const asistencias = [];
    const comportamientos = [];

    // Recorrer los datos de cada trimestre
    historialData.forEach(data => {
        periodos.push(data.periodo);
        
        // Aplicar la lógica de conversión de porcentaje (basada en el script Python)
        const notaPct = promedioAPorcentaje(data.promedio);
        const comportamientoPct = calcularComportamiento(data.positivas, data.negativas);

        notasPct.push(parseFloat(notaPct.toFixed(1)));
        asistencias.push(parseFloat(data.asistencia.toFixed(1)));
        comportamientos.push(parseFloat(comportamientoPct.toFixed(1)));
    });

    // Devolver la estructura JSON que el frontend espera para dibujar el gráfico
    return {
        labels: periodos,
        datasets: [
            {
                label: 'Nota (%)',
                data: notasPct,
                backgroundColor: 'rgba(75, 192, 192, 1)', // Color similar al azul
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 1
            },
            {
                label: 'Asistencia (%)',
                data: asistencias,
                backgroundColor: 'rgba(255, 159, 64, 1)', // Color similar al naranja
                borderColor: 'rgba(255, 159, 64, 1)',
                borderWidth: 1
            },
            {
                label: 'Comportamiento (%)',
                data: comportamientos,
                backgroundColor: 'rgba(54, 162, 235, 1)', // Color similar al verde
                borderColor: 'rgba(54, 162, 235, 1)',
                borderWidth: 1
            }
        ],
        // Metadatos adicionales (ej: para mostrar sobre el gráfico)
        metadatos: {
            titulo: "Historial de Rendimiento Trimestral"
        }
    };
};

module.exports = {
    estructurarHistorialGrafico
};