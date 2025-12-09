"use strict";
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const fileService_1 = require("../services/fileService");
const auth_1 = require("../middleware/auth");
const errors_1 = require("../config/errors");
const router = (0, express_1.Router)();
// Aplicar autenticación a todas las rutas
router.use(auth_1.requireAuth);
/**
 * POST /api/files/students/upload
 * Sube una foto de estudiante y la procesa (optimiza y crea thumbnail)
 * Requiere permisos de administrador o profesor
 */
router.post('/students/upload', (0, auth_1.requirePermission)('estudiantes', 'update'), fileService_1.upload.single('photo'), async (req, res, next) => {
    try {
        if (!req.file) {
            return next(errors_1.createError.validation('No se proporcionó archivo de imagen'));
        }
        // Procesar la imagen
        const result = await (0, fileService_1.processStudentPhoto)(req.file.path, req.file.filename);
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
    }
    catch (error) {
        next(error);
    }
});
/**
 * GET /api/files/students/:filename
 * Sirve archivos de fotos de estudiantes
 * Acceso público para mostrar fotos en la interfaz
 */
router.get('/students/:filename', (req, res, next) => {
    try {
        const { filename } = req.params;
        // Validar nombre de archivo
        if (!filename || filename.includes('..') || filename.includes('/')) {
            return next(errors_1.createError.validation('Nombre de archivo inválido'));
        }
        const filePath = path_1.default.join(fileService_1.STUDENT_PHOTOS_DIR, filename);
        if (!fs_1.default.existsSync(filePath)) {
            return next(errors_1.createError.notFound('Archivo no encontrado'));
        }
        // Establecer headers apropiados
        res.setHeader('Content-Type', 'image/jpeg');
        res.setHeader('Cache-Control', 'public, max-age=31536000'); // Cache por 1 año
        // Servir archivo
        res.sendFile(filePath);
    }
    catch (error) {
        next(error);
    }
});
/**
 * GET /api/files/students/thumb/:filename
 * Sirve thumbnails de fotos de estudiantes
 * Acceso público para mostrar thumbnails en la interfaz
 */
router.get('/students/thumb/:filename', (req, res, next) => {
    try {
        const { filename } = req.params;
        // Validar nombre de archivo
        if (!filename || filename.includes('..') || filename.includes('/')) {
            return next(errors_1.createError.validation('Nombre de archivo inválido'));
        }
        const filePath = path_1.default.join(fileService_1.STUDENT_PHOTOS_DIR, `thumb_${filename}`);
        if (!fs_1.default.existsSync(filePath)) {
            return next(errors_1.createError.notFound('Thumbnail no encontrado'));
        }
        // Establecer headers apropiados
        res.setHeader('Content-Type', 'image/jpeg');
        res.setHeader('Cache-Control', 'public, max-age=31536000'); // Cache por 1 año
        // Servir archivo
        res.sendFile(filePath);
    }
    catch (error) {
        next(error);
    }
});
/**
 * DELETE /api/files/students/:filename
 * Elimina una foto de estudiante
 * Requiere permisos de administrador
 */
router.delete('/students/:filename', (0, auth_1.requirePermission)('estudiantes', 'delete'), async (req, res, next) => {
    try {
        const { filename } = req.params;
        if (!filename || filename.includes('..') || filename.includes('/')) {
            return next(errors_1.createError.validation('Nombre de archivo inválido'));
        }
        const deleted = await (0, fileService_1.deleteStudentPhoto)(filename);
        if (!deleted) {
            return next(errors_1.createError.notFound('Archivo no encontrado'));
        }
        res.status(204).send();
    }
    catch (error) {
        next(error);
    }
});
/**
 * GET /api/files/stats
 * Obtiene estadísticas de archivos almacenados
 * Requiere permisos de administrador
 */
router.get('/stats', (0, auth_1.requirePermission)('usuarios', 'read'), async (req, res, next) => {
    try {
        const stats = await (0, fileService_1.getFileStats)();
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
    }
    catch (error) {
        next(error);
    }
});
/**
 * POST /api/files/backup/:filename
 * Crea un backup de una foto de estudiante
 * Requiere permisos de administrador
 */
router.post('/backup/:filename', (0, auth_1.requirePermission)('backup', 'create'), async (req, res, next) => {
    try {
        const { filename } = req.params;
        if (!filename || filename.includes('..') || filename.includes('/')) {
            return next(errors_1.createError.validation('Nombre de archivo inválido'));
        }
        const backupPath = await (0, fileService_1.backupStudentPhoto)(filename);
        res.status(201).json({
            success: true,
            message: 'Backup creado exitosamente',
            data: {
                originalFilename: filename,
                backupPath,
                createdAt: new Date().toISOString()
            }
        });
    }
    catch (error) {
        next(error);
    }
});
/**
 * POST /api/files/restore/:filename
 * Restaura una foto desde backup
 * Requiere permisos de administrador
 */
router.post('/restore/:filename', (0, auth_1.requirePermission)('backup', 'restore'), async (req, res, next) => {
    try {
        const { filename } = req.params;
        const { backupPath } = req.body;
        if (!filename || filename.includes('..') || filename.includes('/')) {
            return next(errors_1.createError.validation('Nombre de archivo inválido'));
        }
        if (!backupPath) {
            return next(errors_1.createError.validation('Ruta de backup requerida'));
        }
        const restored = await (0, fileService_1.restoreStudentPhoto)(backupPath, filename);
        if (!restored) {
            return next(errors_1.createError.internal('Error al restaurar archivo desde backup'));
        }
        res.json({
            success: true,
            message: 'Archivo restaurado exitosamente',
            data: {
                filename,
                restoredAt: new Date().toISOString()
            }
        });
    }
    catch (error) {
        next(error);
    }
});
/**
 * POST /api/files/cleanup
 * Limpia archivos temporales
 * Requiere permisos de administrador
 */
router.post('/cleanup', (0, auth_1.requirePermission)('usuarios', 'delete'), async (req, res, next) => {
    try {
        const deletedCount = await (0, fileService_1.cleanupTempFiles)();
        res.json({
            success: true,
            message: 'Limpieza completada',
            data: {
                deletedFiles: deletedCount,
                cleanedAt: new Date().toISOString()
            }
        });
    }
    catch (error) {
        next(error);
    }
});
/**
 * GET /api/files/students/info/:filename
 * Obtiene información detallada de una foto de estudiante
 * Requiere permisos de lectura
 */
router.get('/students/info/:filename', (0, auth_1.requirePermission)('estudiantes', 'read'), async (req, res, next) => {
    try {
        const { filename } = req.params;
        if (!filename || filename.includes('..') || filename.includes('/')) {
            return next(errors_1.createError.validation('Nombre de archivo inválido'));
        }
        const photoInfo = await (0, fileService_1.getStudentPhotoInfo)(filename);
        if (!photoInfo) {
            return next(errors_1.createError.notFound('Archivo no encontrado'));
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
    }
    catch (error) {
        next(error);
    }
});
exports.default = router;
