class RateLimiter {
  constructor() {
    // Almacenar intentos por IP/username
    this.attempts = new Map();
    // Usuarios bloqueados temporalmente
    this.blocked = new Map();
  }

  // Configuración
  static config = {
    maxAttempts: 5,        // Máximo de intentos
    windowMs: 15 * 60 * 1000, // Ventana de tiempo (15 minutos)
    blockDurationMs: 30 * 60 * 1000  // Duración del bloqueo (30 minutos)
  };

  // Registrar intento
  recordAttempt(identifier) {
    const now = Date.now();
    
    // Verificar si está bloqueado
    if (this.isBlocked(identifier)) {
      const blockedUntil = this.blocked.get(identifier);
      const remainingTime = Math.ceil((blockedUntil - now) / 1000 / 60);
      return {
        blocked: true,
        remainingMinutes: remainingTime
      };
    }

    // Obtener intentos previos
    let userAttempts = this.attempts.get(identifier) || [];
    
    // Filtrar intentos dentro de la ventana de tiempo
    userAttempts = userAttempts.filter(timestamp => 
      now - timestamp < RateLimiter.config.windowMs
    );

    // Agregar nuevo intento
    userAttempts.push(now);
    this.attempts.set(identifier, userAttempts);

    // Verificar si excedió el límite
    if (userAttempts.length >= RateLimiter.config.maxAttempts) {
      this.blockUser(identifier);
      return {
        blocked: true,
        remainingMinutes: Math.ceil(RateLimiter.config.blockDurationMs / 1000 / 60)
      };
    }

    return {
      blocked: false,
      attemptsRemaining: RateLimiter.config.maxAttempts - userAttempts.length
    };
  }

  // Bloquear usuario
  blockUser(identifier) {
    const blockedUntil = Date.now() + RateLimiter.config.blockDurationMs;
    this.blocked.set(identifier, blockedUntil);
    console.warn(`[RATE LIMIT] Usuario bloqueado: ${identifier}`);
  }

  // Verificar si está bloqueado
  isBlocked(identifier) {
    const blockedUntil = this.blocked.get(identifier);
    if (!blockedUntil) return false;

    const now = Date.now();
    if (now >= blockedUntil) {
      // El bloqueo expiró
      this.blocked.delete(identifier);
      this.attempts.delete(identifier);
      return false;
    }

    return true;
  }

  // Limpiar intentos exitosos
  clearAttempts(identifier) {
    this.attempts.delete(identifier);
    this.blocked.delete(identifier);
  }

  // Limpiar registros antiguos (ejecutar periódicamente)
  cleanup() {
    const now = Date.now();
    
    // Limpiar intentos antiguos
    for (const [identifier, timestamps] of this.attempts.entries()) {
      const validAttempts = timestamps.filter(timestamp => 
        now - timestamp < RateLimiter.config.windowMs
      );
      
      if (validAttempts.length === 0) {
        this.attempts.delete(identifier);
      } else {
        this.attempts.set(identifier, validAttempts);
      }
    }

    // Limpiar bloqueos expirados
    for (const [identifier, blockedUntil] of this.blocked.entries()) {
      if (now >= blockedUntil) {
        this.blocked.delete(identifier);
      }
    }
  }
}

// Instancia singleton
const rateLimiter = new RateLimiter();

// Limpiar cada 5 minutos
setInterval(() => rateLimiter.cleanup(), 5 * 60 * 1000);

module.exports = rateLimiter;