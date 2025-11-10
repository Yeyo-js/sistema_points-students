const { ipcMain } = require('electron');
const pointService = require('../services/pointService');

function registerPointHandlers() {
  // Asignar puntos
  ipcMain.handle('point:assign', async (event, { studentId, userId, participationTypeId, pointsValue, reason }) => {
    try {
      return pointService.assignPoints(studentId, userId, participationTypeId, pointsValue, reason);
    } catch (error) {
      console.error('Error en IPC point:assign:', error);
      return { success: false, error: 'Error al asignar puntos' };
    }
  });

  // Obtener historial de puntos de un estudiante
  ipcMain.handle('point:getStudentHistory', async (event, { studentId, userId, limit }) => {
    try {
      return pointService.getStudentPointsHistory(studentId, userId, limit);
    } catch (error) {
      console.error('Error en IPC point:getStudentHistory:', error);
      return { success: false, error: 'Error al obtener historial' };
    }
  });

  // Obtener historial de puntos de un curso
  ipcMain.handle('point:getCourseHistory', async (event, { courseId, userId, limit }) => {
    try {
      return pointService.getCoursePointsHistory(courseId, userId, limit);
    } catch (error) {
      console.error('Error en IPC point:getCourseHistory:', error);
      return { success: false, error: 'Error al obtener historial del curso' };
    }
  });

  // Actualizar punto
  ipcMain.handle('point:update', async (event, { pointId, userId, participationTypeId, pointsValue, reason }) => {
    try {
      return pointService.updatePoint(pointId, userId, participationTypeId, pointsValue, reason);
    } catch (error) {
      console.error('Error en IPC point:update:', error);
      return { success: false, error: 'Error al actualizar punto' };
    }
  });

  // Eliminar punto
  ipcMain.handle('point:delete', async (event, { pointId, userId }) => {
    try {
      return pointService.deletePoint(pointId, userId);
    } catch (error) {
      console.error('Error en IPC point:delete:', error);
      return { success: false, error: 'Error al eliminar punto' };
    }
  });

  // Obtener evolución de puntos (para gráficos)
  ipcMain.handle('point:getEvolution', async (event, { studentId, userId }) => {
    try {
      return pointService.getPointsEvolution(studentId, userId);
    } catch (error) {
      console.error('Error en IPC point:getEvolution:', error);
      return { success: false, error: 'Error al obtener evolución de puntos' };
    }
  });

  console.log('✅ Point handlers registrados');
}

module.exports = { registerPointHandlers };