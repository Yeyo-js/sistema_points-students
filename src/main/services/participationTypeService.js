const participationTypeRepository = require('../database/repositories/participationTypeRepository');
const Validators = require('../../shared/utils/validators');
const ErrorHandler = require('../../shared/utils/errorHandler');

class ParticipationTypeService {
  // Crear tipo de participación
  createParticipationType(userId, name, defaultPoints) {
    try {
      // ========== VALIDACIONES ==========
      
      // Sanitizar inputs
      name = Validators.sanitize(name);

      // Validar campos requeridos
      if (!name || name.trim() === '') {
        return ErrorHandler.handleValidationError('name', 'El nombre del tipo de participación es requerido');
      }

      if (!Number.isInteger(defaultPoints)) {
        return ErrorHandler.handleValidationError('defaultPoints', 'Los puntos por defecto deben ser un número entero');
      }

      // Validar longitud del nombre
      if (!Validators.isValidLength(name, 2, 100)) {
        return ErrorHandler.handleValidationError('name', 'El nombre debe tener entre 2 y 100 caracteres');
      }

      // Validar rango de puntos por defecto
      if (defaultPoints < -100 || defaultPoints > 100) {
        return ErrorHandler.handleValidationError('defaultPoints', 'Los puntos por defecto deben estar entre -100 y +100');
      }

      if (defaultPoints === 0) {
        return ErrorHandler.handleValidationError('defaultPoints', 'Los puntos por defecto no pueden ser cero');
      }

      // Validar seguridad
      if (!Validators.isSafeInput(name)) {
        ErrorHandler.logSecurityEvent('MALICIOUS_INPUT_PARTICIPATION_TYPE', { userId, name });
        return ErrorHandler.createError(
          ErrorHandler.ErrorTypes.VALIDATION,
          'Se detectaron caracteres no permitidos en el nombre'
        );
      }

      // Verificar que no exista un tipo con el mismo nombre para el usuario
      if (participationTypeRepository.existsName(userId, name)) {
        return ErrorHandler.createError(
          ErrorHandler.ErrorTypes.DUPLICATE,
          'Ya existe un tipo de participación con ese nombre'
        );
      }

      // ========== CREAR TIPO ==========
      
      const result = participationTypeRepository.insert(userId, name, defaultPoints);
      const typeId = result.lastInsertRowid;

      const participationType = participationTypeRepository.findById(typeId);

      return {
        success: true,
        participationType,
        message: 'Tipo de participación creado exitosamente'
      };

    } catch (error) {
      ErrorHandler.logCriticalError(error, { action: 'createParticipationType', userId });
      return ErrorHandler.handleDatabaseError(error);
    }
  }

  // Obtener tipos de participación del usuario
  getParticipationTypesByUser(userId) {
    try {
      if (!Validators.isPositiveInteger(userId)) {
        return ErrorHandler.handleValidationError('userId', 'ID de usuario inválido');
      }

      const types = participationTypeRepository.findByUser(userId);

      return {
        success: true,
        participationTypes: types
      };

    } catch (error) {
      ErrorHandler.logCriticalError(error, { action: 'getParticipationTypesByUser', userId });
      return ErrorHandler.handleDatabaseError(error);
    }
  }

  // Obtener tipo de participación por ID
  getParticipationTypeById(typeId, userId) {
    try {
      if (!Validators.isPositiveInteger(typeId)) {
        return ErrorHandler.handleValidationError('typeId', 'ID de tipo inválido');
      }

      const participationType = participationTypeRepository.findById(typeId);

      if (!participationType) {
        return ErrorHandler.handleNotFoundError('Tipo de participación');
      }

      // Verificar que el tipo pertenece al usuario
      if (participationType.user_id !== userId) {
        ErrorHandler.logSecurityEvent('UNAUTHORIZED_PARTICIPATION_TYPE_ACCESS', { userId, typeId });
        return ErrorHandler.handleAuthorizationError('No tienes permiso para acceder a este tipo de participación');
      }

      // Obtener estadísticas de uso
      const stats = participationTypeRepository.getUsageStats(typeId);

      return {
        success: true,
        participationType: {
          ...participationType,
          usage_count: stats.usage_count,
          total_points_assigned: stats.total_points_assigned
        }
      };

    } catch (error) {
      ErrorHandler.logCriticalError(error, { action: 'getParticipationTypeById', typeId, userId });
      return ErrorHandler.handleDatabaseError(error);
    }
  }

  // Actualizar tipo de participación
  updateParticipationType(typeId, userId, name, defaultPoints) {
    try {
      // ========== VALIDACIONES ==========
      
      if (!Validators.isPositiveInteger(typeId)) {
        return ErrorHandler.handleValidationError('typeId', 'ID de tipo inválido');
      }

      // Verificar que el tipo existe y pertenece al usuario
      const existingType = participationTypeRepository.findById(typeId);
      
      if (!existingType) {
        return ErrorHandler.handleNotFoundError('Tipo de participación');
      }

      if (existingType.user_id !== userId) {
        ErrorHandler.logSecurityEvent('UNAUTHORIZED_PARTICIPATION_TYPE_UPDATE', { userId, typeId });
        return ErrorHandler.handleAuthorizationError('No tienes permiso para modificar este tipo de participación');
      }

      // Sanitizar inputs
      name = Validators.sanitize(name);

      // Validar campos
      if (!name || name.trim() === '') {
        return ErrorHandler.handleValidationError('name', 'El nombre del tipo de participación es requerido');
      }

      if (!Number.isInteger(defaultPoints)) {
        return ErrorHandler.handleValidationError('defaultPoints', 'Los puntos por defecto deben ser un número entero');
      }

      // Validar longitud del nombre
      if (!Validators.isValidLength(name, 2, 100)) {
        return ErrorHandler.handleValidationError('name', 'El nombre debe tener entre 2 y 100 caracteres');
      }

      // Validar rango de puntos
      if (defaultPoints < -100 || defaultPoints > 100) {
        return ErrorHandler.handleValidationError('defaultPoints', 'Los puntos por defecto deben estar entre -100 y +100');
      }

      if (defaultPoints === 0) {
        return ErrorHandler.handleValidationError('defaultPoints', 'Los puntos por defecto no pueden ser cero');
      }

      // Validar seguridad
      if (!Validators.isSafeInput(name)) {
        ErrorHandler.logSecurityEvent('MALICIOUS_INPUT_PARTICIPATION_TYPE_UPDATE', { userId, typeId });
        return ErrorHandler.createError(
          ErrorHandler.ErrorTypes.VALIDATION,
          'Se detectaron caracteres no permitidos en el nombre'
        );
      }

      // Verificar que no exista otro tipo con el mismo nombre (excluyendo el actual)
      if (participationTypeRepository.existsName(userId, name, typeId)) {
        return ErrorHandler.createError(
          ErrorHandler.ErrorTypes.DUPLICATE,
          'Ya existe un tipo de participación con ese nombre'
        );
      }

      // ========== ACTUALIZAR ==========
      
      participationTypeRepository.update(typeId, name, defaultPoints);

      const updatedType = participationTypeRepository.findById(typeId);

      return {
        success: true,
        participationType: updatedType,
        message: 'Tipo de participación actualizado exitosamente'
      };

    } catch (error) {
      ErrorHandler.logCriticalError(error, { action: 'updateParticipationType', typeId, userId });
      return ErrorHandler.handleDatabaseError(error);
    }
  }

  // Eliminar tipo de participación
  deleteParticipationType(typeId, userId) {
    try {
      if (!Validators.isPositiveInteger(typeId)) {
        return ErrorHandler.handleValidationError('typeId', 'ID de tipo inválido');
      }

      // Verificar que el tipo existe y pertenece al usuario
      const participationType = participationTypeRepository.findById(typeId);
      
      if (!participationType) {
        return ErrorHandler.handleNotFoundError('Tipo de participación');
      }

      if (participationType.user_id !== userId) {
        ErrorHandler.logSecurityEvent('UNAUTHORIZED_PARTICIPATION_TYPE_DELETE', { userId, typeId });
        return ErrorHandler.handleAuthorizationError('No tienes permiso para eliminar este tipo de participación');
      }

      // Verificar si está siendo usado
      const stats = participationTypeRepository.getUsageStats(typeId);
      
      if (stats.usage_count > 0) {
        return ErrorHandler.createError(
          ErrorHandler.ErrorTypes.VALIDATION,
          `No se puede eliminar este tipo porque tiene ${stats.usage_count} registro(s) de puntos asociado(s)`
        );
      }

      // Eliminar tipo
      participationTypeRepository.delete(typeId);

      return {
        success: true,
        message: 'Tipo de participación eliminado exitosamente'
      };

    } catch (error) {
      ErrorHandler.logCriticalError(error, { action: 'deleteParticipationType', typeId, userId });
      return ErrorHandler.handleDatabaseError(error);
    }
  }

  // Crear tipos por defecto para un nuevo usuario
  createDefaultTypes(userId) {
    try {
      const defaultTypes = [
        { name: 'Pregunta en clase', defaultPoints: 2 },
        { name: 'Respuesta correcta', defaultPoints: 3 },
        { name: 'Participación voluntaria', defaultPoints: 2 },
        { name: 'Exposición', defaultPoints: 5 },
        { name: 'Trabajo en equipo', defaultPoints: 3 },
        { name: 'Mala conducta', defaultPoints: -2 },
        { name: 'No participó', defaultPoints: -1 }
      ];

      const createdTypes = [];

      for (const type of defaultTypes) {
        const result = participationTypeRepository.insert(userId, type.name, type.defaultPoints);
        const createdType = participationTypeRepository.findById(result.lastInsertRowid);
        createdTypes.push(createdType);
      }

      return {
        success: true,
        participationTypes: createdTypes,
        message: 'Tipos de participación por defecto creados'
      };

    } catch (error) {
      ErrorHandler.logCriticalError(error, { action: 'createDefaultTypes', userId });
      return ErrorHandler.handleDatabaseError(error);
    }
  }
}

module.exports = new ParticipationTypeService();