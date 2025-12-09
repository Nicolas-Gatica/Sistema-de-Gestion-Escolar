"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// backend/src/app.ts
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
// ELIMINAMOS: import { prisma } from "./config/prisma"; 
const errors_1 = require("./config/errors");
// --- IMPORTACIÓN CENTRALIZADA DE RUTAS ---
const index_1 = __importDefault(require("./routes/index"));
dotenv_1.default.config();
const app = (0, express_1.default)();
// Middlewares
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// app.use(collectMetrics); // Comentado si 'monitoring' usa Prisma
// Ruta raíz
app.get("/", (_req, res) => {
    res.send("🚀 Backend del Sistema de Gestión Escolar CORRIENDO (Migrado a Supabase)");
});
// --- RUTAS DE LA API ---
app.use("/api", index_1.default);
// Manejador de errores
app.use((err, _req, res, _next) => {
    console.error("💥 Error en el servidor:", err);
    const errorResponse = (0, errors_1.formatErrorResponse)(err);
    const statusCode = err instanceof errors_1.AppErrorClass ? err.statusCode : 500;
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
exports.default = app;
