// routes/resourceRoutes.js

const { Router } = require('express');
const horarioController = require('../controllers/horarioController').default; // Horarios para estudiante
const salaController = require('../controllers/salaController').default; // CRUD de Salas y Horarios admin

const router = Router();

// Rutas de horarios para estudiante: /api/resources/horarios/estudiante/:id
router.use('/', horarioController); 

// Rutas CRUD de salas y horarios: /api/resources/salas, /api/resources/horarios
router.use('/', salaController); 

module.exports = router;