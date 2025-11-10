const { ipcRenderer } = window.require('electron');

class CourseService {
  /**
   * Crear un nuevo curso
   */
  async createCourse(userId, name, level, academicPeriod) {
    try {
      const result = await ipcRenderer.invoke('course:create', {
        userId,
        name,
        level,
        academicPeriod
      });
      return result;
    } catch (error) {
      console.error('Error en CourseService.createCourse:', error);
      return { success: false, error: 'Error al crear curso' };
    }
  }

  /**
   * Obtener todos los cursos del usuario
   */
  async getCoursesByUser(userId) {
    try {
      const result = await ipcRenderer.invoke('course:getByUser', { userId });
      return result;
    } catch (error) {
      console.error('Error en CourseService.getCoursesByUser:', error);
      return { success: false, error: 'Error al obtener cursos' };
    }
  }

  /**
   * Obtener un curso por ID
   */
  async getCourseById(courseId, userId) {
    try {
      const result = await ipcRenderer.invoke('course:getById', {
        courseId,
        userId
      });
      return result;
    } catch (error) {
      console.error('Error en CourseService.getCourseById:', error);
      return { success: false, error: 'Error al obtener curso' };
    }
  }

  /**
   * Actualizar un curso
   */
  async updateCourse(courseId, userId, name, level, academicPeriod) {
    try {
      const result = await ipcRenderer.invoke('course:update', {
        courseId,
        userId,
        name,
        level,
        academicPeriod
      });
      return result;
    } catch (error) {
      console.error('Error en CourseService.updateCourse:', error);
      return { success: false, error: 'Error al actualizar curso' };
    }
  }

  /**
   * Eliminar un curso
   */
  async deleteCourse(courseId, userId) {
    try {
      const result = await ipcRenderer.invoke('course:delete', {
        courseId,
        userId
      });
      return result;
    } catch (error) {
      console.error('Error en CourseService.deleteCourse:', error);
      return { success: false, error: 'Error al eliminar curso' };
    }
  }

  /**
   * Obtener estadísticas de un curso
   */
  async getCourseStatistics(courseId, userId) {
    try {
      const result = await ipcRenderer.invoke('course:getStatistics', {
        courseId,
        userId
      });
      return result;
    } catch (error) {
      console.error('Error en CourseService.getCourseStatistics:', error);
      return { success: false, error: 'Error al obtener estadísticas' };
    }
  }
}

export default new CourseService();