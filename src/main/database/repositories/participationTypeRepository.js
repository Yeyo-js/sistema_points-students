const { getDatabaseInstance } = require('../index');

class ParticipationTypeRepository {
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
  insert(userId, name, defaultPoints) {
    try {
      const dbInstance = this.getDbInstance();
      const db = dbInstance.getDb();

      db.run(
        "INSERT INTO participation_types (user_id, name, default_points) VALUES (?, ?, ?)",
        [userId, name, defaultPoints]
      );

      const result = db.exec("SELECT last_insert_rowid() as id");
      const lastInsertRowid = result[0].values[0][0];

      dbInstance.saveDatabase();

      return { lastInsertRowid };
    } catch (error) {
      console.error("Error en ParticipationTypeRepository.insert:", error);
      throw error;
    }
  }

  // READ
  findById(typeId) {
    try {
      const dbInstance = this.getDbInstance();
      const result = dbInstance
        .getDb()
        .exec("SELECT * FROM participation_types WHERE id = ?", [typeId]);

      if (!result.length || !result[0].values.length) {
        return null;
      }

      return this._rowToObject(result[0]);
    } catch (error) {
      console.error("Error en ParticipationTypeRepository.findById:", error);
      throw error;
    }
  }

  findByUser(userId) {
    try {
      const dbInstance = this.getDbInstance();
      const result = dbInstance.getDb().exec(
        `SELECT * FROM participation_types 
        WHERE user_id = ?
        ORDER BY created_at DESC`,
        [userId]
      );

      if (!result.length) {
        return [];
      }

      return this._rowsToObjects(result[0]);
    } catch (error) {
      console.error("Error en ParticipationTypeRepository.findByUser:", error);
      throw error;
    }
  }

  findAll() {
    try {
      const dbInstance = this.getDbInstance();
      const result = dbInstance.getDb().exec(
        `SELECT pt.*, u.full_name as teacher_name
        FROM participation_types pt
        JOIN users u ON pt.user_id = u.id
        ORDER BY pt.created_at DESC`
      );

      if (!result.length) {
        return [];
      }

      return this._rowsToObjects(result[0]);
    } catch (error) {
      console.error("Error en ParticipationTypeRepository.findAll:", error);
      throw error;
    }
  }

  // UPDATE
  update(typeId, name, defaultPoints) {
    try {
      const dbInstance = this.getDbInstance();

      dbInstance.run(
        `UPDATE participation_types 
        SET name = ?, default_points = ?
        WHERE id = ?`,
        [name, defaultPoints, typeId]
      );

      return { changes: 1 };
    } catch (error) {
      console.error("Error en ParticipationTypeRepository.update:", error);
      throw error;
    }
  }

  // DELETE
  delete(typeId) {
    try {
      const dbInstance = this.getDbInstance();

      dbInstance.run("DELETE FROM participation_types WHERE id = ?", [typeId]);

      return { changes: 1 };
    } catch (error) {
      console.error("Error en ParticipationTypeRepository.delete:", error);
      throw error;
    }
  }

  // Verificar si el tipo pertenece al usuario
  belongsToUser(typeId, userId) {
    try {
      const dbInstance = this.getDbInstance();
      const result = dbInstance
        .getDb()
        .exec(
          "SELECT COUNT(*) as count FROM participation_types WHERE id = ? AND user_id = ?",
          [typeId, userId]
        );

      if (!result.length) {
        return false;
      }

      const count = result[0].values[0][0];
      return count > 0;
    } catch (error) {
      console.error(
        "Error en ParticipationTypeRepository.belongsToUser:",
        error
      );
      throw error;
    }
  }

  // Verificar si existe un tipo con el mismo nombre para el usuario
  existsName(userId, name, excludeTypeId = null) {
    try {
      const dbInstance = this.getDbInstance();
      let query =
        "SELECT COUNT(*) as count FROM participation_types WHERE user_id = ? AND name = ?";
      let params = [userId, name];

      if (excludeTypeId) {
        query += " AND id != ?";
        params.push(excludeTypeId);
      }

      const result = dbInstance.getDb().exec(query, params);

      if (!result.length) {
        return false;
      }

      const count = result[0].values[0][0];
      return count > 0;
    } catch (error) {
      console.error("Error en ParticipationTypeRepository.existsName:", error);
      throw error;
    }
  }

  // Obtener estadísticas de uso del tipo
  getUsageStats(typeId) {
    try {
      const dbInstance = this.getDbInstance();
      const result = dbInstance.getDb().exec(
        `SELECT 
          COUNT(*) as usage_count,
          SUM(points_value) as total_points_assigned
        FROM points
        WHERE participation_type_id = ?`,
        [typeId]
      );

      if (!result.length || !result[0].values.length) {
        return {
          usage_count: 0,
          total_points_assigned: 0,
        };
      }

      return this._rowToObject(result[0]);
    } catch (error) {
      console.error(
        "Error en ParticipationTypeRepository.getUsageStats:",
        error
      );
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

module.exports = new ParticipationTypeRepository();