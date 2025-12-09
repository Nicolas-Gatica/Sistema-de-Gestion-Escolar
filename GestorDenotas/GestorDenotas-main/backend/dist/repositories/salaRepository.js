// repositories/salaRepository.js

const prisma = require('../config/prisma');

// Constante para obtener el día de la semana actual (1=Lunes a 7=Domingo)
const getDiaActual = () => new Date().getDay() === 0 ? 7 : new Date().getDay();

exports.salaRepository = {

    /**
     * @name findById
     * @description Obtiene los datos de una sala, incluyendo su foto/guía visual (RF4.2).
     * @param {number} id - ID de la sala.
     */
    findById: (id) => prisma.sala.findUnique({
        where: { id },
    }),

    /**
     * @name findHorarioEstudiante
     * @description Obtiene el horario de clases de un estudiante para el día actual o un día específico (RF4.1).
     * @param {number} cursoId - ID del curso del estudiante.
     * @param {number} [diaSemana] - Opcional. Día de la semana a consultar (1-7).
     * @returns {Promise<object[]>} Lista de clases programadas.
     */
    findHorarioEstudiante: (cursoId, diaSemana = getDiaActual()) => prisma.horario.findMany({
        where: {
            cursoId: cursoId,
            diaSemana: diaSemana,
            activo: true
        },
        // Incluimos las relaciones clave: Asignatura y Sala (con su foto)
        include: {
            asignatura: {
                select: { nombre: true }
            },
            profesor: {
                select: { nombre: true, apellido: true }
            },
            sala: {
                select: {
                    nombre: true,
                    ubicacion: true,
                    fotoGuiaUrl: true, // RF4.2: La guía visual o foto
                    tipo: true
                }
            }
        },
        orderBy: {
            horaInicio: 'asc'
        }
    }),

    // --- Funciones CRUD básicas para la administración de salas (RF1.3) ---

    create: (data) => prisma.sala.create({ data }),
    
    update: (id, data) => prisma.sala.update({ where: { id }, data }),
    
    delete: (id) => prisma.sala.delete({ where: { id } }),

    findAll: () => prisma.sala.findMany(),
};