const { getDatabaseInstance } = require('../index');

class CourseRepository {
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
  insert(userId, name, level, academicPeriod) {
    try {
      const dbInstance = this.getDbInstance();
      const db = dbInstance.getDb();

      db.run(
        "INSERT INTO courses (user_id, name, level, academic_period) VALUES (?, ?, ?, ?)",
        [userId, name, level, academicPeriod]
      );

      const result = db.exec("SELECT last_insert_rowid() as id");
      const lastInsertRowid = result[0].values[0][0];

      dbInstance.saveDatabase();

      return { lastInsertRowid };
    } catch (error) {
      console.error("Error en CourseRepository.insert:", error);
      throw error;
    }
  }

  // READ
  findById(courseId) {
    try {
      const dbInstance = this.getDbInstance();
      const result = dbInstance.getDb().exec(
        `SELECT c.*, u.full_name as teacher_name
        FROM courses c
        JOIN users u ON c.user_id = u.id
        WHERE c.id = ?`,
        [courseId]
      );

      if (!result.length || !result[0].values.length) {
        return null;
      }

      return this._rowToObject(result[0]);
    } catch (error) {
      console.error("Error en CourseRepository.findById:", error);
      throw error;
    }
  }

  findByUser(userId) {
    try {
      const dbInstance = this.getDbInstance();
      const result = dbInstance.getDb().exec(
        `SELECT c.*, 
          (SELECT COUNT(*) FROM students WHERE course_id = c.id) as student_count
        FROM courses c
        WHERE c.user_id = ?
        ORDER BY c.created_at DESC`,
        [userId]
      );

      if (!result.length) {
        return [];
      }

      return this._rowsToObjects(result[0]);
    } catch (error) {
      console.error("Error en CourseRepository.findByUser:", error);
      throw error;
    }
  }

  findAll() {
    try {
      const dbInstance = this.getDbInstance();
      const result = dbInstance.getDb().exec(
        `SELECT c.*, u.full_name as teacher_name,
          (SELECT COUNT(*) FROM students WHERE course_id = c.id) as student_count
        FROM courses c
        JOIN users u ON c.user_id = u.id
        ORDER BY c.created_at DESC`
      );

      if (!result.length) {
        return [];
      }

      return this._rowsToObjects(result[0]);
    } catch (error) {
      console.error("Error en CourseRepository.findAll:", error);
      throw error;
    }
  }

  // UPDATE
  update(courseId, name, level, academicPeriod) {
    try {
      const dbInstance = this.getDbInstance();

      dbInstance.run(
        `UPDATE courses 
        SET name = ?, level = ?, academic_period = ?
        WHERE id = ?`,
        [name, level, academicPeriod, courseId]
      );

      return { changes: 1 };
    } catch (error) {
      console.error("Error en CourseRepository.update:", error);
      throw error;
    }
  }

  // DELETE
  delete(courseId) {
    try {
      const dbInstance = this.getDbInstance();

      dbInstance.run("DELETE FROM courses WHERE id = ?", [courseId]);

      return { changes: 1 };
    } catch (error) {
      console.error("Error en CourseRepository.delete:", error);
      throw error;
    }
  }

  // Verificar si el curso pertenece al usuario
  belongsToUser(courseId, userId) {
    try {
      const dbInstance = this.getDbInstance();
      const result = dbInstance
        .getDb()
        .exec(
          "SELECT COUNT(*) as count FROM courses WHERE id = ? AND user_id = ?",
          [courseId, userId]
        );

      if (!result.length) {
        return false;
      }

      const count = result[0].values[0][0];
      return count > 0;
    } catch (error) {
      console.error("Error en CourseRepository.belongsToUser:", error);
      throw error;
    }
  }

  // Obtener estadísticas del curso
  getStatistics(courseId) {
    try {
      const dbInstance = this.getDbInstance();
      const result = dbInstance.getDb().exec(
        `SELECT 
          COUNT(DISTINCT s.id) as total_students,
          COUNT(p.id) as total_participations,
          COALESCE(SUM(p.points_value), 0) as total_points,
          COALESCE(AVG(st.rounded_average), 0) as class_average
        FROM courses c
        LEFT JOIN students s ON c.id = s.course_id
        LEFT JOIN points p ON s.id = p.student_id
        LEFT JOIN student_totals st ON s.id = st.student_id
        WHERE c.id = ?`,
        [courseId]
      );

      if (!result.length || !result[0].values.length) {
        return {
          total_students: 0,
          total_participations: 0,
          total_points: 0,
          class_average: 0,
        };
      }

      return this._rowToObject(result[0]);
    } catch (error) {
      console.error("Error en CourseRepository.getStatistics:", error);
      throw error;
    }
  }

  // Helpers
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

module.exports = new CourseRepository();