const { app, BrowserWindow } = require('electron');
const path = require('path');
const isDev = require('electron-is-dev');
const { registerAllHandlers } = require('./ipc');
const { closeDatabase, getDatabaseInstance } = require('./database');

let mainWindow;

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1200,
    minHeight: 700,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true,
    },
    icon: path.join(__dirname, '../../assets/icon.png'),
    show: false,
  });

  const startURL = isDev
    ? 'http://localhost:3000'
    : `file://${path.join(__dirname, '../renderer/index.html')}`;

  mainWindow.loadURL(startURL);

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Inicializar la base de datos y luego registrar handlers
app.on('ready', async () => {
  try {
    console.log('🚀 Inicializando aplicación...');
    
    // Primero inicializar la base de datos
    const DatabaseSchema = require('./database/schema');
    const dbInstance = new DatabaseSchema();
    await dbInstance.initDatabase();
    
    console.log('✅ Base de datos inicializada');
    
    // Luego registrar handlers IPC
    registerAllHandlers();
    
    console.log('✅ Handlers IPC registrados');
    
    // Finalmente crear ventana
    await createWindow();
    
    console.log('✅ Aplicación lista');
  } catch (error) {
    console.error('❌ Error al inicializar aplicación:', error);
  }
});

app.on('window-all-closed', () => {
  closeDatabase();
  
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', async () => {
  if (mainWindow === null) {
    await createWindow();
  }
});

app.on('before-quit', () => {
  closeDatabase();
});