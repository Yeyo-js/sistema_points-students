# Sistema de Puntos para Estudiantes

Sistema de gestión de puntos de participación desarrollado con Electron, React y SQL.js. Permite a los docentes gestionar cursos, estudiantes y registrar puntos de participación de manera eficiente.

## Características

- **Autenticación segura** con JWT y bcrypt
- **Gestión de cursos** - Crear y administrar múltiples cursos por docente
- **Administración de estudiantes** - Agregar, editar y eliminar estudiantes
- **Sistema de puntos** - Asignar puntos individuales y masivos
- **Tipos de participación personalizables** - Predefinidos y personalizados
- **Historial completo** - Seguimiento detallado de todas las asignaciones
- **Exportación a Excel** - Exportar datos de estudiantes y puntos
- **Dashboard con estadísticas** - Vista general de toda tu actividad
- **Rate limiting** - Protección contra ataques de fuerza bruta

## Tecnologías

### Frontend
- React 19.2.0
- React Router DOM 7.9.5
- Atomic Design Pattern

### Backend
- Electron 39.1.1
- Node.js
- SQL.js 1.13.0 (SQLite en memoria con persistencia)

### Seguridad
- bcryptjs 3.0.3
- jsonwebtoken 9.0.2
- Variables de entorno (.env)

### Utilidades
- ExcelJS 4.4.0
- date-fns 4.1.0

## Requisitos Previos

- Node.js (versión 16 o superior)
- npm o yarn

## Instalación

1. **Clonar el repositorio**
   ```bash
   git clone <url-del-repositorio>
   cd students-points-app
   ```

2. **Instalar dependencias**
   ```bash
   npm install
   ```

3. **Configurar variables de entorno**

   Copia el archivo `.env.example` a `.env`:
   ```bash
   cp .env.example .env
   ```

   El archivo `.env` ya tiene un JWT_SECRET generado automáticamente. Si deseas cambiarlo, puedes generar uno nuevo:
   ```bash
   node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
   ```

4. **Crear directorios necesarios**

   Los directorios `data/` y `assets/` ya están creados. Si no existen, créalos manualmente:
   ```bash
   mkdir data assets
   ```

## Uso

### Modo Desarrollo

Para ejecutar la aplicación en modo desarrollo con hot-reload:

```bash
npm run dev
```

Esto iniciará dos procesos:
- Webpack dev server en `http://localhost:3000`
- Electron con hot-reload

### Compilación para Producción

Para compilar la aplicación:

```bash
npm run build
```

Para empaquetar la aplicación:

```bash
npm run package
```

## Estructura del Proyecto

```
students-points-app/
├── src/
│   ├── main/                      # Proceso principal de Electron
│   │   ├── main.js               # Punto de entrada
│   │   ├── database/             # Gestión de base de datos
│   │   │   ├── schema.js         # Definición de esquema
│   │   │   ├── index.js          # Singleton de BD
│   │   │   └── repositories/     # Patrón Repository
│   │   ├── services/             # Lógica de negocio
│   │   └── ipc/                  # Handlers IPC
│   ├── renderer/                 # Proceso renderizador (Frontend)
│   │   ├── components/           # Componentes React
│   │   │   ├── atoms/           # Componentes básicos
│   │   │   ├── molecules/       # Componentes compuestos
│   │   │   ├── organisms/       # Componentes complejos
│   │   │   └── templates/       # Layouts
│   │   ├── pages/               # Páginas de la aplicación
│   │   ├── services/            # Servicios del cliente
│   │   ├── context/             # Context API
│   │   └── styles/              # Estilos globales
│   └── shared/                  # Código compartido
│       └── utils/               # Utilidades
├── data/                        # Base de datos SQLite
├── assets/                      # Recursos (iconos, imágenes)
├── .env                         # Variables de entorno (NO subir a Git)
├── .env.example                 # Plantilla de variables de entorno
└── package.json
```

## Funcionalidades Principales

### 1. Autenticación

- Registro de usuarios con validación completa
- Login con rate limiting (5 intentos máximo)
- Sesión persistente con JWT
- Hash de contraseñas con bcrypt

### 2. Gestión de Cursos

- Crear cursos con nombre, nivel y período académico
- Editar información de cursos
- Eliminar cursos (con verificación de estudiantes asociados)
- Ver estadísticas por curso

### 3. Administración de Estudiantes

- Agregar estudiantes con nombre completo, código y número de lista
- Importar estudiantes desde Excel
- Editar información de estudiantes
- Eliminar estudiantes (con advertencia si tiene puntos asignados)
- Ver perfil detallado con historial de puntos

### 4. Sistema de Puntos

- Asignar puntos individuales
- Asignación masiva de puntos
- Tipos de participación predefinidos y personalizados
- Editar puntos asignados
- Eliminar registros de puntos
- Historial completo con filtros

### 5. Dashboard

- Estadísticas en tiempo real:
  - Total de cursos
  - Total de estudiantes
  - Puntos totales asignados
  - Tipos de participación configurados
- Acciones rápidas
- Guía de inicio

### 6. Exportación

- Exportar lista de estudiantes a Excel
- Exportar puntos por curso
- Formatos personalizables

## Seguridad

### Medidas Implementadas

1. **Autenticación**
   - JWT con expiración configurable
   - Secret key en variables de entorno
   - Hash de contraseñas con bcrypt (10 rounds)

2. **Validación de Inputs**
   - Sanitización de todos los inputs
   - Validación de tipos de datos
   - Límites de longitud en strings
   - Validación de emails

3. **Autorización**
   - Verificación de pertenencia de recursos
   - Validación de permisos en cada operación
   - Logging de eventos de seguridad

4. **Rate Limiting**
   - Límite de intentos de login (5 intentos)
   - Cooldown de 15 minutos tras bloqueo

5. **SQL Injection Prevention**
   - Uso de prepared statements
   - Validación de parámetros
   - Sanitización de queries dinámicas

### Advertencias de Seguridad

⚠️ **IMPORTANTE**: El proyecto actualmente tiene `nodeIntegration: true` y `contextIsolation: false` en la configuración de Electron, lo cual representa un riesgo de seguridad. Se recomienda:

1. Crear un preload script
2. Habilitar contextIsolation
3. Deshabilitar nodeIntegration
4. Usar IPC para toda la comunicación

Esto está planificado para una futura actualización.

## Base de Datos

La aplicación usa SQL.js (SQLite en memoria) con persistencia en disco.

### Esquema

- **users** - Usuarios del sistema (profesores)
- **courses** - Cursos académicos
- **students** - Estudiantes por curso
- **participation_types** - Tipos de participación
- **points** - Registro de puntos asignados

### Ubicación

La base de datos se guarda en: `data/students-points.db`

### Backup

Se recomienda hacer backups regulares de la carpeta `data/` para no perder información.

## Configuración Avanzada

### Variables de Entorno (.env)

```bash
# JWT Secret - Clave para firmar tokens
JWT_SECRET=your-super-secret-key

# Expiración del token (en segundos)
JWT_EXPIRES_IN=86400

# Entorno
NODE_ENV=development

# Base de datos
DB_PATH=./data/students-points.db

# Rate limiting
MAX_LOGIN_ATTEMPTS=5
LOGIN_COOLDOWN_MINUTES=15
```

## Desarrollo

### Scripts Disponibles

- `npm run dev` - Modo desarrollo
- `npm run build` - Compilar para producción
- `npm run package` - Empaquetar aplicación
- `npm run clean` - Limpiar archivos generados

### Guía de Contribución

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## Solución de Problemas

### La aplicación no inicia

1. Verifica que las dependencias estén instaladas: `npm install`
2. Asegúrate de tener el archivo `.env` configurado
3. Verifica que existan los directorios `data/` y `assets/`

### Error "JWT_SECRET no está configurado"

1. Copia el archivo `.env.example` a `.env`
2. Verifica que el archivo `.env` tenga la variable `JWT_SECRET`

### Error de base de datos

1. Verifica que el directorio `data/` exista
2. Verifica permisos de escritura en el directorio
3. Intenta eliminar `data/students-points.db` y reiniciar

### Problemas de performance

1. Verifica el tamaño de la base de datos
2. Considera hacer limpieza de datos antiguos
3. Reinicia la aplicación

## Licencia

[Especificar licencia]

## Autor

[Tu nombre/organización]

## Contacto

[Tu información de contacto]

---

**Nota**: Esta es una aplicación de escritorio desarrollada con Electron. No requiere servidor web ni conexión a internet para funcionar.
