// backend/src/__tests__/security.test.js

const request = require('supertest');
const app = require('../app').default; // Asegúrate de que app.js exporte el objeto Express correctamente
const { prisma } = require('../config/prisma');

// Variables globales para la prueba
let adminToken;
let profesorToken;
let estudianteToken;

// Datos simulados (DEBES asegurarte de que existan en tu base de datos de prueba)
const ADMIN_CREDENTIALS = { email: 'admin@test.cl', password: 'passwordSegura' };
const PROFESOR_CREDENTIALS = { email: 'profesor@test.cl', password: 'passwordSegura' };
const ESTUDIANTE_CREDENTIALS = { email: 'estudiante@test.cl', password: 'passwordSegura' };

// IDs de recursos conocidos para prueba de Ownership
const ESTUDIANTE_ID_TEST = 1; 

// =========================================================================
// BLOQUE DE PRUEBAS DE SEGURIDAD (RF1.1 y RF1.2)
// =========================================================================

describe('PRUEBAS DE SEGURIDAD Y AUTENTICACIÓN (RF1.1, RF1.2)', () => {

    beforeAll(async () => {
        // --- 1. Obtener tokens de autenticación (RF1.1) ---
        
        // Login Admin
        const adminRes = await request(app)
            .post('/api/auth/login')
            .send(ADMIN_CREDENTIALS);
        adminToken = adminRes.body.data.token;
        
        // Login Profesor
        const profRes = await request(app)
            .post('/api/auth/login')
            .send(PROFESOR_CREDENTIALS);
        profesorToken = profRes.body.data.token;
        
        // Login Estudiante
        const estRes = await request(app)
            .post('/api/auth/login')
            .send(ESTUDIANTE_CREDENTIALS);
        estudianteToken = estRes.body.data.token;

        // Verificar que los tokens se obtuvieron (Sanity Check)
        expect(adminToken).toBeDefined();
        expect(profesorToken).toBeDefined();
        expect(estudianteToken).toBeDefined();
    });

    afterAll(async () => {
        // Desconectar Prisma después de todas las pruebas
        await prisma.$disconnect();
    });

    // ---------------------------------------------------------------------
    // 1. VERIFICACIÓN DE AUTENTICACIÓN (REQUIRE AUTH - RF6.1)
    // ---------------------------------------------------------------------

    test('Debe retornar 401 si no se proporciona token para rutas protegidas', async () => {
        // Ruta protegida (ej: listar profesores, requiere requireAuth)
        const res = await request(app).get('/api/users/profesores');
        expect(res.statusCode).toBe(401);
        expect(res.body.message).toContain('Token de acceso requerido');
    });

    // ---------------------------------------------------------------------
    // 2. VERIFICACIÓN DE PERMISOS DE ROL (REQUIRE ADMIN - RF1.2)
    // ---------------------------------------------------------------------

    test('ADMIN debe crear una nueva sala (201)', async () => {
        // Ruta que requiere rol 'admin' (Gestión de Salas RF4.2)
        const res = await request(app)
            .post('/api/resources/salas')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ 
                nombre: 'Sala Test A1', 
                capacidad: 30, 
                tipo: 'Aula' 
            });
        expect(res.statusCode).toBe(201);
    });

    test('PROFESOR debe ser denegado para crear salas (403)', async () => {
        // Ruta que requiere rol 'admin'
        const res = await request(app)
            .post('/api/resources/salas')
            .set('Authorization', `Bearer ${profesorToken}`)
            .send({ 
                nombre: 'Sala Denegada', 
                capacidad: 30, 
                tipo: 'Laboratorio' 
            });
        expect(res.statusCode).toBe(403);
        expect(res.body.message).toContain('Acceso denegado: permisos insuficientes');
    });

    // ---------------------------------------------------------------------
    // 3. VERIFICACIÓN DE PERMISOS GRANULARES (REQUIRE PERMISSION - RF1.2, RF2.1)
    // ---------------------------------------------------------------------

    test('PROFESOR debe registrar una nota (201 - Permiso: calificaciones:create)', async () => {
        // Ruta que requiere 'calificaciones:create' (RF2.1)
        const res = await request(app)
            .post('/api/grades/calificaciones')
            .set('Authorization', `Bearer ${profesorToken}`)
            .send({
                estudianteId: ESTUDIANTE_ID_TEST, 
                asignaturaId: 1, 
                profesorId: 1, // IDs de prueba
                valor: 6.5 
            });
        expect(res.statusCode).toBe(201);
    });

    test('ESTUDIANTE debe ser denegado para registrar notas (403 - No tiene: calificaciones:create)', async () => {
        // Ruta que requiere 'calificaciones:create'
        const res = await request(app)
            .post('/api/grades/calificaciones')
            .set('Authorization', `Bearer ${estudianteToken}`)
            .send({
                estudianteId: ESTUDIANTE_ID_TEST, 
                asignaturaId: 1, 
                profesorId: 1, 
                valor: 7.0 
            });
        expect(res.statusCode).toBe(403);
        expect(res.body.message).toContain('Acceso denegado: no tiene permisos para create en calificaciones');
    });

    // ---------------------------------------------------------------------
    // 4. VERIFICACIÓN DE AUTORIZACIÓN INDIVIDUAL (OWNERSHIP)
    // ---------------------------------------------------------------------

    test('ESTUDIANTE debe poder ver sus propias notas (200 - requireOwnership)', async () => {
        // Ruta de lectura de notas (Estudiante/Apoderado)
        const res = await request(app)
            .get(`/api/grades/calificaciones/estudiante/${ESTUDIANTE_ID_TEST}`)
            .set('Authorization', `Bearer ${estudianteToken}`);
        
        // Nota: Este test ASUME que el ID del estudiante asociado al token es ESTUDIANTE_ID_TEST.
        // Si el middleware requireOwnership es llamado, debe pasar.
        expect(res.statusCode).toBe(200);
        expect(res.body.data.asignaturas).toBeDefined(); 
    });

});