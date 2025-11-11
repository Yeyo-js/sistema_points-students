import ipcService from './ipcService';

class ExcelService {
  /**
   * Exportar estudiantes de un curso a Excel
   */
  async exportStudents(courseId, courseName) {
    try {
      const result = await ipcService.invoke('excel:exportStudents', {
        courseId,
        courseName
      });
      return result;
    } catch (error) {
      console.error('Error al exportar estudiantes:', error);
      return {
        success: false,
        error: 'Error al exportar estudiantes'
      };
    }
  }

  /**
   * Exportar puntos de un curso a Excel
   */
  async exportPoints(courseId, courseName) {
    try {
      const result = await ipcService.invoke('excel:exportPoints', {
        courseId,
        courseName
      });
      return result;
    } catch (error) {
      console.error('Error al exportar puntos:', error);
      return {
        success: false,
        error: 'Error al exportar puntos'
      };
    }
  }

  /**
   * Importar estudiantes desde Excel
   */
  async importStudents(courseId) {
    try {
      const result = await ipcService.invoke('excel:importStudents', {
        courseId
      });
      return result;
    } catch (error) {
      console.error('Error al importar estudiantes:', error);
      return {
        success: false,
        error: 'Error al importar estudiantes'
      };
    }
  }

  /**
   * Descargar plantilla de importación
   */
  async downloadTemplate() {
    try {
      const result = await ipcService.invoke('excel:createTemplate');
      return result;
    } catch (error) {
      console.error('Error al descargar plantilla:', error);
      return {
        success: false,
        error: 'Error al descargar plantilla'
      };
    }
  }
}

export default new ExcelService();
