const { getDatabaseInstance } = require('../index');

class PointRepository {
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
  insert(studentId, userId, participationTypeId, pointsValue, reason) {
    try {
      const dbInstance = this.getDbInstance();
      const db = dbInstance.getDb();

      db.run(
        "INSERT INTO points (student_id, user_id, participation_type_id, points_value, reason) VALUES (?, ?, ?, ?, ?)",
        [studentId, userId, participationTypeId, pointsValue, reason]
      );

      const result = db.exec("SELECT last_insert_rowid() as id");
      const lastInsertRowid = result[0].values[0][0];

      dbInstance.saveDatabase();

      return { lastInsertRowid };
    } catch (error) {
      console.error("Error en PointRepository.insert:", error);
      throw error;
    }
  }

  // READ
  findById(pointId) {
    try {
      const dbInstance = this.getDbInstance();
      const result = dbInstance.getDb().exec(
        `SELECT 
          p.*,
          s.full_name as student_name,
          s.list_number,
          pt.name as participation_type_name,
          u.full_name as teacher_name
        FROM points p
        JOIN students s ON p.student_id = s.id
        JOIN participation_types pt ON p.participation_type_id = pt.id
        JOIN users u ON p.user_id = u.id
        WHERE p.id = ?`,
        [pointId]
      );

      if (!result.length || !result[0].values.length) {
        return null;
      }

      return this._rowToObject(result[0]);
    } catch (error) {
      console.error("Error en PointRepository.findById:", error);
      throw error;
    }
  }

  findByStudent(studentId, limit = null) {
    try {
      const dbInstance = this.getDbInstance();
      let query = `
        SELECT
          p.*,
          pt.name as participation_type_name,
          u.full_name as teacher_name
        FROM points p
        JOIN participation_types pt ON p.participation_type_id = pt.id
        JOIN users u ON p.user_id = u.id
        WHERE p.student_id = ?
        ORDER BY p.created_at DESC
      `;

      // Validar y sanitizar limit antes de usarlo en la query
      // Nota: SQL.js no soporta placeholders para LIMIT, por lo que se usa interpolación
      // pero con validación estricta para prevenir SQL injection
      if (limit) {
        const parsedLimit = parseInt(limit, 10);
        if (!Number.isInteger(parsedLimit) || parsedLimit <= 0) {
          throw new Error('El parámetro limit debe ser un entero positivo');
        }
        query += ` LIMIT ${parsedLimit}`;
      }

      const result = dbInstance.getDb().exec(query, [studentId]);

      if (!result.length) {
        return [];
      }

      return this._rowsToObjects(result[0]);
    } catch (error) {
      console.error("Error en PointRepository.findByStudent:", error);
      throw error;
    }
  }

  // Contar puntos asignados a un estudiante
  countByStudent(studentId) {
    try {
      const dbInstance = this.getDbInstance();
      const query = `
        SELECT COALESCE(SUM(points_value), 0) as total_points
        FROM points
        WHERE student_id = ?
      `;

      const result = dbInstance.getDb().exec(query, [studentId]);

      if (!result.length || !result[0].values.length) {
        return 0;
      }
      
      // Retorna la suma total de puntos (índice 0 de la primera fila)
      return result[0].values[0][0]; 
    } catch (error) {
      console.error("Error en PointRepository.countByStudent:", error);
      throw error;
    }
  }

  findByCourse(courseId, limit = null) {
    try {
      const dbInstance = this.getDbInstance();
      let query = `
        SELECT 
          p.*,
          s.full_name as student_name,
          s.list_number,
          pt.name as participation_type_name,
          u.full_name as teacher_name
        FROM points p
        JOIN students s ON p.student_id = s.id
        JOIN participation_types pt ON p.participation_type_id = pt.id
        JOIN users u ON p.user_id = u.id
        WHERE s.course_id = ?
        ORDER BY p.created_at DESC
      `;

      if (limit) {
        query += ` LIMIT ${parseInt(limit)}`;
      }

      const result = dbInstance.getDb().exec(query, [courseId]);

      if (!result.length) {
        return [];
      }

      return this._rowsToObjects(result[0]);
    } catch (error) {
      console.error("Error en PointRepository.findByCourse:", error);
      throw error;
    }
  }

  findByDateRange(studentId, startDate, endDate) {
    try {
      const dbInstance = this.getDbInstance();
      const result = dbInstance.getDb().exec(
        `SELECT 
          p.*,
          pt.name as participation_type_name,
          u.full_name as teacher_name
        FROM points p
        JOIN participation_types pt ON p.participation_type_id = pt.id
        JOIN users u ON p.user_id = u.id
        WHERE p.student_id = ? 
          AND p.created_at >= ? 
          AND p.created_at <= ?
        ORDER BY p.created_at DESC`,
        [studentId, startDate, endDate]
      );

      if (!result.length) {
        return [];
      }

      return this._rowsToObjects(result[0]);
    } catch (error) {
      console.error("Error en PointRepository.findByDateRange:", error);
      throw error;
    }
  }

  // UPDATE
  update(participationTypeId, pointsValue, reason, pointId) {
    try {
      const dbInstance = this.getDbInstance();
      const db = dbInstance.getDb(); // <-- Obtener el objeto de BD directo

      // Ejecutar la actualización en la base de datos
      db.run(
        `UPDATE points 
        SET participation_type_id = ?, points_value = ?, reason = ?
        WHERE id = ?`,
        [participationTypeId, pointsValue, reason, pointId] 
      );
      
      // CORRECCIÓN CRÍTICA: Guardar explícitamente en el disco
      dbInstance.saveDatabase();

      return { changes: 1 };
    } catch (error) {
      console.error("Error en PointRepository.update:", error);
      throw error;
    }
  }

  // DELETE
  delete(pointId) {
    try {
      const dbInstance = this.getDbInstance();
      const db = dbInstance.getDb(); // <-- Obtener el objeto de BD directo

      db.run("DELETE FROM points WHERE id = ?", [pointId]);
      
      // CORRECCIÓN CRÍTICA: Guardar explícitamente en el disco
      dbInstance.saveDatabase();

      return { changes: 1 };
    } catch (error) {
      console.error("Error en PointRepository.delete:", error);
      throw error;
    }
  }

  // Calcular totales de un estudiante
  calculateStudentTotals(studentId) {
    try {
      const dbInstance = this.getDbInstance();
      const result = dbInstance.getDb().exec(
        `SELECT 
          COALESCE(SUM(points_value), 0) as total_points,
          COUNT(*) as participation_count,
          CASE 
            WHEN COUNT(*) > 0 THEN CAST(SUM(points_value) AS REAL) / COUNT(*)
            ELSE 0 
          END as average_points
        FROM points
        WHERE student_id = ?`,
        [studentId]
      );

      if (!result.length || !result[0].values.length) {
        return {
          total_points: 0,
          participation_count: 0,
          average_points: 0,
        };
      }

      return this._rowToObject(result[0]);
    } catch (error) {
      console.error("Error en PointRepository.calculateStudentTotals:", error);
      throw error;
    }
  }

  // Actualizar totales en student_totals
  updateStudentTotals(studentId) {
    try {
      const totals = this.calculateStudentTotals(studentId);
      const roundedAverage = Math.round(totals.average_points);

      const dbInstance = this.getDbInstance();
      const db = dbInstance.getDb(); // <-- Obtener el objeto de BD directo

      // Verificar si ya existe un registro
      const exists = db.exec(
        "SELECT COUNT(*) as count FROM student_totals WHERE student_id = ?",
        [studentId]
      );

      const count = exists[0].values[0][0];

      if (count > 0) {
        // Actualizar
        db.run(
          `UPDATE student_totals 
          SET 
            total_points = ?,
            participation_count = ?,
            average_points = ?,
            rounded_average = ?,
            last_updated = CURRENT_TIMESTAMP
          WHERE student_id = ?`,
          [
            totals.total_points,
            totals.participation_count,
            totals.average_points,
            roundedAverage,
            studentId,
          ]
        );
      } else {
        // Insertar (obtener course_id del estudiante)
        const studentResult = db.exec("SELECT course_id FROM students WHERE id = ?", [studentId]);

        if (studentResult.length && studentResult[0].values.length) {
          const courseId = studentResult[0].values[0][0];

          db.run(
            `INSERT INTO student_totals 
            (student_id, course_id, total_points, participation_count, average_points, rounded_average) 
            VALUES (?, ?, ?, ?, ?, ?)`,
            [
              studentId,
              courseId,
              totals.total_points,
              totals.participation_count,
              totals.average_points,
              roundedAverage,
            ]
          );
        }
      }

      // CORRECCIÓN FINAL: Guardar los cambios realizados en el disco
      dbInstance.saveDatabase(); 

      return { changes: 1 };
    } catch (error) {
      console.error("Error en PointRepository.updateStudentTotals:", error);
      throw error;
    }
  }

  // Obtener historial agrupado por fecha (para gráficos)
  // ... (código se mantiene)

  getPointsHistory(studentId) {
    try {
      const dbInstance = this.getDbInstance();
      const result = dbInstance.getDb().exec(
        `SELECT 
          DATE(created_at) as date,
          SUM(points_value) as daily_points,
          COUNT(*) as participation_count
        FROM points
        WHERE student_id = ?
        GROUP BY DATE(created_at)
        ORDER BY date ASC`,
        [studentId]
      );

      if (!result.length) {
        return [];
      }

      return this._rowsToObjects(result[0]);
    } catch (error) {
      console.error("Error en PointRepository.getPointsHistory:", error);
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

module.exports = new PointRepository();