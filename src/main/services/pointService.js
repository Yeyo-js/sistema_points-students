const pointRepository = require('../database/repositories/pointRepository');
const studentRepository = require('../database/repositories/studentRepository');
const participationTypeRepository = require('../database/repositories/participationTypeRepository');
const courseRepository = require('../database/repositories/courseRepository');
const Validators = require('../../shared/utils/validators');
const ErrorHandler = require('../../shared/utils/errorHandler');

class PointService {
  // Asignar puntos a un estudiante
  assignPoints(studentId, userId, participationTypeId, pointsValue, reason = null) {
    try {
      // ========== VALIDACIONES ==========
      
      if (!Validators.isPositiveInteger(studentId)) {
        return ErrorHandler.handleValidationError('studentId', 'ID de estudiante inválido');
      }

      if (!Validators.isPositiveInteger(participationTypeId)) {
        return ErrorHandler.handleValidationError('participationTypeId', 'ID de tipo de participación inválido');
      }

      if (!Number.isInteger(pointsValue)) {
        return ErrorHandler.handleValidationError('pointsValue', 'El valor de puntos debe ser un número entero');
      }

      if (pointsValue === 0) {
        return ErrorHandler.handleValidationError('pointsValue', 'El valor de puntos no puede ser cero');
      }

      // Validar rango de puntos (-100 a +100)
      if (pointsValue < -100 || pointsValue > 100) {
        return ErrorHandler.handleValidationError('pointsValue', 'El valor de puntos debe estar entre -100 y +100');
      }

      // Sanitizar razón si existe
      if (reason) {
        reason = Validators.sanitize(reason);
        
        if (!Validators.isValidLength(reason, 0, 500)) {
          return ErrorHandler.handleValidationError('reason', 'La razón no puede exceder 500 caracteres');
        }

        if (!Validators.isSafeInput(reason)) {
          ErrorHandler.logSecurityEvent('MALICIOUS_INPUT_POINT_REASON', { userId, studentId });
          return ErrorHandler.createError(
            ErrorHandler.ErrorTypes.VALIDATION,
            'Se detectaron caracteres no permitidos en la razón'
          );
        }
      }

      // Verificar que el estudiante existe
      const student = studentRepository.findById(studentId);
      if (!student) {
        return ErrorHandler.handleNotFoundError('Estudiante');
      }

      // Verificar que el curso pertenece al usuario
      if (!courseRepository.belongsToUser(student.course_id, userId)) {
        ErrorHandler.logSecurityEvent('UNAUTHORIZED_POINTS_ASSIGNMENT', { userId, studentId });
        return ErrorHandler.handleAuthorizationError('No tienes permiso para asignar puntos a este estudiante');
      }

      // Verificar que el tipo de participación existe y pertenece al usuario
      const participationType = participationTypeRepository.findById(participationTypeId);
      if (!participationType) {
        return ErrorHandler.handleNotFoundError('Tipo de participación');
      }

      if (participationType.user_id !== userId) {
        ErrorHandler.logSecurityEvent('UNAUTHORIZED_PARTICIPATION_TYPE_USE', { userId, participationTypeId });
        return ErrorHandler.handleAuthorizationError('No tienes permiso para usar este tipo de participación');
      }

      // ========== ASIGNAR PUNTOS SIN TRANSACCIÓN ==========
      // sql.js no soporta transacciones como better-sqlite3
      // Ejecutamos las operaciones secuencialmente
      
      // 1. Insertar punto
      const result = pointRepository.insert(studentId, userId, participationTypeId, pointsValue, reason);
      const pointId = result.lastInsertRowid;

      // 2. Actualizar totales del estudiante
      pointRepository.updateStudentTotals(studentId);

      // 3. Obtener el punto creado con toda la información
      const point = pointRepository.findById(pointId);

      // 4. Obtener totales actualizados
      const updatedStudent = studentRepository.findById(studentId);

      return {
        success: true,
        point,
        studentTotals: {
          total_points: updatedStudent.total_points,
          participation_count: updatedStudent.participation_count,
          average_points: updatedStudent.average_points,
          rounded_average: updatedStudent.rounded_average
        },
        message: pointsValue > 0 
          ? `Se asignaron ${pointsValue} punto(s) exitosamente`
          : `Se restaron ${Math.abs(pointsValue)} punto(s) exitosamente`
      };

    } catch (error) {
      ErrorHandler.logCriticalError(error, { action: 'assignPoints', studentId, userId });
      return ErrorHandler.handleDatabaseError(error);
    }
  }

  // Obtener historial de puntos de un estudiante
  getStudentPointsHistory(studentId, userId, limit = null) {
    try {
      if (!Validators.isPositiveInteger(studentId)) {
        return ErrorHandler.handleValidationError('studentId', 'ID de estudiante inválido');
      }

      // Verificar que el estudiante existe
      const student = studentRepository.findById(studentId);
      if (!student) {
        return ErrorHandler.handleNotFoundError('Estudiante');
      }

      // Verificar autorización
      if (!courseRepository.belongsToUser(student.course_id, userId)) {
        ErrorHandler.logSecurityEvent('UNAUTHORIZED_POINTS_HISTORY_ACCESS', { userId, studentId });
        return ErrorHandler.handleAuthorizationError('No tienes permiso para ver el historial de este estudiante');
      }

      const points = pointRepository.findByStudent(studentId, limit);

      return {
        success: true,
        points,
        student: {
          id: student.id,
          full_name: student.full_name,
          list_number: student.list_number,
          total_points: student.total_points,
          rounded_average: student.rounded_average
        }
      };

    } catch (error) {
      ErrorHandler.logCriticalError(error, { action: 'getStudentPointsHistory', studentId, userId });
      return ErrorHandler.handleDatabaseError(error);
    }
  }

  // Obtener historial de puntos de un curso
  getCoursePointsHistory(courseId, userId, limit = null) {
    try {
      if (!Validators.isPositiveInteger(courseId)) {
        return ErrorHandler.handleValidationError('courseId', 'ID de curso inválido');
      }

      // Verificar autorización
      if (!courseRepository.belongsToUser(courseId, userId)) {
        ErrorHandler.logSecurityEvent('UNAUTHORIZED_COURSE_POINTS_ACCESS', { userId, courseId });
        return ErrorHandler.handleAuthorizationError('No tienes permiso para ver el historial de este curso');
      }

      const points = pointRepository.findByCourse(courseId, limit);

      return {
        success: true,
        points
      };

    } catch (error) {
      ErrorHandler.logCriticalError(error, { action: 'getCoursePointsHistory', courseId, userId });
      return ErrorHandler.handleDatabaseError(error);
    }
  }

  // Actualizar un punto existente
  updatePoint(pointId, userId, participationTypeId, pointsValue, reason = null) {
    try {
      // ========== VALIDACIONES ==========
      
      if (!Validators.isPositiveInteger(pointId)) {
        return ErrorHandler.handleValidationError('pointId', 'ID de punto inválido');
      }

      if (!Validators.isPositiveInteger(participationTypeId)) {
        return ErrorHandler.handleValidationError('participationTypeId', 'ID de tipo de participación inválido');
      }

      if (!Number.isInteger(pointsValue)) {
        return ErrorHandler.handleValidationError('pointsValue', 'El valor de puntos debe ser un número entero');
      }

      if (pointsValue === 0) {
        return ErrorHandler.handleValidationError('pointsValue', 'El valor de puntos no puede ser cero');
      }

      if (pointsValue < -100 || pointsValue > 100) {
        return ErrorHandler.handleValidationError('pointsValue', 'El valor de puntos debe estar entre -100 y +100');
      }

      // Sanitizar razón
      if (reason) {
        reason = Validators.sanitize(reason);
        
        if (!Validators.isValidLength(reason, 0, 500)) {
          return ErrorHandler.handleValidationError('reason', 'La razón no puede exceder 500 caracteres');
        }

        if (!Validators.isSafeInput(reason)) {
          ErrorHandler.logSecurityEvent('MALICIOUS_INPUT_POINT_UPDATE', { userId, pointId });
          return ErrorHandler.createError(
            ErrorHandler.ErrorTypes.VALIDATION,
            'Se detectaron caracteres no permitidos en la razón'
          );
        }
      }

      // Verificar que el punto existe
      const existingPoint = pointRepository.findById(pointId);
      if (!existingPoint) {
        return ErrorHandler.handleNotFoundError('Punto');
      }

      // Verificar autorización (que el punto fue creado por el usuario)
      if (existingPoint.user_id !== userId) {
        ErrorHandler.logSecurityEvent('UNAUTHORIZED_POINT_UPDATE', { userId, pointId });
        return ErrorHandler.handleAuthorizationError('No tienes permiso para modificar este punto');
      }

      // Verificar tipo de participación
      const participationType = participationTypeRepository.findById(participationTypeId);
      if (!participationType) {
        return ErrorHandler.handleNotFoundError('Tipo de participación');
      }

      if (participationType.user_id !== userId) {
        ErrorHandler.logSecurityEvent('UNAUTHORIZED_PARTICIPATION_TYPE_UPDATE', { userId, participationTypeId });
        return ErrorHandler.handleAuthorizationError('No tienes permiso para usar este tipo de participación');
      }

      // ========== ACTUALIZAR SIN TRANSACCIÓN ==========
      
      // 1. Actualizar punto
      pointRepository.update(pointId, participationTypeId, pointsValue, reason);

      // 2. Recalcular totales del estudiante
      pointRepository.updateStudentTotals(existingPoint.student_id);

      // 3. Obtener punto actualizado
      const updatedPoint = pointRepository.findById(pointId);

      // 4. Obtener totales actualizados
      const student = studentRepository.findById(existingPoint.student_id);

      return {
        success: true,
        point: updatedPoint,
        studentTotals: {
          total_points: student.total_points,
          participation_count: student.participation_count,
          average_points: student.average_points,
          rounded_average: student.rounded_average
        },
        message: 'Punto actualizado exitosamente'
      };

    } catch (error) {
      ErrorHandler.logCriticalError(error, { action: 'updatePoint', pointId, userId });
      return ErrorHandler.handleDatabaseError(error);
    }
  }

  // Eliminar un punto
  deletePoint(pointId, userId) {
    try {
      if (!Validators.isPositiveInteger(pointId)) {
        return ErrorHandler.handleValidationError('pointId', 'ID de punto inválido');
      }

      // Verificar que el punto existe
      const point = pointRepository.findById(pointId);
      if (!point) {
        return ErrorHandler.handleNotFoundError('Punto');
      }

      // Verificar autorización
      if (point.user_id !== userId) {
        ErrorHandler.logSecurityEvent('UNAUTHORIZED_POINT_DELETE', { userId, pointId });
        return ErrorHandler.handleAuthorizationError('No tienes permiso para eliminar este punto');
      }

      // ========== ELIMINAR SIN TRANSACCIÓN ==========
      
      // 1. Eliminar punto
      pointRepository.delete(pointId);

      // 2. Recalcular totales del estudiante
      pointRepository.updateStudentTotals(point.student_id);

      // 3. Obtener totales actualizados
      const student = studentRepository.findById(point.student_id);

      return {
        success: true,
        studentTotals: {
          total_points: student.total_points,
          participation_count: student.participation_count,
          average_points: student.average_points,
          rounded_average: student.rounded_average
        },
        message: 'Punto eliminado exitosamente'
      };

    } catch (error) {
      ErrorHandler.logCriticalError(error, { action: 'deletePoint', pointId, userId });
      return ErrorHandler.handleDatabaseError(error);
    }
  }

  // Obtener gráfico de evolución de puntos
  getPointsEvolution(studentId, userId) {
    try {
      if (!Validators.isPositiveInteger(studentId)) {
        return ErrorHandler.handleValidationError('studentId', 'ID de estudiante inválido');
      }

      // Verificar autorización
      const student = studentRepository.findById(studentId);
      if (!student) {
        return ErrorHandler.handleNotFoundError('Estudiante');
      }

      if (!courseRepository.belongsToUser(student.course_id, userId)) {
        ErrorHandler.logSecurityEvent('UNAUTHORIZED_POINTS_EVOLUTION_ACCESS', { userId, studentId });
        return ErrorHandler.handleAuthorizationError('No tienes permiso para ver la evolución de este estudiante');
      }

      const evolution = pointRepository.getPointsHistory(studentId);

      return {
        success: true,
        evolution,
        student: {
          id: student.id,
          full_name: student.full_name,
          list_number: student.list_number
        }
      };

    } catch (error) {
      ErrorHandler.logCriticalError(error, { action: 'getPointsEvolution', studentId, userId });
      return ErrorHandler.handleDatabaseError(error);
    }
  }
}

module.exports = new PointService();