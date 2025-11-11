const { ipcMain } = require('electron');
const groupService = require('../services/groupService');

function registerGroupHandlers() {
  /**
   * Crear grupo general desde curso
   */
  ipcMain.handle('groups:createFromCourse', async (event, { courseId, userId }) => {
    try {
      return await groupService.createGeneralGroupFromCourse(courseId, userId);
    } catch (error) {
      console.error('Error en IPC groups:createFromCourse:', error);
      return { success: false, error: 'Error al crear grupo general' };
    }
  });

  /**
   * Crear subgrupo
   */
  ipcMain.handle('groups:createSubgroup', async (event, { parentGroupId, name, studentIds, userId }) => {
    try {
      return await groupService.createSubgroup(parentGroupId, name, studentIds, userId);
    } catch (error) {
      console.error('Error en IPC groups:createSubgroup:', error);
      return { success: false, error: 'Error al crear subgrupo' };
    }
  });

  /**
   * Crear grupo independiente
   */
  ipcMain.handle('groups:createIndependent', async (event, { groupData, userId }) => {
    try {
      return await groupService.createIndependentGroup(groupData, userId);
    } catch (error) {
      console.error('Error en IPC groups:createIndependent:', error);
      return { success: false, error: 'Error al crear grupo independiente' };
    }
  });

  /**
   * Obtener todos los grupos del usuario
   */
  ipcMain.handle('groups:getByUser', async (event, { userId }) => {
    try {
      return await groupService.getUserGroups(userId);
    } catch (error) {
      console.error('Error en IPC groups:getByUser:', error);
      return { success: false, error: 'Error al obtener grupos' };
    }
  });

  /**
   * Obtener grupos de un curso
   */
  ipcMain.handle('groups:getByCourse', async (event, { courseId, userId }) => {
    try {
      return await groupService.getCourseGroups(courseId, userId);
    } catch (error) {
      console.error('Error en IPC groups:getByCourse:', error);
      return { success: false, error: 'Error al obtener grupos del curso' };
    }
  });

  /**
   * Obtener detalles de un grupo
   */
  ipcMain.handle('groups:getDetails', async (event, { groupId, userId }) => {
    try {
      return await groupService.getGroupDetails(groupId, userId);
    } catch (error) {
      console.error('Error en IPC groups:getDetails:', error);
      return { success: false, error: 'Error al obtener detalles del grupo' };
    }
  });

  /**
   * Actualizar grupo
   */
  ipcMain.handle('groups:update', async (event, { groupId, updateData, userId }) => {
    try {
      return await groupService.updateGroup(groupId, updateData, userId);
    } catch (error) {
      console.error('Error en IPC groups:update:', error);
      return { success: false, error: 'Error al actualizar grupo' };
    }
  });

  /**
   * Eliminar grupo
   */
  ipcMain.handle('groups:delete', async (event, { groupId, userId }) => {
    try {
      return await groupService.deleteGroup(groupId, userId);
    } catch (error) {
      console.error('Error en IPC groups:delete:', error);
      return { success: false, error: 'Error al eliminar grupo' };
    }
  });

  /**
   * Asignar puntos a todo el grupo
   */
  ipcMain.handle('groups:assignPoints', async (event, { groupId, pointData, userId }) => {
    try {
      return await groupService.assignPointsToGroup(groupId, pointData, userId);
    } catch (error) {
      console.error('Error en IPC groups:assignPoints:', error);
      return { success: false, error: 'Error al asignar puntos al grupo' };
    }
  });

  console.log('✅ Group handlers registrados');
}

module.exports = { registerGroupHandlers };
