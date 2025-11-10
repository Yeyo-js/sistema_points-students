import ipcService from './ipcService';

class StudentService {
  // Crear estudiante
  async createStudent(courseId, fullName, studentCode, listNumber) {
    return await ipcService.invoke('student:create', {
      courseId,
      fullName,
      studentCode,
      listNumber
    });
  }

  // Obtener estudiantes por curso
  async getStudentsByCourse(courseId) {
    try {
      const result = await ipcService.invoke('student:getByCourse', {
        courseId
      });
      
      // Asegurarnos de que siempre devuelve el formato correcto
      if (result && result.success !== false) {
        // Si result.students existe, usarlo; si no, asumir que result ES el array
        const students = result.students || result;
        return {
          success: true,
          students: Array.isArray(students) ? students : []
        };
      }
      
      return {
        success: false,
        students: []
      };
    } catch (error) {
      console.error('Error en StudentService.getStudentsByCourse:', error);
      return {
        success: false,
        students: []
      };
    }
  }

  // Obtener estudiante por ID
  async getStudentById(studentId) {
    return await ipcService.invoke('student:getById', {
      studentId
    });
  }

  // Actualizar estudiante
  async updateStudent(studentId, fullName, studentCode, listNumber) {
    return await ipcService.invoke('student:update', {
      studentId,
      fullName,
      studentCode,
      listNumber
    });
  }

  // Eliminar estudiante
  async deleteStudent(studentId) {
    return await ipcService.invoke('student:delete', {
      studentId
    });
  }
}

export default new StudentService();