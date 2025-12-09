"use strict";
/**
 * ========================================
 * SERVICIO DE GESTIÓN DE ARCHIVOS
 * ========================================
 *
 * Este servicio maneja la gestión de archivos para cumplir con:
 * - RF5.1: Mostrar la foto del alumno junto con su información académica
 *
 * Funcionalidades:
 * - Subida de fotos de estudiantes
 * - Validación de tipos de archivo
 * - Redimensionamiento de imágenes
 * - Almacenamiento seguro de archivos
 * - Generación de URLs de acceso
 * - Eliminación de archivos
 * - Backup de archivos importantes
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cleanupTempFiles = exports.getFileStats = exports.restoreStudentPhoto = exports.backupStudentPhoto = exports.deleteStudentPhoto = exports.getStudentPhotoInfo = exports.processStudentPhoto = exports.upload = exports.BACKUP_DIR = exports.STUDENT_PHOTOS_DIR = exports.UPLOAD_DIR = void 0;
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const sharp_1 = __importDefault(require("sharp"));
const crypto_1 = __importDefault(require("crypto"));
const errors_1 = require("../config/errors");
// Configuración de directorios
exports.UPLOAD_DIR = path_1.default.join(process.cwd(), 'uploads');
exports.STUDENT_PHOTOS_DIR = path_1.default.join(exports.UPLOAD_DIR, 'students');
exports.BACKUP_DIR = path_1.default.join(exports.UPLOAD_DIR, 'backup');
// Crear directorios si no existen
const ensureDirectories = () => {
    [exports.UPLOAD_DIR, exports.STUDENT_PHOTOS_DIR, exports.BACKUP_DIR].forEach(dir => {
        if (!fs_1.default.existsSync(dir)) {
            fs_1.default.mkdirSync(dir, { recursive: true });
        }
    });
};
// Configuración de multer para subida de archivos
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        ensureDirectories();
        cb(null, exports.STUDENT_PHOTOS_DIR);
    },
    filename: (req, file, cb) => {
        // Generar nombre único para el archivo
        const uniqueSuffix = crypto_1.default.randomBytes(16).toString('hex');
        const extension = path_1.default.extname(file.originalname);
        cb(null, `student_${uniqueSuffix}${extension}`);
    }
});
// Filtro para validar tipos de archivo
const fileFilter = (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    }
    else {
        cb(new Error('Tipo de archivo no permitido. Solo se permiten imágenes (JPEG, PNG, WebP)'));
    }
};
// Configuración de multer
exports.upload = (0, multer_1.default)({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB máximo
        files: 1 // Solo un archivo por vez
    }
});
/**
 * Función para procesar y optimizar imagen de estudiante
 *
 * @param filePath - Ruta del archivo original
 * @param filename - Nombre del archivo
 * @returns Promise<FileUploadResult> - Resultado del procesamiento
 */
const processStudentPhoto = async (filePath, filename) => {
    try {
        const originalName = filename;
        const stats = fs_1.default.statSync(filePath);
        const mimetype = 'image/jpeg'; // Siempre convertimos a JPEG
        // Crear versión optimizada (máximo 800x800px)
        const optimizedPath = path_1.default.join(exports.STUDENT_PHOTOS_DIR, `optimized_${filename}`);
        await (0, sharp_1.default)(filePath)
            .resize(800, 800, {
            fit: 'inside',
            withoutEnlargement: true
        })
            .jpeg({ quality: 85 })
            .toFile(optimizedPath);
        // Crear thumbnail (200x200px)
        const thumbnailPath = path_1.default.join(exports.STUDENT_PHOTOS_DIR, `thumb_${filename}`);
        await (0, sharp_1.default)(filePath)
            .resize(200, 200, {
            fit: 'cover',
            position: 'center'
        })
            .jpeg({ quality: 80 })
            .toFile(thumbnailPath);
        // Eliminar archivo original
        fs_1.default.unlinkSync(filePath);
        // Renombrar archivo optimizado
        const finalPath = path_1.default.join(exports.STUDENT_PHOTOS_DIR, filename);
        fs_1.default.renameSync(optimizedPath, finalPath);
        const finalStats = fs_1.default.statSync(finalPath);
        return {
            filename,
            originalName,
            size: finalStats.size,
            mimetype,
            url: `/api/files/students/${filename}`,
            thumbnailUrl: `/api/files/students/thumb_${filename}`
        };
    }
    catch (error) {
        throw errors_1.createError.internal('Error al procesar la imagen del estudiante');
    }
};
exports.processStudentPhoto = processStudentPhoto;
/**
 * Función para obtener información de una foto de estudiante
 *
 * @param filename - Nombre del archivo
 * @returns Promise<StudentPhoto | null> - Información de la foto
 */
const getStudentPhotoInfo = async (filename) => {
    try {
        const filePath = path_1.default.join(exports.STUDENT_PHOTOS_DIR, filename);
        if (!fs_1.default.existsSync(filePath)) {
            return null;
        }
        const stats = fs_1.default.statSync(filePath);
        return {
            id: 0, // Se asignará desde la base de datos
            filename,
            originalName: filename,
            url: `/api/files/students/${filename}`,
            thumbnailUrl: `/api/files/students/thumb_${filename}`,
            size: stats.size,
            uploadedAt: stats.birthtime,
            studentId: 0 // Se asignará desde la base de datos
        };
    }
    catch (error) {
        return null;
    }
};
exports.getStudentPhotoInfo = getStudentPhotoInfo;
/**
 * Función para eliminar foto de estudiante
 *
 * @param filename - Nombre del archivo
 * @returns Promise<boolean> - True si se eliminó correctamente
 */
const deleteStudentPhoto = async (filename) => {
    try {
        const filePath = path_1.default.join(exports.STUDENT_PHOTOS_DIR, filename);
        const thumbnailPath = path_1.default.join(exports.STUDENT_PHOTOS_DIR, `thumb_${filename}`);
        let deleted = false;
        if (fs_1.default.existsSync(filePath)) {
            fs_1.default.unlinkSync(filePath);
            deleted = true;
        }
        if (fs_1.default.existsSync(thumbnailPath)) {
            fs_1.default.unlinkSync(thumbnailPath);
        }
        return deleted;
    }
    catch (error) {
        return false;
    }
};
exports.deleteStudentPhoto = deleteStudentPhoto;
/**
 * Función para crear backup de foto de estudiante
 *
 * @param filename - Nombre del archivo
 * @returns Promise<string> - Ruta del archivo de backup
 */
const backupStudentPhoto = async (filename) => {
    try {
        const sourcePath = path_1.default.join(exports.STUDENT_PHOTOS_DIR, filename);
        const backupPath = path_1.default.join(exports.BACKUP_DIR, `backup_${Date.now()}_${filename}`);
        if (fs_1.default.existsSync(sourcePath)) {
            fs_1.default.copyFileSync(sourcePath, backupPath);
            return backupPath;
        }
        throw new Error('Archivo no encontrado');
    }
    catch (error) {
        throw errors_1.createError.internal('Error al crear backup de la foto');
    }
};
exports.backupStudentPhoto = backupStudentPhoto;
/**
 * Función para restaurar foto desde backup
 *
 * @param backupPath - Ruta del archivo de backup
 * @param filename - Nombre del archivo destino
 * @returns Promise<boolean> - True si se restauró correctamente
 */
const restoreStudentPhoto = async (backupPath, filename) => {
    try {
        const destPath = path_1.default.join(exports.STUDENT_PHOTOS_DIR, filename);
        if (fs_1.default.existsSync(backupPath)) {
            fs_1.default.copyFileSync(backupPath, destPath);
            return true;
        }
        return false;
    }
    catch (error) {
        return false;
    }
};
exports.restoreStudentPhoto = restoreStudentPhoto;
/**
 * Función para obtener estadísticas de archivos
 *
 * @returns Promise<any> - Estadísticas de archivos
 */
const getFileStats = async () => {
    try {
        const files = fs_1.default.readdirSync(exports.STUDENT_PHOTOS_DIR);
        const totalSize = files.reduce((size, file) => {
            const filePath = path_1.default.join(exports.STUDENT_PHOTOS_DIR, file);
            const stats = fs_1.default.statSync(filePath);
            return size + stats.size;
        }, 0);
        return {
            totalFiles: files.length,
            totalSize,
            totalSizeMB: Math.round(totalSize / (1024 * 1024) * 100) / 100,
            directory: exports.STUDENT_PHOTOS_DIR
        };
    }
    catch (error) {
        return {
            totalFiles: 0,
            totalSize: 0,
            totalSizeMB: 0,
            directory: exports.STUDENT_PHOTOS_DIR
        };
    }
};
exports.getFileStats = getFileStats;
/**
 * Función para limpiar archivos temporales
 *
 * @returns Promise<number> - Número de archivos eliminados
 */
const cleanupTempFiles = async () => {
    try {
        const files = fs_1.default.readdirSync(exports.STUDENT_PHOTOS_DIR);
        let deletedCount = 0;
        files.forEach(file => {
            // Eliminar archivos temporales (que empiecen con temp_)
            if (file.startsWith('temp_')) {
                const filePath = path_1.default.join(exports.STUDENT_PHOTOS_DIR, file);
                try {
                    fs_1.default.unlinkSync(filePath);
                    deletedCount++;
                }
                catch (error) {
                    // Ignorar errores de archivos individuales
                }
            }
        });
        return deletedCount;
    }
    catch (error) {
        return 0;
    }
};
exports.cleanupTempFiles = cleanupTempFiles;
