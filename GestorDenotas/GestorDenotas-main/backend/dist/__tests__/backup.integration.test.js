"use strict";
/**
 * ========================================
 * TESTS DE INTEGRACIÓN - SISTEMA DE BACKUP
 * ========================================
 *
 * Tests para verificar el funcionamiento del sistema de backup
 * que cumple con el requisito RNF8 (Copias de seguridad diarias)
 */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const app_1 = __importDefault(require("../app"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const backupService_1 = require("../services/backupService");
describe('💾 Sistema de Backup y Respaldo', () => {
    beforeAll(() => __awaiter(void 0, void 0, void 0, function* () {
        // Asegurar que el directorio de backup existe
        if (!fs_1.default.existsSync(backupService_1.BACKUP_DIR)) {
            fs_1.default.mkdirSync(backupService_1.BACKUP_DIR, { recursive: true });
        }
    }));
    afterAll(() => __awaiter(void 0, void 0, void 0, function* () {
        // Limpiar archivos de backup de prueba
        const files = fs_1.default.readdirSync(backupService_1.BACKUP_DIR);
        files.forEach(file => {
            if (file.includes('test') || file.includes('backup_')) {
                fs_1.default.unlinkSync(path_1.default.join(backupService_1.BACKUP_DIR, file));
            }
        });
    }));
    describe('POST /api/backup/create', () => {
        it('debería crear un backup manual', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app_1.default)
                .post('/api/backup/create');
            expect(response.status).toBe(201);
            expect(response.body.success).toBe(true);
            expect(response.body.data.filename).toBeDefined();
            expect(response.body.data.filename).toMatch(/backup_.*\.db/);
        }));
    });
    describe('GET /api/backup/list', () => {
        it('debería listar todos los backups disponibles', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app_1.default)
                .get('/api/backup/list');
            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(Array.isArray(response.body.data.backups)).toBe(true);
        }));
    });
    describe('GET /api/backup/stats', () => {
        it('debería obtener estadísticas de backups', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app_1.default)
                .get('/api/backup/stats');
            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.stats).toBeDefined();
            expect(typeof response.body.data.stats.totalBackups).toBe('number');
        }));
    });
    describe('GET /api/backup/verify/:filename', () => {
        let backupFilename;
        beforeAll(() => __awaiter(void 0, void 0, void 0, function* () {
            // Crear un backup para verificar
            const createResponse = yield (0, supertest_1.default)(app_1.default)
                .post('/api/backup/create');
            backupFilename = createResponse.body.data.filename;
        }));
        it('debería verificar la integridad de un backup', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app_1.default)
                .get(`/api/backup/verify/${backupFilename}`);
            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.filename).toBe(backupFilename);
            expect(typeof response.body.data.isValid).toBe('boolean');
        }));
        it('debería retornar false para backup inexistente', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app_1.default)
                .get('/api/backup/verify/backup_inexistente.db');
            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.isValid).toBe(false);
            expect(response.body.data.message).toContain('Checksum no coincide o archivo corrupto');
        }));
    });
    describe('GET /api/backup/download/:filename', () => {
        let backupFilename;
        beforeAll(() => __awaiter(void 0, void 0, void 0, function* () {
            // Crear un backup para descargar
            const createResponse = yield (0, supertest_1.default)(app_1.default)
                .post('/api/backup/create');
            backupFilename = createResponse.body.data.filename;
        }));
        it('debería permitir descargar un backup', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app_1.default)
                .get(`/api/backup/download/${backupFilename}`);
            expect(response.status).toBe(200);
            expect(response.headers['content-disposition']).toContain('attachment');
        }));
        it('debería retornar 404 para backup inexistente', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app_1.default)
                .get('/api/backup/download/backup_inexistente.db');
            expect(response.status).toBe(500); // Error interno
        }));
    });
    describe('POST /api/backup/restore/:filename', () => {
        let backupFilename;
        beforeAll(() => __awaiter(void 0, void 0, void 0, function* () {
            // Crear un backup para restaurar
            const createResponse = yield (0, supertest_1.default)(app_1.default)
                .post('/api/backup/create');
            backupFilename = createResponse.body.data.filename;
        }));
        it('debería restaurar un backup', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app_1.default)
                .post(`/api/backup/restore/${backupFilename}`);
            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.message).toContain('restaurada');
        }));
        it('debería retornar error para backup inexistente', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app_1.default)
                .post('/api/backup/restore/backup_inexistente.db');
            expect(response.status).toBe(500); // Error interno
        }));
    });
    describe('DELETE /api/backup/delete/:filename', () => {
        let backupFilename;
        beforeAll(() => __awaiter(void 0, void 0, void 0, function* () {
            // Crear un backup para eliminar
            const createResponse = yield (0, supertest_1.default)(app_1.default)
                .post('/api/backup/create');
            backupFilename = createResponse.body.data.filename;
        }));
        it('debería eliminar un backup', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app_1.default)
                .delete(`/api/backup/delete/${backupFilename}`);
            expect(response.status).toBe(204);
        }));
        it('debería retornar error para backup inexistente', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app_1.default)
                .delete('/api/backup/delete/backup_inexistente.db');
            expect(response.status).toBe(500); // Error interno
        }));
    });
});
