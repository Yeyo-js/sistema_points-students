const { ipcMain } = require('electron');
const courseService = require('../services/courseService');

function registerCourseHandlers() {
  // Crear curso
  ipcMain.handle('course:create', async (event, { userId, name, level, academicPeriod }) => {
    try {
      return courseService.createCourse(userId, name, level, academicPeriod);
    } catch (error) {
      console.error('Error en IPC course:create:', error);
      return { success: false, error: 'Error al crear curso' };
    }
  });

  // Obtener cursos del usuario
  ipcMain.handle('course:getByUser', async (event, { userId }) => {
    try {
      return courseService.getCoursesByUser(userId);
    } catch (error) {
      console.error('Error en IPC course:getByUser:', error);
      return { success: false, error: 'Error al obtener cursos' };
    }
  });

  // Obtener curso por ID
  ipcMain.handle('course:getById', async (event, { courseId, userId }) => {
    try {
      return courseService.getCourseById(courseId, userId);
    } catch (error) {
      console.error('Error en IPC course:getById:', error);
      return { success: false, error: 'Error al obtener curso' };
    }
  });

  // Actualizar curso
  ipcMain.handle('course:update', async (event, { courseId, userId, name, level, academicPeriod }) => {
    try {
      return courseService.updateCourse(courseId, userId, name, level, academicPeriod);
    } catch (error) {
      console.error('Error en IPC course:update:', error);
      return { success: false, error: 'Error al actualizar curso' };
    }
  });

  // Eliminar curso
  ipcMain.handle('course:delete', async (event, { courseId, userId }) => {
    try {
      return courseService.deleteCourse(courseId, userId);
    } catch (error) {
      console.error('Error en IPC course:delete:', error);
      return { success: false, error: 'Error al eliminar curso' };
    }
  });

  // Obtener estadísticas del curso
  ipcMain.handle('course:getStatistics', async (event, { courseId, userId }) => {
    try {
      return courseService.getCourseStatistics(courseId, userId);
    } catch (error) {
      console.error('Error en IPC course:getStatistics:', error);
      return { success: false, error: 'Error al obtener estadísticas' };
    }
  });

  console.log('✅ Course handlers registrados');
}

module.exports = { registerCourseHandlers };