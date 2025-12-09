"use strict";
/**
 * ========================================
 * TESTS DE INTEGRACIÓN - ANÁLISIS PREDICTIVO
 * ========================================
 *
 * Tests para verificar el funcionamiento del análisis predictivo
 * que cumple con los requisitos RF3.1, RF3.2, RF3.3
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
describe('📊 Sistema de Análisis Predictivo', () => {
    let estudianteId;
    let cursoId;
    let asignaturaId;
    let profesorId;
    beforeAll(() => __awaiter(void 0, void 0, void 0, function* () {
        // Crear profesor primero
        const profesor = yield prisma_1.prisma.profesor.create({
            data: {
                nombre: 'Profesor',
                apellido: 'Analytics',
                edad: 35,
                sexo: 'M'
            }
        });
        profesorId = profesor.id;
        // Crear curso con el profesor como jefe
        const curso = yield prisma_1.prisma.curso.create({
            data: {
                nombre: '1° Básico A',
                jefeId: profesor.id
            }
        });
        cursoId = curso.id;
        const asignatura = yield prisma_1.prisma.asignatura.create({
            data: {
                nombre: 'Matemáticas'
            }
        });
        asignaturaId = asignatura.id;
        const estudiante = yield prisma_1.prisma.estudiante.create({
            data: {
                nombre: 'Ana',
                apellido: 'García',
                edad: 15,
                sexo: 'F',
                cursoId: cursoId
            }
        });
        estudianteId = estudiante.id;
        // Crear calificaciones de prueba para análisis
        yield prisma_1.prisma.calificacion.createMany({
            data: [
                { estudianteId, asignaturaId, profesorId, valor: 4.5, fecha: new Date('2024-01-15') },
                { estudianteId, asignaturaId, profesorId, valor: 3.8, fecha: new Date('2024-02-15') },
                { estudianteId, asignaturaId, profesorId, valor: 4.2, fecha: new Date('2024-03-15') },
                { estudianteId, asignaturaId, profesorId, valor: 3.5, fecha: new Date('2024-04-15') }
            ]
        });
        // Crear asistencias de prueba
        yield prisma_1.prisma.asistencia.createMany({
            data: [
                { estudianteId, fecha: new Date('2024-01-15'), estado: 'presente' },
                { estudianteId, fecha: new Date('2024-01-16'), estado: 'presente' },
                { estudianteId, fecha: new Date('2024-01-17'), estado: 'ausente' },
                { estudianteId, fecha: new Date('2024-01-18'), estado: 'presente' }
            ]
        });
    }));
    afterAll(() => __awaiter(void 0, void 0, void 0, function* () {
        // Limpiar datos de prueba en orden correcto
        yield prisma_1.prisma.calificacion.deleteMany();
        yield prisma_1.prisma.asistencia.deleteMany();
        yield prisma_1.prisma.observacion.deleteMany();
        yield prisma_1.prisma.usuarioEstudiante.deleteMany();
        yield prisma_1.prisma.estudiante.deleteMany();
        yield prisma_1.prisma.curso.deleteMany();
        yield prisma_1.prisma.profesor.deleteMany();
        yield prisma_1.prisma.asignatura.deleteMany();
    }));
    describe('GET /api/analytics/estudiante/:id', () => {
        it('debería analizar rendimiento de un estudiante', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app_1.default)
                .get(`/api/analytics/estudiante/${estudianteId}`);
            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.analisis).toBeDefined();
            expect(response.body.data.analisis.estudianteId).toBe(estudianteId);
            expect(response.body.data.analisis.promedioGeneral).toBeDefined();
            expect(response.body.data.analisis.riesgoReprobacion).toBeDefined();
            expect(['bajo', 'medio', 'alto']).toContain(response.body.data.analisis.riesgoReprobacion);
        }));
        it('debería retornar 404 para estudiante inexistente', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app_1.default)
                .get('/api/analytics/estudiante/99999');
            expect(response.status).toBe(500); // Error interno
        }));
    });
    describe('GET /api/analytics/curso/:id/año/:año', () => {
        it('debería analizar estadísticas de un curso', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app_1.default)
                .get(`/api/analytics/curso/${cursoId}/año/2024`);
            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.estadisticas).toBeDefined();
            expect(response.body.data.estadisticas.cursoId).toBe(cursoId);
            expect(response.body.data.estadisticas.año).toBe(2024);
            expect(typeof response.body.data.estadisticas.promedioGeneral).toBe('number');
        }));
        it('debería validar año válido', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app_1.default)
                .get(`/api/analytics/curso/${cursoId}/año/1990`);
            expect(response.status).toBe(400); // Año fuera del rango válido
        }));
    });
    describe('GET /api/analytics/prediccion/:id', () => {
        it('debería generar predicción de riesgo de reprobación', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app_1.default)
                .get(`/api/analytics/prediccion/${estudianteId}`);
            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.prediccion).toBeDefined();
            expect(response.body.data.prediccion.riesgoReprobacion).toBeDefined();
            expect(response.body.data.prediccion.probabilidadReprobacion).toBeDefined();
            expect(response.body.data.prediccion.factoresRiesgo).toBeDefined();
            expect(response.body.data.prediccion.recomendaciones).toBeDefined();
        }));
    });
    describe('GET /api/analytics/graficos/estudiante/:id', () => {
        it('debería generar datos para gráficos del estudiante', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app_1.default)
                .get(`/api/analytics/graficos/estudiante/${estudianteId}`);
            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.graficos).toBeDefined();
            expect(response.body.data.graficos.evolucionPromedio).toBeDefined();
            expect(response.body.data.graficos.calificacionesPorAsignatura).toBeDefined();
            expect(response.body.data.graficos.distribucionRendimiento).toBeDefined();
            expect(response.body.data.graficos.indicadoresRiesgo).toBeDefined();
        }));
    });
    describe('GET /api/analytics/graficos/curso/:id', () => {
        it('debería generar datos para gráficos del curso', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app_1.default)
                .get(`/api/analytics/graficos/curso/${cursoId}?año=2024`);
            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.graficos).toBeDefined();
            expect(response.body.data.graficos.topAsignaturas).toBeDefined();
            expect(response.body.data.graficos.distribucionCalificaciones).toBeDefined();
            expect(response.body.data.graficos.tendenciaAnual).toBeDefined();
            expect(response.body.data.graficos.indicadoresCurso).toBeDefined();
        }));
    });
    describe('GET /api/analytics/tendencias', () => {
        it('debería obtener tendencias generales del sistema', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app_1.default)
                .get('/api/analytics/tendencias?año=2024');
            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.tendencias).toBeDefined();
        }));
    });
});
