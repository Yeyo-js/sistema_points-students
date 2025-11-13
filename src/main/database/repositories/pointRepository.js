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

  // READ (rest of methods unchanged)
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
      const db = dbInstance.getDb(); 

      db.run(
        `UPDATE points 
        SET participation_type_id = ?, points_value = ?, reason = ?
        WHERE id = ?`,
        [participationTypeId, pointsValue, reason, pointId] 
      );
      
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
      const db = dbInstance.getDb(); 

      db.run("DELETE FROM points WHERE id = ?", [pointId]);
      
      dbInstance.saveDatabase();

      return { changes: 1 };
    } catch (error) {
      console.error("Error en PointRepository.delete:", error);
      throw error;
    }
  }

  // Nuevo método auxiliar para obtener la suma máxima de puntos en un curso
  getMaxTotalPointsInCourse(courseId) {
    try {
        const dbInstance = this.getDbInstance();
        // Obtener el máximo 'total_points' de la tabla student_totals para el curso.
        const query = `
            SELECT COALESCE(MAX(total_points), 0) as max_points
            FROM student_totals
            WHERE course_id = ?
        `;
        const result = dbInstance.getDb().exec(query, [courseId]);
        
        if (!result.length || !result[0].values.length) {
            return 0;
        }
        return result[0].values[0][0] || 0; 
    } catch (error) {
        console.error("Error en PointRepository.getMaxTotalPointsInCourse:", error);
        throw error;
    }
  }

  // Calcular totales de un estudiante (Simplificado para solo sumar y contar)
  calculateStudentTotals(studentId) {
    try {
      const dbInstance = this.getDbInstance();
      const result = dbInstance.getDb().exec(
        `SELECT 
          COALESCE(SUM(points_value), 0) as total_points,
          COUNT(*) as participation_count
        FROM points
        WHERE student_id = ?`,
        [studentId]
      );

      if (!result.length || !result[0].values.length) {
        return {
          total_points: 0,
          participation_count: 0,
        };
      }

      return this._rowToObject(result[0]);
    } catch (error) {
      console.error("Error en PointRepository.calculateStudentTotals:", error);
      throw error;
    }
  }

  // Actualizar totales en student_totals (NUEVA LÓGICA DE PROMEDIO)
  updateStudentTotals(studentId) {
    try {
      const totals = this.calculateStudentTotals(studentId);
      const dbInstance = this.getDbInstance();
      const db = dbInstance.getDb();
      
      let courseId = null;
      let totalPoints = totals.total_points;
      let averagePoints = 0;
      let roundedAverage = 0;
      
      // 1. Obtener Course ID
      const studentResult = db.exec("SELECT course_id FROM students WHERE id = ?", [studentId]);
      if (studentResult.length && studentResult[0].values.length) {
          courseId = studentResult[0].values[0][0];
      }
      
      if (!courseId) {
          // No se puede calcular el promedio si no hay ID de curso.
          console.warn(`No se pudo encontrar el ID del curso para el estudiante ${studentId}.`);
          // Si el estudiante no tiene curso, los puntos se guardarán, pero el promedio será 0.
      } else {
          // 2. Obtener Max Total Points en el curso
          // NOTA: El valor de maxPoints puede estar desactualizado en este momento, 
          // pero se actualizará en la próxima operación si este estudiante tiene un nuevo máximo.
          const maxPoints = this.getMaxTotalPointsInCourse(courseId);
          
          // 3. Aplicar NUEVA LÓGICA DE PROMEDIO: (Puntos Estudiante / Puntos Máximos del Curso) * 20
          if (maxPoints > 0) {
              averagePoints = (totalPoints / maxPoints) * 20;
              
              // Limitar la nota máxima a 20.
              if (averagePoints > 20) averagePoints = 20; 
              
              roundedAverage = Math.round(averagePoints);
          } else {
              // Si el estudiante es el primero o el único con puntos, su puntaje es 20/20.
              if (totalPoints > 0) {
                 averagePoints = 20;
                 roundedAverage = 20;
              }
              // Si totalPoints es 0, el promedio es 0, lo cual es correcto.
          }
      }
      
      
      // 4. Actualizar/Insertar en student_totals

      // Verificar si ya existe un registro
      const exists = db.exec(
        "SELECT COUNT(*) as count FROM student_totals WHERE student_id = ?",
        [studentId]
      );

      const count = exists[0].values[0][0];

      if (count > 0) {
        // Actualizar
        dbInstance.run(
          `UPDATE student_totals 
          SET 
            total_points = ?,
            participation_count = ?,
            average_points = ?,
            rounded_average = ?,
            last_updated = CURRENT_TIMESTAMP
          WHERE student_id = ?`,
          [
            totalPoints,
            totals.participation_count,
            averagePoints, // Usamos el nuevo cálculo
            roundedAverage,
            studentId,
          ]
        );
      } else if (courseId) {
        // Insertar (solo si hay courseId)
        dbInstance.run(
          `INSERT INTO student_totals 
          (student_id, course_id, total_points, participation_count, average_points, rounded_average) 
          VALUES (?, ?, ?, ?, ?, ?)`,
          [
            studentId,
            courseId,
            totalPoints,
            totals.participation_count,
            averagePoints, // Usamos el nuevo cálculo
            roundedAverage,
          ]
        );
      }

      dbInstance.saveDatabase(); 

      return { changes: 1 };
    } catch (error) {
      console.error("Error en PointRepository.updateStudentTotals:", error);
      throw error;
    }
  }

  // Obtener historial agrupado por fecha (para gráficos)
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

      // 1. Obtener la información del estudiante para el cálculo acumulado
      let student = null;
      const studentInfo = dbInstance.getDb().exec("SELECT course_id FROM students WHERE id = ?", [studentId]);
      const courseId = studentInfo.length && studentInfo[0].values.length ? studentInfo[0].values[0][0] : null;

      // 2. Obtener todos los puntos de la historia (sin agrupar)
      const allPoints = this.findByStudent(studentId, null);
      
      // 3. Obtener el puntaje máximo del curso (para el cálculo del acumulado en 20)
      const maxPoints = courseId ? this.getMaxTotalPointsInCourse(courseId) : 0;
      
      // 4. Calcular acumulados y notas finales
      let cumulativePoints = 0;
      const history = allPoints.reverse().map(point => {
        cumulativePoints += point.points_value;

        let finalGrade = 0;
        if (maxPoints > 0) {
            finalGrade = (cumulativePoints / maxPoints) * 20;
            if (finalGrade > 20) finalGrade = 20;
        } else if (cumulativePoints > 0) {
             // Si no hay maxPoints, pero tiene puntos, se asume 20
             finalGrade = 20; 
        }

        return {
          date: point.created_at,
          cumulativePoints: cumulativePoints,
          dayPoints: point.points_value,
          participationType: point.participation_type_name,
          finalGrade: Math.round(finalGrade) // Se podría usar para mostrar la evolución
        };
      }).reverse(); // Revertir para que el orden sea de nuevo DESC

      return history; // Devuelve la historia para el gráfico
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