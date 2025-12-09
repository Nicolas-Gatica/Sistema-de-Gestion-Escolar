"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
exports.config = {
    PORT: process.env.PORT || 4000,
    NODE_ENV: process.env.NODE_ENV || 'development',
    JWT_SECRET: process.env.JWT_SECRET || 'tu-clave-secreta-super-segura-2024',
    DATABASE_URL: process.env.DATABASE_URL || 'file:./dev.db',
    CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:3000'
};
exports.default = exports.config;
