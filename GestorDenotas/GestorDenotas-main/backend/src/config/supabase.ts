// backend/src/config/supabase.ts

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Carga las variables desde el .env en la raíz de /backend
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !serviceKey) {
  throw new Error('BACKEND: Faltan SUPABASE_URL o SUPABASE_SERVICE_KEY en .env');
}

// Este es el cliente "Admin" que usa la Llave Maestra (Service Role)
// Lo llamamos 'supabase' por simplicidad.
export const supabase = createClient(supabaseUrl, serviceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});