/**
 * ========================================
 * CONTROLADOR DE ESTUDIANTES (Migrado a Supabase)
 * ========================================
 *
 * Maneja operaciones CRUD para estudiantes, conectándose
 * directamente a las tablas de Supabase.
 */

import { Router, Request, Response, NextFunction } from "express";
// Importamos el cliente Supabase (que usa la Service Key)
import { supabase } from "../config/supabase"; 
import { createError } from "../config/errors";

const router = Router();

// Definimos interfaces para los tipos de datos (ayuda a TypeScript)
interface Estudiante {
    id: number;
    user_uuid: string;
    nombre: string;
    apellido: string;
    cursoId: number;
    // ...otros campos
}

/**
 * GET /api/estudiantes
 * Obtiene la lista completa de todos los estudiantes
 */
router.get("/", async (_req: Request, res: Response, next: NextFunction) => {
  try {
    // Consulta Supabase: trae Estudiantes y el nombre del Curso asociado
    const { data: estudiantes, error } = await supabase
        .from('Estudiante')
        .select(`
            id,
            user_uuid,
            nombre,
            apellido,
            foto,
            Curso ( nombre )
        `)
        .order('apellido', { ascending: true });

    if (error) throw error;

    res.json({ 
      success: true,
      data: { estudiantes } 
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/estudiantes/curso/:cursoId
 * Obtiene estudiantes de un curso específico
 */
router.get("/curso/:cursoId", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const cursoId = Number(req.params.cursoId);
    
    const { data: estudiantes, error } = await supabase
        .from('Estudiante')
        .select(`
            id,
            user_uuid,
            nombre,
            apellido,
            foto,
            Curso ( nombre )
        `)
        .eq('cursoId', cursoId)
        .order('apellido', { ascending: true });

    if (error) throw error;
    
    res.json({ 
      success: true,
      data: { estudiantes } 
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/estudiantes
 * Crea un nuevo estudiante (Nota: Aún no crea el usuario en Auth)
 * TODO: Esta función debe mejorarse para crear el usuario en Auth (similar a profesorController)
 */
/**
 * POST /api/estudiantes
 * Crea un nuevo estudiante y su usuario de Auth asociado.
 */
router.post("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Asegúrate de recibir 'email' y opcionalmente 'password' desde el frontend
    const { nombre, apellido, edad, sexo, cursoId, email, password } = req.body;

    // 1. Validar que el email venga en la petición (necesario para Auth)
    if (!email) {
       throw createError.badRequest("El email es obligatorio para crear un estudiante.");
    }

    // 2. Crear el usuario en Supabase Auth
    // Nota: Asignamos una contraseña por defecto si no viene una, o puedes generarla aleatoriamente.
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: email,
      password: password || "Estudiante123!", // Contraseña temporal o enviada desde el front
      email_confirm: true, // Auto-confirmamos el email para que pueda entrar directo
      user_metadata: { nombre, apellido, rol: 'estudiante' } // Guardamos info extra en metadata si gustas
    });

    if (authError) throw authError;

    // Obtenemos el ID único generado por Supabase Auth
    const userUuid = authData.user.id;

    // 3. Insertar el perfil en la tabla 'Estudiante' usando el userUuid generado
    const { data: nuevoEstudiante, error } = await supabase
        .from('Estudiante')
        .insert([{
            user_uuid: userUuid, // <--- ESTO ES LO QUE FALTABA
            nombre,
            apellido,
            edad: Number(edad),
            sexo,
            cursoId: Number(cursoId),
            // Si tu tabla Estudiante tiene columna email, agrégala aquí también:
            // email: email 
        }])
        .select()
        .single();
    
    // ROLLBACK: Si falla la inserción en la tabla, deberíamos borrar el usuario de Auth
    // para no dejar "usuarios fantasmas" sin perfil.
    if (error) {
        await supabase.auth.admin.deleteUser(userUuid);
        throw error;
    }

    res.status(201).json({ 
      success: true,
      data: { 
          estudiante: nuevoEstudiante,
          auth: { email, id: userUuid } // Opcional: devolver info de cuenta
      } 
    });
  } catch (err) {
    next(err);
  }
});
/**
 * GET /api/estudiantes/:id/calificaciones
 * Obtiene calificaciones de un estudiante (ID numérico de la tabla Estudiante)
 */
router.get("/:id/calificaciones", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const estudianteId = Number(req.params.id);
    
    // Primero buscar el UUID del estudiante usando su ID numérico
    const { data: estData } = await supabase
        .from('Estudiante')
        .select('user_uuid')
        .eq('id', estudianteId)
        .single();
    
    if (!estData) throw createError.notFound('Estudiante no encontrado');

    // Ahora buscar las calificaciones con el UUID
    const { data: calificaciones, error } = await supabase
        .from('Calificacion')
        .select(`
            id,
            valor,
            fecha,
            Asignatura ( nombre ),
            Profesor ( nombre, apellido )
        `)
        .eq('estudiante_uuid', estData.user_uuid);
    
    if (error) throw error;
    
    res.json({ 
      success: true,
      data: { calificaciones } 
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/estudiantes/:id
 * Obtiene un estudiante específico por su ID numérico
 */
router.get("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Number(req.params.id);
    
    const { data: estudiante, error } = await supabase
        .from('Estudiante')
        .select(`
            *,
            Curso ( nombre ),
            Calificacion ( id, valor, Asignatura(nombre) ),
            Observacion ( id, estado, texto, fecha ),
            Asistencia ( id, estado, fecha )
        `)
        .eq('id', id)
        .single();
    
    if (error) throw error;
    if (!estudiante) throw createError.notFound('Estudiante no encontrado');
    
    res.json({ 
      success: true,
      data: { estudiante } 
    });
  } catch (err) {
    next(err);
  }
});

/**
 * PUT /api/estudiantes/:id
 * Actualiza la información de un estudiante existente
 */
router.put("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Number(req.params.id);
    const { nombre, apellido, edad, sexo, cursoId } = req.body;
    
    const { data: estudianteActualizado, error } = await supabase
        .from('Estudiante')
        .update({
            nombre,
            apellido,
            edad: edad ? Number(edad) : undefined,
            sexo,
            cursoId: cursoId ? Number(cursoId) : undefined,
        })
        .eq('id', id)
        .select()
        .single();

    if (error) throw error;

    res.json({ 
      success: true,
      data: { estudiante: estudianteActualizado } 
    });
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /api/estudiantes/:id
 * Elimina un estudiante (y su usuario de Auth si está bien configurado)
 */
router.delete("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Number(req.params.id);

    // 1. Obtener el UUID del estudiante antes de borrarlo
    const { data: estData } = await supabase
        .from('Estudiante')
        .select('user_uuid')
        .eq('id', id)
        .single();

    if (!estData) throw createError.notFound('Estudiante no encontrado');

    // 2. Borrar de la tabla Estudiante (gracias a 'ON DELETE CASCADE',
    // esto debería borrar sus notas, asistencia, etc. si la BD está bien configurada)
    const { error: deleteError } = await supabase
        .from('Estudiante')
        .delete()
        .eq('id', id);
    
    if (deleteError) throw deleteError;

    // 3. Borrar el usuario de Supabase Auth (MUY IMPORTANTE)
    const { error: authError } = await supabase.auth.admin.deleteUser(estData.user_uuid);
    if (authError) throw authError;

    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

export default router;