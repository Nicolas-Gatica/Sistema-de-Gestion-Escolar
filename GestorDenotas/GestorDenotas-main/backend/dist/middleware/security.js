"use strict";
/**
 * ========================================
 * MIDDLEWARE DE SEGURIDAD Y CIFRADO
 * ========================================
 *
 * Este middleware maneja la seguridad y cifrado para cumplir con:
 * - RF6.2: Implementar cifrado en la comunicación de datos entre cliente y servidor
 * - RNF3: Cifrado de información sensible
 *
 * Funcionalidades:
 * - Cifrado de datos sensibles en respuestas
 * - Validación de headers de seguridad
 * - Protección contra ataques comunes
 * - Sanitización de datos de entrada
 * - Rate limiting
 * - Headers de seguridad HTTP
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateContentType = exports.validateRequestSize = exports.securityLogger = exports.validateSecurityHeaders = exports.sanitizeInput = exports.loginRateLimiter = exports.rateLimiter = exports.securityHeaders = exports.encryptResponseData = exports.decryptSensitiveData = exports.encryptSensitiveData = void 0;
const crypto_1 = __importDefault(require("crypto"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const helmet_1 = __importDefault(require("helmet"));
const errors_1 = require("../config/errors");
// Configuración de cifrado
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || crypto_1.default.randomBytes(32).toString('hex');
const ALGORITHM = 'aes-256-gcm';
/**
 * Función para cifrar datos sensibles
 *
 * @param text - Texto a cifrar
 * @returns string - Texto cifrado en base64
 */
const encryptSensitiveData = (text) => {
    try {
        const iv = crypto_1.default.randomBytes(16);
        const cipher = crypto_1.default.createCipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY, 'hex'), iv);
        let encrypted = cipher.update(text, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        const authTag = cipher.getAuthTag();
        // Combinar IV, authTag y datos cifrados
        const combined = iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted;
        return Buffer.from(combined).toString('base64');
    }
    catch (error) {
        console.error('Error al cifrar datos:', error);
        return text; // Retornar texto original en caso de error
    }
};
exports.encryptSensitiveData = encryptSensitiveData;
/**
 * Función para descifrar datos sensibles
 *
 * @param encryptedText - Texto cifrado en base64
 * @returns string - Texto descifrado
 */
const decryptSensitiveData = (encryptedText) => {
    try {
        const combined = Buffer.from(encryptedText, 'base64').toString('utf8');
        const parts = combined.split(':');
        if (parts.length !== 3) {
            throw new Error('Formato de datos cifrados inválido');
        }
        const iv = Buffer.from(parts[0], 'hex');
        const authTag = Buffer.from(parts[1], 'hex');
        const encrypted = parts[2];
        const decipher = crypto_1.default.createDecipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY, 'hex'), iv);
        decipher.setAuthTag(authTag);
        let decrypted = decipher.update(encrypted, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    }
    catch (error) {
        console.error('Error al descifrar datos:', error);
        return encryptedText; // Retornar texto original en caso de error
    }
};
exports.decryptSensitiveData = decryptSensitiveData;
/**
 * Middleware para cifrar datos sensibles en respuestas
 * Cifra automáticamente campos como emails, nombres, etc.
 */
const encryptResponseData = (req, res, next) => {
    const originalSend = res.send;
    res.send = function (data) {
        try {
            if (typeof data === 'string') {
                const parsed = JSON.parse(data);
                const encrypted = encryptSensitiveFields(parsed);
                return originalSend.call(this, JSON.stringify(encrypted));
            }
            else if (typeof data === 'object') {
                const encrypted = encryptSensitiveFields(data);
                return originalSend.call(this, encrypted);
            }
            return originalSend.call(this, data);
        }
        catch (error) {
            // Si hay error en el cifrado, enviar datos originales
            return originalSend.call(this, data);
        }
    };
    next();
};
exports.encryptResponseData = encryptResponseData;
/**
 * Función para cifrar campos sensibles en un objeto
 *
 * @param obj - Objeto a procesar
 * @returns any - Objeto con campos sensibles cifrados
 */
const encryptSensitiveFields = (obj) => {
    if (obj === null || obj === undefined) {
        return obj;
    }
    if (Array.isArray(obj)) {
        return obj.map(item => encryptSensitiveFields(item));
    }
    if (typeof obj === 'object') {
        const result = {};
        for (const [key, value] of Object.entries(obj)) {
            // Campos sensibles que deben ser cifrados
            const sensitiveFields = ['email', 'password', 'nombre', 'apellido', 'telefono', 'direccion'];
            if (sensitiveFields.includes(key.toLowerCase()) && typeof value === 'string') {
                result[key] = (0, exports.encryptSensitiveData)(value);
            }
            else {
                result[key] = encryptSensitiveFields(value);
            }
        }
        return result;
    }
    return obj;
};
/**
 * Middleware para headers de seguridad HTTP
 * Configura headers de seguridad para proteger contra ataques comunes
 */
exports.securityHeaders = (0, helmet_1.default)({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'"],
            fontSrc: ["'self'"],
            objectSrc: ["'none'"],
            mediaSrc: ["'self'"],
            frameSrc: ["'none'"],
        },
    },
    crossOriginEmbedderPolicy: false,
    hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
    }
});
/**
 * Middleware de rate limiting para prevenir ataques de fuerza bruta
 */
exports.rateLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 100, // máximo 100 requests por IP por ventana
    message: {
        success: false,
        error: 'Demasiadas solicitudes desde esta IP, intente nuevamente en 15 minutos.'
    },
    standardHeaders: true,
    legacyHeaders: false,
});
/**
 * Middleware de rate limiting específico para login
 */
exports.loginRateLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 5, // máximo 5 intentos de login por IP por ventana
    message: {
        success: false,
        error: 'Demasiados intentos de login, intente nuevamente en 15 minutos.'
    },
    standardHeaders: true,
    legacyHeaders: false,
});
/**
 * Middleware para sanitizar datos de entrada
 * Limpia y valida datos de entrada para prevenir inyecciones
 */
const sanitizeInput = (req, res, next) => {
    const sanitizeObject = (obj) => {
        if (obj === null || obj === undefined) {
            return obj;
        }
        if (Array.isArray(obj)) {
            return obj.map(item => sanitizeObject(item));
        }
        if (typeof obj === 'string') {
            // Remover caracteres peligrosos
            return obj
                .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
                .replace(/javascript:/gi, '')
                .replace(/on\w+\s*=/gi, '')
                .trim();
        }
        if (typeof obj === 'object') {
            const result = {};
            for (const [key, value] of Object.entries(obj)) {
                result[key] = sanitizeObject(value);
            }
            return result;
        }
        return obj;
    };
    // Sanitizar body, query y params
    if (req.body) {
        req.body = sanitizeObject(req.body);
    }
    if (req.query) {
        req.query = sanitizeObject(req.query);
    }
    if (req.params) {
        req.params = sanitizeObject(req.params);
    }
    next();
};
exports.sanitizeInput = sanitizeInput;
/**
 * Middleware para validar headers de seguridad
 * Verifica que las requests vengan con headers apropiados
 */
const validateSecurityHeaders = (req, res, next) => {
    // Verificar que la request venga de un origen válido
    const origin = req.get('Origin');
    const referer = req.get('Referer');
    // En producción, validar orígenes permitidos
    if (process.env.NODE_ENV === 'production') {
        const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [];
        if (origin && !allowedOrigins.includes(origin)) {
            return next(errors_1.createError.forbidden('Origen no permitido'));
        }
    }
    // Verificar User-Agent
    const userAgent = req.get('User-Agent');
    if (!userAgent || userAgent.length < 10) {
        return next(errors_1.createError.badRequest('User-Agent inválido'));
    }
    next();
};
exports.validateSecurityHeaders = validateSecurityHeaders;
/**
 * Middleware para logging de seguridad
 * Registra eventos de seguridad importantes
 */
const securityLogger = (req, res, next) => {
    const startTime = Date.now();
    // Log de request
    console.log(`[SECURITY] ${req.method} ${req.path} - IP: ${req.ip} - User-Agent: ${req.get('User-Agent')}`);
    // Interceptar respuestas para logging
    const originalSend = res.send;
    res.send = function (data) {
        const duration = Date.now() - startTime;
        const statusCode = res.statusCode;
        // Log de eventos de seguridad importantes
        if (statusCode === 401 || statusCode === 403) {
            console.warn(`[SECURITY ALERT] ${req.method} ${req.path} - Status: ${statusCode} - IP: ${req.ip} - Duration: ${duration}ms`);
        }
        if (statusCode >= 500) {
            console.error(`[SECURITY ERROR] ${req.method} ${req.path} - Status: ${statusCode} - IP: ${req.ip} - Duration: ${duration}ms`);
        }
        return originalSend.call(this, data);
    };
    next();
};
exports.securityLogger = securityLogger;
/**
 * Middleware para validar tamaño de request
 * Previene ataques de denegación de servicio por tamaño excesivo
 */
const validateRequestSize = (maxSize = 1024 * 1024) => {
    return (req, res, next) => {
        const contentLength = parseInt(req.get('Content-Length') || '0');
        if (contentLength > maxSize) {
            return next(errors_1.createError.badRequest(`Request demasiado grande. Máximo permitido: ${maxSize} bytes`));
        }
        next();
    };
};
exports.validateRequestSize = validateRequestSize;
/**
 * Middleware para validar tipos de contenido
 * Asegura que solo se acepten tipos de contenido válidos
 */
const validateContentType = (allowedTypes = ['application/json', 'multipart/form-data']) => {
    return (req, res, next) => {
        const contentType = req.get('Content-Type');
        if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
            if (!contentType || !allowedTypes.some(type => contentType.includes(type))) {
                return next(errors_1.createError.badRequest(`Tipo de contenido no permitido. Permitidos: ${allowedTypes.join(', ')}`));
            }
        }
        next();
    };
};
exports.validateContentType = validateContentType;
