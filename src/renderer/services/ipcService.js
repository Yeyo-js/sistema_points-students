const { ipcRenderer } = window.require('electron');

class IpcService {
  // Método genérico para invocar canales IPC
  async invoke(channel, data = {}) {
    try {
      const result = await ipcRenderer.invoke(channel, data);
      return result;
    } catch (error) {
      console.error(`Error en canal IPC ${channel}:`, error);
      return {
        success: false,
        error: 'Error de comunicación con el sistema'
      };
    }
  }
}

export default new IpcService();