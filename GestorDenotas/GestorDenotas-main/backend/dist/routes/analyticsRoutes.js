// routes/analyticsRoutes.js

const { Router } = require('express');
const analyticsController = require('../controllers/analyticsController').default;

const router = Router();

// Rutas de análisis de estudiante: /api/analytics/estudiante/:id, /api/analytics/prediccion/:id, etc.
router.use('/', analyticsController);

module.exports = router;