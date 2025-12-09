"use strict";
/**
 * ========================================
 * TESTS DE INTEGRACIÓN - AUTENTICACIÓN
 * ========================================
 *
 * Tests para verificar el funcionamiento completo del sistema de autenticación
 * que cumple con los requisitos RF1.1, RF1.2, RF6.1
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
const bcrypt_1 = __importDefault(require("bcrypt"));
describe('🔐 Sistema de Autenticación', () => {
    beforeAll(() => __awaiter(void 0, void 0, void 0, function* () {
        // Limpiar base de datos antes de los tests en orden correcto
        yield prisma_1.prisma.calificacion.deleteMany();
        yield prisma_1.prisma.observacion.deleteMany();
        yield prisma_1.prisma.asistencia.deleteMany();
        yield prisma_1.prisma.usuarioEstudiante.deleteMany();
        yield prisma_1.prisma.estudiante.deleteMany();
        yield prisma_1.prisma.curso.deleteMany();
        yield prisma_1.prisma.profesor.deleteMany();
        yield prisma_1.prisma.asignatura.deleteMany();
        yield prisma_1.prisma.usuario.deleteMany();
    }));
    afterAll(() => __awaiter(void 0, void 0, void 0, function* () {
        yield prisma_1.prisma.$disconnect();
    }));
    describe('POST /api/auth/login', () => {
        it('debería autenticar un administrador correctamente', () => __awaiter(void 0, void 0, void 0, function* () {
            // Crear usuario admin de prueba con contraseña hasheada correctamente
            const hashedPassword = yield bcrypt_1.default.hash('password123', 10);
            const admin = yield prisma_1.prisma.usuario.create({
                data: {
                    email: 'admin@test.com',
                    password: hashedPassword,
                    rol: 'admin',
                    activo: true
                }
            });
            const response = yield (0, supertest_1.default)(app_1.default)
                .post('/api/auth/login')
                .send({
                email: 'admin@test.com',
                password: 'password123'
            });
            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.user.role).toBe('admin');
            expect(response.body.data.token).toBeDefined();
        }));
        it('debería rechazar credenciales inválidas', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app_1.default)
                .post('/api/auth/login')
                .send({
                email: 'admin@test.com',
                password: 'password_incorrecta'
            });
            expect(response.status).toBe(401);
            expect(response.body.success).toBe(false);
        }));
        it('debería validar datos requeridos', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app_1.default)
                .post('/api/auth/login')
                .send({
                email: 'admin@test.com'
                // password faltante
            });
            expect(response.status).toBe(400);
        }));
    });
    describe('POST /api/auth/verify', () => {
        let validToken;
        beforeAll(() => __awaiter(void 0, void 0, void 0, function* () {
            // Obtener token válido para tests
            const loginResponse = yield (0, supertest_1.default)(app_1.default)
                .post('/api/auth/login')
                .send({
                email: 'admin@test.com',
                password: 'password123'
            });
            validToken = loginResponse.body.data.token;
        }));
        it('debería verificar un token válido', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app_1.default)
                .post('/api/auth/verify')
                .set('Authorization', `Bearer ${validToken}`);
            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.user.role).toBe('admin');
        }));
        it('debería rechazar un token inválido', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app_1.default)
                .post('/api/auth/verify')
                .set('Authorization', 'Bearer token_invalido');
            expect(response.status).toBe(401);
        }));
        it('debería rechazar request sin token', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app_1.default)
                .post('/api/auth/verify');
            expect(response.status).toBe(401);
        }));
    });
    describe('POST /api/auth/logout', () => {
        let validToken;
        beforeAll(() => __awaiter(void 0, void 0, void 0, function* () {
            const loginResponse = yield (0, supertest_1.default)(app_1.default)
                .post('/api/auth/login')
                .send({
                email: 'admin@test.com',
                password: 'password123'
            });
            validToken = loginResponse.body.data.token;
        }));
        it('debería cerrar sesión correctamente', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app_1.default)
                .post('/api/auth/logout')
                .set('Authorization', `Bearer ${validToken}`);
            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('Logout exitoso');
        }));
    });
});
