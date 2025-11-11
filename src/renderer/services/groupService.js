import ipcService from './ipcService';

class GroupService {
  /**
   * Crear grupo general desde curso
   */
  async createFromCourse(courseId, userId) {
    try {
      const result = await ipcService.invoke('groups:createFromCourse', {
        courseId,
        userId
      });
      return result;
    } catch (error) {
      console.error('Error al crear grupo general:', error);
      return {
        success: false,
        error: 'Error al crear grupo general'
      };
    }
  }

  /**
   * Crear subgrupo
   */
  async createSubgroup(parentGroupId, name, studentIds, userId) {
    try {
      const result = await ipcService.invoke('groups:createSubgroup', {
        parentGroupId,
        name,
        studentIds,
        userId
      });
      return result;
    } catch (error) {
      console.error('Error al crear subgrupo:', error);
      return {
        success: false,
        error: 'Error al crear subgrupo'
      };
    }
  }

  /**
   * Crear grupo independiente
   */
  async createIndependent(groupData, userId) {
    try {
      const result = await ipcService.invoke('groups:createIndependent', {
        groupData,
        userId
      });
      return result;
    } catch (error) {
      console.error('Error al crear grupo independiente:', error);
      return {
        success: false,
        error: 'Error al crear grupo independiente'
      };
    }
  }

  /**
   * Obtener todos los grupos del usuario
   */
  async getByUser(userId) {
    try {
      const result = await ipcService.invoke('groups:getByUser', {
        userId
      });
      return result;
    } catch (error) {
      console.error('Error al obtener grupos:', error);
      return {
        success: false,
        error: 'Error al obtener grupos'
      };
    }
  }

  /**
   * Obtener grupos de un curso
   */
  async getByCourse(courseId, userId) {
    try {
      const result = await ipcService.invoke('groups:getByCourse', {
        courseId,
        userId
      });
      return result;
    } catch (error) {
      console.error('Error al obtener grupos del curso:', error);
      return {
        success: false,
        error: 'Error al obtener grupos del curso'
      };
    }
  }

  /**
   * Obtener detalles de un grupo
   */
  async getDetails(groupId, userId) {
    try {
      const result = await ipcService.invoke('groups:getDetails', {
        groupId,
        userId
      });
      return result;
    } catch (error) {
      console.error('Error al obtener detalles del grupo:', error);
      return {
        success: false,
        error: 'Error al obtener detalles del grupo'
      };
    }
  }

  /**
   * Actualizar grupo
   */
  async update(groupId, updateData, userId) {
    try {
      const result = await ipcService.invoke('groups:update', {
        groupId,
        updateData,
        userId
      });
      return result;
    } catch (error) {
      console.error('Error al actualizar grupo:', error);
      return {
        success: false,
        error: 'Error al actualizar grupo'
      };
    }
  }

  /**
   * Eliminar grupo
   */
  async delete(groupId, userId) {
    try {
      const result = await ipcService.invoke('groups:delete', {
        groupId,
        userId
      });
      return result;
    } catch (error) {
      console.error('Error al eliminar grupo:', error);
      return {
        success: false,
        error: 'Error al eliminar grupo'
      };
    }
  }

  /**
   * Asignar puntos a todo el grupo
   */
  async assignPoints(groupId, pointData, userId) {
    try {
      const result = await ipcService.invoke('groups:assignPoints', {
        groupId,
        pointData,
        userId
      });
      return result;
    } catch (error) {
      console.error('Error al asignar puntos al grupo:', error);
      return {
        success: false,
        error: 'Error al asignar puntos al grupo'
      };
    }
  }
}

export default new GroupService();
