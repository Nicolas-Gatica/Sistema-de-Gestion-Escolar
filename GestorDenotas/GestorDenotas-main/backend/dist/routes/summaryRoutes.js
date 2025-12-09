// routes/summaryRoutes.js

const { Router } = require('express');
const summaryController = require('../controllers/summaryController').default;

const router = Router();

// Rutas de Hoja de Vida/Tarjeta Académica: /api/summary/estudiante/:id/tarjeta, /api/summary/observaciones
router.use('/', summaryController);

module.exports = router;