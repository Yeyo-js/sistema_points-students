# Mejoras de Seguridad Pendientes

Este documento detalla las mejoras de seguridad críticas que deben implementarse antes de desplegar la aplicación en producción.

## 1. Configuración de Electron - CRÍTICO

### Problema Actual

En `src/main/main.js:16-18`, la configuración actual es insegura:

```javascript
webPreferences: {
  nodeIntegration: true,        // ❌ PELIGRO
  contextIsolation: false,      // ❌ PELIGRO
  enableRemoteModule: true,     // ❌ PELIGRO (deprecado)
}
```

### Riesgo

- **Severidad**: CRÍTICA
- **CVSS Score**: 9.8
- **Tipo**: Ejecución Remota de Código (RCE)

**Impacto**:
- Cualquier vulnerabilidad XSS puede ejecutar código arbitrario en el sistema
- Acceso completo al sistema de archivos desde el renderer
- Posibilidad de ejecutar comandos del sistema operativo
- Exposición de APIs sensibles de Node.js al código web

### Solución Requerida

#### Paso 1: Crear Preload Script

Crear `src/main/preload.js`:

```javascript
const { contextBridge, ipcRenderer } = require('electron');

// Exponer APIs de manera segura al renderer
contextBridge.exposeInMainWorld('electronAPI', {
  // Auth
  login: (username, password) => ipcRenderer.invoke('auth:login', { username, password }),
  register: (data) => ipcRenderer.invoke('auth:register', data),
  logout: () => ipcRenderer.invoke('auth:logout'),

  // Courses
  createCourse: (data) => ipcRenderer.invoke('course:create', data),
  getCourses: (userId) => ipcRenderer.invoke('course:getByUser', { userId }),
  updateCourse: (data) => ipcRenderer.invoke('course:update', data),
  deleteCourse: (data) => ipcRenderer.invoke('course:delete', data),

  // Students
  createStudent: (data) => ipcRenderer.invoke('student:create', data),
  getStudents: (courseId) => ipcRenderer.invoke('student:getByCourse', { courseId }),
  updateStudent: (data) => ipcRenderer.invoke('student:update', data),
  deleteStudent: (studentId) => ipcRenderer.invoke('student:delete', { studentId }),
  forceDeleteStudent: (studentId) => ipcRenderer.invoke('student:forceDelete', { studentId }),

  // Points
  assignPoints: (data) => ipcRenderer.invoke('point:assign', data),
  updatePoint: (data) => ipcRenderer.invoke('point:update', data),
  deletePoint: (pointId) => ipcRenderer.invoke('point:delete', { pointId }),
  getPointsByStudent: (studentId) => ipcRenderer.invoke('point:getByStudent', { studentId }),

  // Participation Types
  getParticipationTypes: () => ipcRenderer.invoke('participationType:getAll'),
  createParticipationType: (data) => ipcRenderer.invoke('participationType:create', data),

  // Dashboard
  getDashboardStats: (userId) => ipcRenderer.invoke('dashboard:getStats', { userId })
});
```

#### Paso 2: Actualizar main.js

```javascript
webPreferences: {
  nodeIntegration: false,       // ✅ SEGURO
  contextIsolation: true,       // ✅ SEGURO
  enableRemoteModule: false,    // ✅ SEGURO
  preload: path.join(__dirname, 'preload.js')
}
```

#### Paso 3: Actualizar ipcService.js en Renderer

Cambiar de:
```javascript
const { ipcRenderer } = window.require('electron');
```

A:
```javascript
const electronAPI = window.electronAPI;
```

#### Paso 4: Actualizar Todos los Servicios del Renderer

Cada servicio debe usar `window.electronAPI` en lugar de `ipcRenderer` directamente.

Ejemplo en `authService.js`:
```javascript
async login(username, password) {
  try {
    const result = await window.electronAPI.login(username, password);
    // ... resto del código
  }
}
```

### Estimación de Esfuerzo

- **Tiempo**: 4-6 horas
- **Complejidad**: Media-Alta
- **Archivos afectados**: ~15 archivos
- **Testing requerido**: Extensivo

---

## 2. Content Security Policy (CSP)

### Implementar CSP Headers

En `main.js`, agregar:

```javascript
mainWindow.webContents.session.webRequest.onHeadersReceived((details, callback) => {
  callback({
    responseHeaders: {
      ...details.responseHeaders,
      'Content-Security-Policy': [
        "default-src 'self'",
        "script-src 'self'",
        "style-src 'self' 'unsafe-inline'",
        "img-src 'self' data:",
        "font-src 'self'"
      ].join('; ')
    }
  });
});
```

---

## 3. Validación y Sanitización Mejorada

### Implementar DOMPurify

```bash
npm install dompurify
```

Actualizar `validators.js`:

```javascript
const DOMPurify = require('dompurify');

static sanitizeHTML(input) {
  return DOMPurify.sanitize(input);
}
```

---

## 4. Sistema de Logging Seguro

### Implementar Winston

```bash
npm install winston
```

Crear `src/shared/utils/logger.js`:

```javascript
const winston = require('winston');
const path = require('path');

const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({
      filename: path.join(__dirname, '../../logs/error.log'),
      level: 'error'
    }),
    new winston.transports.File({
      filename: path.join(__dirname, '../../logs/combined.log')
    })
  ]
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}

module.exports = logger;
```

Reemplazar todos los `console.log` por `logger.info()`, `logger.error()`, etc.

---

## 5. Configuración de ESLint y Prettier

### Instalar Dependencias

```bash
npm install --save-dev eslint eslint-plugin-react eslint-plugin-react-hooks prettier eslint-config-prettier
```

### Crear .eslintrc.js

```javascript
module.exports = {
  env: {
    browser: true,
    es2021: true,
    node: true
  },
  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
    'prettier'
  ],
  parserOptions: {
    ecmaFeatures: {
      jsx: true
    },
    ecmaVersion: 12,
    sourceType: 'module'
  },
  plugins: ['react', 'react-hooks'],
  rules: {
    'no-console': process.env.NODE_ENV === 'production' ? 'error' : 'warn',
    'react/prop-types': 'off',
    'react/react-in-jsx-scope': 'off'
  }
};
```

### Crear .prettierrc

```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2
}
```

---

## 6. Tests

### Implementar Jest y React Testing Library

```bash
npm install --save-dev jest @testing-library/react @testing-library/jest-dom
```

### Crear tests/setup.js

```javascript
import '@testing-library/jest-dom';
```

### Tests Prioritarios

1. **AuthService** - Login, registro, validaciones
2. **Validators** - Todas las funciones de validación
3. **CourseService** - CRUD de cursos
4. **PointService** - Asignación de puntos

---

## 7. Backup Automático de Base de Datos

### Implementar en main.js

```javascript
const fs = require('fs');
const path = require('path');

function createBackup() {
  const dbPath = path.join(__dirname, '../data/students-points.db');
  const backupDir = path.join(__dirname, '../data/backups');

  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/:/g, '-');
  const backupPath = path.join(backupDir, `backup-${timestamp}.db`);

  fs.copyFileSync(dbPath, backupPath);

  // Mantener solo los últimos 7 backups
  const backups = fs.readdirSync(backupDir)
    .filter(f => f.startsWith('backup-'))
    .sort()
    .reverse();

  backups.slice(7).forEach(backup => {
    fs.unlinkSync(path.join(backupDir, backup));
  });
}

// Ejecutar backup cada 24 horas
setInterval(createBackup, 24 * 60 * 60 * 1000);
```

---

## 8. Variables de Entorno para Producción

### Validación Estricta

En `main.js`, agregar al inicio:

```javascript
// Validar variables de entorno requeridas
const requiredEnvVars = ['JWT_SECRET'];

requiredEnvVars.forEach(varName => {
  if (!process.env[varName]) {
    console.error(`ERROR: Variable de entorno ${varName} no está configurada`);
    app.quit();
  }
});

// Validar longitud del JWT_SECRET
if (process.env.JWT_SECRET.length < 32) {
  console.error('ERROR: JWT_SECRET debe tener al menos 32 caracteres');
  app.quit();
}
```

---

## Priorización de Implementación

### Fase 1: Crítico (Antes de Producción) - 1 Semana
1. ✅ Preload Script y Context Isolation
2. ✅ Validación de Variables de Entorno
3. ✅ Content Security Policy

### Fase 2: Alta Prioridad (Primera Actualización) - 1 Semana
4. ⬜ Sistema de Logging (Winston)
5. ⬜ ESLint + Prettier
6. ⬜ Backup Automático

### Fase 3: Mejoras (Siguientes Sprints) - 2 Semanas
7. ⬜ Tests Unitarios
8. ⬜ Tests de Integración
9. ⬜ DOMPurify
10. ⬜ Optimizaciones de Performance

---

## Recursos y Documentación

- [Electron Security](https://www.electronjs.org/docs/latest/tutorial/security)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Electron Context Isolation](https://www.electronjs.org/docs/latest/tutorial/context-isolation)
- [Content Security Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)

---

**Última actualización**: 2025-11-10
**Estado**: Pendiente de implementación
**Responsable**: [Asignar]
