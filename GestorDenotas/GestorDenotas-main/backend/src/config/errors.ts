// backend/src/config/errors.ts

// Tipos de errores comunes
export enum ErrorType {
  VALIDATION = 'VALIDATION_ERROR',
  NOT_FOUND = 'NOT_FOUND',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  CONFLICT = 'CONFLICT',
  INTERNAL = 'INTERNAL_ERROR'
}

// Interfaz para errores consistentes
export interface AppError {
  type: ErrorType;
  message: string;
  details?: any;
  statusCode: number;
}

// Clase personalizada para errores de la aplicación
export class AppErrorClass extends Error {
  public type: ErrorType;
  public statusCode: number;
  public details?: any;

  constructor(type: ErrorType, message: string, statusCode: number, details?: any) {
    super(message);
    this.type = type;
    this.statusCode = statusCode;
    this.details = details;
  }
}

// Funciones helper para crear errores
export const createError = {
  validation: (message: string, details?: any): AppErrorClass => 
    new AppErrorClass(ErrorType.VALIDATION, message, 400, details),
  
  badRequest: (message: string, details?: any): AppErrorClass => 
    new AppErrorClass(ErrorType.VALIDATION, message, 400, details),
  
  notFound: (message: string): AppErrorClass => 
    new AppErrorClass(ErrorType.NOT_FOUND, message, 404),
  
  unauthorized: (message: string = 'No autorizado'): AppErrorClass => 
    new AppErrorClass(ErrorType.UNAUTHORIZED, message, 401),
  
  forbidden: (message: string = 'Acceso denegado'): AppErrorClass => 
    new AppErrorClass(ErrorType.FORBIDDEN, message, 403),
  
  conflict: (message: string, details?: any): AppErrorClass => 
    new AppErrorClass(ErrorType.CONFLICT, message, 409, details),
  
  internal: (message: string = 'Error interno del servidor'): AppErrorClass => 
    new AppErrorClass(ErrorType.INTERNAL, message, 500)
};

// Función para formatear respuesta de error
export const formatErrorResponse = (error: any) => {
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