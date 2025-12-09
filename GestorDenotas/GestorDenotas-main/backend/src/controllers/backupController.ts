/**
 * ========================================
 * CONTROLADOR DE BACKUP Y RESPALDO
 * ========================================
 * 
 * Este controlador maneja todas las operaciones de backup y respaldo de datos
 * para cumplir con el requisito RNF8 (Copias de seguridad diarias).
 * 
 * Funcionalidades principales:
 * - Creación de backups manuales y automáticos
 * - Gestión de archivos de respaldo
 * - Restauración de backups
 * - Verificación de integridad
 * - Compresión y encriptación de backups
 * - Rotación automática de backups antiguos
 * 
 * Endpoints disponibles (requieren autenticación admin):
 * - POST /api/backup/create - Crear backup manual
 * - GET /api/backup/list - Listar backups disponibles
 * - POST /api/backup/restore/:filename - Restaurar backup
 * - GET /api/backup/download/:filename - Descargar backup
 * - DELETE /api/backup/delete/:filename - Eliminar backup
 * - GET /api/backup/stats - Estadísticas de backups
 * - GET /api/backup/verify/:filename - Verificar integridad
 */

import { Router, Request, Response, NextFunction } from 'express';
import {
  createBackup,
  listBackups,
  restoreBackup,
  deleteBackup,
  getBackupStats,
  verifyBackupIntegrity,
  BACKUP_DIR,
} from '../services/backupService';
import { createError } from '../config/errors';
import path from 'path';
import fs from 'fs';

const router = Router();

/**
 * POST /api/backup/create
 * Crea una nueva copia de seguridad de la base de datos.
 * Retorna el nombre del archivo de backup creado.
 */
router.post('/create', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const filename = await createBackup();
    res.status(201).json({
      success: true,
      message: "Copia de seguridad creada exitosamente",
      data: { filename },
    });
  } catch (error) {
    next(createError.internal(`Error al crear la copia de seguridad: ${error}`));
  }
});

/**
 * GET /api/backup/list
 * Lista todas las copias de seguridad disponibles en el directorio de backups.
 * Retorna un array con los nombres de los archivos de backup.
 */
router.get('/list', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const backups = await listBackups();
    res.json({
      success: true,
      data: { backups },
    });
  } catch (error) {
    next(createError.internal(`Error al listar las copias de seguridad: ${error}`));
  }
});

/**
 * POST /api/backup/restore/:filename
 * Restaura la base de datos a partir de un archivo de copia de seguridad específico.
 * CUIDADO: Esto sobrescribirá la base de datos actual.
 */
router.post('/restore/:filename', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { filename } = req.params;
    await restoreBackup(filename);
    res.json({
      success: true,
      message: `Base de datos restaurada desde ${filename} exitosamente.`,
    });
  } catch (error) {
    next(createError.internal(`Error al restaurar la base de datos: ${error}`));
  }
});

/**
 * GET /api/backup/download/:filename
 * Permite descargar un archivo de copia de seguridad específico.
 */
router.get('/download/:filename', (req: Request, res: Response, next: NextFunction) => {
  const { filename } = req.params;
  const filePath = path.join(BACKUP_DIR, filename);

  if (!fs.existsSync(filePath)) {
    return next(createError.internal("Archivo de backup no encontrado."));
  }

  res.download(filePath, (err) => {
    if (err) {
      next(createError.internal(`Error al descargar el archivo: ${err.message}`));
    }
  });
});

/**
 * DELETE /api/backup/delete/:filename
 * Elimina un archivo de copia de seguridad específico.
 */
router.delete('/delete/:filename', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { filename } = req.params;
    await deleteBackup(filename);
    res.status(204).send(); // No Content
  } catch (error) {
    next(createError.internal(`Error al eliminar la copia de seguridad: ${error}`));
  }
});

/**
 * GET /api/backup/stats
 * Obtiene estadísticas sobre las copias de seguridad, como el número total y el tamaño combinado.
 */
router.get('/stats', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const stats = await getBackupStats();
    res.json({
      success: true,
      data: { stats },
    });
  } catch (error) {
    next(createError.internal(`Error al obtener estadísticas de backup: ${error}`));
  }
});

/**
 * GET /api/backup/verify/:filename
 * Verifica la integridad de un archivo de copia de seguridad utilizando su checksum.
 */
router.get('/verify/:filename', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { filename } = req.params;
    const isValid = await verifyBackupIntegrity(filename);
    res.json({
      success: true,
      data: { filename, isValid, message: isValid ? "Integridad verificada." : "Checksum no coincide o archivo corrupto." },
    });
  } catch (error) {
    next(createError.internal(`Error al verificar la integridad del backup: ${error}`));
  }
});

export default router;