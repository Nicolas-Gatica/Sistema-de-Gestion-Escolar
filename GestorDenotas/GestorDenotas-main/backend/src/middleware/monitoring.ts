// backend/src/middleware/monitoring.ts
import { Request, Response, NextFunction } from 'express';
// import { prisma } from '../config/prisma'; // <-- ELIMINADO
import { supabase } from '../config/supabase'; // <-- AÑADIDO
import os from 'os';
import fs from 'fs';
import path from 'path';

// Métricas del sistema
interface SystemMetrics {
  timestamp: Date;
  uptime: number;
  memory: {
    used: number;
    free: number;
    total: number;
    percentage: number;
  };
  cpu: {
    loadAverage: number[];
    cores: number;
  };
  database: {
    connected: boolean;
    responseTime: number;
    // activeConnections: number; // (Difícil de obtener en Supabase serverless)
  };
  disk: {
    used: number;
    free: number;
    total: number;
    percentage: number;
  };
}

// Almacenar métricas en memoria
let systemMetrics: SystemMetrics[] = [];
const MAX_METRICS_HISTORY = 1000;

/**
 * Función para obtener métricas del sistema (MIGRADA A SUPABASE)
 */
export const getSystemMetrics = async (): Promise<SystemMetrics> => {
  const startTime = Date.now();
  
  // Verificar conexión a base de datos (Supabase)
  let dbConnected = false;
  let dbResponseTime = 0;
  
  try {
    const dbStartTime = Date.now();
    // Verificación rápida: Contar 1 fila de la tabla más pequeña (Asignatura)
    const { error } = await supabase.from('Asignatura').select('id', { count: 'exact', head: true }).limit(1);
    
    if (error) throw error;
    
    dbResponseTime = Date.now() - dbStartTime;
    dbConnected = true;
  } catch (error) {
    dbConnected = false;
    dbResponseTime = -1;
  }

  // Obtener información de memoria
  const totalMemory = os.totalmem();
  const freeMemory = os.freemem();
  const usedMemory = totalMemory - freeMemory;

  // Obtener información de CPU
  const loadAverage = os.loadavg();
  const cpuCores = os.cpus().length;

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

// Función para obtener uso de disco (Sin cambios)
const getDiskUsage = () => {
  try {
    // Simulación (En un servidor real, usar 'diskusage')
    const total = 100 * 1024 * 1024 * 1024; // 100GB
    const used = 50 * 1024 * 1024 * 1024;   // 50GB
    const free = total - used;
    
    return {
      used,
      free,
      total,
      percentage: (used / total) * 100
    };
  } catch (error) {
    return { used: 0, free: 0, total: 0, percentage: 0 };
  }
};

// Middleware para recopilar métricas en cada request (Sin cambios)
export const collectMetrics = async (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();
  
  const originalSend = res.send;
  res.send = function(this: Response, data: any): Response {
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

// Función para obtener métricas históricas (Sin cambios)
export const getMetricsHistory = (limit: number = 100): SystemMetrics[] => {
  return systemMetrics.slice(-limit);
};

// Función para calcular disponibilidad (Sin cambios)
export const calculateAvailability = (hours: number = 24): number => {
  const cutoffTime = new Date(Date.now() - (hours * 60 * 60 * 1000));
  const recentMetrics = systemMetrics.filter(m => m.timestamp >= cutoffTime);
  
  if (recentMetrics.length === 0) return 100;
  
  const failedChecks = recentMetrics.filter(m => 
    !m.database.connected || 
    m.database.responseTime > 5000 ||
    m.memory.percentage > 90 ||
    m.disk.percentage > 90
  ).length;
  
  return ((recentMetrics.length - failedChecks) / recentMetrics.length) * 100;
};

// Función para verificar si el sistema está saludable (Sin cambios)
export const isSystemHealthy = async (): Promise<{ healthy: boolean; issues: string[] }> => {
  const metrics = await getSystemMetrics();
  const issues: string[] = [];
  
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

// Función para recopilar métricas periódicamente (Sin cambios)
export const startMetricsCollection = (intervalMs: number = 60000) => { // Cada minuto
  setInterval(async () => {
    try {
      const metrics = await getSystemMetrics();
      systemMetrics.push(metrics);
      
      if (systemMetrics.length > MAX_METRICS_HISTORY) {
        systemMetrics = systemMetrics.slice(-MAX_METRICS_HISTORY);
      }
      
      const availability = calculateAvailability(24);
      if (availability < 95) {
        console.warn(`⚠️ Disponibilidad baja: ${availability.toFixed(2)}%`);
      }
      
    } catch (error) {
      console.error('Error collecting metrics:', error);
    }
  }, intervalMs);
  
  console.log('📊 Sistema de monitoreo iniciado');
};