const { ipcMain } = require('electron');
const participationTypeService = require('../services/participationTypeService');

function registerParticipationTypeHandlers() {
  // Crear tipo de participación
  ipcMain.handle('participationType:create', async (event, { userId, name, defaultPoints }) => {
    try {
      return participationTypeService.createParticipationType(userId, name, defaultPoints);
    } catch (error) {
      console.error('Error en IPC participationType:create:', error);
      return { success: false, error: 'Error al crear tipo de participación' };
    }
  });

  // Obtener tipos de participación del usuario
  ipcMain.handle('participationType:getByUser', async (event, { userId }) => {
    try {
      return participationTypeService.getParticipationTypesByUser(userId);
    } catch (error) {
      console.error('Error en IPC participationType:getByUser:', error);
      return { success: false, error: 'Error al obtener tipos de participación' };
    }
  });

  // Obtener tipo de participación por ID
  ipcMain.handle('participationType:getById', async (event, { typeId, userId }) => {
    try {
      return participationTypeService.getParticipationTypeById(typeId, userId);
    } catch (error) {
      console.error('Error en IPC participationType:getById:', error);
      return { success: false, error: 'Error al obtener tipo de participación' };
    }
  });

  // Actualizar tipo de participación
  ipcMain.handle('participationType:update', async (event, { typeId, userId, name, defaultPoints }) => {
    try {
      return participationTypeService.updateParticipationType(typeId, userId, name, defaultPoints);
    } catch (error) {
      console.error('Error en IPC participationType:update:', error);
      return { success: false, error: 'Error al actualizar tipo de participación' };
    }
  });

  // Eliminar tipo de participación
  ipcMain.handle('participationType:delete', async (event, { typeId, userId }) => {
    try {
      return participationTypeService.deleteParticipationType(typeId, userId);
    } catch (error) {
      console.error('Error en IPC participationType:delete:', error);
      return { success: false, error: 'Error al eliminar tipo de participación' };
    }
  });

  console.log('✅ ParticipationType handlers registrados');
}

module.exports = { registerParticipationTypeHandlers };