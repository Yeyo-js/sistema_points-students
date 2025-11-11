const courseRepository = require('../database/repositories/courseRepository');
const studentRepository = require('../database/repositories/studentRepository');
const pointRepository = require('../database/repositories/pointRepository');
const participationTypeRepository = require('../database/repositories/participationTypeRepository');
const Validators = require('../../shared/utils/validators');
const ErrorHandler = require('../../shared/utils/errorHandler');

class DashboardService {
  // Obtener estadísticas del dashboard para un usuario
  async getDashboardStats(userId) {
    try {
      if (!Validators.isPositiveInteger(userId)) {
        return ErrorHandler.handleValidationError('userId', 'ID de usuario inválido');
      }

      // Obtener todos los cursos del usuario
      const userCourses = courseRepository.findByUser(userId);
      const totalCourses = userCourses.length;

      // Contar total de estudiantes en todos los cursos del usuario
      let totalStudents = 0;
      let totalPoints = 0;

      userCourses.forEach(course => {
        const students = studentRepository.findByCourse(course.id);
        totalStudents += students.length;

        // Contar puntos asignados en este curso
        students.forEach(student => {
          const pointsCount = pointRepository.countByStudent(student.id);
          totalPoints += pointsCount;
        });
      });

      // Contar tipos de participación
      const participationTypes = participationTypeRepository.findAll();
      const totalParticipationTypes = participationTypes.length;

      return {
        success: true,
        stats: {
          totalCourses,
          totalStudents,
          totalPoints,
          totalParticipationTypes
        }
      };

    } catch (error) {
      ErrorHandler.logCriticalError(error, { action: 'getDashboardStats', userId });
      return ErrorHandler.handleDatabaseError(error);
    }
  }
}

module.exports = new DashboardService();
