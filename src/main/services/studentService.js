const studentRepository = require('../database/repositories/studentRepository');
const courseRepository = require('../database/repositories/courseRepository');
const Validators = require('../../shared/utils/validators');
const ErrorHandler = require('../../shared/utils/errorHandler');

class StudentService {
  // Crear estudiante con validaciones
  async createStudent(courseId, fullName, studentCode, listNumber) {
    try {
      // ========== VALIDACIONES ==========
      
      if (!Validators.isPositiveInteger(courseId)) {
        return ErrorHandler.handleValidationError('courseId', 'ID de curso inválido');
      }

      // Sanitizar inputs
      fullName = Validators.sanitize(fullName);
      if (studentCode) {
        studentCode = Validators.sanitize(studentCode);
      }

      // Validar campos requeridos
      if (!fullName || fullName.trim() === '') {
        return ErrorHandler.handleValidationError('fullName', 'El nombre completo es requerido');
      }

      if (!Validators.isValidLength(fullName, 3, 100)) {
        return ErrorHandler.handleValidationError('fullName', 'El nombre debe tener entre 3 y 100 caracteres');
      }

      // Validar código de estudiante (máximo 14 dígitos)
      if (studentCode && studentCode.length > 14) {
        return ErrorHandler.handleValidationError('studentCode', 'El código de estudiante no puede exceder 14 caracteres');
      }

      // Validar número de lista
      if (!listNumber || listNumber < 1) {
        return ErrorHandler.handleValidationError('listNumber', 'El número de lista debe ser mayor a 0');
      }

      // Validar que el número de lista no exceda 3 dígitos (999)
      if (listNumber > 999) {
        return ErrorHandler.handleValidationError('listNumber', 'El número de lista no puede exceder 999');
      }

      // Validar seguridad de inputs
      if (!Validators.isSafeInput(fullName) || (studentCode && !Validators.isSafeInput(studentCode))) {
        ErrorHandler.logSecurityEvent('MALICIOUS_INPUT_STUDENT', { courseId, fullName });
        return ErrorHandler.createError(
          ErrorHandler.ErrorTypes.VALIDATION,
          'Se detectaron caracteres no permitidos'
        );
      }

      // Verificar que el curso existe
      const course = courseRepository.findById(courseId);
      if (!course) {
        return ErrorHandler.handleNotFoundError('Curso');
      }

      // Verificar que no exista el número de lista en el curso
      if (studentRepository.existsListNumber(courseId, listNumber)) {
        return ErrorHandler.createError(
          ErrorHandler.ErrorTypes.DUPLICATE,
          'Ya existe un estudiante con ese número de lista en este curso'
        );
      }

      // ========== CREAR ESTUDIANTE ==========
      
      const result = studentRepository.insert(courseId, fullName, studentCode, listNumber);
      const studentId = result.lastInsertRowid;

      const student = studentRepository.findById(studentId);

      return { 
        success: true, 
        student,
        id: studentId,
        message: 'Estudiante creado exitosamente' 
      };

    } catch (error) {
      ErrorHandler.logCriticalError(error, { action: 'createStudent', courseId });
      return ErrorHandler.handleDatabaseError(error);
    }
  }

  // Obtener estudiantes por curso
  async getStudentsByCourse(courseId) {
    try {
      if (!Validators.isPositiveInteger(courseId)) {
        return ErrorHandler.handleValidationError('courseId', 'ID de curso inválido');
      }

      const students = studentRepository.findByCourse(courseId);
      
      return {
        success: true,
        students
      };

    } catch (error) {
      ErrorHandler.logCriticalError(error, { action: 'getStudentsByCourse', courseId });
      return ErrorHandler.handleDatabaseError(error);
    }
  }

  // Obtener estudiante por ID
  async getStudentById(studentId) {
    try {
      if (!Validators.isPositiveInteger(studentId)) {
        return ErrorHandler.handleValidationError('studentId', 'ID de estudiante inválido');
      }

      const student = studentRepository.findById(studentId);
      
      if (!student) {
        return ErrorHandler.handleNotFoundError('Estudiante');
      }

      return {
        success: true,
        student
      };

    } catch (error) {
      ErrorHandler.logCriticalError(error, { action: 'getStudentById', studentId });
      return ErrorHandler.handleDatabaseError(error);
    }
  }

  // Actualizar estudiante con validaciones
  async updateStudent(studentId, fullName, studentCode, listNumber) {
    try {
      // ========== VALIDACIONES ==========
      
      if (!Validators.isPositiveInteger(studentId)) {
        return ErrorHandler.handleValidationError('studentId', 'ID de estudiante inválido');
      }

      // Verificar que el estudiante existe
      const existingStudent = studentRepository.findById(studentId);
      if (!existingStudent) {
        return ErrorHandler.handleNotFoundError('Estudiante');
      }

      // Sanitizar inputs
      fullName = Validators.sanitize(fullName);
      if (studentCode) {
        studentCode = Validators.sanitize(studentCode);
      }

      // Validar campos
      if (!fullName || fullName.trim() === '') {
        return ErrorHandler.handleValidationError('fullName', 'El nombre completo es requerido');
      }

      if (!Validators.isValidLength(fullName, 3, 100)) {
        return ErrorHandler.handleValidationError('fullName', 'El nombre debe tener entre 3 y 100 caracteres');
      }

      // Validar código de estudiante (máximo 14 dígitos)
      if (studentCode && studentCode.length > 14) {
        return ErrorHandler.handleValidationError('studentCode', 'El código de estudiante no puede exceder 14 caracteres');
      }

      // Validar número de lista
      if (!listNumber || listNumber < 1) {
        return ErrorHandler.handleValidationError('listNumber', 'El número de lista debe ser mayor a 0');
      }

      // Validar que el número de lista no exceda 3 dígitos (999)
      if (listNumber > 999) {
        return ErrorHandler.handleValidationError('listNumber', 'El número de lista no puede exceder 999');
      }

      // Validar seguridad
      if (!Validators.isSafeInput(fullName) || (studentCode && !Validators.isSafeInput(studentCode))) {
        ErrorHandler.logSecurityEvent('MALICIOUS_INPUT_STUDENT_UPDATE', { studentId });
        return ErrorHandler.createError(
          ErrorHandler.ErrorTypes.VALIDATION,
          'Se detectaron caracteres no permitidos'
        );
      }

      // Verificar número de lista duplicado (excluyendo el mismo estudiante)
      if (studentRepository.existsListNumber(existingStudent.course_id, listNumber, studentId)) {
        return ErrorHandler.createError(
          ErrorHandler.ErrorTypes.DUPLICATE,
          'Ya existe un estudiante con ese número de lista en este curso'
        );
      }

      // ========== ACTUALIZAR ==========
      
      studentRepository.update(studentId, fullName, studentCode, listNumber);

      const updatedStudent = studentRepository.findById(studentId);

      return { 
        success: true,
        student: updatedStudent,
        message: 'Estudiante actualizado exitosamente'
      };

    } catch (error) {
      ErrorHandler.logCriticalError(error, { action: 'updateStudent', studentId });
      return ErrorHandler.handleDatabaseError(error);
    }
  }

  // Eliminar estudiante
  async deleteStudent(studentId) {
    try {
      if (!Validators.isPositiveInteger(studentId)) {
        return ErrorHandler.handleValidationError('studentId', 'ID de estudiante inválido');
      }

      const student = studentRepository.findById(studentId);
      if (!student) {
        return ErrorHandler.handleNotFoundError('Estudiante');
      }

      // TODO: Verificar si tiene puntos asignados y advertir al usuario
      // Por ahora permitimos eliminarlo (los puntos se eliminarán por CASCADE)

      studentRepository.delete(studentId);

      return { 
        success: true,
        message: 'Estudiante eliminado exitosamente'
      };

    } catch (error) {
      ErrorHandler.logCriticalError(error, { action: 'deleteStudent', studentId });
      return ErrorHandler.handleDatabaseError(error);
    }
  }
}

module.exports = new StudentService();