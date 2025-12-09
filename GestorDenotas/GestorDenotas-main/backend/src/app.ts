// backend/src/app.ts
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
// ELIMINAMOS: import { prisma } from "./config/prisma"; 
import { formatErrorResponse, AppErrorClass } from "./config/errors";

// --- IMPORTACIÓN CENTRALIZADA DE RUTAS ---
import indexRouter from "./routes/index"; 

// Importar servicios (limpiamos los que ya no usamos)
import { startAutomaticBackups } from "./services/backupService";

dotenv.config();
const app = express();

// Middlewares
app.use(cors()); 
app.use(express.json());
// app.use(collectMetrics); // Comentado si 'monitoring' usa Prisma

// Ruta raíz
app.get("/", (_req: express.Request, res: express.Response) => {
    res.send("🚀 Backend del Sistema de Gestión Escolar CORRIENDO (Migrado a Supabase)");
});

// --- RUTAS DE LA API ---
app.use("/api", indexRouter);

// Manejador de errores
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error("💥 Error en el servidor:", err);
    const errorResponse = formatErrorResponse(err);
    const statusCode = err instanceof AppErrorClass ? err.statusCode : 500;
    res.status(statusCode).json(errorResponse);
});

// Arranque del servidor
if (require.main === module) {
    const PORT = process.env.PORT || 4000;
    
    // Iniciar backups automáticos (el que ya no usa gzip)
    //startAutomaticBackups(24);
    
    app.listen(PORT, () => {
        console.log(`🚀 Backend corriendo en http://localhost:${PORT}`);
    });
}

export default app;