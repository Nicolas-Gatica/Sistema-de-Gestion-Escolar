"use strict";
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const backupService_1 = require("../services/backupService");
const errors_1 = require("../config/errors");
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const router = (0, express_1.Router)();
/**
 * POST /api/backup/create
 * Crea una nueva copia de seguridad de la base de datos.
 * Retorna el nombre del archivo de backup creado.
 */
router.post('/create', async (req, res, next) => {
    try {
        const filename = await (0, backupService_1.createBackup)();
        res.status(201).json({
            success: true,
            message: "Copia de seguridad creada exitosamente",
            data: { filename },
        });
    }
    catch (error) {
        next(errors_1.createError.internal(`Error al crear la copia de seguridad: ${error}`));
    }
});
/**
 * GET /api/backup/list
 * Lista todas las copias de seguridad disponibles en el directorio de backups.
 * Retorna un array con los nombres de los archivos de backup.
 */
router.get('/list', async (req, res, next) => {
    try {
        const backups = await (0, backupService_1.listBackups)();
        res.json({
            success: true,
            data: { backups },
        });
    }
    catch (error) {
        next(errors_1.createError.internal(`Error al listar las copias de seguridad: ${error}`));
    }
});
/**
 * POST /api/backup/restore/:filename
 * Restaura la base de datos a partir de un archivo de copia de seguridad específico.
 * CUIDADO: Esto sobrescribirá la base de datos actual.
 */
router.post('/restore/:filename', async (req, res, next) => {
    try {
        const { filename } = req.params;
        await (0, backupService_1.restoreBackup)(filename);
        res.json({
            success: true,
            message: `Base de datos restaurada desde ${filename} exitosamente.`,
        });
    }
    catch (error) {
        next(errors_1.createError.internal(`Error al restaurar la base de datos: ${error}`));
    }
});
/**
 * GET /api/backup/download/:filename
 * Permite descargar un archivo de copia de seguridad específico.
 */
router.get('/download/:filename', (req, res, next) => {
    const { filename } = req.params;
    const filePath = path_1.default.join(backupService_1.BACKUP_DIR, filename);
    if (!fs_1.default.existsSync(filePath)) {
        return next(errors_1.createError.internal("Archivo de backup no encontrado."));
    }
    res.download(filePath, (err) => {
        if (err) {
            next(errors_1.createError.internal(`Error al descargar el archivo: ${err.message}`));
        }
    });
});
/**
 * DELETE /api/backup/delete/:filename
 * Elimina un archivo de copia de seguridad específico.
 */
router.delete('/delete/:filename', async (req, res, next) => {
    try {
        const { filename } = req.params;
        await (0, backupService_1.deleteBackup)(filename);
        res.status(204).send(); // No Content
    }
    catch (error) {
        next(errors_1.createError.internal(`Error al eliminar la copia de seguridad: ${error}`));
    }
});
/**
 * GET /api/backup/stats
 * Obtiene estadísticas sobre las copias de seguridad, como el número total y el tamaño combinado.
 */
router.get('/stats', async (req, res, next) => {
    try {
        const stats = await (0, backupService_1.getBackupStats)();
        res.json({
            success: true,
            data: { stats },
        });
    }
    catch (error) {
        next(errors_1.createError.internal(`Error al obtener estadísticas de backup: ${error}`));
    }
});
/**
 * GET /api/backup/verify/:filename
 * Verifica la integridad de un archivo de copia de seguridad utilizando su checksum.
 */
router.get('/verify/:filename', async (req, res, next) => {
    try {
        const { filename } = req.params;
        const isValid = await (0, backupService_1.verifyBackupIntegrity)(filename);
        res.json({
            success: true,
            data: { filename, isValid, message: isValid ? "Integridad verificada." : "Checksum no coincide o archivo corrupto." },
        });
    }
    catch (error) {
        next(errors_1.createError.internal(`Error al verificar la integridad del backup: ${error}`));
    }
});
exports.default = router;
