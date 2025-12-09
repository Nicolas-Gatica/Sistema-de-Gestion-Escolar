// controllers/salaController.js

const { Router } = require('express');
const { requireAuth, requireAdmin, requireAdminOrProfesor } = require('../middleware/auth');
const salaService = require('../services/salaService');
const { createError } = require('../config/errors');

const router = Router();
router.use(requireAuth);

// =========================================================================
//                  RUTAS CRUD: GESTIÓN DE SALAS (RF4.2)
// =========================================================================

/**
 * POST /api/salas
 * Crea una nueva sala (RF4.2). Solo Admin.
 */
router.post('/salas', requireAdmin, async (req, res, next) => {
    try {
        const sala = await salaService.createSala(req.body);
        res.status(201).json({ success: true, data: sala, message: "Sala creada con éxito. Recuerde añadir la guía visual (fotoGuiaUrl)." });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/salas
 * Obtiene todas las salas (RF4.2). Admin/Profesor.
 * Incluye la URL de la foto/guía visual.
 */
router.get('/salas', requireAdminOrProfesor, async (req, res, next) => {
    try {
        const salas = await salaService.getAllSalas();
        res.json({ success: true, data: salas });
    } catch (error) {
        next(error);
    }
});

/**
 * PUT /api/salas/:id
 * Actualiza una sala (RF4.2). Solo Admin.
 */
router.put('/salas/:id', requireAdmin, async (req, res, next) => {
    try {
        const id = parseInt(req.params.id);
        const sala = await salaService.updateSala(id, req.body);
        res.json({ success: true, data: sala });
    } catch (error) {
        // En caso de que la sala no se encuentre o haya un error de base de datos
        next(error);
    }
});

/**
 * DELETE /api/salas/:id
 * Elimina una sala (RF4.2). Solo Admin.
 */
router.delete('/salas/:id', requireAdmin, async (req, res, next) => {
    try {
        const id = parseInt(req.params.id);
        await salaService.deleteSala(id);
        res.status(204).json({ success: true, message: 'Sala eliminada' });
    } catch (error) {
        next(error);
    }
});


// =========================================================================
//                  RUTAS CRUD: GESTIÓN DE HORARIOS (RF4.1)
// =========================================================================

/**
 * POST /api/horarios
 * Crea un nuevo registro de horario (RF4.1). Admin/Profesor.
 */
router.post('/horarios', requireAdminOrProfesor, async (req, res, next) => {
    try {
        // La lógica para que el profesor solo pueda crear horarios para sus asignaturas 
        // debería ir en el servicio para mantener la seguridad.
        const horario = await salaService.createHorario(req.body); 
        res.status(201).json({ success: true, data: horario });
    } catch (error) {
        // Manejo de errores de colisión (ej: dos clases a la misma hora en el mismo curso)
        next(error);
    }
});

/**
 * GET /api/horarios/curso/:cursoId
 * Obtiene el horario completo de un curso (RF4.1). Admin/Profesor.
 */
router.get('/horarios/curso/:cursoId', requireAdminOrProfesor, async (req, res, next) => {
    try {
        const cursoId = parseInt(req.params.cursoId);
        if (isNaN(cursoId)) return next(createError.validation('ID de curso inválido'));

        const horario = await salaService.getHorarioCurso(cursoId);
        res.json({ success: true, data: horario });
    } catch (error) {
        next(error);
    }
});

/**
 * PUT /api/horarios/:id
 * Actualiza un registro de horario (RF4.1). Admin/Profesor.
 */
router.put('/horarios/:id', requireAdminOrProfesor, async (req, res, next) => {
    try {
        const id = parseInt(req.params.id);
        const horario = await salaService.updateHorario(id, req.body);
        res.json({ success: true, data: horario });
    } catch (error) {
        next(error);
    }
});

/**
 * DELETE /api/horarios/:id
 * Elimina un registro de horario (RF4.1). Admin/Profesor.
 */
router.delete('/horarios/:id', requireAdminOrProfesor, async (req, res, next) => {
    try {
        const id = parseInt(req.params.id);
        await salaService.deleteHorario(id);
        res.status(204).json({ success: true, message: 'Horario eliminado' });
    } catch (error) {
        next(error);
    }
});

exports.default = router;