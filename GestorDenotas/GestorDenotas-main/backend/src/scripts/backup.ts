// backend/src/scripts/backup.ts
import { backupService } from '../services/backupService';

async function main() {
  console.log('🔄 Iniciando backup manual...');
  
  try {
    const result = await backupService.createDatabaseBackup();
    
    if (result.success) {
      console.log('✅ Backup completado exitosamente');
      console.log(`📁 Archivo: ${result.filename}`);
      console.log(`📊 Tamaño: ${(result.size / 1024 / 1024).toFixed(2)} MB`);
      console.log(`⏰ Timestamp: ${result.timestamp.toISOString()}`);
    } else {
      console.error('❌ Error en backup:', result.error);
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Error fatal:', error);
    process.exit(1);
  }
}

main();
