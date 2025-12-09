"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const userRoutes_1 = __importDefault(require("./userRoutes"));
const gradeController_1 = __importDefault(require("../controllers/gradeController")); // Importamos el controlador directamente o su router
const asistenciaController_1 = __importDefault(require("../controllers/asistenciaController"));
const observacionController_1 = __importDefault(require("../controllers/observacionController"));
const healthController_1 = __importDefault(require("../controllers/healthController"));
const router = (0, express_1.Router)();
// 1. Usuarios (Profesores y Estudiantes) -> /api/users/...
router.use("/users", userRoutes_1.default);
// 2. Calificaciones -> /api/grades/...
router.use("/grades", gradeController_1.default);
// 3. Asistencia -> /api/asistencias/...
router.use("/asistencias", asistenciaController_1.default);
// 4. Observaciones -> /api/observaciones/...
router.use("/observaciones", observacionController_1.default);
// 5. Salud del Sistema -> /api/health/...
router.use("/health", healthController_1.default);
exports.default = router;
