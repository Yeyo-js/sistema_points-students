const { getDatabaseInstance } = require('../index');

class GroupRepository {
  constructor() {
    this.dbInstance = null;
  }

  getDbInstance() {
    if (!this.dbInstance) {
      this.dbInstance = getDatabaseInstance();
    }
    return this.dbInstance;
  }

  /**
   * Crear un nuevo grupo
   */
  create(groupData) {
    try {
      const dbInstance = this.getDbInstance();
      const db = dbInstance.getDb(); 

      const { name, courseId, type, parentGroupId, createdBy } = groupData;

      const query = `
        INSERT INTO groups (name, course_id, type, parent_group_id, created_by, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, datetime('now'), datetime('now'))
      `;

      db.run(query, [name, courseId || null, type, parentGroupId || null, createdBy]);

      const result = db.exec("SELECT last_insert_rowid() as id");
      const lastInsertId = result[0].values[0][0];
      
      dbInstance.saveDatabase();

      return lastInsertId;
    } catch (error) {
      console.error('Error in GroupRepository.create:', error);
      throw error;
    }
  }

  /**
   * Buscar grupo por ID con sus estudiantes
   */
  findById(id) {
    const db = this.getDbInstance().getDb(); // <-- Usa la instancia correcta

    const query = `
      SELECT
        g.*,
        c.name as course_name,
        u.full_name as created_by_name
      FROM groups g
      LEFT JOIN courses c ON g.course_id = c.id
      LEFT JOIN users u ON g.created_by = u.id
      WHERE g.id = ?
    `;

    const result = db.exec(query, [id]);

    if (!result[0] || result[0].values.length === 0) {
      return null;
    }

    const columns = result[0].columns;
    const row = result[0].values[0];
    const group = {};

    columns.forEach((col, index) => {
      group[col] = row[index];
    });

    // Obtener estudiantes del grupo (CRÍTICO: Asegura que la lista se adjunta)
    group.students = this.getGroupStudents(id);

    return group;
  }

  /**
   * Obtener todos los estudiantes de un grupo
   */
  getGroupStudents(groupId) {
    const db = this.getDbInstance().getDb(); // <-- Usa la instancia correcta

    const query = `
      SELECT
        s.*,
        st.total_points,
        st.rounded_average
      FROM group_students gs
      INNER JOIN students s ON gs.student_id = s.id
      LEFT JOIN student_totals st ON s.id = st.student_id
      WHERE gs.group_id = ?
      ORDER BY s.list_number ASC
    `;

    const result = db.exec(query, [groupId]);

    if (!result[0]) {
      return [];
    }

    const columns = result[0].columns;
    const rows = result[0].values;

    return rows.map(row => {
      const student = {};
      columns.forEach((col, index) => {
        student[col] = row[index];
      });
      return student;
    });
  }

  /**
   * Obtener todos los grupos de un usuario
   */
  findByUser(userId) {
    const db = this.getDbInstance().getDb();
    // ... (logic remains the same)
    const query = `
      SELECT
        g.*,
        c.name as course_name,
        COUNT(DISTINCT gs.student_id) as student_count
      FROM groups g
      LEFT JOIN courses c ON g.course_id = c.id
      LEFT JOIN group_students gs ON g.id = gs.group_id
      WHERE g.created_by = ?
      GROUP BY g.id
      ORDER BY g.created_at DESC
    `;

    const result = db.exec(query, [userId]);

    if (!result[0]) {
      return [];
    }

    const columns = result[0].columns;
    return result[0].values.map(row => {
      const group = {};
      columns.forEach((col, index) => {
        group[col] = row[index];
      });
      return group;
    });
  }

  /**
   * Obtener grupos de un curso específico
   */
  findByCourse(courseId) {
    const db = this.getDbInstance().getDb();
    // ... (logic remains the same)
    const query = `
      SELECT
        g.*,
        COUNT(DISTINCT gs.student_id) as student_count
      FROM groups g
      LEFT JOIN group_students gs ON g.id = gs.group_id
      WHERE g.course_id = ?
      GROUP BY g.id
      ORDER BY
        CASE g.type
          WHEN 'general' THEN 1
          WHEN 'subgroup' THEN 2
          ELSE 3
        END,
        g.created_at ASC
    `;

    const result = db.exec(query, [courseId]);

    if (!result[0]) {
      return [];
    }

    const columns = result[0].columns;
    return result[0].values.map(row => {
      const group = {};
      columns.forEach((col, index) => {
        group[col] = row[index];
      });
      return group;
    });
  }

  /**
   * Obtener subgrupos de un grupo padre
   */
  findSubgroups(parentGroupId) {
    const db = this.getDbInstance().getDb();

    const query = `
      SELECT
        g.*,
        COUNT(DISTINCT gs.student_id) as student_count
      FROM groups g
      LEFT JOIN group_students gs ON g.id = gs.group_id
      WHERE g.parent_group_id = ?
      GROUP BY g.id
      ORDER BY g.name ASC
    `;

    const result = db.exec(query, [parentGroupId]);

    if (!result[0]) {
      return [];
    }

    const columns = result[0].columns;
    return result[0].values.map(row => {
      const group = {};
      columns.forEach((col, index) => {
        group[col] = row[index];
      });
      return group;
    });
  }

  /**
   * Actualizar información de un grupo
   */
  update(id, groupData) {
    try {
      const dbInstance = this.getDbInstance();
      const db = dbInstance.getDb();
      const { name } = groupData;
  
      const query = `
        UPDATE groups
        SET name = ?, updated_at = datetime('now')
        WHERE id = ?
      `;
  
      db.run(query, [name, id]);
      
      dbInstance.saveDatabase();
  
      return this.findById(id);
    } catch (error) {
      console.error('Error in GroupRepository.update:', error);
      throw error;
    }
  }

  /**
   * Eliminar un grupo
   */
  delete(id) {
    try {
      const dbInstance = this.getDbInstance();
      const db = dbInstance.getDb();

      // Primero verificar si tiene subgrupos
      const subgroups = this.findSubgroups(id);
      if (subgroups.length > 0) {
        throw new Error('No se puede eliminar un grupo que tiene subgrupos');
      }

      const query = `DELETE FROM groups WHERE id = ?`;
      db.run(query, [id]);
      
      dbInstance.saveDatabase();

      return true;
    } catch (error) {
      console.error('Error in GroupRepository.delete:', error);
      throw error;
    }
  }

  /**
   * Agregar estudiante a un grupo (Nota: No usado directamente en el servicio, pero mantenido)
   */
  addStudent(groupId, studentId) {
    const dbInstance = this.getDbInstance();
    const db = dbInstance.getDb();

    const query = `
      INSERT INTO group_students (group_id, student_id, created_at)
      VALUES (?, ?, datetime('now'))
    `;

    try {
      db.run(query, [groupId, studentId]);
      dbInstance.saveDatabase(); 
      return true;
    } catch (error) {
      if (error.message.includes('UNIQUE constraint')) {
        return false;
      }
      throw error;
    }
  }

  /**
   * Agregar múltiples estudiantes a un grupo
   */
  addStudents(groupId, studentIds) {
    const dbInstance = this.getDbInstance();
    const db = dbInstance.getDb();
    let addedCount = 0;

    // Usar transacción para rendimiento y atomicidad
    db.run('BEGIN TRANSACTION');
    try {
      studentIds.forEach(studentId => {
        const query = `
          INSERT INTO group_students (group_id, student_id, created_at)
          VALUES (?, ?, datetime('now'))
        `;
        db.exec(query, [groupId, studentId]); 
        addedCount++;
      });
      db.run('COMMIT');
      
      dbInstance.saveDatabase();
      
    } catch (error) {
      db.run('ROLLBACK');
      console.error('Error in GroupRepository.addStudents:', error);
      if (!error.message.includes('UNIQUE constraint')) {
        throw error;
      }
    }
    return addedCount;
  }

  /**
   * Remover todos los estudiantes de un grupo
   */
  removeAllStudents(groupId) {
    const dbInstance = this.getDbInstance();
    const db = dbInstance.getDb();

    const query = `DELETE FROM group_students WHERE group_id = ?`;
    db.run(query, [groupId]);
    
    dbInstance.saveDatabase();
    
    return true;
  }

  /**
   * Reemplazar estudiantes de un grupo (útil para editar)
   */
  replaceStudents(groupId, studentIds) {
    this.removeAllStudents(groupId);

    if (studentIds && studentIds.length > 0) {
      return this.addStudents(groupId, studentIds);
    }

    return 0;
  }

  /**
   * Verificar si un estudiante está en un grupo
   */
  hasStudent(groupId, studentId) {
    const db = this.getDbInstance().getDb();

    const query = `
      SELECT COUNT(*) as count
      FROM group_students
      WHERE group_id = ? AND student_id = ?
    `;

    const result = db.exec(query, [groupId, studentId]);
    return result[0].values[0][0] > 0;
  }

  /**
   * Contar estudiantes en un grupo
   */
  countStudents(groupId) {
    const db = this.getDbInstance().getDb();

    const query = `
      SELECT COUNT(*) as count
      FROM group_students
      WHERE group_id = ?
    `;

    const result = db.exec(query, [groupId]);
    return result[0].values[0][0];
  }
  /**
   * Obtener IDs de estudiantes ya asignados a otros subgrupos de un grupo padre
   * @param {number} parentGroupId
   * @param {number} excludeSubgroupId - ID del subgrupo actual (para edición)
   * @returns {number[]} Lista de IDs de estudiantes excluidos
   */
  getStudentsInSubgroups(parentGroupId, excludeSubgroupId = null) {
    const db = this.getDbInstance().getDb();

    let query = `
      SELECT DISTINCT gs.student_id
      FROM group_students gs
      JOIN groups g ON gs.group_id = g.id
      WHERE g.parent_group_id = ?
    `;
    let params = [parentGroupId];

    if (excludeSubgroupId) {
      query += ` AND g.id != ?`;
      params.push(excludeSubgroupId);
    }

    const result = db.exec(query, params);

    if (!result[0] || result[0].values.length === 0) {
      return [];
    }

    // Retorna solo la primera columna (student_id) como un array de números
    return result[0].values.map(row => row[0]);
  }
}

module.exports = new GroupRepository();