import ipcService from './ipcService';
import authService from './authService';

class PointService {
  // Asignar puntos a un estudiante
  async assignPoints(studentId, participationTypeId, pointsValue, reason = null) {
    const user = authService.getUser();
    
    if (!user) {
      return { success: false, error: 'No hay sesión activa' };
    }

    return await ipcService.invoke('point:assign', {
      studentId,
      userId: user.id,
      participationTypeId,
      pointsValue,
      reason
    });
  }

  // Obtener historial de puntos de un estudiante
  async getStudentHistory(studentId, limit = null) {
    const user = authService.getUser();
    
    if (!user) {
      return { success: false, error: 'No hay sesión activa' };
    }

    return await ipcService.invoke('point:getStudentHistory', {
      studentId,
      userId: user.id,
      limit
    });
  }

  // Obtener historial de puntos de un curso
  async getCourseHistory(courseId, limit = null) {
    const user = authService.getUser();
    
    if (!user) {
      return { success: false, error: 'No hay sesión activa' };
    }

    return await ipcService.invoke('point:getCourseHistory', {
      courseId,
      userId: user.id,
      limit
    });
  }

  // Actualizar punto
  async updatePoint(pointId, participationTypeId, pointsValue, reason = null) {
    const user = authService.getUser();
    
    if (!user) {
      return { success: false, error: 'No hay sesión activa' };
    }

    return await ipcService.invoke('point:update', {
      pointId,
      userId: user.id,
      participationTypeId,
      pointsValue,
      reason
    });
  }

  // Eliminar punto
  async deletePoint(pointId) {
    const user = authService.getUser();
    
    if (!user) {
      return { success: false, error: 'No hay sesión activa' };
    }

    return await ipcService.invoke('point:delete', {
      pointId,
      userId: user.id
    });
  }

  // Obtener evolución de puntos (para gráficos)
  async getPointsEvolution(studentId) {
    const user = authService.getUser();
    
    if (!user) {
      return { success: false, error: 'No hay sesión activa' };
    }

    return await ipcService.invoke('point:getEvolution', {
      studentId,
      userId: user.id
    });
  }
}

export default new PointService();