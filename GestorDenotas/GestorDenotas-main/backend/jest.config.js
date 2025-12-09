// backend/jest.config.js

/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest', 
  testEnvironment: 'node', 
  
  // SOLUCIÓN CLAVE: Define la transformación para ambos tipos de archivos
  transform: {
    '^.+\\.ts$': 'ts-jest', 
    '^.+\\.js$': 'babel-jest', // Usa Babel para archivos .js (maneja 'import' y sintaxis moderna)
  },
  
  // Asegura que busca archivos de prueba en JS y TS
  testMatch: [
    '**/__tests__/**/*.test.ts', 
    '**/__tests__/**/*.test.js'
  ],
  
  // Ignora la carpeta 'dist' (transpilada) para evitar problemas de duplicidad y de lectura
  testPathIgnorePatterns: [
    "/node_modules/", 
    "/dist/" 
  ],
  
  // Define dónde está la raíz de tu código fuente
  roots: ['<rootDir>/src'], 

  // Configuración de archivos
  moduleFileExtensions: ['ts', 'js', 'json', 'node'],
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],
};