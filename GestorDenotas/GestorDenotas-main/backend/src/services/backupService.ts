/**
 * ========================================
 * SERVICIO DE BACKUP Y RESPALDO (CORREGIDO PARA WINDOWS)
 * ========================================
 * * Este servicio maneja las copias de seguridad automáticas.
 * * CORRECCIÓN: Se usa zlib (nativo de Node) en lugar de 'gzip' (comando Linux).
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { createError } from '../config/errors';

// --- NUEVAS IMPORTACIONES PARA COMPRESIÓN NATIVA ---
import zlib from 'zlib'; 
import { pipeline } from 'stream';
import { promisify } from 'util';

// Promisify pipeline para usar async/await
const pipe = promisify(pipeline);

// Configuración de directorios
export const BACKUP_DIR = path.join(process.cwd(), 'backups');

// Crear directorio de backups si no existe
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

interface BackupConfig {
  backupDir: string;
  maxBackups: number;
  compressionEnabled: boolean;
  encryptionEnabled: boolean;
  encryptionKey?: string;
}

interface BackupResult {
  success: boolean;
  filename: string;
  size: number;
  timestamp: Date;
  error?: string;
}

class BackupService {
  private config: BackupConfig;
  private isRunning: boolean = false;

  constructor(config: Partial<BackupConfig> = {}) {
    this.config = {
      backupDir: config.backupDir || path.join(process.cwd(), 'backups'),
      maxBackups: config.maxBackups || 30,
      compressionEnabled: config.compressionEnabled ?? true,
      encryptionEnabled: config.encryptionEnabled ?? false,
      encryptionKey: config.encryptionKey || process.env.BACKUP_ENCRYPTION_KEY
    };
    
    this.ensureBackupDirectory();
  }

  private ensureBackupDirectory(): void {
    if (!fs.existsSync(this.config.backupDir)) {
      fs.mkdirSync(this.config.backupDir, { recursive: true });
      console.log(`📁 Directorio de backup creado: ${this.config.backupDir}`);
    }
  }

  // Crear backup de la base de datos SQLite
  async createDatabaseBackup(): Promise<BackupResult> {
    if (this.isRunning) {
      // Si ya está corriendo, salta esta ejecución para evitar colisiones
      return { 
        success: false, 
        filename: '', 
        size: 0, 
        timestamp: new Date(), 
        error: 'Backup ya está en progreso' 
      };
    }

    this.isRunning = true;
    const timestamp = new Date();
    const dateStr = timestamp.toISOString().replace(/[:.]/g, '-').split('T')[0];
    const timeStr = timestamp.toTimeString().split(' ')[0].replace(/:/g, '-');
    
    // Ruta de la base de datos (Asumiendo que está en /prisma/dev.db)
    const dbPath = path.join(process.cwd(), 'prisma', 'dev.db');
    const backupFilename = `backup_${dateStr}_${timeStr}.db`;
    const backupPath = path.join(this.config.backupDir, backupFilename);
    let finalPath = backupPath; // Ruta final (puede ser .gz o .enc)

    try {
      // Verificar que la base de datos existe
      if (!fs.existsSync(dbPath)) {
        console.warn(`⚠️ Base de datos no encontrada en: ${dbPath}. Saltando backup.`);
        this.isRunning = false;
        return { success: false, filename: '', size: 0, timestamp, error: 'DB not found' };
      }
      
      // Copiar archivo de base de datos
      fs.copyFileSync(dbPath, backupPath);
      
      // Comprimir si está habilitado (CORREGIDO)
      if (this.config.compressionEnabled) {
        finalPath = await this.compressBackup(backupPath);
        // Eliminar archivo original sin comprimir
        if (fs.existsSync(backupPath)) fs.unlinkSync(backupPath);
      }

      // Encriptar si está habilitado
      if (this.config.encryptionEnabled && this.config.encryptionKey) {
        finalPath = await this.encryptBackup(finalPath);
      }

      const stats = fs.statSync(finalPath);
      console.log(`✅ Backup creado exitosamente: ${path.basename(finalPath)} (${this.formatBytes(stats.size)})`);
      
      // Limpiar backups antiguos
      await this.cleanupOldBackups();
      
      return {
        success: true,
        filename: path.basename(finalPath),
        size: stats.size,
        timestamp
      };

    } catch (error: any) {
      console.error('❌ Error creando backup:', error.message);
      // Si algo falló, borrar archivos temporales si existen
      if (fs.existsSync(backupPath)) fs.unlinkSync(backupPath);
      if (fs.existsSync(backupPath + '.gz')) fs.unlinkSync(backupPath + '.gz');
      
      return {
        success: false,
        filename: '',
        size: 0,
        timestamp,
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
    } finally {
      this.isRunning = false;
    }
  }

  // --- CORRECCIÓN 1: Comprimir usando zlib (Nativo Node.js) ---
  private async compressBackup(filePath: string): Promise<string> {
    const compressedPath = filePath + '.gz';
    
    try {
      console.log("Iniciando compresión (zlib)...");
      const source = fs.createReadStream(filePath);
      const destination = fs.createWriteStream(compressedPath);
      const gzip = zlib.createGzip();

      await pipe(source, gzip, destination);
      console.log("Compresión (zlib) finalizada.");
      return compressedPath;
    } catch (error: any) {
      throw new Error(`Error comprimiendo backup (zlib): ${error.message}`);
    }
  }

  // --- CORRECCIÓN 2: Descomprimir usando zlib ---
  private async decompressBackup(filePath: string): Promise<string> {
    const decompressedPath = filePath.replace('.gz', '');
    
    try {
      const source = fs.createReadStream(filePath);
      const destination = fs.createWriteStream(decompressedPath);
      const gunzip = zlib.createGunzip();

      await pipe(source, gunzip, destination);
      return decompressedPath;
    } catch (error: any) {
      throw new Error(`Error descomprimiendo backup (zlib): ${error.message}`);
    }
  }

  // Encriptar backup (Tu código original)
  private async encryptBackup(filePath: string): Promise<string> {
    if (!this.config.encryptionKey) {
      throw new Error('Clave de encriptación no configurada');
    }

    const encryptedPath = filePath + '.enc';
    const algorithm = 'aes-256-cbc';
    const key = crypto.scryptSync(this.config.encryptionKey, 'salt', 32);
    const iv = crypto.randomBytes(16);

    try {
      const cipher = crypto.createCipheriv(algorithm, key, iv);
      const input = fs.createReadStream(filePath);
      const output = fs.createWriteStream(encryptedPath);
      output.write(iv); // Escribir IV al inicio del archivo
      input.pipe(cipher).pipe(output);

      return new Promise((resolve, reject) => {
        output.on('finish', () => {
          if(fs.existsSync(filePath)) fs.unlinkSync(filePath);
          resolve(encryptedPath);
        });
        output.on('error', reject);
      });
    } catch (error: any) {
      throw new Error(`Error encriptando backup: ${error.message}`);
    }
  }

  // Desencriptar backup (Tu código original)
  private async decryptBackup(filePath: string): Promise<string> {
    if (!this.config.encryptionKey) {
      throw new Error('Clave de encriptación no configurada');
    }

    const decryptedPath = filePath.replace('.enc', '');
    const algorithm = 'aes-256-cbc';
    const key = crypto.scryptSync(this.config.encryptionKey, 'salt', 32);

    try {
      const data = fs.readFileSync(filePath);
      const iv = data.slice(0, 16);
      const encrypted = data.slice(16);
      
      const decipher = crypto.createDecipheriv(algorithm, key, iv);
      const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
      
      fs.writeFileSync(decryptedPath, decrypted);
      return decryptedPath;
    } catch (error: any) {
      throw new Error(`Error desencriptando backup: ${error.message}`);
    }
  }

  // Limpiar backups antiguos
  private async cleanupOldBackups(): Promise<void> {
    try {
      const files = fs.readdirSync(this.config.backupDir)
        .filter(file => file.startsWith('backup_'))
        .map(file => ({
          name: file,
          path: path.join(this.config.backupDir, file),
          stats: fs.statSync(path.join(this.config.backupDir, file))
        }))
        .sort((a, b) => b.stats.mtime.getTime() - a.stats.mtime.getTime());

      if (files.length > this.config.maxBackups) {
        const filesToDelete = files.slice(this.config.maxBackups);
        for (const file of filesToDelete) {
          fs.unlinkSync(file.path);
          console.log(`🗑️ Backup antiguo eliminado: ${file.name}`);
        }
      }
    } catch (error: any) {
      console.error('Error limpiando backups antiguos:', error.message);
    }
  }

  // Listar backups
  listBackups(): Array<{ filename: string; size: number; created: Date; compressed: boolean; encrypted: boolean }> {
    try {
      if (!fs.existsSync(this.config.backupDir)) return [];
      
      return fs.readdirSync(this.config.backupDir)
        .filter(file => file.startsWith('backup_'))
        .map(file => {
          const filePath = path.join(this.config.backupDir, file);
          const stats = fs.statSync(filePath);
          return {
            filename: file,
            size: stats.size,
            created: stats.birthtime,
            compressed: file.endsWith('.gz'),
            encrypted: file.endsWith('.enc')
          };
        })
        .sort((a, b) => b.created.getTime() - a.created.getTime());
    } catch (error: any) {
      console.error('Error listando backups:', error.message);
      return [];
    }
  }

  // Restaurar backup
  async restoreBackup(filename: string): Promise<{ success: boolean; error?: string }> {
    try {
      const backupPath = path.join(this.config.backupDir, filename);
      if (!fs.existsSync(backupPath)) {
        throw new Error(`Backup no encontrado: ${filename}`);
      }
      const dbPath = path.join(process.cwd(), 'prisma', 'dev.db');
      
      const currentBackup = `pre_restore_${Date.now()}.db`;
      if (fs.existsSync(dbPath)) {
        fs.copyFileSync(dbPath, path.join(this.config.backupDir, currentBackup));
      }

      let sourcePath = backupPath;

      if (filename.endsWith('.enc')) {
        sourcePath = await this.decryptBackup(backupPath);
      }
      if (filename.endsWith('.gz') || sourcePath.endsWith('.gz')) {
        sourcePath = await this.decompressBackup(sourcePath);
      }

      fs.copyFileSync(sourcePath, dbPath);

      if (sourcePath !== backupPath && fs.existsSync(sourcePath)) {
        fs.unlinkSync(sourcePath);
      }

      console.log(`✅ Backup restaurado exitosamente: ${filename}`);
      return { success: true };

    } catch (error: any) {
      console.error('❌ Error restaurando backup:', error.message);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
  }

  // Formatear bytes
  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // Stats
  getBackupStats(): any {
    const backups = this.listBackups();
    if (backups.length === 0) {
      return { totalBackups: 0, totalSize: 0, averageSize: 0 };
    }
    const totalSize = backups.reduce((sum, backup) => sum + backup.size, 0);
    const oldestBackup = backups[backups.length - 1]?.created;
    const newestBackup = backups[0]?.created;
    return {
      totalBackups: backups.length,
      totalSize,
      oldestBackup,
      newestBackup,
      averageSize: totalSize / backups.length
    };
  }
}

// Instancia singleton
export const backupService = new BackupService();

// Función de inicio automático
export const startAutomaticBackups = (intervalHours: number = 24) => {
  const intervalMs = intervalHours * 60 * 60 * 1000;
  console.log(`🔄 Iniciando backups automáticos cada ${intervalHours} horas`);
  
  // Ejecutar uno al inicio para probar (puedes comentar esto después)
  setTimeout(() => backupService.createDatabaseBackup(), 5000); // Espera 5 seg
  
  setInterval(async () => {
    try {
      await backupService.createDatabaseBackup();
    } catch (error: any) {
      console.error('Error en backup automático:', error.message);
    }
  }, intervalMs);
};

// --- EXPORTACIONES PARA TU CONTROLADOR ---
export const createBackup = async (): Promise<string> => {
  const result = await backupService.createDatabaseBackup();
  if (!result.success) throw new Error(result.error);
  return result.filename;
};
export const listBackups = async (): Promise<string[]> => {
  return backupService.listBackups().map(b => b.filename);
};
export const restoreBackup = async (filename: string): Promise<void> => {
  const result = await backupService.restoreBackup(filename);
  if (!result.success) throw new Error(result.error);
};
export const deleteBackup = async (filename: string): Promise<void> => {
  const filePath = path.join(BACKUP_DIR, filename);
  if (!fs.existsSync(filePath)) {
    throw createError.notFound('Archivo no encontrado');
  }
  fs.unlinkSync(filePath);
};
export const getBackupStats = async (): Promise<any> => {
  return backupService.getBackupStats();
};
export const verifyBackupIntegrity = async (filename: string): Promise<boolean> => {
  const filePath = path.join(BACKUP_DIR, filename);
  if (!fs.existsSync(filePath)) return false;
  const stats = fs.statSync(filePath);
  return stats.size > 0;
};