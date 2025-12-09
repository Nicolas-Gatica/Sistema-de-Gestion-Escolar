// services/summaryService.js

const { estudianteRepository } = require('../repositories/estudianteRepository');
const gradeService = require('./gradeService');
const asistenciaService = require('./asistenciaService');
const observacionService = require('./observacionService');
const { createError } = require('../config/errors');

/**
 * @name construirTarjetaAcademica
 * @description Construye la estructura de datos ideal para la "Tarjeta de Estudiante" (RF5.1) / Hoja de Vida (RF2.4).
 * @param {number} estudianteId - ID del estudiante.
 * @param {number} año - Año de la consulta.
 * @returns {Promise<object>} Objeto listo para ser consumido por el frontend.
 */
exports.construirTarjetaAcademica = async (estudianteId, año = new Date().getFullYear()) => {
    
    // 1. Obtener datos generales del estudiante (incluyendo foto)
    const datosGenerales = await estudianteRepository.findDatosGenerales(estudianteId);
    
    if (!datosGenerales) {
        throw createError.notFound('Estudiante no encontrado');
    }

    // 2. Obtener la data académica clave
    // Usaremos los servicios ya implementados para obtener promedios/totales del año.
    const notasAgrupadas = await gradeService.getNotasEstudiante(estudianteId, año);
    const resumenAsistencia = await asistenciaService.getResumenAsistencia(estudianteId, año);
    const conteoObservaciones = await observacionService.conteoObservaciones(estudianteId, año);
    
    // Calcular el Promedio General Anual
    const todosLosPromedios = notasAgrupadas.map(a => a.promedio);
    const promedioAnual = todosLosPromedios.length > 0
        ? parseFloat((todosLosPromedios.reduce((sum, p) => sum + p, 0) / todosLosPromedios.length).toFixed(2))
        : 1.0;

    // --- Mapeo a la estructura de "Tarjeta de Atributos" ---
    
    // El frontend podrá mapear estos atributos a la tarjeta de Vardy:
    const tarjeta = {
        // Datos del Jugador (Estudiante)
        id: datosGenerales.id,
        nombreCompleto: `${datosGenerales.nombre} ${datosGenerales.apellido}`,
        curso: datosGenerales.curso.nombre,
        fotoUrl: datosGenerales.foto || '/default-avatar.png', // RF5.1: La foto

        // Atributos Clave (Valores de 0 a 100)
        atributos: {
            RITMO_APRENDIZAJE: {
                valor: Math.min(100, Math.round(promedioAnual * 12.5 + 15)), // Escala 1.0-7.0 a 0-100
                etiqueta: 'Promedio Gral.',
                sub_ritmo: {
                    Aceleracion: Math.round(promedioAnual * 10), 
                    Velocidad: resumenAsistencia.tasaAsistencia // Usamos asistencia como "Velocidad"
                }
            },
            TIRO_ACADEMICO: {
                valor: Math.min(100, Math.round(promedioAnual * 12.5 + 20)),
                etiqueta: 'Promedio Asig.',
                sub_tiro: {
                    Definicion: Math.min(7.0, Math.max(1.0, promedioAnual + 0.5)) // Podrías usar la mejor nota promedio
                }
            },
            PASE_SOCIAL: {
                valor: Math.min(100, 100 - conteoObservaciones.negativas * 5), // Disminuye con negativas
                etiqueta: 'Comportamiento',
                sub_pase: {
                    Vision: conteoObservaciones.positivas * 10,
                    Pase_Largo: conteoObservaciones.neutras * 5
                }
            },
            DEFENSA: {
                valor: resumenAsistencia.tasaAsistencia,
                etiqueta: 'Asistencia (%)',
                sub_defensa: {
                    Intercepciones: resumenAsistencia.presente,
                    Prec_cabeza: resumenAsistencia.tarde 
                }
            },
            FISICO: {
                valor: Math.min(100, 70 + conteoObservaciones.positivas * 2), // Sube con positivas
                etiqueta: 'Motivación',
                sub_fisico: {
                    Resistencia: conteoObservaciones.positivas * 5,
                    Agresividad: conteoObservaciones.negativas * 10 // ¡Ojo con el nombre!
                }
            }
        },

        // El detalle de Notas/Asignaturas para mostrar al lado
        detalleAcademico: notasAgrupadas, 
        detalleObservaciones: conteoObservaciones
    };

    return tarjeta;
};