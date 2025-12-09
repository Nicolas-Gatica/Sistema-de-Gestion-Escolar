"use strict";
// backend/src/config/errors.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatErrorResponse = exports.createError = exports.AppErrorClass = exports.ErrorType = void 0;
// Tipos de errores comunes
var ErrorType;
(function (ErrorType) {
    ErrorType["VALIDATION"] = "VALIDATION_ERROR";
    ErrorType["NOT_FOUND"] = "NOT_FOUND";
    ErrorType["UNAUTHORIZED"] = "UNAUTHORIZED";
    ErrorType["FORBIDDEN"] = "FORBIDDEN";
    ErrorType["CONFLICT"] = "CONFLICT";
    ErrorType["INTERNAL"] = "INTERNAL_ERROR";
})(ErrorType || (exports.ErrorType = ErrorType = {}));
// Clase personalizada para errores de la aplicación
class AppErrorClass extends Error {
    constructor(type, message, statusCode, details) {
        super(message);
        this.type = type;
        this.statusCode = statusCode;
        this.details = details;
    }
}
exports.AppErrorClass = AppErrorClass;
// Funciones helper para crear errores
exports.createError = {
    validation: (message, details) => new AppErrorClass(ErrorType.VALIDATION, message, 400, details),
    badRequest: (message, details) => new AppErrorClass(ErrorType.VALIDATION, message, 400, details),
    notFound: (message) => new AppErrorClass(ErrorType.NOT_FOUND, message, 404),
    unauthorized: (message = 'No autorizado') => new AppErrorClass(ErrorType.UNAUTHORIZED, message, 401),
    forbidden: (message = 'Acceso denegado') => new AppErrorClass(ErrorType.FORBIDDEN, message, 403),
    conflict: (message, details) => new AppErrorClass(ErrorType.CONFLICT, message, 409, details),
    internal: (message = 'Error interno del servidor') => new AppErrorClass(ErrorType.INTERNAL, message, 500)
};
// Función para formatear respuesta de error
const formatErrorResponse = (error) => {
    if (error instanceof AppErrorClass) {
        return {
            success: false,
            error: {
                type: error.type,
                message: error.message,
                details: error.details
            }
        };
    }
    // Para errores de Prisma
    if (error.code) {
        switch (error.code) {
            case 'P2002':
                return {
                    success: false,
                    error: {
                        type: ErrorType.CONFLICT,
                        message: 'El registro ya existe',
                        details: error.meta?.target
                    }
                };
            case 'P2025':
                return {
                    success: false,
                    error: {
                        type: ErrorType.NOT_FOUND,
                        message: 'Registro no encontrado'
                    }
                };
            default:
                return {
                    success: false,
                    error: {
                        type: ErrorType.INTERNAL,
                        message: 'Error de base de datos'
                    }
                };
        }
    }
    // Error genérico
    return {
        success: false,
        error: {
            type: ErrorType.INTERNAL,
            message: error.message || 'Error interno del servidor'
        }
    };
};
exports.formatErrorResponse = formatErrorResponse;
