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
    return await ipcService.invoke('student:getByCourse', {
      courseId
    });
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