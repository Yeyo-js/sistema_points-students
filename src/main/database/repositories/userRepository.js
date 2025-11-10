const { getDatabaseInstance } = require('../index');

class UserRepository {
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
  insert(username, fullName, email, hashedPassword) {
    try {
      const dbInstance = this.getDbInstance();
      const db = dbInstance.getDb();

      // Ejecutar INSERT directamente en la base de datos
      db.run(
        "INSERT INTO users (username, full_name, email, password) VALUES (?, ?, ?, ?)",
        [username, fullName, email, hashedPassword]
      );

      // Obtener el último ID insertado INMEDIATAMENTE después del INSERT
      const result = db.exec("SELECT last_insert_rowid() as id");

      console.log(
        "📊 Resultado last_insert_rowid:",
        JSON.stringify(result, null, 2)
      );

      if (
        !result ||
        !result.length ||
        !result[0].values ||
        !result[0].values.length
      ) {
        throw new Error("No se pudo obtener el ID del usuario creado");
      }

      const lastInsertRowid = result[0].values[0][0];

      console.log("✅ ID del usuario creado:", lastInsertRowid);

      // Verificar que el ID sea válido
      if (!lastInsertRowid || lastInsertRowid === 0) {
        console.error("❌ ID inválido recibido:", lastInsertRowid);
        throw new Error("ID inválido: " + lastInsertRowid);
      }

      // Guardar la base de datos
      dbInstance.saveDatabase();

      return { lastInsertRowid };
    } catch (error) {
      console.error("❌ Error en UserRepository.insert:", error);
      throw error;
    }
  }

  // READ
  findById(userId) {
    try {
      const dbInstance = this.getDbInstance();

      console.log("🔍 Buscando usuario con ID:", userId);

      const result = dbInstance
        .getDb()
        .exec("SELECT * FROM users WHERE id = ?", [userId]);

      console.log("📊 Resultado de query:", {
        hasResult: !!result.length,
        resultLength: result.length,
        hasValues: result.length > 0 ? result[0].values.length : 0,
      });

      if (!result.length || !result[0].values.length) {
        console.warn("⚠️ Usuario no encontrado con ID:", userId);
        return null;
      }

      const user = this._rowToObject(result[0]);
      console.log("✅ Usuario encontrado:", user ? "Sí" : "No");

      return user;
    } catch (error) {
      console.error("❌ Error en UserRepository.findById:", error);
      throw error;
    }
  }

  findByUsername(username) {
    try {
      const dbInstance = this.getDbInstance();
      const result = dbInstance
        .getDb()
        .exec(`SELECT * FROM users WHERE username = ?`, [username]);

      if (!result.length || !result[0].values.length) {
        return null;
      }

      return this._rowToObject(result[0]);
    } catch (error) {
      console.error("Error en UserRepository.findByUsername:", error);
      throw error;
    }
  }

  findByEmail(email) {
    try {
      const dbInstance = this.getDbInstance();
      const result = dbInstance
        .getDb()
        .exec(`SELECT * FROM users WHERE email = ?`, [email]);

      if (!result.length || !result[0].values.length) {
        return null;
      }

      return this._rowToObject(result[0]);
    } catch (error) {
      console.error("Error en UserRepository.findByEmail:", error);
      throw error;
    }
  }

  findAll() {
    try {
      const dbInstance = this.getDbInstance();
      const result = dbInstance
        .getDb()
        .exec("SELECT id, username, full_name, email, created_at FROM users");

      if (!result.length) {
        return [];
      }

      return this._rowsToObjects(result[0]);
    } catch (error) {
      console.error("Error en UserRepository.findAll:", error);
      throw error;
    }
  }

  // UPDATE
  update(userId, fullName, email) {
    try {
      const dbInstance = this.getDbInstance();

      dbInstance.run(
        `UPDATE users SET full_name = ?, email = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
        [fullName, email, userId]
      );

      return { changes: 1 };
    } catch (error) {
      console.error("Error en UserRepository.update:", error);
      throw error;
    }
  }

  updatePassword(userId, hashedPassword) {
    try {
      const dbInstance = this.getDbInstance();

      dbInstance.run(
        `UPDATE users SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
        [hashedPassword, userId]
      );

      return { changes: 1 };
    } catch (error) {
      console.error("Error en UserRepository.updatePassword:", error);
      throw error;
    }
  }

  // DELETE
  delete(userId) {
    try {
      const dbInstance = this.getDbInstance();

      dbInstance.run("DELETE FROM users WHERE id = ?", [userId]);

      return { changes: 1 };
    } catch (error) {
      console.error("Error en UserRepository.delete:", error);
      throw error;
    }
  }

  // Verificar si existe un username
  existsUsername(username, excludeUserId = null) {
    try {
      const dbInstance = this.getDbInstance();
      let query = "SELECT COUNT(*) as count FROM users WHERE username = ?";
      let params = [username];

      if (excludeUserId) {
        query += " AND id != ?";
        params.push(excludeUserId);
      }

      const result = dbInstance.getDb().exec(query, params);

      if (!result.length) {
        return false;
      }

      const count = result[0].values[0][0];
      return count > 0;
    } catch (error) {
      console.error("Error en UserRepository.existsUsername:", error);
      throw error;
    }
  }

  // Verificar si existe un email
  existsEmail(email, excludeUserId = null) {
    try {
      const dbInstance = this.getDbInstance();
      let query = "SELECT COUNT(*) as count FROM users WHERE email = ?";
      let params = [email];

      if (excludeUserId) {
        query += " AND id != ?";
        params.push(excludeUserId);
      }

      const result = dbInstance.getDb().exec(query, params);

      if (!result.length) {
        return false;
      }

      const count = result[0].values[0][0];
      return count > 0;
    } catch (error) {
      console.error("Error en UserRepository.existsEmail:", error);
      throw error;
    }
  }

  // Helpers para convertir resultados de sql.js a objetos
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

module.exports = new UserRepository();