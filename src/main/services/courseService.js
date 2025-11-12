const courseRepository = require('../database/repositories/courseRepository');
const Validators = require('../../shared/utils/validators');
const ErrorHandler = require('../../shared/utils/errorHandler');

class CourseService {

  // Crear curso
  createCourse(userId, name, level, academicPeriod) {
    try {
      // ========== VALIDACIONES ==========
      
      // Sanitizar inputs
      name = Validators.sanitize(name);
      level = Validators.sanitize(level);
      academicPeriod = Validators.sanitize(academicPeriod);

      // Validar campos requeridos
      if (!name || name.trim() === '') {
        return ErrorHandler.handleValidationError('name', 'El nombre del curso es requerido');
      }

      if (!level || level.trim() === '') {
        return ErrorHandler.handleValidationError('level', 'El nivel es requerido');
      }

      if (!academicPeriod || academicPeriod.trim() === '') {
        return ErrorHandler.handleValidationError('academicPeriod', 'El periodo académico es requerido');
      }

      // Validar longitud
      if (!Validators.isValidLength(name, 3, 100)) {
        return ErrorHandler.handleValidationError('name', 'El nombre del curso debe tener entre 3 y 100 caracteres');
      }

      if (!Validators.isValidLength(level, 3, 50)) {
        return ErrorHandler.handleValidationError('level', 'El nivel debe tener entre 3 y 50 caracteres');
      }

      if (!Validators.isValidLength(academicPeriod, 3, 50)) {
        return ErrorHandler.handleValidationError('academicPeriod', 'El periodo académico debe tener entre 3 y 50 caracteres');
      }

      // Validar seguridad
      if (!Validators.isSafeInput(name) || !Validators.isSafeInput(level) || !Validators.isSafeInput(academicPeriod)) {
        ErrorHandler.logSecurityEvent('MALICIOUS_INPUT_COURSE', { userId, name, level });
        return ErrorHandler.createError(
          ErrorHandler.ErrorTypes.VALIDATION,
          'Se detectaron caracteres no permitidos'
        );
      }

      // ========== CREAR CURSO ==========
      
      const result = courseRepository.insert(userId, name, level, academicPeriod);
      const courseId = result.lastInsertRowid;

      const course = courseRepository.findById(courseId);

      return {
        success: true,
        course,
        message: 'Curso creado exitosamente'
      };

    } catch (error) {
      ErrorHandler.logCriticalError(error, { action: 'createCourse', userId });
      return ErrorHandler.handleDatabaseError(error);
    }
  }

  // Obtener cursos del usuario
  getCoursesByUser(userId) {
    try {
      if (!Validators.isPositiveInteger(userId)) {
        return ErrorHandler.handleValidationError('userId', 'ID de usuario inválido');
      }

      const courses = courseRepository.findByUser(userId);
      
      return {
        success: true,
        courses
      };

    } catch (error) {
      ErrorHandler.logCriticalError(error, { action: 'getCoursesByUser', userId });
      return ErrorHandler.handleDatabaseError(error);
    }
  }

  // Obtener curso por ID
  getCourseById(courseId, userId) {
    try {
      if (!Validators.isPositiveInteger(courseId)) {
        return ErrorHandler.handleValidationError('courseId', 'ID de curso inválido');
      }

      const course = courseRepository.findById(courseId);

      if (!course) {
        return ErrorHandler.handleNotFoundError('Curso');
      }

      // Verificar que el curso pertenece al usuario
      if (course.user_id !== userId) {
        ErrorHandler.logSecurityEvent('UNAUTHORIZED_COURSE_ACCESS', { userId, courseId });
        return ErrorHandler.handleAuthorizationError('No tienes permiso para acceder a este curso');
      }

      return {
        success: true,
        course
      };

    } catch (error) {
      ErrorHandler.logCriticalError(error, { action: 'getCourseById', courseId, userId });
      return ErrorHandler.handleDatabaseError(error);
    }
  }

  // Actualizar curso
  updateCourse(courseId, userId, name, level, academicPeriod) {
    try {
      // ========== VALIDACIONES ==========
      
      if (!Validators.isPositiveInteger(courseId)) {
        return ErrorHandler.handleValidationError('courseId', 'ID de curso inválido');
      }

      // Verificar que el curso existe y pertenece al usuario
      const existingCourse = courseRepository.findById(courseId);
      
      if (!existingCourse) {
        return ErrorHandler.handleNotFoundError('Curso');
      }

      if (existingCourse.user_id !== userId) {
        ErrorHandler.logSecurityEvent('UNAUTHORIZED_COURSE_UPDATE', { userId, courseId });
        return ErrorHandler.handleAuthorizationError('No tienes permiso para modificar este curso');
      }

      // Sanitizar inputs
      name = Validators.sanitize(name);
      level = Validators.sanitize(level);
      academicPeriod = Validators.sanitize(academicPeriod);

      // Validar campos
      if (!name || name.trim() === '') {
        return ErrorHandler.handleValidationError('name', 'El nombre del curso es requerido');
      }

      if (!level || level.trim() === '') {
        return ErrorHandler.handleValidationError('level', 'El nivel es requerido');
      }

      if (!academicPeriod || academicPeriod.trim() === '') {
        return ErrorHandler.handleValidationError('academicPeriod', 'El periodo académico es requerido');
      }

      // Validar longitud
      if (!Validators.isValidLength(name, 3, 100)) {
        return ErrorHandler.handleValidationError('name', 'El nombre del curso debe tener entre 3 y 100 caracteres');
      }

      // Validar seguridad
      if (!Validators.isSafeInput(name) || !Validators.isSafeInput(level) || !Validators.isSafeInput(academicPeriod)) {
        ErrorHandler.logSecurityEvent('MALICIOUS_INPUT_COURSE_UPDATE', { userId, courseId });
        return ErrorHandler.createError(
          ErrorHandler.ErrorTypes.VALIDATION,
          'Se detectaron caracteres no permitidos'
        );
      }

      // ========== ACTUALIZAR ==========
      
      courseRepository.update(courseId, name, level, academicPeriod);

      const updatedCourse = courseRepository.findById(courseId);

      return {
        success: true,
        course: updatedCourse,
        message: 'Curso actualizado exitosamente'
      };

    } catch (error) {
      ErrorHandler.logCriticalError(error, { action: 'updateCourse', courseId, userId });
      return ErrorHandler.handleDatabaseError(error);
    }
  }

  // Eliminar curso
  deleteCourse(courseId, userId) {
    try {
      if (!Validators.isPositiveInteger(courseId)) {
        return ErrorHandler.handleValidationError('courseId', 'ID de curso inválido');
      }

      // Verificar que el curso existe y pertenece al usuario
      const course = courseRepository.findById(courseId);
      
      if (!course) {
        return ErrorHandler.handleNotFoundError('Curso');
      }

      if (course.user_id !== userId) {
        ErrorHandler.logSecurityEvent('UNAUTHORIZED_COURSE_DELETE', { userId, courseId });
        return ErrorHandler.handleAuthorizationError('No tienes permiso para eliminar este curso');
      }

      // === LÓGICA DE VALIDACIÓN ELIMINADA (CORRECCIÓN) ===
      // Ya no bloqueamos la eliminación. La base de datos se encargará de:
      // DELETE FROM students WHERE course_id = ?
      // Y las FKs en points, student_totals, y group_students se encargarán del resto.
      
      // Eliminar curso
      courseRepository.delete(courseId);

      return {
        success: true,
        message: 'Curso y todos los datos asociados eliminados exitosamente'
      };

    } catch (error) {
      ErrorHandler.logCriticalError(error, { action: 'deleteCourse', courseId, userId });
      return ErrorHandler.handleDatabaseError(error);
    }
  }

  // Obtener estadísticas del curso
  getCourseStatistics(courseId, userId) {
    try {
      if (!Validators.isPositiveInteger(courseId)) {
        return ErrorHandler.handleValidationError('courseId', 'ID de curso inválido');
      }

      // Verificar autorización
      if (!courseRepository.belongsToUser(courseId, userId)) {
        ErrorHandler.logSecurityEvent('UNAUTHORIZED_COURSE_STATS_ACCESS', { userId, courseId });
        return ErrorHandler.handleAuthorizationError('No tienes permiso para ver las estadísticas de este curso');
      }

      const stats = courseRepository.getStatistics(courseId);

      return {
        success: true,
        statistics: stats
      };

    } catch (error) {
      ErrorHandler.logCriticalError(error, { action: 'getCourseStatistics', courseId, userId });
      return ErrorHandler.handleDatabaseError(error);
    }
  }
}

module.exports = new CourseService();