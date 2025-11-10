const { ipcMain } = require('electron');
const authService = require('../services/authService');
const participationTypeService = require('../services/participationTypeService');

function registerAuthHandlers() {
  // Registrar usuario
  ipcMain.handle('auth:register', async (event, { username, fullName, email, password, confirmPassword }) => {
    try {
      console.log('📝 Iniciando registro de usuario:', username);
      
      const result = await authService.register(username, fullName, email, password, confirmPassword);
      
      console.log('✅ Resultado de authService.register:', result.success);
      
      // Si el registro fue exitoso, crear tipos de participación por defecto
      if (result.success) {
        console.log('📋 Creando tipos de participación por defecto para userId:', result.user.id);
        
        try {
          const typesResult = await participationTypeService.createDefaultTypes(result.user.id);
          console.log('✅ Tipos de participación creados:', typesResult.success);
        } catch (typeError) {
          console.error('⚠️ Error al crear tipos de participación (no crítico):', typeError);
          // No fallar el registro si falla la creación de tipos
        }
      }
      
      return result;
    } catch (error) {
      console.error('❌ Error en IPC auth:register:', error);
      return { success: false, error: 'Error al registrar usuario' };
    }
  });

  // Iniciar sesión
  ipcMain.handle('auth:login', async (event, { username, password }) => {
    try {
      return await authService.login(username, password);
    } catch (error) {
      console.error('Error en IPC auth:login:', error);
      return { success: false, error: 'Error al iniciar sesión' };
    }
  });

  // Obtener usuario actual
  ipcMain.handle('auth:getCurrentUser', async (event, { token }) => {
    try {
      return authService.getCurrentUser(token);
    } catch (error) {
      console.error('Error en IPC auth:getCurrentUser:', error);
      return { success: false, error: 'Error al obtener usuario actual' };
    }
  });

  // Verificar token
  ipcMain.handle('auth:verifyToken', async (event, { token }) => {
    try {
      return authService.verifyToken(token);
    } catch (error) {
      console.error('Error en IPC auth:verifyToken:', error);
      return { success: false, error: 'Error al verificar token' };
    }
  });

  // Cambiar contraseña
  ipcMain.handle('auth:changePassword', async (event, { userId, currentPassword, newPassword, confirmNewPassword }) => {
    try {
      return await authService.changePassword(userId, currentPassword, newPassword, confirmNewPassword);
    } catch (error) {
      console.error('Error en IPC auth:changePassword:', error);
      return { success: false, error: 'Error al cambiar contraseña' };
    }
  });

  // Cerrar sesión
  ipcMain.handle('auth:logout', async (event, { username }) => {
    try {
      return authService.logout(username);
    } catch (error) {
      console.error('Error en IPC auth:logout:', error);
      return { success: true }; // No fallar el logout
    }
  });

  console.log('✅ Auth handlers registrados');
}

module.exports = { registerAuthHandlers };