"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const supabase_1 = require("../config/supabase");
const router = (0, express_1.Router)();
/**
 * POST /api/users/profesores
 * Crea un nuevo profesor.
 * - En 'auth' y 'perfiles': Usa nombre + apellido juntos.
 * - En 'Profesor': Usa nombre y apellido separados.
 */
router.post("/", async (req, res, next) => {
    try {
        const { email, password, nombre, apellido, edad, sexo } = req.body;
        if (!email || !password || !nombre || !apellido) {
            res.status(400).json({ success: false, message: "Faltan datos obligatorios" });
            return;
        }
        console.log("🔵 Backend: Creando profesor:", email);
        // 1. Crear en Auth
        const { data: authData, error: authError } = await supabase_1.supabase.auth.admin.createUser({
            email: email,
            password: password,
            email_confirm: true,
            user_metadata: { nombre, apellido }
        });
        if (authError)
            throw authError;
        if (!authData.user)
            throw new Error("No se pudo generar el usuario");
        const userUuid = authData.user.id;
        // 2. Insertar en Perfiles (AQUÍ ESTÁ LA MAGIA)
        // Unimos nombre y apellido para cumplir con la tabla 'perfiles'
        const nombreParaPerfil = `${nombre} ${apellido}`;
        const { error: perfilError } = await supabase_1.supabase
            .from('perfiles')
            .insert([{
                id: userUuid,
                rol: 'profesor',
                nombre_completo: nombreParaPerfil // <--- CORREGIDO: nombre_completo (con guion bajo)
            }]);
        if (perfilError) {
            // Si falla, borramos el usuario de Auth para no dejar basura
            await supabase_1.supabase.auth.admin.deleteUser(userUuid);
            throw perfilError;
        }
        // 3. Insertar en Profesor (Mantiene los datos separados y ordenados)
        const { data: nuevoProfesor, error: profeError } = await supabase_1.supabase
            .from('Profesor')
            .insert([{
                user_uuid: userUuid,
                nombre, // Guarda solo el nombre
                apellido, // Guarda solo el apellido
                email,
                edad: Number(edad),
                sexo
            }])
            .select()
            .single();
        if (profeError) {
            // Si falla aquí, es grave, intentamos limpiar
            await supabase_1.supabase.auth.admin.deleteUser(userUuid);
            throw profeError;
        }
        console.log("✅ Profesor creado con éxito:", nuevoProfesor);
        res.status(201).json({
            success: true,
            data: { profesor: nuevoProfesor }
        });
    }
    catch (err) {
        console.error("🔴 Error en controlador:", err);
        res.status(400).json({
            success: false,
            message: err.message || "Error desconocido al crear profesor"
        });
    }
});
exports.default = router;
