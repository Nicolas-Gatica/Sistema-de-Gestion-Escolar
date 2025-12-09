// routes/gradeRoutes.js

const { Router } = require('express');
const gradeController = require('../controllers/gradeController').default;

const router = Router();

// Rutas de gestión de notas: /api/grades/calificaciones
router.use('/', gradeController);

module.exports = router;