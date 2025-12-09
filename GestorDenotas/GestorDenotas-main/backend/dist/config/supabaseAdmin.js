"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supabase_js_1 = require("@supabase/supabase-js");
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
// Cargar variables de entorno
dotenv_1.default.config({ path: path_1.default.resolve(__dirname, '../../.env') });
const supabaseUrl = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_KEY;
if (!supabaseUrl || !serviceKey) {
    throw new Error('Faltan variables de entorno SUPABASE_URL o SUPABASE_SERVICE_KEY');
}
// Cliente con permisos de administrador (Service Role)
const supabaseAdmin = (0, supabase_js_1.createClient)(supabaseUrl, serviceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});
exports.default = supabaseAdmin;
