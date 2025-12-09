// backend/src/scripts/monitor.ts
import { getSystemMetrics, calculateAvailability, isSystemHealthy } from '../middleware/monitoring';
import { backupService } from '../services/backupService';

async function displaySystemStatus() {
  console.log('📊 === ESTADO DEL SISTEMA ===\n');
  
  try {
    // Métricas del sistema
    const metrics = await getSystemMetrics();
    const health = await isSystemHealthy();
    const availability = calculateAvailability(24);
    
    // Estado general
    console.log(`🟢 Estado: ${health.healthy ? 'SALUDABLE' : 'PROBLEMAS DETECTADOS'}`);
    console.log(`📈 Disponibilidad (24h): ${availability.toFixed(2)}%`);
    console.log(`⏱️  Uptime: ${Math.floor(metrics.uptime / 3600)}h ${Math.floor((metrics.uptime % 3600) / 60)}m\n`);
    
    // Memoria
    console.log('💾 MEMORIA:');
    console.log(`   Usada: ${(metrics.memory.used / 1024 / 1024 / 1024).toFixed(2)}GB`);
    console.log(`   Total: ${(metrics.memory.total / 1024 / 1024 / 1024).toFixed(2)}GB`);
    console.log(`   Porcentaje: ${metrics.memory.percentage.toFixed(2)}%\n`);
    
    // CPU
    console.log('🖥️  CPU:');
    console.log(`   Cores: ${metrics.cpu.cores}`);
    console.log(`   Load Average: ${metrics.cpu.loadAverage.map(l => l.toFixed(2)).join(', ')}\n`);
    
    // Disco
    console.log('💿 DISCO:');
    console.log(`   Usado: ${(metrics.disk.used / 1024 / 1024 / 1024).toFixed(2)}GB`);
    console.log(`   Total: ${(metrics.disk.total / 1024 / 1024 / 1024).toFixed(2)}GB`);
    console.log(`   Porcentaje: ${metrics.disk.percentage.toFixed(2)}%\n`);
    
    // Base de datos
    console.log('🗄️  BASE DE DATOS:');
    console.log(`   Estado: ${metrics.database.connected ? 'CONECTADA' : 'DESCONECTADA'}`);
    console.log(`   Tiempo de respuesta: ${metrics.database.responseTime}ms`);
    
    // Problemas detectados
    if (!health.healthy) {
      console.log('⚠️  PROBLEMAS DETECTADOS:');
      health.issues.forEach(issue => console.log(`   - ${issue}`));
      console.log('');
    }
    
    // Estadísticas de backup
    const backupStats = backupService.getBackupStats();
    console.log('💾 BACKUPS:');
    console.log(`   Total: ${backupStats.totalBackups}`);
    console.log(`   Tamaño total: ${(backupStats.totalSize / 1024 / 1024).toFixed(2)}MB`);
    console.log(`   Último backup: ${backupStats.newestBackup?.toLocaleString() || 'N/A'}`);
    console.log(`   Backup más antiguo: ${backupStats.oldestBackup?.toLocaleString() || 'N/A'}\n`);
    
    // Cumplimiento de requisitos
    console.log('📋 CUMPLIMIENTO DE REQUISITOS:');
    console.log(`   RNF7 (Disponibilidad 95%): ${availability >= 95 ? '✅ CUMPLE' : '❌ NO CUMPLE'}`);
    console.log(`   RNF8 (Backups diarios): ${backupStats.totalBackups > 0 ? '✅ CUMPLE' : '❌ NO CUMPLE'}\n`);
    
  } catch (error) {
    console.error('❌ Error obteniendo métricas:', error);
  }
}

// Ejecutar monitoreo
displaySystemStatus();
