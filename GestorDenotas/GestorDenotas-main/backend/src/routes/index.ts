import { Router } from "express";
import userRoutes from "./userRoutes";
import gradeController from "../controllers/gradeController"; // Importamos el controlador directamente o su router
import asistenciaController from "../controllers/asistenciaController";
import observacionController from "../controllers/observacionController";
import healthController from "../controllers/healthController";

const router = Router();

// 1. Usuarios (Profesores y Estudiantes) -> /api/users/...
router.use("/users", userRoutes);

// 2. Calificaciones -> /api/grades/...
router.use("/grades", gradeController);

// 3. Asistencia -> /api/asistencias/...
router.use("/asistencias", asistenciaController);

// 4. Observaciones -> /api/observaciones/...
router.use("/observaciones", observacionController);

// 5. Salud del Sistema -> /api/health/...
router.use("/health", healthController);

export default router;