import ipcService from './ipcService';

class AuthService {
  // Registrar usuario
  async register(username, fullName, email, password, confirmPassword) {
    return await ipcService.invoke('auth:register', {
      username,
      fullName,
      email,
      password,
      confirmPassword
    });
  }

  // Iniciar sesión
  async login(username, password) {
    const result = await ipcService.invoke('auth:login', {
      username,
      password
    });

    // Si el login es exitoso, guardar el token en localStorage
    if (result.success && result.token) {
      localStorage.setItem('token', result.token);
      localStorage.setItem('user', JSON.stringify(result.user));
    }

    return result;
  }

  // Obtener usuario actual
  async getCurrentUser() {
    const token = this.getToken();
    
    if (!token) {
      return { success: false, error: 'No hay sesión activa' };
    }

    return await ipcService.invoke('auth:getCurrentUser', { token });
  }

  // Verificar token
  async verifyToken() {
    const token = this.getToken();
    
    if (!token) {
      return { success: false, error: 'No hay token' };
    }

    return await ipcService.invoke('auth:verifyToken', { token });
  }

  // Cambiar contraseña
  async changePassword(currentPassword, newPassword, confirmNewPassword) {
    const user = this.getUser();
    
    if (!user) {
      return { success: false, error: 'No hay sesión activa' };
    }

    return await ipcService.invoke('auth:changePassword', {
      userId: user.id,
      currentPassword,
      newPassword,
      confirmNewPassword
    });
  }

  // Cerrar sesión
  async logout() {
    const user = this.getUser();
    
    if (user) {
      await ipcService.invoke('auth:logout', { username: user.username });
    }

    localStorage.removeItem('token');
    localStorage.removeItem('user');

    return { success: true };
  }

  // Obtener token del localStorage
  getToken() {
    return localStorage.getItem('token');
  }

  // Obtener usuario del localStorage
  getUser() {
    const userJson = localStorage.getItem('user');
    return userJson ? JSON.parse(userJson) : null;
  }

  // Verificar si está autenticado
  isAuthenticated() {
    return !!this.getToken();
  }
}

export default new AuthService();