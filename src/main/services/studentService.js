const studentRepository = require('../database/repositories/studentRepository');
const { getDatabase } = require('../database');

class StudentService {
  constructor() {
    this.db = getDatabase();
  }

  // Crear estudiante con validaciones
  createStudent(courseId, fullName, studentCode, listNumber) {
    try {
      // Validaciones
      if (!fullName || fullName.trim() === '') {
        return { success: false, error: 'El nombre completo es requerido' };
      }

      if (!listNumber || listNumber < 1) {
        return { success: false, error: 'El número de lista debe ser mayor a 0' };
      }

      // Verificar que no exista el número de lista en el curso
      if (studentRepository.existsListNumber(courseId, listNumber)) {
        return { success: false, error: 'Ya existe un estudiante con ese número de lista en este curso' };
      }

      // Transacción para crear estudiante y su registro de totales
      const transaction = this.db.transaction(() => {
        // Crear estudiante
        const result = studentRepository.insert(courseId, fullName, studentCode, listNumber);
        const studentId = result.lastInsertRowid;

        // Crear registro en student_totals
        const totalStmt = this.db.prepare(`
          INSERT INTO student_totals (student_id, course_id)
          VALUES (?, ?)
        `);
        totalStmt.run(studentId, courseId);

        return studentId;
      });

      const studentId = transaction();
      return { id: studentId, success: true };

    } catch (error) {
      console.error('Error al crear estudiante:', error);
      return { success: false, error: error.message };
    }
  }

  // Obtener estudiantes por curso
  getStudentsByCourse(courseId) {
    try {
      return studentRepository.findByCourse(courseId);
    } catch (error) {
      console.error('Error al obtener estudiantes:', error);
      return [];
    }
  }

  // Obtener estudiante por ID
  getStudentById(studentId) {
    try {
      return studentRepository.findById(studentId);
    } catch (error) {
      console.error('Error al obtener estudiante:', error);
      return null;
    }
  }

  // Actualizar estudiante con validaciones
  updateStudent(studentId, fullName, studentCode, listNumber) {
    try {
      // Validaciones
      if (!fullName || fullName.trim() === '') {
        return { success: false, error: 'El nombre completo es requerido' };
      }

      if (!listNumber || listNumber < 1) {
        return { success: false, error: 'El número de lista debe ser mayor a 0' };
      }

      // Verificar que el estudiante existe
      const student = studentRepository.findById(studentId);
      if (!student) {
        return { success: false, error: 'Estudiante no encontrado' };
      }

      // Verificar número de lista duplicado (excluyendo el mismo estudiante)
      if (studentRepository.existsListNumber(student.course_id, listNumber, studentId)) {
        return { success: false, error: 'Ya existe un estudiante con ese número de lista en este curso' };
      }

      studentRepository.update(studentId, fullName, studentCode, listNumber);
      return { success: true };

    } catch (error) {
      console.error('Error al actualizar estudiante:', error);
      return { success: false, error: error.message };
    }
  }

  // Eliminar estudiante
  deleteStudent(studentId) {
    try {
      const student = studentRepository.findById(studentId);
      if (!student) {
        return { success: false, error: 'Estudiante no encontrado' };
      }

      studentRepository.delete(studentId);
      return { success: true };

    } catch (error) {
      console.error('Error al eliminar estudiante:', error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = new StudentService();