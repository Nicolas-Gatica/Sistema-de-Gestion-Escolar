"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const testSupabase_1 = require("../controllers/testSupabase");
const router = (0, express_1.Router)();
router.get("/test-supabase", testSupabase_1.testSupabase);
exports.default = router;
