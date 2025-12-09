// backend/src/routes/userRoutes.ts

import { Router } from "express";
import profesorController from "../controllers/profesorController";
import estudianteController from "../controllers/estudianteController"; // Asumo que tienes este controlador

const router = Router();

// Conecta la ruta /profesores al controlador de profesores
// Cuando el frontend llame a /api/users/profesores, el backend hará:
// /api -> index.ts
// /users -> userRoutes.ts
// /profesores -> profesorController.ts
router.use("/profesores", profesorController);

// Conecta la ruta /estudiantes al controlador de estudiantes
router.use("/estudiantes", estudianteController);

export default router;