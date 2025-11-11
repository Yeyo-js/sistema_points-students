const { getDatabaseInstance } = require('../index');

class StudentRepository {
  constructor() {
    this.dbInstance = null;
  }

  getDbInstance() {
    if (!this.dbInstance) {
      this.dbInstance = getDatabaseInstance();
    }
    return this.dbInstance;
  }

  // CREATE
  insert(courseId, fullName, studentCode, listNumber) {
    try {
      const dbInstance = this.getDbInstance();
      const db = dbInstance.getDb();

      db.run(
        "INSERT INTO students (course_id, full_name, student_code, list_number) VALUES (?, ?, ?, ?)",
        [courseId, fullName, studentCode, listNumber]
      );

      const result = db.exec("SELECT last_insert_rowid() as id");
      const lastInsertRowid = result[0].values[0][0];

      dbInstance.saveDatabase();

      return { lastInsertRowid };
    } catch (error) {
      console.error("Error en StudentRepository.insert:", error);
      throw error;
    }
  }

  // READ
  findById(studentId) {
    try {
      const dbInstance = this.getDbInstance();
      const result = dbInstance.getDb().exec(
        `SELECT 
          s.*,
          st.total_points,
          st.participation_count,
          st.average_points,
          st.rounded_average
        FROM students s
        LEFT JOIN student_totals st ON s.id = st.student_id
        WHERE s.id = ?`,
        [studentId]
      );

      if (!result.length || !result[0].values.length) {
        return null;
      }

      return this._rowToObject(result[0]);
    } catch (error) {
      console.error("Error en StudentRepository.findById:", error);
      throw error;
    }
  }

  findByCourse(courseId) {
    try {
      const dbInstance = this.getDbInstance();
      const result = dbInstance.getDb().exec(
        `SELECT 
          s.*,
          st.total_points,
          st.participation_count,
          st.average_points,
          st.rounded_average
        FROM students s
        LEFT JOIN student_totals st ON s.id = st.student_id
        WHERE s.course_id = ?
        ORDER BY s.list_number ASC`,
        [courseId]
      );

      if (!result.length) {
        return [];
      }

      return this._rowsToObjects(result[0]);
    } catch (error) {
      console.error("Error en StudentRepository.findByCourse:", error);
      throw error;
    }
  }

  // UPDATE
  update(studentId, fullName, studentCode, listNumber) {
    try {
      const dbInstance = this.getDbInstance();

      dbInstance.run(
        `UPDATE students 
        SET full_name = ?, student_code = ?, list_number = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?`,
        [fullName, studentCode, listNumber, studentId]
      );

      return { changes: 1 };
    } catch (error) {
      console.error("Error en StudentRepository.update:", error);
      throw error;
    }
  }

  // DELETE
  delete(studentId) {
    try {
      const dbInstance = this.getDbInstance();

      dbInstance.run("DELETE FROM students WHERE id = ?", [studentId]);

      return { changes: 1 };
    } catch (error) {
      console.error("Error en StudentRepository.delete:", error);
      throw error;
    }
  }

  // Verificar si existe un número de lista en un curso
  existsListNumber(courseId, listNumber, excludeStudentId = null) {
    try {
      const dbInstance = this.getDbInstance();
      let query =
        "SELECT COUNT(*) as count FROM students WHERE course_id = ? AND list_number = ?";
      let params = [courseId, listNumber];

      if (excludeStudentId) {
        query += " AND id != ?";
        params.push(excludeStudentId);
      }

      const result = dbInstance.getDb().exec(query, params);

      if (!result.length) {
        return false;
      }

      const count = result[0].values[0][0];
      return count > 0;
    } catch (error) {
      console.error("Error en StudentRepository.existsListNumber:", error);
      throw error;
    }
  }

  // Helpers para convertir resultados
  _rowToObject(result) {
    if (!result.values || !result.values.length) {
      return null;
    }

    const columns = result.columns;
    const row = result.values[0];
    const obj = {};

    columns.forEach((col, index) => {
      obj[col] = row[index];
    });

    return obj;
  }

  // Buscar estudiante por código en un curso
  findByStudentCode(courseId, studentCode) {
    try {
      const dbInstance = this.getDbInstance();
      const query = `
        SELECT * FROM students
        WHERE course_id = ? AND student_code = ?
        LIMIT 1
      `;

      const result = dbInstance.getDb().exec(query, [courseId, studentCode]);

      if (!result.length || !result[0].values.length) {
        return null;
      }

      const rows = this._rowsToObjects(result[0]);
      return rows[0] || null;
    } catch (error) {
      console.error('Error en StudentRepository.findByStudentCode:', error);
      throw error;
    }
  }

  // Buscar estudiante por número de lista en un curso
  findByListNumber(courseId, listNumber) {
    try {
      const dbInstance = this.getDbInstance();
      const query = `
        SELECT * FROM students
        WHERE course_id = ? AND list_number = ?
        LIMIT 1
      `;

      const result = dbInstance.getDb().exec(query, [courseId, listNumber]);

      if (!result.length || !result[0].values.length) {
        return null;
      }

      const rows = this._rowsToObjects(result[0]);
      return rows[0] || null;
    } catch (error) {
      console.error('Error en StudentRepository.findByListNumber:', error);
      throw error;
    }
  }

  _rowsToObjects(result) {
    if (!result.values || !result.values.length) {
      return [];
    }

    const columns = result.columns;
    const rows = result.values;

    return rows.map((row) => {
      const obj = {};
      columns.forEach((col, index) => {
        obj[col] = row[index];
      });
      return obj;
    });
  }
}

module.exports = new StudentRepository();