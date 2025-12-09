// backend/src/routes/userRoutes.js

const { Router } = require('express');
// Importamos el controlador que contiene la lógica de creación con la Service Key
const profesorController = require('../controllers/profesorController');

const router = Router();

// Montamos las rutas definidas en el controlador.
// Si el controlador define 'router.post("/profesores")', y aquí estamos en '/users',
// la ruta final será: /api/users/profesores
router.use('/', profesorController);

module.exports = router;