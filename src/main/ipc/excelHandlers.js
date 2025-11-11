const { ipcMain, dialog } = require('electron');
const excelService = require('../services/excelService');
const { shell } = require('electron');

function registerExcelHandlers() {
  // Exportar estudiantes a Excel
  ipcMain.handle('excel:exportStudents', async (event, { courseId, courseName }) => {
    try {
      const result = await excelService.exportStudents(courseId, courseName);

      // Si fue exitoso, mostrar el archivo en el explorador
      if (result.success && result.filePath) {
        // Abrir carpeta de descargas
        shell.showItemInFolder(result.filePath);
      }

      return result;
    } catch (error) {
      console.error('Error en IPC excel:exportStudents:', error);
      return { success: false, error: 'Error al exportar estudiantes' };
    }
  });

  // Exportar puntos a Excel
  ipcMain.handle('excel:exportPoints', async (event, { courseId, courseName }) => {
    try {
      const result = await excelService.exportPoints(courseId, courseName);

      // Si fue exitoso, mostrar el archivo en el explorador
      if (result.success && result.filePath) {
        shell.showItemInFolder(result.filePath);
      }

      return result;
    } catch (error) {
      console.error('Error en IPC excel:exportPoints:', error);
      return { success: false, error: 'Error al exportar puntos' };
    }
  });

  // Importar estudiantes desde Excel
  ipcMain.handle('excel:importStudents', async (event, { courseId }) => {
    try {
      // Mostrar diálogo para seleccionar archivo
      const result = await dialog.showOpenDialog({
        title: 'Seleccionar archivo Excel',
        filters: [
          { name: 'Excel Files', extensions: ['xlsx', 'xls'] },
          { name: 'All Files', extensions: ['*'] }
        ],
        properties: ['openFile']
      });

      // Si el usuario canceló
      if (result.canceled || !result.filePaths.length) {
        return {
          success: false,
          canceled: true,
          error: 'Operación cancelada'
        };
      }

      const filePath = result.filePaths[0];

      // Importar estudiantes
      const importResult = await excelService.importStudents(courseId, filePath);

      return importResult;
    } catch (error) {
      console.error('Error en IPC excel:importStudents:', error);
      return { success: false, error: 'Error al importar estudiantes' };
    }
  });

  // Crear plantilla de importación
  ipcMain.handle('excel:createTemplate', async (event) => {
    try {
      const result = await excelService.createImportTemplate();

      // Si fue exitoso, mostrar el archivo en el explorador
      if (result.success && result.filePath) {
        shell.showItemInFolder(result.filePath);
      }

      return result;
    } catch (error) {
      console.error('Error en IPC excel:createTemplate:', error);
      return { success: false, error: 'Error al crear plantilla' };
    }
  });

  console.log('✅ Excel handlers registrados');
}

module.exports = { registerExcelHandlers };
