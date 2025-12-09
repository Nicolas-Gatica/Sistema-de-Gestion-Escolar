// src/supabase/client.js

import { createClient } from '@supabase/supabase-js';

// Usamos process.env para acceder a las variables del archivo .env.local
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

// --- AGREGA ESTAS LÍNEAS AQUÍ ---
console.log('URL leída desde .env:', supabaseUrl);
console.log('KEY leída desde .env:', supabaseAnonKey);

// Si las variables no se encuentran, mostramos un error claro en la consola.
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Faltan las variables de entorno de Supabase.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);