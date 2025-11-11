import ipcService from './ipcService';

class DashboardService {
  async getDashboardStats(userId) {
    try {
      const result = await ipcService.invoke('dashboard:getStats', { userId });
      return result;
    } catch (error) {
      console.error('Error al obtener estadísticas del dashboard:', error);
      return {
        success: false,
        error: 'Error al obtener estadísticas'
      };
    }
  }
}

export default new DashboardService();
