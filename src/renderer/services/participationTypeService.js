import ipcService from './ipcService';
import authService from './authService';

class ParticipationTypeService {
  // Crear tipo de participación
  async createParticipationType(name, defaultPoints) {
    const user = authService.getUser();
    
    if (!user) {
      return { success: false, error: 'No hay sesión activa' };
    }

    return await ipcService.invoke('participationType:create', {
      userId: user.id,
      name,
      defaultPoints
    });
  }

  // Obtener tipos de participación del usuario
  async getParticipationTypes() {
    const user = authService.getUser();
    
    if (!user) {
      return { success: false, error: 'No hay sesión activa' };
    }

    return await ipcService.invoke('participationType:getByUser', {
      userId: user.id
    });
  }

  // Obtener tipo de participación por ID
  async getParticipationTypeById(typeId) {
    const user = authService.getUser();
    
    if (!user) {
      return { success: false, error: 'No hay sesión activa' };
    }

    return await ipcService.invoke('participationType:getById', {
      typeId,
      userId: user.id
    });
  }

  // Actualizar tipo de participación
  async updateParticipationType(typeId, name, defaultPoints) {
    const user = authService.getUser();
    
    if (!user) {
      return { success: false, error: 'No hay sesión activa' };
    }

    return await ipcService.invoke('participationType:update', {
      typeId,
      userId: user.id,
      name,
      defaultPoints
    });
  }

  // Eliminar tipo de participación
  async deleteParticipationType(typeId) {
    const user = authService.getUser();
    
    if (!user) {
      return { success: false, error: 'No hay sesión activa' };
    }

    return await ipcService.invoke('participationType:delete', {
      typeId,
      userId: user.id
    });
  }
}

export default new ParticipationTypeService();