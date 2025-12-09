import dotenv from 'dotenv';

dotenv.config();

export const config = {
  PORT: process.env.PORT || 4000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  JWT_SECRET: process.env.JWT_SECRET || 'tu-clave-secreta-super-segura-2024',
  DATABASE_URL: process.env.DATABASE_URL || 'file:./dev.db',
  CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:3000'
};

export default config;
