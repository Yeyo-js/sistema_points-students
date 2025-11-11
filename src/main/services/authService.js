const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const userRepository = require('../database/repositories/userRepository');
const Validators = require('../../shared/utils/validators');
const ErrorHandler = require('../../shared/utils/errorHandler');
const rateLimiter = require('../../shared/utils/rateLimiter');

// Validar que JWT_SECRET esté configurado
if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET no está configurado en las variables de entorno. Por favor, configura el archivo .env');
}

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d'; // Token válido por 7 días (o según .env)

class AuthService {
  // Registrar nuevo usuario
  async register(username, fullName, email, password, confirmPassword) {
    try {
      // ========== VALIDACIONES DE SEGURIDAD ==========

      // Sanitizar inputs
      username = Validators.sanitize(username);
      fullName = Validators.sanitize(fullName);
      email = Validators.sanitize(email);

      // Validar campos vacíos
      if (!username || username.trim() === "") {
        return ErrorHandler.handleValidationError(
          "username",
          "El nombre de usuario es requerido"
        );
      }

      if (!fullName || fullName.trim() === "") {
        return ErrorHandler.handleValidationError(
          "fullName",
          "El nombre completo es requerido"
        );
      }

      if (!email || email.trim() === "") {
        return ErrorHandler.handleValidationError(
          "email",
          "El email es requerido"
        );
      }

      if (!password || !confirmPassword) {
        return ErrorHandler.handleValidationError(
          "password",
          "La contraseña es requerida"
        );
      }

      // Validar formato de username
      if (!Validators.isValidUsername(username)) {
        return ErrorHandler.handleValidationError(
          "username",
          "El nombre de usuario debe tener entre 3-20 caracteres y solo puede contener letras, números, guiones y guiones bajos"
        );
      }

      // Validar longitud de nombre completo
      if (!Validators.isValidLength(fullName, 3, 100)) {
        return ErrorHandler.handleValidationError(
          "fullName",
          "El nombre completo debe tener entre 3 y 100 caracteres"
        );
      }

      // Validar formato de email
      if (!Validators.isValidEmail(email)) {
        return ErrorHandler.handleValidationError(
          "email",
          "Formato de email inválido"
        );
      }

      // Validar contraseña fuerte
      if (!Validators.isStrongPassword(password)) {
        return ErrorHandler.handleValidationError(
          "password",
          "La contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula y un número"
        );
      }

      // Validar coincidencia de contraseñas
      if (password !== confirmPassword) {
        return ErrorHandler.handleValidationError(
          "confirmPassword",
          "Las contraseñas no coinciden"
        );
      }

      // Validar seguridad de inputs (SQL Injection y XSS)
      if (
        !Validators.isSafeInput(username) ||
        !Validators.isSafeInput(fullName) ||
        !Validators.isSafeInput(email)
      ) {
        ErrorHandler.logSecurityEvent("MALICIOUS_INPUT_ATTEMPT", {
          username,
          email,
          action: "register",
        });
        return ErrorHandler.createError(
          ErrorHandler.ErrorTypes.VALIDATION,
          "Se detectaron caracteres no permitidos en los datos ingresados"
        );
      }

      // Verificar si ya existe el username
      if (userRepository.existsUsername(username)) {
        return ErrorHandler.createError(
          ErrorHandler.ErrorTypes.DUPLICATE,
          "El nombre de usuario ya está en uso"
        );
      }

      // Verificar si ya existe el email
      if (userRepository.existsEmail(email)) {
        return ErrorHandler.createError(
          ErrorHandler.ErrorTypes.DUPLICATE,
          "El email ya está registrado"
        );
      }

      // ========== ENCRIPTACIÓN Y CREACIÓN ==========

      // Encriptar contraseña con bcrypt (10 rounds)
      const hashedPassword = await bcrypt.hash(password, 10);

      // Crear usuario
      const result = userRepository.insert(
        username,
        fullName,
        email,
        hashedPassword
      );
      const userId = result.lastInsertRowid;

      console.log("👤 Usuario creado con ID:", userId);

      // Generar token JWT
      const token = this.generateToken(userId, username);

      // Obtener usuario creado (sin password)
      const user = userRepository.findById(userId);

      if (!user) {
        console.error("❌ Error: No se pudo obtener el usuario recién creado");
        return ErrorHandler.createError(
          ErrorHandler.ErrorTypes.DATABASE,
          "Error al crear usuario: no se pudo verificar la creación"
        );
      }

      console.log("✅ Usuario obtenido de BD:", user);

      // Eliminar password del objeto de respuesta
      delete user.password;

      // Log de evento de seguridad
      ErrorHandler.logSecurityEvent("USER_REGISTERED", {
        userId,
        username,
        email,
      });

      return {
        success: true,
        user,
        token,
        message: "Usuario registrado exitosamente",
      };
    } catch (error) {
      ErrorHandler.logCriticalError(error, { action: 'register', username, email });
      return ErrorHandler.handleDatabaseError(error);
    }
  }

  // Iniciar sesión
  async login(username, password) {
    try {
      // ========== VALIDACIONES DE SEGURIDAD ==========
      
      // Sanitizar inputs
      username = Validators.sanitize(username);

      // Validar campos vacíos
      if (!username || username.trim() === '') {
        return ErrorHandler.handleValidationError('username', 'El nombre de usuario es requerido');
      }

      if (!password || password.trim() === '') {
        return ErrorHandler.handleValidationError('password', 'La contraseña es requerida');
      }

      // Verificar seguridad de inputs
      if (!Validators.isSafeInput(username)) {
        ErrorHandler.logSecurityEvent('MALICIOUS_LOGIN_ATTEMPT', {
          username,
          action: 'login'
        });
        return ErrorHandler.createError(
          ErrorHandler.ErrorTypes.VALIDATION,
          'Se detectaron caracteres no permitidos'
        );
      }

      // ========== RATE LIMITING (Protección contra fuerza bruta) ==========
      
      const rateLimitCheck = rateLimiter.recordAttempt(username);
      
      if (rateLimitCheck.blocked) {
        ErrorHandler.logSecurityEvent('RATE_LIMIT_EXCEEDED', {
          username,
          remainingMinutes: rateLimitCheck.remainingMinutes
        });
        return ErrorHandler.createError(
          ErrorHandler.ErrorTypes.AUTHENTICATION,
          `Demasiados intentos fallidos. Intenta nuevamente en ${rateLimitCheck.remainingMinutes} minutos`
        );
      }

      // ========== AUTENTICACIÓN ==========
      
      // Buscar usuario
      const user = userRepository.findByUsername(username);
      
      if (!user) {
        ErrorHandler.logSecurityEvent('LOGIN_FAILED_USER_NOT_FOUND', { username });
        return ErrorHandler.handleAuthError('Usuario o contraseña incorrectos');
      }

      // Verificar contraseña
      const isValidPassword = await bcrypt.compare(password, user.password);
      
      if (!isValidPassword) {
        ErrorHandler.logSecurityEvent('LOGIN_FAILED_WRONG_PASSWORD', { 
          username,
          attemptsRemaining: rateLimitCheck.attemptsRemaining 
        });
        
        return ErrorHandler.createError(
          ErrorHandler.ErrorTypes.AUTHENTICATION,
          `Usuario o contraseña incorrectos. Intentos restantes: ${rateLimitCheck.attemptsRemaining}`
        );
      }

      // ========== LOGIN EXITOSO ==========
      
      // Limpiar intentos fallidos
      rateLimiter.clearAttempts(username);

      // Generar token JWT
      const token = this.generateToken(user.id, user.username);

      // Eliminar password del objeto de respuesta
      delete user.password;

      // Log de evento de seguridad
      ErrorHandler.logSecurityEvent('USER_LOGIN_SUCCESS', {
        userId: user.id,
        username: user.username
      });

      return {
        success: true,
        user,
        token,
        message: 'Inicio de sesión exitoso'
      };

    } catch (error) {
      ErrorHandler.logCriticalError(error, { action: 'login', username });
      return ErrorHandler.createError(
        ErrorHandler.ErrorTypes.INTERNAL,
        'Error al iniciar sesión. Intenta nuevamente.'
      );
    }
  }

  // Generar JWT token
  generateToken(userId, username) {
    return jwt.sign(
      { 
        userId, 
        username,
        iat: Math.floor(Date.now() / 1000) // Issued at
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );
  }

  // Verificar token
  verifyToken(token) {
    try {
      if (!token || token.trim() === '') {
        return ErrorHandler.handleAuthError('Token no proporcionado');
      }

      const decoded = jwt.verify(token, JWT_SECRET);
      
      return { 
        success: true, 
        data: decoded 
      };

    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return ErrorHandler.handleAuthError('Token expirado. Por favor inicia sesión nuevamente');
      }
      
      if (error.name === 'JsonWebTokenError') {
        ErrorHandler.logSecurityEvent('INVALID_TOKEN_ATTEMPT', { error: error.message });
        return ErrorHandler.handleAuthError('Token inválido');
      }

      return ErrorHandler.handleAuthError('Error al verificar token');
    }
  }

  // Obtener usuario actual por token
  getCurrentUser(token) {
    try {
      const verification = this.verifyToken(token);
      
      if (!verification.success) {
        return verification;
      }

      const user = userRepository.findById(verification.data.userId);
      
      if (!user) {
        return ErrorHandler.handleNotFoundError('Usuario');
      }

      delete user.password;
      
      return { 
        success: true, 
        user 
      };

    } catch (error) {
      ErrorHandler.logCriticalError(error, { action: 'getCurrentUser' });
      return ErrorHandler.createError(
        ErrorHandler.ErrorTypes.INTERNAL,
        'Error al obtener usuario actual'
      );
    }
  }

  // Cambiar contraseña
  async changePassword(userId, currentPassword, newPassword, confirmNewPassword) {
    try {
      // ========== VALIDACIONES ==========
      
      if (!currentPassword || !newPassword || !confirmNewPassword) {
        return ErrorHandler.handleValidationError('password', 'Todos los campos son requeridos');
      }

      if (!Validators.isStrongPassword(newPassword)) {
        return ErrorHandler.handleValidationError(
          'newPassword',
          'La nueva contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula y un número'
        );
      }

      if (newPassword !== confirmNewPassword) {
        return ErrorHandler.handleValidationError('confirmNewPassword', 'Las contraseñas nuevas no coinciden');
      }

      if (currentPassword === newPassword) {
        return ErrorHandler.handleValidationError('newPassword', 'La nueva contraseña debe ser diferente a la actual');
      }

      // Obtener usuario
      const user = userRepository.findById(userId);
      
      if (!user) {
        return ErrorHandler.handleNotFoundError('Usuario');
      }

      // Verificar contraseña actual
      const isValidPassword = await bcrypt.compare(currentPassword, user.password);
      
      if (!isValidPassword) {
        ErrorHandler.logSecurityEvent('CHANGE_PASSWORD_FAILED', { userId });
        return ErrorHandler.handleAuthError('La contraseña actual es incorrecta');
      }

      // Encriptar nueva contraseña
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // Actualizar contraseña
      userRepository.updatePassword(userId, hashedPassword);

      // Log de seguridad
      ErrorHandler.logSecurityEvent('PASSWORD_CHANGED', { userId });

      return { 
        success: true, 
        message: 'Contraseña actualizada correctamente' 
      };

    } catch (error) {
      ErrorHandler.logCriticalError(error, { action: 'changePassword', userId });
      return ErrorHandler.handleDatabaseError(error);
    }
  }

  // Cerrar sesión (opcional - para limpiar rate limiting)
  logout(username) {
    try {
      rateLimiter.clearAttempts(username);
      
      ErrorHandler.logSecurityEvent('USER_LOGOUT', { username });
      
      return { 
        success: true, 
        message: 'Sesión cerrada correctamente' 
      };
    } catch (error) {
      return { success: true }; // No fallar el logout
    }
  }
}

module.exports = new AuthService();