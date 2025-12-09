// backend/src/controllers/asignaturaController.ts

import { Router, Request, Response, NextFunction } from "express";
import {
  getAllAsignaturas,
  getAsignaturaById,
  createAsignatura,
  updateAsignatura,
  deleteAsignatura,
  // --- LÍNEAS ELIMINADAS ---
  // addProfesorToAsignatura, 
  // removeProfesorFromAsignatura,
} from "../services/asignaturaService";

const router = Router();

// GET /api/asignaturas
router.get("/", async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const asignaturas = await getAllAsignaturas();
    res.json({ 
      success: true,
      data: { asignaturas } 
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/asignaturas/:id
router.get("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Number(req.params.id);
    const asignatura = await getAsignaturaById(id);
    res.json({ 
      success: true,
      data: { asignatura } 
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/asignaturas
router.post("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { nombre } = req.body;
    const nueva = await createAsignatura({ nombre });
    res.status(201).json({ 
      success: true,
      data: { asignatura: nueva } 
    });
  } catch (err) {
    next(err);
  }
});

// PUT /api/asignaturas/:id
router.put("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Number(req.params.id);
    const { nombre } = req.body;
    const actualizada = await updateAsignatura(id, { nombre });
    res.json({ 
      success: true,
      data: { asignatura: actualizada } 
    });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/asignaturas/:id
router.delete("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Number(req.params.id);
    await deleteAsignatura(id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

// --- RUTAS OBSOLETAS ELIMINADAS ---
// (Se eliminaron las rutas POST y DELETE para /:id/profesores)

export default router;