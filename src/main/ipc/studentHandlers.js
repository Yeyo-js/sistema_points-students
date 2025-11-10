const { ipcMain } = require('electron');
const studentService = require('../services/studentService');

function registerStudentHandlers() {
  // Crear estudiante
  ipcMain.handle('student:create', async (event, { courseId, fullName, studentCode, listNumber }) => {
    try {
      return studentService.createStudent(courseId, fullName, studentCode, listNumber);
    } catch (error) {
      console.error('Error en IPC student:create:', error);
      return { success: false, error: 'Error al crear estudiante' };
    }
  });

  // Obtener estudiantes por curso
  ipcMain.handle('student:getByCourse', async (event, { courseId }) => {
    try {
      return studentService.getStudentsByCourse(courseId);
    } catch (error) {
      console.error('Error en IPC student:getByCourse:', error);
      return { success: false, error: 'Error al obtener estudiantes' };
    }
  });

  // Obtener estudiante por ID
  ipcMain.handle('student:getById', async (event, { studentId }) => {
    try {
      return studentService.getStudentById(studentId);
    } catch (error) {
      console.error('Error en IPC student:getById:', error);
      return { success: false, error: 'Error al obtener estudiante' };
    }
  });

  // Actualizar estudiante
  ipcMain.handle('student:update', async (event, { studentId, fullName, studentCode, listNumber }) => {
    try {
      return studentService.updateStudent(studentId, fullName, studentCode, listNumber);
    } catch (error) {
      console.error('Error en IPC student:update:', error);
      return { success: false, error: 'Error al actualizar estudiante' };
    }
  });

  // Eliminar estudiante
  ipcMain.handle('student:delete', async (event, { studentId }) => {
    try {
      return studentService.deleteStudent(studentId);
    } catch (error) {
      console.error('Error en IPC student:delete:', error);
      return { success: false, error: 'Error al eliminar estudiante' };
    }
  });

  console.log('✅ Student handlers registrados');
}

module.exports = { registerStudentHandlers };