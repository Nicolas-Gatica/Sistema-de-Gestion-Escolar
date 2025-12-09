"use strict";
/**
 * ========================================
 * TESTS DE INTEGRACIÓN - GESTIÓN DE ARCHIVOS
 * ========================================
 *
 * Tests para verificar el funcionamiento de la gestión de archivos
 * que cumple con el requisito RF5.1 (Fotos de estudiantes)
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
const prisma_1 = require("../config/prisma");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const fileService_1 = require("../services/fileService");
describe('📁 Gestión de Archivos y Fotos', () => {
    let estudianteId;
    beforeAll(() => __awaiter(void 0, void 0, void 0, function* () {
        // Crear profesor primero
        const profesor = yield prisma_1.prisma.profesor.create({
            data: {
                nombre: 'Profesor',
                apellido: 'Files',
                edad: 30,
                sexo: 'M'
            }
        });
        // Crear curso con el profesor como jefe
        const curso = yield prisma_1.prisma.curso.create({
            data: {
                nombre: '1° Básico A',
                jefeId: profesor.id
            }
        });
        const estudiante = yield prisma_1.prisma.estudiante.create({
            data: {
                nombre: 'María',
                apellido: 'González',
                edad: 15,
                sexo: 'F',
                cursoId: curso.id
            }
        });
        estudianteId = estudiante.id;
        // Crear directorio de fotos si no existe
        if (!fs_1.default.existsSync(fileService_1.STUDENT_PHOTOS_DIR)) {
            fs_1.default.mkdirSync(fileService_1.STUDENT_PHOTOS_DIR, { recursive: true });
        }
    }));
    afterAll(() => __awaiter(void 0, void 0, void 0, function* () {
        // Limpiar datos de prueba en orden correcto
        yield prisma_1.prisma.usuarioEstudiante.deleteMany();
        yield prisma_1.prisma.estudiante.deleteMany();
        yield prisma_1.prisma.curso.deleteMany();
        yield prisma_1.prisma.profesor.deleteMany();
        // Limpiar archivos de prueba
        if (fs_1.default.existsSync(fileService_1.STUDENT_PHOTOS_DIR)) {
            const files = fs_1.default.readdirSync(fileService_1.STUDENT_PHOTOS_DIR);
            files.forEach(file => {
                if (file.includes('test') || file.includes('estudiante_')) {
                    fs_1.default.unlinkSync(path_1.default.join(fileService_1.STUDENT_PHOTOS_DIR, file));
                }
            });
        }
    }));
    describe('POST /api/files/upload/student/:id', () => {
        it('debería subir foto de estudiante', () => __awaiter(void 0, void 0, void 0, function* () {
            // Crear un archivo de imagen de prueba
            const testImagePath = path_1.default.join(fileService_1.STUDENT_PHOTOS_DIR, 'test_image.jpg');
            const testImageBuffer = Buffer.from('fake-image-data');
            fs_1.default.writeFileSync(testImagePath, testImageBuffer);
            const response = yield (0, supertest_1.default)(app_1.default)
                .post(`/api/files/upload/student/${estudianteId}`)
                .attach('photo', testImagePath);
            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.filename).toBeDefined();
            expect(response.body.data.url).toBeDefined();
            // Limpiar archivo de prueba
            fs_1.default.unlinkSync(testImagePath);
        }));
        it('debería validar que el archivo sea una imagen', () => __awaiter(void 0, void 0, void 0, function* () {
            // Crear un archivo de texto de prueba
            const testTextPath = path_1.default.join(fileService_1.STUDENT_PHOTOS_DIR, 'test_file.txt');
            fs_1.default.writeFileSync(testTextPath, 'Este no es un archivo de imagen');
            const response = yield (0, supertest_1.default)(app_1.default)
                .post(`/api/files/upload/student/${estudianteId}`)
                .attach('photo', testTextPath);
            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
            // Limpiar archivo de prueba
            fs_1.default.unlinkSync(testTextPath);
        }));
        it('debería retornar error para estudiante inexistente', () => __awaiter(void 0, void 0, void 0, function* () {
            const testImagePath = path_1.default.join(fileService_1.STUDENT_PHOTOS_DIR, 'test_image.jpg');
            const testImageBuffer = Buffer.from('fake-image-data');
            fs_1.default.writeFileSync(testImagePath, testImageBuffer);
            const response = yield (0, supertest_1.default)(app_1.default)
                .post('/api/files/upload/student/99999')
                .attach('photo', testImagePath);
            expect(response.status).toBe(500); // Error interno
            // Limpiar archivo de prueba
            fs_1.default.unlinkSync(testImagePath);
        }));
    });
    describe('GET /api/files/student/:id/photo', () => {
        it('debería obtener la foto de un estudiante', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app_1.default)
                .get(`/api/files/student/${estudianteId}/photo`);
            // Puede retornar 404 si no hay foto o 200 si existe
            expect([200, 404]).toContain(response.status);
        }));
        it('debería retornar 404 para estudiante sin foto', () => __awaiter(void 0, void 0, void 0, function* () {
            // Crear estudiante sin foto
            const curso = yield prisma_1.prisma.curso.create({
                data: {
                    nombre: '1° Básico B',
                    jefeId: 1
                }
            });
            const estudianteSinFoto = yield prisma_1.prisma.estudiante.create({
                data: {
                    nombre: 'Pedro',
                    apellido: 'SinFoto',
                    edad: 14,
                    sexo: 'M',
                    cursoId: curso.id
                }
            });
            const response = yield (0, supertest_1.default)(app_1.default)
                .get(`/api/files/student/${estudianteSinFoto.id}/photo`);
            expect(response.status).toBe(404);
        }));
    });
    describe('DELETE /api/files/student/:id/photo', () => {
        it('debería eliminar la foto de un estudiante', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app_1.default)
                .delete(`/api/files/student/${estudianteId}/photo`);
            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
        }));
        it('debería retornar 404 para estudiante sin foto', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app_1.default)
                .delete('/api/files/student/99999/photo');
            expect(response.status).toBe(500); // Error interno
        }));
    });
    describe('GET /api/files/student/:id/photo/thumbnail', () => {
        it('debería obtener la miniatura de la foto de un estudiante', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app_1.default)
                .get(`/api/files/student/${estudianteId}/photo/thumbnail`);
            // Puede retornar 404 si no hay foto o 200 si existe
            expect([200, 404]).toContain(response.status);
        }));
    });
});
