"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startMetricsCollection = exports.isSystemHealthy = exports.calculateAvailability = exports.getMetricsHistory = exports.collectMetrics = exports.getSystemMetrics = void 0;
// import { prisma } from '../config/prisma'; // <-- ELIMINADO
const supabase_1 = require("../config/supabase"); // <-- AÑADIDO
const os_1 = __importDefault(require("os"));
// Almacenar métricas en memoria
let systemMetrics = [];
const MAX_METRICS_HISTORY = 1000;
/**
 * Función para obtener métricas del sistema (MIGRADA A SUPABASE)
 */
const getSystemMetrics = async () => {
    const startTime = Date.now();
    // Verificar conexión a base de datos (Supabase)
    let dbConnected = false;
    let dbResponseTime = 0;
    try {
        const dbStartTime = Date.now();
        // Verificación rápida: Contar 1 fila de la tabla más pequeña (Asignatura)
        const { error } = await supabase_1.supabase.from('Asignatura').select('id', { count: 'exact', head: true }).limit(1);
        if (error)
            throw error;
        dbResponseTime = Date.now() - dbStartTime;
        dbConnected = true;
    }
    catch (error) {
        dbConnected = false;
        dbResponseTime = -1;
    }
    // Obtener información de memoria
    const totalMemory = os_1.default.totalmem();
    const freeMemory = os_1.default.freemem();
    const usedMemory = totalMemory - freeMemory;
    // Obtener información de CPU
    const loadAverage = os_1.default.loadavg();
    const cpuCores = os_1.default.cpus().length;
    // Obtener información de disco
    const diskStats = getDiskUsage();
    return {
        timestamp: new Date(),
        uptime: process.uptime(),
        memory: {
            used: usedMemory,
            free: freeMemory,
            total: totalMemory,
            percentage: (usedMemory / totalMemory) * 100
        },
        cpu: {
            loadAverage,
            cores: cpuCores
        },
        database: {
            connected: dbConnected,
            responseTime: dbResponseTime,
            // activeConnections: 0 // (Supabase maneja esto automáticamente)
        },
        disk: diskStats
    };
};
exports.getSystemMetrics = getSystemMetrics;
// Función para obtener uso de disco (Sin cambios)
const getDiskUsage = () => {
    try {
        // Simulación (En un servidor real, usar 'diskusage')
        const total = 100 * 1024 * 1024 * 1024; // 100GB
        const used = 50 * 1024 * 1024 * 1024; // 50GB
        const free = total - used;
        return {
            used,
            free,
            total,
            percentage: (used / total) * 100
        };
    }
    catch (error) {
        return { used: 0, free: 0, total: 0, percentage: 0 };
    }
};
// Middleware para recopilar métricas en cada request (Sin cambios)
const collectMetrics = async (req, res, next) => {
    const startTime = Date.now();
    const originalSend = res.send;
    res.send = function (data) {
        const responseTime = Date.now() - startTime;
        res.set('X-Response-Time', `${responseTime}ms`);
        const requestMetric = {
            method: req.method,
            url: req.url,
            statusCode: res.statusCode,
            responseTime,
            timestamp: new Date(),
            userAgent: req.get('User-Agent'),
            ip: req.ip
        };
        console.log('Request Metric:', requestMetric);
        return originalSend.call(this, data);
    };
    next();
};
exports.collectMetrics = collectMetrics;
// Función para obtener métricas históricas (Sin cambios)
const getMetricsHistory = (limit = 100) => {
    return systemMetrics.slice(-limit);
};
exports.getMetricsHistory = getMetricsHistory;
// Función para calcular disponibilidad (Sin cambios)
const calculateAvailability = (hours = 24) => {
    const cutoffTime = new Date(Date.now() - (hours * 60 * 60 * 1000));
    const recentMetrics = systemMetrics.filter(m => m.timestamp >= cutoffTime);
    if (recentMetrics.length === 0)
        return 100;
    const failedChecks = recentMetrics.filter(m => !m.database.connected ||
        m.database.responseTime > 5000 ||
        m.memory.percentage > 90 ||
        m.disk.percentage > 90).length;
    return ((recentMetrics.length - failedChecks) / recentMetrics.length) * 100;
};
exports.calculateAvailability = calculateAvailability;
// Función para verificar si el sistema está saludable (Sin cambios)
const isSystemHealthy = async () => {
    const metrics = await (0, exports.getSystemMetrics)();
    const issues = [];
    if (!metrics.database.connected) {
        issues.push('Database connection failed');
    }
    if (metrics.database.responseTime > 5000) {
        issues.push(`Database response time too high: ${metrics.database.responseTime}ms`);
    }
    if (metrics.memory.percentage > 90) {
        issues.push(`High memory usage: ${metrics.memory.percentage.toFixed(2)}%`);
    }
    if (metrics.disk.percentage > 90) {
        issues.push(`High disk usage: ${metrics.disk.percentage.toFixed(2)}%`);
    }
    if (metrics.cpu.loadAverage[0] > metrics.cpu.cores * 2) {
        issues.push(`High CPU load: ${metrics.cpu.loadAverage[0].toFixed(2)}`);
    }
    return {
        healthy: issues.length === 0,
        issues
    };
};
exports.isSystemHealthy = isSystemHealthy;
// Función para recopilar métricas periódicamente (Sin cambios)
const startMetricsCollection = (intervalMs = 60000) => {
    setInterval(async () => {
        try {
            const metrics = await (0, exports.getSystemMetrics)();
            systemMetrics.push(metrics);
            if (systemMetrics.length > MAX_METRICS_HISTORY) {
                systemMetrics = systemMetrics.slice(-MAX_METRICS_HISTORY);
            }
            const availability = (0, exports.calculateAvailability)(24);
            if (availability < 95) {
                console.warn(`⚠️ Disponibilidad baja: ${availability.toFixed(2)}%`);
            }
        }
        catch (error) {
            console.error('Error collecting metrics:', error);
        }
    }, intervalMs);
    console.log('📊 Sistema de monitoreo iniciado');
};
exports.startMetricsCollection = startMetricsCollection;
