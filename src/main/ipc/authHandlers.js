const { ipcMain } = require('electron');
const authService = require('../services/authService');
// ELIMINADA la importación aquí: const participationTypeService = require('../services/participationTypeService'); 

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
          // CORRECCIÓN CRÍTICA: Importar el servicio aquí para romper la dependencia circular
          const participationTypeService = require('../services/participationTypeService');
          
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

  // ... (otros handlers se mantienen)

  // Iniciar sesión
  ipcMain.handle('auth:login', async (event, { username, password }) => {
    try {
      return await authService.login(username, password);
    } catch (error) {
      console.error('Error en IPC auth:login:', error);
      return { success: false, error: 'Error al iniciar sesión' };
    }
  });
  
  // ... (el resto de los handlers de autenticación)

  console.log('✅ Auth handlers registrados');
}

module.exports = { registerAuthHandlers };