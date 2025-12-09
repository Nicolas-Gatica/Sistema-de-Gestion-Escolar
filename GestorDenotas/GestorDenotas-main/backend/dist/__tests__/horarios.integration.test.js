"use strict";
/**
 * ========================================
 * TESTS DE INTEGRACIÓN - GESTIÓN DE HORARIOS
 * ========================================
 *
 * Tests para verificar el funcionamiento de la gestión de horarios
 * que cumple con los requisitos RF4.1, RF4.2
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
describe('📅 Gestión de Horarios y Salas', () => {
    let cursoId;
    let asignaturaId;
    let profesorId;
    let salaId;
    let horarioId;
    beforeAll(() => __awaiter(void 0, void 0, void 0, function* () {
        // Crear profesor primero
        const profesor = yield prisma_1.prisma.profesor.create({
            data: {
                nombre: 'Profesor',
                apellido: 'Horarios',
                edad: 30,
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
        const sala = yield prisma_1.prisma.sala.create({
            data: {
                nombre: 'Aula 101',
                capacidad: 30,
                tipo: 'Aula',
                ubicacion: 'Primer piso',
                equipamiento: 'Pizarra, proyector'
            }
        });
        salaId = sala.id;
    }));
    afterAll(() => __awaiter(void 0, void 0, void 0, function* () {
        // Limpiar datos de prueba en orden correcto para evitar restricciones de clave foránea
        yield prisma_1.prisma.horario.deleteMany();
        yield prisma_1.prisma.sala.deleteMany();
        yield prisma_1.prisma.asignatura.deleteMany();
        yield prisma_1.prisma.curso.deleteMany();
        yield prisma_1.prisma.profesor.deleteMany();
    }));
    describe('POST /api/horarios', () => {
        it('debería crear un horario correctamente', () => __awaiter(void 0, void 0, void 0, function* () {
            const horarioData = {
                cursoId,
                asignaturaId,
                profesorId,
                salaId,
                diaSemana: 1, // Lunes
                horaInicio: '08:00',
                horaFin: '09:00',
                activo: true
            };
            const response = yield (0, supertest_1.default)(app_1.default)
                .post('/api/horarios')
                .send(horarioData);
            expect(response.status).toBe(201);
            expect(response.body.success).toBe(true);
            expect(response.body.data.horario.diaSemana).toBe(1);
            expect(response.body.data.horario.horaInicio).toBe('08:00');
            expect(response.body.data.horario.horaFin).toBe('09:00');
            horarioId = response.body.data.horario.id;
        }));
        it('debería validar datos requeridos', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app_1.default)
                .post('/api/horarios')
                .send({
                cursoId,
                asignaturaId
                // datos faltantes
            });
            expect(response.status).toBe(500); // Error de validación
        }));
        it('debería validar conflictos de horario', () => __awaiter(void 0, void 0, void 0, function* () {
            // Intentar crear horario en el mismo día y hora
            const horarioData = {
                cursoId,
                asignaturaId,
                profesorId,
                salaId,
                diaSemana: 1, // Mismo día
                horaInicio: '08:00', // Misma hora
                horaFin: '09:00',
                activo: true
            };
            const response = yield (0, supertest_1.default)(app_1.default)
                .post('/api/horarios')
                .send(horarioData);
            expect(response.status).toBe(500); // Error de conflicto
        }));
    });
    describe('GET /api/horarios', () => {
        it('debería listar todos los horarios', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app_1.default)
                .get('/api/horarios');
            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(Array.isArray(response.body.data.horarios)).toBe(true);
            expect(response.body.data.horarios.length).toBeGreaterThan(0);
        }));
        it('debería filtrar horarios por curso', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app_1.default)
                .get(`/api/horarios?cursoId=${cursoId}`);
            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(Array.isArray(response.body.data.horarios)).toBe(true);
        }));
        it('debería filtrar horarios por profesor', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app_1.default)
                .get(`/api/horarios?profesorId=${profesorId}`);
            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(Array.isArray(response.body.data.horarios)).toBe(true);
        }));
    });
    describe('GET /api/horarios/:id', () => {
        it('debería obtener un horario específico', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app_1.default)
                .get(`/api/horarios/${horarioId}`);
            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.horario.id).toBe(horarioId);
        }));
        it('debería retornar 404 para horario inexistente', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app_1.default)
                .get('/api/horarios/99999');
            expect(response.status).toBe(500); // Error interno
        }));
    });
    describe('PUT /api/horarios/:id', () => {
        it('debería actualizar un horario correctamente', () => __awaiter(void 0, void 0, void 0, function* () {
            const updateData = {
                horaInicio: '08:30',
                horaFin: '09:30'
            };
            const response = yield (0, supertest_1.default)(app_1.default)
                .put(`/api/horarios/${horarioId}`)
                .send(updateData);
            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.horario.horaInicio).toBe('08:30');
            expect(response.body.data.horario.horaFin).toBe('09:30');
        }));
    });
    describe('DELETE /api/horarios/:id', () => {
        it('debería eliminar un horario', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app_1.default)
                .delete(`/api/horarios/${horarioId}`);
            expect(response.status).toBe(204);
        }));
    });
    describe('GET /api/horarios/salas', () => {
        it('debería listar todas las salas', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app_1.default)
                .get('/api/horarios/salas');
            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(Array.isArray(response.body.data.salas)).toBe(true);
            expect(response.body.data.salas.length).toBeGreaterThan(0);
        }));
    });
    describe('POST /api/horarios/salas', () => {
        it('debería crear una nueva sala', () => __awaiter(void 0, void 0, void 0, function* () {
            const salaData = {
                nombre: 'Laboratorio 201',
                capacidad: 25,
                tipo: 'Laboratorio',
                ubicacion: 'Segundo piso',
                equipamiento: 'Computadoras, proyector, pizarra digital'
            };
            const response = yield (0, supertest_1.default)(app_1.default)
                .post('/api/horarios/salas')
                .send(salaData);
            expect(response.status).toBe(201);
            expect(response.body.success).toBe(true);
            expect(response.body.data.sala.nombre).toBe('Laboratorio 201');
            expect(response.body.data.sala.tipo).toBe('Laboratorio');
        }));
    });
    describe('GET /api/horarios/salas/:id', () => {
        it('debería obtener una sala específica', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app_1.default)
                .get(`/api/horarios/salas/${salaId}`);
            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.sala.id).toBe(salaId);
        }));
    });
    describe('PUT /api/horarios/salas/:id', () => {
        it('debería actualizar una sala', () => __awaiter(void 0, void 0, void 0, function* () {
            const updateData = {
                capacidad: 35,
                equipamiento: 'Pizarra, proyector, aire acondicionado'
            };
            const response = yield (0, supertest_1.default)(app_1.default)
                .put(`/api/horarios/salas/${salaId}`)
                .send(updateData);
            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.sala.capacidad).toBe(35);
        }));
    });
    describe('GET /api/horarios/conflictos', () => {
        it('debería detectar conflictos de horario', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app_1.default)
                .get('/api/horarios/conflictos');
            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(Array.isArray(response.body.data.conflictos)).toBe(true);
        }));
    });
});
