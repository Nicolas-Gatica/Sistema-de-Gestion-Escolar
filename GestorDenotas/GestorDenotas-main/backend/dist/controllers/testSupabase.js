"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.testSupabase = void 0;
const supabase_1 = require("../config/supabase");
const testSupabase = async (req, res) => {
    try {
        const { data, error } = await supabase_1.supabase
            .from("tu_tabla_aqui") // <--- Cambia por una tabla real
            .select("*")
            .limit(1);
        if (error) {
            res.status(500).json({ ok: false, error: error.message });
            return;
        }
        res.json({ ok: true, data });
    }
    catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        res.status(500).json({ ok: false, error: message });
    }
};
exports.testSupabase = testSupabase;
