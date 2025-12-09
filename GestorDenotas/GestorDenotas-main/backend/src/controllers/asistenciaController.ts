// backend/src/controllers/gradeController.ts

import { Router, Request, Response, NextFunction } from "express";
import {
  addGrade,
  getGrades,
  getAllGrades,
  getGradeById,
  updateGrade,
  deleteGrade,
  getGradesByAsignatura,
  getGradesByProfesor,
  getEstadisticasCalificaciones,
} from "../services/gradeService";

const router = Router();

// POST /api/grades
router.post("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    // CORREGIDO: Recibe 'estudiante_uuid' y ya no 'profesorId'
    const { estudiante_uuid, asignaturaId, valor } = req.body;
    
    const nuevaNota = await addGrade(
      estudiante_uuid, // String (UUID)
      Number(asignaturaId),
      Number(valor)
      // Se eliminó profesorId
    );
    
    res.status(201).json({ success: true, data: { calificacion: nuevaNota } });
  } catch (err) {
    next(err);
  }
});

// GET /api/grades/estudiante/:estudianteUuid
// CORREGIDO: La ruta ahora espera el UUID
router.get("/estudiante/:estudianteUuid", async (req: Request, res: Response, next: NextFunction) => {
    try {
      const estudianteUuid = req.params.estudianteUuid; // Es un string
      const notas = await getGrades(estudianteUuid); // Pasamos el string
      res.json({ success: true, data: { calificaciones: notas } });
    } catch (err) {
      next(err);
    }
  }
);

// PUT /api/grades/:id
router.put("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Number(req.params.id);
    const { valor, asignaturaId } = req.body; // CORREGIDO: Se quitó profesorId

    const calificacionActualizada = await updateGrade(id, {
      valor: valor ? Number(valor) : undefined,
      asignaturaId: asignaturaId ? Number(asignaturaId) : undefined,
      // profesorId eliminado
    });
    
    res.json({ success: true, data: { calificacion: calificacionActualizada } });
  } catch (err) {
    next(err);
  }
});

// --- (Otras rutas GET y DELETE se mantienen) ---

router.get("/", async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const calificaciones = await getEstadisticasCalificaciones();
    res.json({ success: true, data: { estadisticas: calificaciones } });
  } catch (err) {
    next(err);
  }
});
router.get("/all", async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const calificaciones = await getAllGrades();
    res.json({ success: true, data: { calificaciones } });
  } catch (err) {
    next(err);
  }
});
router.get("/asignatura/:asignaturaId", async (req: Request, res: Response, next: NextFunction) => {
    try {
      const asignaturaId = Number(req.params.asignaturaId);
      const notas = await getGradesByAsignatura(asignaturaId);
      res.json({ success: true, data: { calificaciones: notas } });
    } catch (err) {
      next(err);
    }
  }
);
router.get("/profesor/:profesorId", async (req: Request, res: Response, next: NextFunction) => {
    try {
      const profesorId = Number(req.params.profesorId);
      const notas = await getGradesByProfesor(profesorId);
      res.json({ success: true, data: { calificaciones: notas } });
    } catch (err) {
      next(err);
    }
  }
);
router.get("/id/:id", async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = Number(req.params.id);
      const calificacion = await getGradeById(id);
      res.json({ success: true, data: { calificacion } });
    } catch (err) {
      next(err);
    }
  }
);
router.delete("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Number(req.params.id);
    await deleteGrade(id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

export default router;