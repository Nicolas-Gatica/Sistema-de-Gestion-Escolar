/**
 * ========================================
 * CONTROLADOR DE GESTIÓN DE ARCHIVOS
 * ========================================
 * 
 * Este controlador maneja la gestión de archivos para cumplir con:
 * - RF5.1: Mostrar la foto del alumno junto con su información académica
 * 
 * Funcionalidades principales:
 * - Subida de fotos de estudiantes
 * - Servir archivos estáticos
 * - Gestión de thumbnails
 * - Validación de archivos
 * - Backup y restauración de archivos
 * - Estadísticas de almacenamiento
 * 
 * Endpoints disponibles:
 * - POST /api/files/students/upload - Subir foto de estudiante
 * - GET /api/files/students/:filename - Obtener foto de estudiante
 * - GET /api/files/students/thumb/:filename - Obtener thumbnail
 * - DELETE /api/files/students/:filename - Eliminar foto
 * - GET /api/files/stats - Estadísticas de archivos
 * - POST /api/files/backup/:filename - Crear backup de archivo
 * - POST /api/files/restore/:filename - Restaurar desde backup
 */

import { Router, Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import { 
  upload, 
  processStudentPhoto, 
  deleteStudentPhoto, 
  getStudentPhotoInfo,
  backupStudentPhoto,
  restoreStudentPhoto,
  getFileStats,
  cleanupTempFiles,
  STUDENT_PHOTOS_DIR
} from '../services/fileService';
import { requireAuth, requirePermission } from '../middleware/auth';
import { createError } from '../config/errors';

const router = Router();

// Aplicar autenticación a todas las rutas
router.use(requireAuth);

/**
 * POST /api/files/students/upload
 * Sube una foto de estudiante y la procesa (optimiza y crea thumbnail)
 * Requiere permisos de administrador o profesor
 */
router.post('/students/upload', 
  requirePermission('estudiantes', 'update'),
  upload.single('photo'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.file) {
        return next(createError.validation('No se proporcionó archivo de imagen'));
      }

      // Procesar la imagen
      const result = await processStudentPhoto(req.file.path, req.file.filename);
      
      res.status(201).json({
        success: true,
        message: 'Foto de estudiante subida exitosamente',
        data: {
          file: result,
          metadata: {
            uploadedAt: new Date().toISOString(),
            uploadedBy: req.user?.id
          }
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/files/students/:filename
 * Sirve archivos de fotos de estudiantes
 * Acceso público para mostrar fotos en la interfaz
 */
router.get('/students/:filename', (req: Request, res: Response, next: NextFunction) => {
  try {
    const { filename } = req.params;
    
    // Validar nombre de archivo
    if (!filename || filename.includes('..') || filename.includes('/')) {
      return next(createError.validation('Nombre de archivo inválido'));
    }
    
    const filePath = path.join(STUDENT_PHOTOS_DIR, filename);
    
    if (!fs.existsSync(filePath)) {
      return next(createError.notFound('Archivo no encontrado'));
    }
    
    // Establecer headers apropiados
    res.setHeader('Content-Type', 'image/jpeg');
    res.setHeader('Cache-Control', 'public, max-age=31536000'); // Cache por 1 año
    
    // Servir archivo
    res.sendFile(filePath);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/files/students/thumb/:filename
 * Sirve thumbnails de fotos de estudiantes
 * Acceso público para mostrar thumbnails en la interfaz
 */
router.get('/students/thumb/:filename', (req: Request, res: Response, next: NextFunction) => {
  try {
    const { filename } = req.params;
    
    // Validar nombre de archivo
    if (!filename || filename.includes('..') || filename.includes('/')) {
      return next(createError.validation('Nombre de archivo inválido'));
    }
    
    const filePath = path.join(STUDENT_PHOTOS_DIR, `thumb_${filename}`);
    
    if (!fs.existsSync(filePath)) {
      return next(createError.notFound('Thumbnail no encontrado'));
    }
    
    // Establecer headers apropiados
    res.setHeader('Content-Type', 'image/jpeg');
    res.setHeader('Cache-Control', 'public, max-age=31536000'); // Cache por 1 año
    
    // Servir archivo
    res.sendFile(filePath);
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/files/students/:filename
 * Elimina una foto de estudiante
 * Requiere permisos de administrador
 */
router.delete('/students/:filename', 
  requirePermission('estudiantes', 'delete'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { filename } = req.params;
      
      if (!filename || filename.includes('..') || filename.includes('/')) {
        return next(createError.validation('Nombre de archivo inválido'));
      }
      
      const deleted = await deleteStudentPhoto(filename);
      
      if (!deleted) {
        return next(createError.notFound('Archivo no encontrado'));
      }
      
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/files/stats
 * Obtiene estadísticas de archivos almacenados
 * Requiere permisos de administrador
 */
router.get('/stats', 
  requirePermission('usuarios', 'read'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const stats = await getFileStats();
      
      res.json({
        success: true,
        data: {
          stats,
          metadata: {
            generatedAt: new Date().toISOString(),
            generatedBy: req.user?.id
          }
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/files/backup/:filename
 * Crea un backup de una foto de estudiante
 * Requiere permisos de administrador
 */
router.post('/backup/:filename', 
  requirePermission('backup', 'create'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { filename } = req.params;
      
      if (!filename || filename.includes('..') || filename.includes('/')) {
        return next(createError.validation('Nombre de archivo inválido'));
      }
      
      const backupPath = await backupStudentPhoto(filename);
      
      res.status(201).json({
        success: true,
        message: 'Backup creado exitosamente',
        data: {
          originalFilename: filename,
          backupPath,
          createdAt: new Date().toISOString()
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/files/restore/:filename
 * Restaura una foto desde backup
 * Requiere permisos de administrador
 */
router.post('/restore/:filename', 
  requirePermission('backup', 'restore'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { filename } = req.params;
      const { backupPath } = req.body;
      
      if (!filename || filename.includes('..') || filename.includes('/')) {
        return next(createError.validation('Nombre de archivo inválido'));
      }
      
      if (!backupPath) {
        return next(createError.validation('Ruta de backup requerida'));
      }
      
      const restored = await restoreStudentPhoto(backupPath, filename);
      
      if (!restored) {
        return next(createError.internal('Error al restaurar archivo desde backup'));
      }
      
      res.json({
        success: true,
        message: 'Archivo restaurado exitosamente',
        data: {
          filename,
          restoredAt: new Date().toISOString()
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/files/cleanup
 * Limpia archivos temporales
 * Requiere permisos de administrador
 */
router.post('/cleanup', 
  requirePermission('usuarios', 'delete'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const deletedCount = await cleanupTempFiles();
      
      res.json({
        success: true,
        message: 'Limpieza completada',
        data: {
          deletedFiles: deletedCount,
          cleanedAt: new Date().toISOString()
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/files/students/info/:filename
 * Obtiene información detallada de una foto de estudiante
 * Requiere permisos de lectura
 */
router.get('/students/info/:filename', 
  requirePermission('estudiantes', 'read'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { filename } = req.params;
      
      if (!filename || filename.includes('..') || filename.includes('/')) {
        return next(createError.validation('Nombre de archivo inválido'));
      }
      
      const photoInfo = await getStudentPhotoInfo(filename);
      
      if (!photoInfo) {
        return next(createError.notFound('Archivo no encontrado'));
      }
      
      res.json({
        success: true,
        data: {
          photo: photoInfo,
          metadata: {
            requestedAt: new Date().toISOString(),
            requestedBy: req.user?.id
          }
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;


