"use strict";
/**
 * ========================================
 * SERVICIO DE BACKUP Y RESPALDO (CORREGIDO PARA WINDOWS)
 * ========================================
 * * Este servicio maneja las copias de seguridad automáticas.
 * * CORRECCIÓN: Se usa zlib (nativo de Node) en lugar de 'gzip' (comando Linux).
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyBackupIntegrity = exports.getBackupStats = exports.deleteBackup = exports.restoreBackup = exports.listBackups = exports.createBackup = exports.startAutomaticBackups = exports.backupService = exports.BACKUP_DIR = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const crypto_1 = __importDefault(require("crypto"));
const errors_1 = require("../config/errors");
// --- NUEVAS IMPORTACIONES PARA COMPRESIÓN NATIVA ---
const zlib_1 = __importDefault(require("zlib"));
const stream_1 = require("stream");
const util_1 = require("util");
// Promisify pipeline para usar async/await
const pipe = (0, util_1.promisify)(stream_1.pipeline);
// Configuración de directorios
exports.BACKUP_DIR = path_1.default.join(process.cwd(), 'backups');
// Crear directorio de backups si no existe
if (!fs_1.default.existsSync(exports.BACKUP_DIR)) {
    fs_1.default.mkdirSync(exports.BACKUP_DIR, { recursive: true });
}
class BackupService {
    constructor(config = {}) {
        this.isRunning = false;
        this.config = {
            backupDir: config.backupDir || path_1.default.join(process.cwd(), 'backups'),
            maxBackups: config.maxBackups || 30,
            compressionEnabled: config.compressionEnabled ?? true,
            encryptionEnabled: config.encryptionEnabled ?? false,
            encryptionKey: config.encryptionKey || process.env.BACKUP_ENCRYPTION_KEY
        };
        this.ensureBackupDirectory();
    }
    ensureBackupDirectory() {
        if (!fs_1.default.existsSync(this.config.backupDir)) {
            fs_1.default.mkdirSync(this.config.backupDir, { recursive: true });
            console.log(`📁 Directorio de backup creado: ${this.config.backupDir}`);
        }
    }
    // Crear backup de la base de datos SQLite
    async createDatabaseBackup() {
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
        const dbPath = path_1.default.join(process.cwd(), 'prisma', 'dev.db');
        const backupFilename = `backup_${dateStr}_${timeStr}.db`;
        const backupPath = path_1.default.join(this.config.backupDir, backupFilename);
        let finalPath = backupPath; // Ruta final (puede ser .gz o .enc)
        try {
            // Verificar que la base de datos existe
            if (!fs_1.default.existsSync(dbPath)) {
                console.warn(`⚠️ Base de datos no encontrada en: ${dbPath}. Saltando backup.`);
                this.isRunning = false;
                return { success: false, filename: '', size: 0, timestamp, error: 'DB not found' };
            }
            // Copiar archivo de base de datos
            fs_1.default.copyFileSync(dbPath, backupPath);
            // Comprimir si está habilitado (CORREGIDO)
            if (this.config.compressionEnabled) {
                finalPath = await this.compressBackup(backupPath);
                // Eliminar archivo original sin comprimir
                if (fs_1.default.existsSync(backupPath))
                    fs_1.default.unlinkSync(backupPath);
            }
            // Encriptar si está habilitado
            if (this.config.encryptionEnabled && this.config.encryptionKey) {
                finalPath = await this.encryptBackup(finalPath);
            }
            const stats = fs_1.default.statSync(finalPath);
            console.log(`✅ Backup creado exitosamente: ${path_1.default.basename(finalPath)} (${this.formatBytes(stats.size)})`);
            // Limpiar backups antiguos
            await this.cleanupOldBackups();
            return {
                success: true,
                filename: path_1.default.basename(finalPath),
                size: stats.size,
                timestamp
            };
        }
        catch (error) {
            console.error('❌ Error creando backup:', error.message);
            // Si algo falló, borrar archivos temporales si existen
            if (fs_1.default.existsSync(backupPath))
                fs_1.default.unlinkSync(backupPath);
            if (fs_1.default.existsSync(backupPath + '.gz'))
                fs_1.default.unlinkSync(backupPath + '.gz');
            return {
                success: false,
                filename: '',
                size: 0,
                timestamp,
                error: error instanceof Error ? error.message : 'Error desconocido'
            };
        }
        finally {
            this.isRunning = false;
        }
    }
    // --- CORRECCIÓN 1: Comprimir usando zlib (Nativo Node.js) ---
    async compressBackup(filePath) {
        const compressedPath = filePath + '.gz';
        try {
            console.log("Iniciando compresión (zlib)...");
            const source = fs_1.default.createReadStream(filePath);
            const destination = fs_1.default.createWriteStream(compressedPath);
            const gzip = zlib_1.default.createGzip();
            await pipe(source, gzip, destination);
            console.log("Compresión (zlib) finalizada.");
            return compressedPath;
        }
        catch (error) {
            throw new Error(`Error comprimiendo backup (zlib): ${error.message}`);
        }
    }
    // --- CORRECCIÓN 2: Descomprimir usando zlib ---
    async decompressBackup(filePath) {
        const decompressedPath = filePath.replace('.gz', '');
        try {
            const source = fs_1.default.createReadStream(filePath);
            const destination = fs_1.default.createWriteStream(decompressedPath);
            const gunzip = zlib_1.default.createGunzip();
            await pipe(source, gunzip, destination);
            return decompressedPath;
        }
        catch (error) {
            throw new Error(`Error descomprimiendo backup (zlib): ${error.message}`);
        }
    }
    // Encriptar backup (Tu código original)
    async encryptBackup(filePath) {
        if (!this.config.encryptionKey) {
            throw new Error('Clave de encriptación no configurada');
        }
        const encryptedPath = filePath + '.enc';
        const algorithm = 'aes-256-cbc';
        const key = crypto_1.default.scryptSync(this.config.encryptionKey, 'salt', 32);
        const iv = crypto_1.default.randomBytes(16);
        try {
            const cipher = crypto_1.default.createCipheriv(algorithm, key, iv);
            const input = fs_1.default.createReadStream(filePath);
            const output = fs_1.default.createWriteStream(encryptedPath);
            output.write(iv); // Escribir IV al inicio del archivo
            input.pipe(cipher).pipe(output);
            return new Promise((resolve, reject) => {
                output.on('finish', () => {
                    if (fs_1.default.existsSync(filePath))
                        fs_1.default.unlinkSync(filePath);
                    resolve(encryptedPath);
                });
                output.on('error', reject);
            });
        }
        catch (error) {
            throw new Error(`Error encriptando backup: ${error.message}`);
        }
    }
    // Desencriptar backup (Tu código original)
    async decryptBackup(filePath) {
        if (!this.config.encryptionKey) {
            throw new Error('Clave de encriptación no configurada');
        }
        const decryptedPath = filePath.replace('.enc', '');
        const algorithm = 'aes-256-cbc';
        const key = crypto_1.default.scryptSync(this.config.encryptionKey, 'salt', 32);
        try {
            const data = fs_1.default.readFileSync(filePath);
            const iv = data.slice(0, 16);
            const encrypted = data.slice(16);
            const decipher = crypto_1.default.createDecipheriv(algorithm, key, iv);
            const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
            fs_1.default.writeFileSync(decryptedPath, decrypted);
            return decryptedPath;
        }
        catch (error) {
            throw new Error(`Error desencriptando backup: ${error.message}`);
        }
    }
    // Limpiar backups antiguos
    async cleanupOldBackups() {
        try {
            const files = fs_1.default.readdirSync(this.config.backupDir)
                .filter(file => file.startsWith('backup_'))
                .map(file => ({
                name: file,
                path: path_1.default.join(this.config.backupDir, file),
                stats: fs_1.default.statSync(path_1.default.join(this.config.backupDir, file))
            }))
                .sort((a, b) => b.stats.mtime.getTime() - a.stats.mtime.getTime());
            if (files.length > this.config.maxBackups) {
                const filesToDelete = files.slice(this.config.maxBackups);
                for (const file of filesToDelete) {
                    fs_1.default.unlinkSync(file.path);
                    console.log(`🗑️ Backup antiguo eliminado: ${file.name}`);
                }
            }
        }
        catch (error) {
            console.error('Error limpiando backups antiguos:', error.message);
        }
    }
    // Listar backups
    listBackups() {
        try {
            if (!fs_1.default.existsSync(this.config.backupDir))
                return [];
            return fs_1.default.readdirSync(this.config.backupDir)
                .filter(file => file.startsWith('backup_'))
                .map(file => {
                const filePath = path_1.default.join(this.config.backupDir, file);
                const stats = fs_1.default.statSync(filePath);
                return {
                    filename: file,
                    size: stats.size,
                    created: stats.birthtime,
                    compressed: file.endsWith('.gz'),
                    encrypted: file.endsWith('.enc')
                };
            })
                .sort((a, b) => b.created.getTime() - a.created.getTime());
        }
        catch (error) {
            console.error('Error listando backups:', error.message);
            return [];
        }
    }
    // Restaurar backup
    async restoreBackup(filename) {
        try {
            const backupPath = path_1.default.join(this.config.backupDir, filename);
            if (!fs_1.default.existsSync(backupPath)) {
                throw new Error(`Backup no encontrado: ${filename}`);
            }
            const dbPath = path_1.default.join(process.cwd(), 'prisma', 'dev.db');
            const currentBackup = `pre_restore_${Date.now()}.db`;
            if (fs_1.default.existsSync(dbPath)) {
                fs_1.default.copyFileSync(dbPath, path_1.default.join(this.config.backupDir, currentBackup));
            }
            let sourcePath = backupPath;
            if (filename.endsWith('.enc')) {
                sourcePath = await this.decryptBackup(backupPath);
            }
            if (filename.endsWith('.gz') || sourcePath.endsWith('.gz')) {
                sourcePath = await this.decompressBackup(sourcePath);
            }
            fs_1.default.copyFileSync(sourcePath, dbPath);
            if (sourcePath !== backupPath && fs_1.default.existsSync(sourcePath)) {
                fs_1.default.unlinkSync(sourcePath);
            }
            console.log(`✅ Backup restaurado exitosamente: ${filename}`);
            return { success: true };
        }
        catch (error) {
            console.error('❌ Error restaurando backup:', error.message);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Error desconocido'
            };
        }
    }
    // Formatear bytes
    formatBytes(bytes) {
        if (bytes === 0)
            return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
    // Stats
    getBackupStats() {
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
exports.backupService = new BackupService();
// Función de inicio automático
const startAutomaticBackups = (intervalHours = 24) => {
    const intervalMs = intervalHours * 60 * 60 * 1000;
    console.log(`🔄 Iniciando backups automáticos cada ${intervalHours} horas`);
    // Ejecutar uno al inicio para probar (puedes comentar esto después)
    setTimeout(() => exports.backupService.createDatabaseBackup(), 5000); // Espera 5 seg
    setInterval(async () => {
        try {
            await exports.backupService.createDatabaseBackup();
        }
        catch (error) {
            console.error('Error en backup automático:', error.message);
        }
    }, intervalMs);
};
exports.startAutomaticBackups = startAutomaticBackups;
// --- EXPORTACIONES PARA TU CONTROLADOR ---
const createBackup = async () => {
    const result = await exports.backupService.createDatabaseBackup();
    if (!result.success)
        throw new Error(result.error);
    return result.filename;
};
exports.createBackup = createBackup;
const listBackups = async () => {
    return exports.backupService.listBackups().map(b => b.filename);
};
exports.listBackups = listBackups;
const restoreBackup = async (filename) => {
    const result = await exports.backupService.restoreBackup(filename);
    if (!result.success)
        throw new Error(result.error);
};
exports.restoreBackup = restoreBackup;
const deleteBackup = async (filename) => {
    const filePath = path_1.default.join(exports.BACKUP_DIR, filename);
    if (!fs_1.default.existsSync(filePath)) {
        throw errors_1.createError.notFound('Archivo no encontrado');
    }
    fs_1.default.unlinkSync(filePath);
};
exports.deleteBackup = deleteBackup;
const getBackupStats = async () => {
    return exports.backupService.getBackupStats();
};
exports.getBackupStats = getBackupStats;
const verifyBackupIntegrity = async (filename) => {
    const filePath = path_1.default.join(exports.BACKUP_DIR, filename);
    if (!fs_1.default.existsSync(filePath))
        return false;
    const stats = fs_1.default.statSync(filePath);
    return stats.size > 0;
};
exports.verifyBackupIntegrity = verifyBackupIntegrity;
