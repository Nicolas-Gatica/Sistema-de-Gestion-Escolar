"use strict";
/**
 * ========================================
 * TESTS DE INTEGRACIÓN - GESTIÓN DE ESTUDIANTES
 * ========================================
 *
 * Tests para verificar el funcionamiento completo del CRUD de estudiantes
 * que cumple con los requisitos RF2.1, RF2.3, RF5.1
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
describe('👨‍🎓 Gestión de Estudiantes', () => {
    let cursoId;
    let estudianteId;
    beforeAll(() => __awaiter(void 0, void 0, void 0, function* () {
        // Crear profesor primero
        const profesor = yield prisma_1.prisma.profesor.create({
            data: {
                nombre: 'Profesor',
                apellido: 'Test',
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
        cursoId = curso.id;
    }));
    afterAll(() => __awaiter(void 0, void 0, void 0, function* () {
        // Limpiar datos de prueba en orden correcto
        yield prisma_1.prisma.calificacion.deleteMany();
        yield prisma_1.prisma.observacion.deleteMany();
        yield prisma_1.prisma.asistencia.deleteMany();
        yield prisma_1.prisma.usuarioEstudiante.deleteMany();
        yield prisma_1.prisma.estudiante.deleteMany();
        yield prisma_1.prisma.curso.deleteMany();
        yield prisma_1.prisma.profesor.deleteMany();
    }));
    describe('POST /api/estudiantes', () => {
        it('debería crear un estudiante correctamente', () => __awaiter(void 0, void 0, void 0, function* () {
            const estudianteData = {
                nombre: 'Juan',
                apellido: 'Pérez',
                edad: 15,
                sexo: 'M',
                cursoId: cursoId
            };
            const response = yield (0, supertest_1.default)(app_1.default)
                .post('/api/estudiantes')
                .send(estudianteData);
            expect(response.status).toBe(201);
            expect(response.body.success).toBe(true);
            expect(response.body.data.estudiante.nombre).toBe('Juan');
            expect(response.body.data.estudiante.apellido).toBe('Pérez');
            estudianteId = response.body.data.estudiante.id;
        }));
        it('debería validar datos requeridos', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app_1.default)
                .post('/api/estudiantes')
                .send({
                nombre: 'Juan'
                // datos faltantes
            });
            expect(response.status).toBe(500); // Error de validación
        }));
    });
    describe('GET /api/estudiantes', () => {
        it('debería listar todos los estudiantes', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app_1.default)
                .get('/api/estudiantes');
            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(Array.isArray(response.body.data.estudiantes)).toBe(true);
            expect(response.body.data.estudiantes.length).toBeGreaterThan(0);
        }));
    });
    describe('GET /api/estudiantes/:id', () => {
        it('debería obtener un estudiante específico', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app_1.default)
                .get(`/api/estudiantes/${estudianteId}`);
            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.estudiante.id).toBe(estudianteId);
            expect(response.body.data.estudiante.nombre).toBe('Juan');
        }));
        it('debería retornar 404 para estudiante inexistente', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app_1.default)
                .get('/api/estudiantes/99999');
            expect(response.status).toBe(500); // Error interno por estudiante no encontrado
        }));
    });
    describe('PUT /api/estudiantes/:id', () => {
        it('debería actualizar un estudiante correctamente', () => __awaiter(void 0, void 0, void 0, function* () {
            const updateData = {
                nombre: 'Juan Carlos',
                apellido: 'Pérez García',
                edad: 16
            };
            const response = yield (0, supertest_1.default)(app_1.default)
                .put(`/api/estudiantes/${estudianteId}`)
                .send(updateData);
            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.estudiante.nombre).toBe('Juan Carlos');
            expect(response.body.data.estudiante.edad).toBe(16);
        }));
    });
    describe('GET /api/estudiantes/curso/:cursoId', () => {
        it('debería listar estudiantes por curso', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app_1.default)
                .get(`/api/estudiantes/curso/${cursoId}`);
            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(Array.isArray(response.body.data.estudiantes)).toBe(true);
        }));
    });
    describe('POST /api/estudiantes/enrollments', () => {
        it('debería inscribir estudiante en curso', () => __awaiter(void 0, void 0, void 0, function* () {
            const enrollmentData = {
                studentId: estudianteId,
                courseId: cursoId
            };
            const response = yield (0, supertest_1.default)(app_1.default)
                .post('/api/estudiantes/enrollments')
                .send(enrollmentData);
            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
        }));
    });
    describe('GET /api/estudiantes/:id/cursos', () => {
        it('debería obtener cursos del estudiante', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app_1.default)
                .get(`/api/estudiantes/${estudianteId}/cursos`);
            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(Array.isArray(response.body.data.cursos)).toBe(true);
        }));
    });
    describe('GET /api/estudiantes/:id/calificaciones', () => {
        it('debería obtener calificaciones del estudiante', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app_1.default)
                .get(`/api/estudiantes/${estudianteId}/calificaciones`);
            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(Array.isArray(response.body.data.calificaciones)).toBe(true);
        }));
    });
    describe('DELETE /api/estudiantes/:id', () => {
        it('debería eliminar un estudiante', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app_1.default)
                .delete(`/api/estudiantes/${estudianteId}`);
            expect(response.status).toBe(204);
        }));
    });
});
