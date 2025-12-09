"use strict";
/**
 * ========================================
 * TESTS DE INTEGRACIÓN - SISTEMA DE MONITOREO
 * ========================================
 *
 * Tests para verificar el funcionamiento del sistema de monitoreo
 * que cumple con el requisito RNF7 (Disponibilidad 95%)
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
describe('📊 Sistema de Monitoreo y Health Checks', () => {
    describe('GET /api/health', () => {
        it('debería retornar health check básico', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app_1.default)
                .get('/api/health');
            expect(response.status).toBe(200);
            expect(response.body.status).toBe('OK');
        }));
    });
    describe('GET /api/health/detailed', () => {
        it('debería retornar health check detallado', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app_1.default)
                .get('/api/health/detailed');
            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.health).toBeDefined();
            expect(response.body.data.health.status).toBeDefined();
            expect(response.body.data.health.timestamp).toBeDefined();
            expect(response.body.data.health.uptime).toBeDefined();
        }));
    });
    describe('GET /api/health/metrics', () => {
        it('debería retornar métricas del sistema', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app_1.default)
                .get('/api/health/metrics');
            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.metrics).toBeDefined();
            expect(response.body.data.metrics.memory).toBeDefined();
            expect(response.body.data.metrics.cpu).toBeDefined();
            expect(response.body.data.metrics.uptime).toBeDefined();
        }));
    });
    describe('GET /api/health/availability', () => {
        it('debería retornar métricas de disponibilidad', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app_1.default)
                .get('/api/health/availability');
            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.availability).toBeDefined();
            expect(response.body.data.availability.uptime).toBeDefined();
            expect(response.body.data.availability.availabilityPercentage).toBeDefined();
            expect(typeof response.body.data.availability.availabilityPercentage).toBe('number');
        }));
    });
    describe('GET /api/health/database', () => {
        it('debería verificar la conexión a la base de datos', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app_1.default)
                .get('/api/health/database');
            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.database).toBeDefined();
            expect(response.body.data.database.status).toBeDefined();
            expect(response.body.data.database.connectionTime).toBeDefined();
        }));
    });
    describe('GET /api/health/dependencies', () => {
        it('debería verificar dependencias del sistema', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app_1.default)
                .get('/api/health/dependencies');
            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.dependencies).toBeDefined();
            expect(Array.isArray(response.body.data.dependencies)).toBe(true);
        }));
    });
});
