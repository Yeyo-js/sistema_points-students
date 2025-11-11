const { ipcMain } = require('electron');
const dashboardService = require('../services/dashboardService');

function registerDashboardHandlers() {
  // Obtener estadísticas del dashboard
  ipcMain.handle('dashboard:getStats', async (event, { userId }) => {
    try {
      return await dashboardService.getDashboardStats(userId);
    } catch (error) {
      console.error('Error en IPC dashboard:getStats:', error);
      return { success: false, error: 'Error al obtener estadísticas' };
    }
  });

  console.log('✅ Dashboard handlers registrados');
}

module.exports = { registerDashboardHandlers };
