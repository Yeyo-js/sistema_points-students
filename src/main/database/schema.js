const initSqlJs = require('sql.js');
const path = require('path');
const fs = require('fs');

class DatabaseSchema {
  constructor() {
    this.db = null;
    this.dbPath = path.join(__dirname, "../../../data/students-points.db");
    this.isInitialized = false;
  }

  async initDatabase() {
    if (this.isInitialized) {
      return;
    }

    try {
      // Crear carpeta de base de datos si no existe
      const dbDir = path.dirname(this.dbPath);
      if (!fs.existsSync(dbDir)) {
        fs.mkdirSync(dbDir, { recursive: true });
        console.log("📁 Carpeta de base de datos creada");
      }

      // Inicializar SQL.js
      const SQL = await initSqlJs();

      // Cargar o crear base de datos
      if (fs.existsSync(this.dbPath)) {
        const buffer = fs.readFileSync(this.dbPath);
        this.db = new SQL.Database(buffer);
        console.log("✅ Base de datos cargada desde archivo");
      } else {
        this.db = new SQL.Database();
        console.log("✅ Nueva base de datos creada");
      }

      this.initTables();
      this.saveDatabase();
      this.isInitialized = true;

      console.log("🎉 Base de datos inicializada correctamente");
    } catch (error) {
      console.error("❌ Error crítico al inicializar base de datos:", error);
      throw error;
    }
  }

  initTables() {
    try {
      // Habilitar foreign keys
      this.db.run("PRAGMA foreign_keys = ON;");

      // Tabla de usuarios (docentes)
      this.db.run(`
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          username TEXT UNIQUE NOT NULL,
          full_name TEXT NOT NULL,
          email TEXT UNIQUE NOT NULL,
          password TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
      `);

      // Tabla de cursos
      this.db.run(`
        CREATE TABLE IF NOT EXISTS courses (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          name TEXT NOT NULL,
          level TEXT NOT NULL,
          academic_period TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );
      `);

      // Tabla de estudiantes
      this.db.run(`
        CREATE TABLE IF NOT EXISTS students (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          course_id INTEGER NOT NULL,
          full_name TEXT NOT NULL,
          student_code TEXT,
          list_number INTEGER NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
          UNIQUE(course_id, list_number)
        );
      `);

      // Tabla de tipos de participación
      this.db.run(`
        CREATE TABLE IF NOT EXISTS participation_types (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          name TEXT NOT NULL,
          default_points INTEGER NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );
      `);

      // Tabla de puntos
      this.db.run(`
        CREATE TABLE IF NOT EXISTS points (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          student_id INTEGER NOT NULL,
          user_id INTEGER NOT NULL,
          participation_type_id INTEGER NOT NULL,
          points_value INTEGER NOT NULL,
          reason TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
          FOREIGN KEY (participation_type_id) REFERENCES participation_types(id) ON DELETE CASCADE
        );
      `);

      // Tabla de totales de estudiantes
      this.db.run(`
        CREATE TABLE IF NOT EXISTS student_totals (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          student_id INTEGER UNIQUE NOT NULL,
          course_id INTEGER NOT NULL,
          total_points INTEGER DEFAULT 0,
          participation_count INTEGER DEFAULT 0,
          average_points REAL DEFAULT 0,
          rounded_average INTEGER DEFAULT 0,
          last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
          FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
        );
      `);

      // Índices para mejorar performance
      this.db.run(
        "CREATE INDEX IF NOT EXISTS idx_courses_user ON courses(user_id);"
      );
      this.db.run(
        "CREATE INDEX IF NOT EXISTS idx_students_course ON students(course_id);"
      );
      this.db.run(
        "CREATE INDEX IF NOT EXISTS idx_points_student ON points(student_id);"
      );
      this.db.run(
        "CREATE INDEX IF NOT EXISTS idx_points_created ON points(created_at);"
      );

      console.log("✅ Tablas e índices creados correctamente");
    } catch (error) {
      console.error("❌ Error al crear tablas:", error);
      throw error;
    }
  }

  // Guardar base de datos en disco
  saveDatabase() {
    try {
      if (!this.db) {
        console.warn("⚠️ No hay base de datos para guardar");
        return;
      }

      const data = this.db.export();
      const buffer = Buffer.from(data);
      fs.writeFileSync(this.dbPath, buffer);
    } catch (error) {
      console.error("❌ Error al guardar base de datos:", error);
      throw error;
    }
  }

  // Método para cerrar la conexión
  close() {
    try {
      if (this.db) {
        this.saveDatabase();
        this.db.close();
        this.db = null;
        this.isInitialized = false;
        console.log("✅ Base de datos cerrada correctamente");
      }
    } catch (error) {
      console.error("❌ Error al cerrar base de datos:", error);
    }
  }

  // Obtener instancia de la base de datos
  getDb() {
    if (!this.db) {
      throw new Error(
        "Base de datos no inicializada. Llama a initDatabase() primero."
      );
    }
    return this.db;
  }

  // Wrapper para ejecutar queries con auto-save y manejo de errores
  run(query, params = []) {
    try {
      if (!this.db) {
        throw new Error("Base de datos no inicializada");
      }

      console.log("🔧 Ejecutando query:", query.substring(0, 80));
      console.log("📝 Parámetros:", JSON.stringify(params));

      // Ejecutar la query
      this.db.run(query, params);

      console.log("✅ Query ejecutada");

      // Guardar en disco
      this.saveDatabase();

      console.log("💾 Base de datos guardada");
    } catch (error) {
      console.error("❌ Error en DatabaseSchema.run:", error);
      console.error("Query:", query);
      console.error("Params:", params);
      throw error;
    }
  }

  exec(query) {
    try {
      if (!this.db) {
        throw new Error("Base de datos no inicializada");
      }

      const result = this.db.exec(query);
      this.saveDatabase();
      return result;
    } catch (error) {
      console.error("❌ Error en DatabaseSchema.exec:", error);
      throw error;
    }
  }
}

module.exports = DatabaseSchema;