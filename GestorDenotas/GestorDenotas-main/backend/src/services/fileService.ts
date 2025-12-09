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

import multer from 'multer';
import path from 'path';
import fs from 'fs';
import sharp from 'sharp';
import crypto from 'crypto';
import { createError } from '../config/errors';

// Configuración de directorios
export const UPLOAD_DIR = path.join(process.cwd(), 'uploads');
export const STUDENT_PHOTOS_DIR = path.join(UPLOAD_DIR, 'students');
export const BACKUP_DIR = path.join(UPLOAD_DIR, 'backup');

// Crear directorios si no existen
const ensureDirectories = () => {
  [UPLOAD_DIR, STUDENT_PHOTOS_DIR, BACKUP_DIR].forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
};

// Configuración de multer para subida de archivos
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    ensureDirectories();
    cb(null, STUDENT_PHOTOS_DIR);
  },
  filename: (req, file, cb) => {
    // Generar nombre único para el archivo
    const uniqueSuffix = crypto.randomBytes(16).toString('hex');
    const extension = path.extname(file.originalname);
    cb(null, `student_${uniqueSuffix}${extension}`);
  }
});

// Filtro para validar tipos de archivo
const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Tipo de archivo no permitido. Solo se permiten imágenes (JPEG, PNG, WebP)'));
  }
};

// Configuración de multer
export const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB máximo
    files: 1 // Solo un archivo por vez
  }
});

// Interfaces
export interface FileUploadResult {
  filename: string;
  originalName: string;
  size: number;
  mimetype: string;
  url: string;
  thumbnailUrl: string;
}

export interface StudentPhoto {
  id: number;
  filename: string;
  originalName: string;
  url: string;
  thumbnailUrl: string;
  size: number;
  uploadedAt: Date;
  studentId: number;
}

/**
 * Función para procesar y optimizar imagen de estudiante
 * 
 * @param filePath - Ruta del archivo original
 * @param filename - Nombre del archivo
 * @returns Promise<FileUploadResult> - Resultado del procesamiento
 */
export const processStudentPhoto = async (filePath: string, filename: string): Promise<FileUploadResult> => {
  try {
    const originalName = filename;
    const stats = fs.statSync(filePath);
    const mimetype = 'image/jpeg'; // Siempre convertimos a JPEG
    
    // Crear versión optimizada (máximo 800x800px)
    const optimizedPath = path.join(STUDENT_PHOTOS_DIR, `optimized_${filename}`);
    await sharp(filePath)
      .resize(800, 800, { 
        fit: 'inside',
        withoutEnlargement: true 
      })
      .jpeg({ quality: 85 })
      .toFile(optimizedPath);
    
    // Crear thumbnail (200x200px)
    const thumbnailPath = path.join(STUDENT_PHOTOS_DIR, `thumb_${filename}`);
    await sharp(filePath)
      .resize(200, 200, { 
        fit: 'cover',
        position: 'center'
      })
      .jpeg({ quality: 80 })
      .toFile(thumbnailPath);
    
    // Eliminar archivo original
    fs.unlinkSync(filePath);
    
    // Renombrar archivo optimizado
    const finalPath = path.join(STUDENT_PHOTOS_DIR, filename);
    fs.renameSync(optimizedPath, finalPath);
    
    const finalStats = fs.statSync(finalPath);
    
    return {
      filename,
      originalName,
      size: finalStats.size,
      mimetype,
      url: `/api/files/students/${filename}`,
      thumbnailUrl: `/api/files/students/thumb_${filename}`
    };
    
  } catch (error) {
    throw createError.internal('Error al procesar la imagen del estudiante');
  }
};

/**
 * Función para obtener información de una foto de estudiante
 * 
 * @param filename - Nombre del archivo
 * @returns Promise<StudentPhoto | null> - Información de la foto
 */
export const getStudentPhotoInfo = async (filename: string): Promise<StudentPhoto | null> => {
  try {
    const filePath = path.join(STUDENT_PHOTOS_DIR, filename);
    
    if (!fs.existsSync(filePath)) {
      return null;
    }
    
    const stats = fs.statSync(filePath);
    
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
    
  } catch (error) {
    return null;
  }
};

/**
 * Función para eliminar foto de estudiante
 * 
 * @param filename - Nombre del archivo
 * @returns Promise<boolean> - True si se eliminó correctamente
 */
export const deleteStudentPhoto = async (filename: string): Promise<boolean> => {
  try {
    const filePath = path.join(STUDENT_PHOTOS_DIR, filename);
    const thumbnailPath = path.join(STUDENT_PHOTOS_DIR, `thumb_${filename}`);
    
    let deleted = false;
    
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      deleted = true;
    }
    
    if (fs.existsSync(thumbnailPath)) {
      fs.unlinkSync(thumbnailPath);
    }
    
    return deleted;
    
  } catch (error) {
    return false;
  }
};

/**
 * Función para crear backup de foto de estudiante
 * 
 * @param filename - Nombre del archivo
 * @returns Promise<string> - Ruta del archivo de backup
 */
export const backupStudentPhoto = async (filename: string): Promise<string> => {
  try {
    const sourcePath = path.join(STUDENT_PHOTOS_DIR, filename);
    const backupPath = path.join(BACKUP_DIR, `backup_${Date.now()}_${filename}`);
    
    if (fs.existsSync(sourcePath)) {
      fs.copyFileSync(sourcePath, backupPath);
      return backupPath;
    }
    
    throw new Error('Archivo no encontrado');
    
  } catch (error) {
    throw createError.internal('Error al crear backup de la foto');
  }
};

/**
 * Función para restaurar foto desde backup
 * 
 * @param backupPath - Ruta del archivo de backup
 * @param filename - Nombre del archivo destino
 * @returns Promise<boolean> - True si se restauró correctamente
 */
export const restoreStudentPhoto = async (backupPath: string, filename: string): Promise<boolean> => {
  try {
    const destPath = path.join(STUDENT_PHOTOS_DIR, filename);
    
    if (fs.existsSync(backupPath)) {
      fs.copyFileSync(backupPath, destPath);
      return true;
    }
    
    return false;
    
  } catch (error) {
    return false;
  }
};

/**
 * Función para obtener estadísticas de archivos
 * 
 * @returns Promise<any> - Estadísticas de archivos
 */
export const getFileStats = async (): Promise<any> => {
  try {
    const files = fs.readdirSync(STUDENT_PHOTOS_DIR);
    const totalSize = files.reduce((size, file) => {
      const filePath = path.join(STUDENT_PHOTOS_DIR, file);
      const stats = fs.statSync(filePath);
      return size + stats.size;
    }, 0);
    
    return {
      totalFiles: files.length,
      totalSize,
      totalSizeMB: Math.round(totalSize / (1024 * 1024) * 100) / 100,
      directory: STUDENT_PHOTOS_DIR
    };
    
  } catch (error) {
    return {
      totalFiles: 0,
      totalSize: 0,
      totalSizeMB: 0,
      directory: STUDENT_PHOTOS_DIR
    };
  }
};

/**
 * Función para limpiar archivos temporales
 * 
 * @returns Promise<number> - Número de archivos eliminados
 */
export const cleanupTempFiles = async (): Promise<number> => {
  try {
    const files = fs.readdirSync(STUDENT_PHOTOS_DIR);
    let deletedCount = 0;
    
    files.forEach(file => {
      // Eliminar archivos temporales (que empiecen con temp_)
      if (file.startsWith('temp_')) {
        const filePath = path.join(STUDENT_PHOTOS_DIR, file);
        try {
          fs.unlinkSync(filePath);
          deletedCount++;
        } catch (error) {
          // Ignorar errores de archivos individuales
        }
      }
    });
    
    return deletedCount;
    
  } catch (error) {
    return 0;
  }
};
