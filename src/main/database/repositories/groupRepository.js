const { getDatabase } = require('../index');

class GroupRepository {
  /**
   * Crear un nuevo grupo
   */
  create(groupData) {
    const db = getDatabase();
    const { name, courseId, type, parentGroupId, createdBy } = groupData;

    const query = `
      INSERT INTO groups (name, course_id, type, parent_group_id, created_by, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `;

    db.run(query, [name, courseId || null, type, parentGroupId || null, createdBy]);

    // Obtener el ID del grupo recién creado
    const result = db.exec("SELECT last_insert_rowid() as id");
    return result[0].values[0][0];
  }

  /**
   * Buscar grupo por ID con sus estudiantes
   */
  findById(id) {
    const db = getDatabase();

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

    // Obtener estudiantes del grupo
    group.students = this.getGroupStudents(id);

    return group;
  }

  /**
   * Obtener todos los estudiantes de un grupo
   */
  getGroupStudents(groupId) {
    const db = getDatabase();

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
    return result[0].values.map(row => {
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
    const db = getDatabase();

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
    const db = getDatabase();

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
    const db = getDatabase();

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
    const db = getDatabase();
    const { name } = groupData;

    const query = `
      UPDATE groups
      SET name = ?, updated_at = datetime('now')
      WHERE id = ?
    `;

    db.run(query, [name, id]);
    return this.findById(id);
  }

  /**
   * Eliminar un grupo
   */
  delete(id) {
    const db = getDatabase();

    // Primero verificar si tiene subgrupos
    const subgroups = this.findSubgroups(id);
    if (subgroups.length > 0) {
      throw new Error('No se puede eliminar un grupo que tiene subgrupos');
    }

    const query = `DELETE FROM groups WHERE id = ?`;
    db.run(query, [id]);
    return true;
  }

  /**
   * Agregar estudiante a un grupo
   */
  addStudent(groupId, studentId) {
    const db = getDatabase();

    const query = `
      INSERT INTO group_students (group_id, student_id, created_at)
      VALUES (?, ?, datetime('now'))
    `;

    try {
      db.run(query, [groupId, studentId]);
      return true;
    } catch (error) {
      // Si el estudiante ya está en el grupo, ignorar
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
    const db = getDatabase();
    let addedCount = 0;

    studentIds.forEach(studentId => {
      try {
        const query = `
          INSERT INTO group_students (group_id, student_id, created_at)
          VALUES (?, ?, datetime('now'))
        `;
        db.run(query, [groupId, studentId]);
        addedCount++;
      } catch (error) {
        // Si el estudiante ya está, continuar con el siguiente
        if (!error.message.includes('UNIQUE constraint')) {
          throw error;
        }
      }
    });

    return addedCount;
  }

  /**
   * Remover estudiante de un grupo
   */
  removeStudent(groupId, studentId) {
    const db = getDatabase();

    const query = `
      DELETE FROM group_students
      WHERE group_id = ? AND student_id = ?
    `;

    db.run(query, [groupId, studentId]);
    return true;
  }

  /**
   * Remover todos los estudiantes de un grupo
   */
  removeAllStudents(groupId) {
    const db = getDatabase();

    const query = `DELETE FROM group_students WHERE group_id = ?`;
    db.run(query, [groupId]);
    return true;
  }

  /**
   * Reemplazar estudiantes de un grupo (útil para editar)
   */
  replaceStudents(groupId, studentIds) {
    // Primero remover todos
    this.removeAllStudents(groupId);

    // Luego agregar los nuevos
    if (studentIds && studentIds.length > 0) {
      return this.addStudents(groupId, studentIds);
    }

    return 0;
  }

  /**
   * Verificar si un estudiante está en un grupo
   */
  hasStudent(groupId, studentId) {
    const db = getDatabase();

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
    const db = getDatabase();

    const query = `
      SELECT COUNT(*) as count
      FROM group_students
      WHERE group_id = ?
    `;

    const result = db.exec(query, [groupId]);
    return result[0].values[0][0];
  }
}

module.exports = new GroupRepository();
