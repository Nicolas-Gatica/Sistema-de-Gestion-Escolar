"use strict";
// backend/src/routes/userRoutes.ts
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const profesorController_1 = __importDefault(require("../controllers/profesorController"));
const estudianteController_1 = __importDefault(require("../controllers/estudianteController")); // Asumo que tienes este controlador
const router = (0, express_1.Router)();
// Conecta la ruta /profesores al controlador de profesores
// Cuando el frontend llame a /api/users/profesores, el backend hará:
// /api -> index.ts
// /users -> userRoutes.ts
// /profesores -> profesorController.ts
router.use("/profesores", profesorController_1.default);
// Conecta la ruta /estudiantes al controlador de estudiantes
router.use("/estudiantes", estudianteController_1.default);
exports.default = router;
