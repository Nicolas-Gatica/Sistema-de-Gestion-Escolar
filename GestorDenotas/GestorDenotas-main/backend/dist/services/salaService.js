// services/salaService.js

const { salaRepository } = require('../repositories/salaRepository');

/**
 * @name createSala
 * @description Crea una nueva sala de clases.
 * @param {object} data - Datos de la sala, incluyendo fotoGuiaUrl (RF4.2).
 */
exports.createSala = async (data) => {
    // Aquí se podría añadir validación de datos
    return await salaRepository.create(data);
};

/**
 * @name getSalaById
 * @description Obtiene los detalles de una sala.
 */
exports.getSalaById = async (id) => {
    const sala = await salaRepository.findById(id);
    if (!sala) {
        throw new Error('Sala no encontrada');
    }
    return sala;
};

/**
 * @name updateSala
 * @description Actualiza los datos de una sala.
 */
exports.updateSala = async (id, data) => {
    const sala = await salaRepository.update(id, data);
    if (!sala) {
        throw new Error('Sala no encontrada');
    }
    return sala;
};

/**
 * @name deleteSala
 * @description Elimina una sala por su ID.
 */
exports.deleteSala = async (id) => {
    // Nota: Prisma maneja la eliminación en cascada si está configurado en el schema.
    return await salaRepository.delete(id);
};

/**
 * @name getAllSalas
 * @description Obtiene todas las salas registradas.
 */
exports.getAllSalas = async () => {
    return await salaRepository.findAll();
};

// =========================================================================
//                  FUNCIONES CRUD para HORARIOS (RF4.1)
// =========================================================================

/**
 * @name createHorario
 * @description Crea un nuevo registro de horario para un curso/asignatura/profesor/sala.
 * @param {object} data - Datos del horario.
 */
exports.createHorario = async (data) => {
    // Se podría añadir lógica de negocio, como verificar si ya existe una clase 
    // en esa misma sala/hora/curso.
    return await prisma.horario.create({ data });
};

/**
 * @name updateHorario
 * @description Actualiza un registro de horario.
 */
exports.updateHorario = async (id, data) => {
    return await prisma.horario.update({ where: { id }, data });
};

/**
 * @name deleteHorario
 * @description Elimina un registro de horario.
 */
exports.deleteHorario = async (id) => {
    return await prisma.horario.delete({ where: { id } });
};

/**
 * @name getHorarioCurso
 * @description Obtiene el horario completo de un curso.
 */
exports.getHorarioCurso = async (cursoId) => {
    return await prisma.horario.findMany({
        where: { cursoId, activo: true },
        include: { asignatura: true, profesor: true, sala: true },
        orderBy: [{ diaSemana: 'asc' }, { horaInicio: 'asc' }]
    });
};