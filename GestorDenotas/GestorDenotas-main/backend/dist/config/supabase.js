"use strict";
// backend/src/config/supabase.ts
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.supabase = void 0;
const supabase_js_1 = require("@supabase/supabase-js");
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
// Carga las variables desde el .env en la raíz de /backend
dotenv_1.default.config({ path: path_1.default.resolve(__dirname, '../../.env') });
const supabaseUrl = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_KEY;
if (!supabaseUrl || !serviceKey) {
    throw new Error('BACKEND: Faltan SUPABASE_URL o SUPABASE_SERVICE_KEY en .env');
}
// Este es el cliente "Admin" que usa la Llave Maestra (Service Role)
// Lo llamamos 'supabase' por simplicidad.
exports.supabase = (0, supabase_js_1.createClient)(supabaseUrl, serviceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});
