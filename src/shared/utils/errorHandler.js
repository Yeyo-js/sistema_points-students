class ErrorHandler {
  // Tipos de errores
  static ErrorTypes = {
    VALIDATION: 'VALIDATION_ERROR',
    DATABASE: 'DATABASE_ERROR',
    AUTHENTICATION: 'AUTHENTICATION_ERROR',
    AUTHORIZATION: 'AUTHORIZATION_ERROR',
    NOT_FOUND: 'NOT_FOUND_ERROR',
    DUPLICATE: 'DUPLICATE_ERROR',
    INTERNAL: 'INTERNAL_ERROR'
  };

  // Crear error formateado
  static createError(type, message, details = null) {
    const error = {
      success: false,
      errorType: type,
      message: message,
      timestamp: new Date().toISOString()
    };

    if (details) {
      error.details = details;
    }

    return error;
  }

  // Manejar error de base de datos
  static handleDatabaseError(error) {
    console.error('[DB ERROR]:', error);

    // Error de constraint UNIQUE
    if (error.code === 'SQLITE_CONSTRAINT' || error.message.includes('UNIQUE')) {
      return this.createError(
        this.ErrorTypes.DUPLICATE,
        'Ya existe un registro con estos datos',
        { original: error.message }
      );
    }

    // Error de foreign key
    if (error.message.includes('FOREIGN KEY')) {
      return this.createError(
        this.ErrorTypes.DATABASE,
        'No se puede realizar la operación: existen datos relacionados',
        { original: error.message }
      );
    }

    // Error genérico de base de datos
    return this.createError(
      this.ErrorTypes.DATABASE,
      'Error al acceder a la base de datos',
      { original: error.message }
    );
  }

  // Manejar error de validación
  static handleValidationError(field, message) {
    return this.createError(
      this.ErrorTypes.VALIDATION,
      message,
      { field }
    );
  }

  // Manejar error de autenticación
  static handleAuthError(message = 'Credenciales inválidas') {
    return this.createError(
      this.ErrorTypes.AUTHENTICATION,
      message
    );
  }

  // Manejar error de autorización
  static handleAuthorizationError(message = 'No tienes permisos para realizar esta acción') {
    return this.createError(
      this.ErrorTypes.AUTHORIZATION,
      message
    );
  }

  // Manejar error de no encontrado
  static handleNotFoundError(resource) {
    return this.createError(
      this.ErrorTypes.NOT_FOUND,
      `${resource} no encontrado`
    );
  }

  // Log de seguridad
  static logSecurityEvent(eventType, details) {
    const logEntry = {
      type: 'SECURITY_EVENT',
      eventType,
      details,
      timestamp: new Date().toISOString()
    };
    
    console.warn('[SECURITY]:', JSON.stringify(logEntry, null, 2));
    
    // Aquí podrías guardar en un archivo de log o base de datos
    // this.saveToSecurityLog(logEntry);
  }

  // Log de errores críticos
  static logCriticalError(error, context = {}) {
    const logEntry = {
      type: 'CRITICAL_ERROR',
      error: error.message,
      stack: error.stack,
      context,
      timestamp: new Date().toISOString()
    };
    
    console.error('[CRITICAL]:', JSON.stringify(logEntry, null, 2));
    
    // Aquí podrías enviar notificación o guardar en log
    // this.notifyCriticalError(logEntry);
  }
}

module.exports = ErrorHandler;