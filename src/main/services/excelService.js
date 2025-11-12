const ExcelJS = require('exceljs');
const { app } = require('electron');
const path = require('path');
const fs = require('fs');
const studentRepository = require('../database/repositories/studentRepository');
const pointRepository = require('../database/repositories/pointRepository');
const Validators = require('../../shared/utils/validators');
const ErrorHandler = require('../../shared/utils/errorHandler');

class ExcelService {
  /**
   * Exportar estudiantes de un curso a Excel
   */
  async exportStudents(courseId, courseName) {
    try {
      if (!Validators.isPositiveInteger(courseId)) {
        return ErrorHandler.handleValidationError('courseId', 'ID de curso inválido');
      }

      // Obtener estudiantes del curso
      const students = studentRepository.findByCourse(courseId);

      if (!students || students.length === 0) {
        return {
          success: false,
          error: 'No hay estudiantes para exportar'
        };
      }

      // Crear workbook
      const workbook = new ExcelJS.Workbook();
      workbook.creator = 'Sistema de Puntos';
      workbook.created = new Date();

      // Crear hoja
      const worksheet = workbook.addWorksheet('Estudiantes');

      // Definir columnas
      worksheet.columns = [
        { header: 'N° Lista', key: 'list_number', width: 10 },
        { header: 'Código', key: 'student_code', width: 15 },
        { header: 'Nombre Completo', key: 'full_name', width: 40 },
        { header: 'Puntos Totales', key: 'total_points', width: 15 },
        { header: 'Fecha Registro', key: 'created_at', width: 20 }
      ];

      // Estilo del encabezado
      worksheet.getRow(1).font = { bold: true, size: 12 };
      worksheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF4472C4' }
      };
      worksheet.getRow(1).font.color = { argb: 'FFFFFFFF' };
      worksheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };

      // Agregar datos con puntos totales
      students.forEach(student => {
        // Calcular puntos totales del estudiante
        const points = pointRepository.findByStudent(student.id);
        const totalPoints = points.reduce((sum, point) => sum + (point.points_value || 0), 0);

        worksheet.addRow({
          list_number: student.list_number || '',
          student_code: student.student_code || '',
          full_name: student.full_name,
          total_points: totalPoints,
          created_at: new Date(student.created_at).toLocaleDateString('es-ES')
        });
      });

      // Aplicar bordes a todas las celdas
      worksheet.eachRow((row, rowNumber) => {
        row.eachCell((cell) => {
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
          };
        });
      });

      // Guardar archivo
      const downloadsPath = app.getPath('downloads');
      const fileName = `Estudiantes_${courseName.replace(/[^a-z0-9]/gi, '_')}_${Date.now()}.xlsx`;
      const filePath = path.join(downloadsPath, fileName);

      await workbook.xlsx.writeFile(filePath);

      return {
        success: true,
        filePath,
        fileName,
        studentsCount: students.length,
        message: `Archivo exportado exitosamente: ${fileName}`
      };

    } catch (error) {
      ErrorHandler.logCriticalError(error, { action: 'exportStudents', courseId });
      return ErrorHandler.handleDatabaseError(error);
    }
  }

  /**
   * Exportar puntos de un curso a Excel
   */
  async exportPoints(courseId, courseName) {
    try {
      if (!Validators.isPositiveInteger(courseId)) {
        return ErrorHandler.handleValidationError('courseId', 'ID de curso inválido');
      }

      // Obtener puntos del curso
      const points = pointRepository.findByCourse(courseId);

      if (!points || points.length === 0) {
        return {
          success: false,
          error: 'No hay puntos para exportar'
        };
      }

      // Crear workbook
      const workbook = new ExcelJS.Workbook();
      workbook.creator = 'Sistema de Puntos';
      workbook.created = new Date();

      // Crear hoja
      const worksheet = workbook.addWorksheet('Puntos');

      // Definir columnas
      worksheet.columns = [
        { header: 'Fecha', key: 'date', width: 15 },
        { header: 'N° Lista', key: 'list_number', width: 10 },
        { header: 'Estudiante', key: 'student_name', width: 35 },
        { header: 'Tipo Participación', key: 'participation_type', width: 30 },
        { header: 'Puntos', key: 'points', width: 10 },
        { header: 'Razón', key: 'reason', width: 40 },
        { header: 'Profesor', key: 'teacher', width: 25 }
      ];

      // Estilo del encabezado
      worksheet.getRow(1).font = { bold: true, size: 12 };
      worksheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF70AD47' }
      };
      worksheet.getRow(1).font.color = { argb: 'FFFFFFFF' };
      worksheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };

      // Agregar datos
      points.forEach(point => {
        const row = worksheet.addRow({
          date: new Date(point.created_at).toLocaleDateString('es-ES'),
          list_number: point.list_number || '',
          student_name: point.student_name,
          participation_type: point.participation_type_name,
          points: point.points_value,
          reason: point.reason || '',
          teacher: point.teacher_name
        });

        // Colorear la celda de puntos según si es positivo o negativo
        const pointsCell = row.getCell('points');
        if (point.points_value > 0) {
          pointsCell.font = { color: { argb: 'FF00B050' }, bold: true };
        } else if (point.points_value < 0) {
          pointsCell.font = { color: { argb: 'FFC00000' }, bold: true };
        }
      });

      // Aplicar bordes
      worksheet.eachRow((row) => {
        row.eachCell((cell) => {
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
          };
        });
      });

      // Guardar archivo
      const downloadsPath = app.getPath('downloads');
      const fileName = `Puntos_${courseName.replace(/[^a-z0-9]/gi, '_')}_${Date.now()}.xlsx`;
      const filePath = path.join(downloadsPath, fileName);

      await workbook.xlsx.writeFile(filePath);

      return {
        success: true,
        filePath,
        fileName,
        pointsCount: points.length,
        message: `Archivo exportado exitosamente: ${fileName}`
      };

    } catch (error) {
      ErrorHandler.logCriticalError(error, { action: 'exportPoints', courseId });
      return ErrorHandler.handleDatabaseError(error);
    }
  }
  /**
   * Importar estudiantes desde Excel
   */
  async importStudents(courseId, filePath) {
    try {
      if (!Validators.isPositiveInteger(courseId)) {
        return ErrorHandler.handleValidationError('courseId', 'ID de curso inválido');
      }

      // Verificar que el archivo exista
      if (!fs.existsSync(filePath)) {
        return {
          success: false,
          error: 'El archivo no existe'
        };
      }

      // Leer archivo
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.readFile(filePath);

      const worksheet = workbook.getWorksheet(1); // Primera hoja

      if (!worksheet) {
        return {
          success: false,
          error: 'El archivo no contiene hojas de trabajo'
        };
      }

      const results = {
        success: true,
        imported: [],
        errors: [],
        duplicates: [],
        total: 0
      };

      // Procesar filas (empezando desde la fila 2, asumiendo que la 1 es encabezado)
      worksheet.eachRow((row, rowNumber) => {
        // Saltar encabezado
        if (rowNumber === 1) return;

        try {
          // Leer y sanitizar datos
          // listNumber debe ser un entero
          let listNumber = row.getCell(1).value ? parseInt(row.getCell(1).value) : null;
          const studentCode = row.getCell(2).value ? String(row.getCell(2).value).trim() : '';
          const fullName = row.getCell(3).value ? String(row.getCell(3).value).trim() : '';
          
          // 1. CORRECCIÓN CRÍTICA: Validar Número de Lista (es obligatorio según DB)
          if (!listNumber || !Number.isInteger(listNumber) || listNumber < 1) {
            results.errors.push({
              row: rowNumber,
              error: 'El número de lista (columna A) es requerido y debe ser un entero positivo',
              data: { listNumber, studentCode, fullName }
            });
            return;
          }

          // Validar Nombre Completo (obligatorio)
          if (!fullName || fullName === '') {
            results.errors.push({
              row: rowNumber,
              error: 'Nombre completo es requerido',
              data: { listNumber, studentCode, fullName }
            });
            return;
          }

          // Validar longitud del nombre (Consistente con studentService.js: 3-100 caracteres)
          if (fullName.length < 3 || fullName.length > 100) {
            results.errors.push({
              row: rowNumber,
              error: 'El nombre debe tener entre 3 y 100 caracteres',
              data: { listNumber, studentCode, fullName }
            });
            return;
          }

          // Verificar duplicados por código de estudiante
          if (studentCode && studentCode !== '') {
            const existingByCode = studentRepository.findByStudentCode(courseId, studentCode);
            if (existingByCode) {
              results.duplicates.push({
                row: rowNumber,
                reason: 'Código de estudiante ya existe',
                data: { listNumber, studentCode, fullName },
                existing: existingByCode
              });
              return;
            }
          }

          // Verificar duplicados por número de lista
          const existingByList = studentRepository.findByListNumber(courseId, listNumber);
          if (existingByList) {
            results.duplicates.push({
              row: rowNumber,
              reason: 'Número de lista ya existe',
              data: { listNumber, studentCode, fullName },
              existing: existingByList
            });
            return;
          }

          // Insertar estudiante 
          const result = studentRepository.insert(
            courseId,
            fullName,
            studentCode || null,
            listNumber
          );
          
          // 2. CORRECCIÓN: Correcta extracción del ID del objeto retornado
          const studentId = result.lastInsertRowid;

          results.imported.push({
            row: rowNumber,
            studentId,
            data: { listNumber, studentCode, fullName }
          });

        } catch (error) {
          results.errors.push({
            row: rowNumber,
            error: error.message,
            data: {
              listNumber: row.getCell(1).value,
              studentCode: row.getCell(2).value,
              fullName: row.getCell(3).value
            }
          });
        }
      });

      results.total = results.imported.length + results.errors.length + results.duplicates.length;

      return results;

    } catch (error) {
      ErrorHandler.logCriticalError(error, { action: 'importStudents', courseId });
      return {
        success: false,
        error: error.message || 'Error al importar estudiantes. Verifica que el archivo no esté corrupto y sigue el formato de la plantilla.'
      };
    }
  }

  /**
   * Crear plantilla de Excel para importar estudiantes
   */
  async createImportTemplate() {
    try {
      const workbook = new ExcelJS.Workbook();
      workbook.creator = 'Sistema de Puntos';
      workbook.created = new Date();

      const worksheet = workbook.addWorksheet('Plantilla Estudiantes');

      // Definir columnas
      worksheet.columns = [
        { header: 'N° Lista', key: 'list_number', width: 10 },
        { header: 'Código', key: 'student_code', width: 15 },
        { header: 'Nombre Completo', key: 'full_name', width: 40 }
      ];

      // Estilo del encabezado
      worksheet.getRow(1).font = { bold: true, size: 12 };
      worksheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF4472C4' }
      };
      worksheet.getRow(1).font.color = { argb: 'FFFFFFFF' };
      worksheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };

      // Agregar filas de ejemplo
      worksheet.addRow({
        list_number: 1,
        student_code: '20230001',
        full_name: 'Juan Pérez García'
      });
      worksheet.addRow({
        list_number: 2,
        student_code: '20230002',
        full_name: 'María López Rodríguez'
      });
      worksheet.addRow({
        list_number: 3,
        student_code: '20230003',
        full_name: 'Carlos Sánchez Martínez'
      });

      // Aplicar bordes
      worksheet.eachRow((row) => {
        row.eachCell((cell) => {
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
          };
        });
      });

      // Agregar instrucciones
      worksheet.addRow([]);
      const instructionRow = worksheet.addRow(['INSTRUCCIONES:']);
      instructionRow.font = { bold: true, size: 11 };
      worksheet.addRow(['1. El único campo obligatorio es "Nombre Completo"']);
      worksheet.addRow(['2. "N° Lista" y "Código" son opcionales']);
      worksheet.addRow(['3. No modifiques los encabezados de las columnas']);
      worksheet.addRow(['4. Elimina las filas de ejemplo antes de importar']);
      worksheet.addRow(['5. No debe haber números de lista o códigos duplicados']);

      // Guardar archivo
      const downloadsPath = app.getPath('downloads');
      const fileName = `Plantilla_Estudiantes_${Date.now()}.xlsx`;
      const filePath = path.join(downloadsPath, fileName);

      await workbook.xlsx.writeFile(filePath);

      return {
        success: true,
        filePath,
        fileName,
        message: `Plantilla creada exitosamente: ${fileName}`
      };

    } catch (error) {
      ErrorHandler.logCriticalError(error, { action: 'createImportTemplate' });
      return {
        success: false,
        error: error.message || 'Error al crear plantilla'
      };
    }
  }
}

module.exports = new ExcelService();
