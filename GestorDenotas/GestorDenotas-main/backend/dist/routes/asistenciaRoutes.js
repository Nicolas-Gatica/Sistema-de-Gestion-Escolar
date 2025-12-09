// routes/asistenciaRoutes.js

const { Router } = require('express');
const asistenciaController = require('../controllers/asistenciaController').default;

const router = Router();

// Rutas de gestión de asistencia: /api/asistencia/asistencia
router.use('/', asistenciaController);

module.exports = router;