const groupRepository = require('../database/repositories/groupRepository');
const studentRepository = require('../database/repositories/studentRepository');
const courseRepository = require('../database/repositories/courseRepository');

class GroupService {
  /**
   * Crear un grupo general desde un curso
   * (importa todos los estudiantes del curso)
   */
  async createGeneralGroupFromCourse(courseId, userId) {
    try {
      // 1. Verificar que el curso existe y pertenece al usuario
      const course = courseRepository.findById(courseId);
      if (!course) {
        return { success: false, error: 'Curso no encontrado' };
      }

      if (course.user_id !== userId) {
        return { success: false, error: 'No tienes permiso para este curso' };
      }

      // 2. Verificar si ya existe un grupo general para este curso
      const existingGroups = groupRepository.findByCourse(courseId);
      const generalGroup = existingGroups.find(g => g.type === 'general');

      if (generalGroup) {
        return {
          success: false,
          error: 'Ya existe un grupo general para este curso',
          existingGroup: generalGroup
        };
      }

      // 3. Obtener todos los estudiantes del curso
      const students = studentRepository.findByCourse(courseId);

      if (students.length === 0) {
        return { success: false, error: 'El curso no tiene estudiantes' };
      }

      // 4. Crear el grupo general
      const groupId = groupRepository.create({
        name: `${course.name} - Grupo General`,
        courseId: courseId,
        type: 'general',
        parentGroupId: null,
        createdBy: userId
      });

      // 5. Agregar todos los estudiantes al grupo
      // CORRECCIÓN: Filtrar estudiantes nulos o sin ID antes de mapear para evitar errores
      const studentIds = students
        .filter(s => s && s.id) 
        .map(s => s.id);

      if (studentIds.length === 0) {
          // Esto solo debería pasar si la base de datos devuelve estudiantes sin ID, 
          // pero es una capa de seguridad extra.
          groupRepository.delete(groupId); // Limpiamos el grupo vacío
          return { success: false, error: 'Se encontraron estudiantes, pero sus IDs no son válidos. Intenta actualizar los estudiantes del curso.' };
      }

      const addedCount = groupRepository.addStudents(groupId, studentIds);

      // Si no se añadió a nadie, es un error de base de datos
      if (addedCount === 0) {
        groupRepository.delete(groupId); 
        return { success: false, error: 'Error interno de la base de datos al añadir estudiantes al grupo.' };
      }

      // Obtener el grupo completo con estudiantes
      const group = groupRepository.findById(groupId);

      return {
        success: true,
        group: group,
        studentsAdded: addedCount
      };
    } catch (error) {
      console.error('Error en createGeneralGroupFromCourse:', error);
      return { success: false, error: error.message || 'Error al crear grupo general' };
    }
  }

  /**
   * Crear un subgrupo dentro de un grupo general
   */
  async createSubgroup(parentGroupId, name, studentIds, userId) {
    try {
      // Verificar que el grupo padre existe
      const parentGroup = await groupRepository.findById(parentGroupId);
      if (!parentGroup) {
        return { success: false, error: 'Grupo padre no encontrado' };
      }

      // Verificar permisos
      if (parentGroup.created_by !== userId) {
        return { success: false, error: 'No tienes permiso para crear subgrupos aquí' };
      }

      // Verificar que el grupo padre es tipo 'general'
      if (parentGroup.type !== 'general') {
        return { success: false, error: 'Solo puedes crear subgrupos dentro de grupos generales' };
      }

      // Validar que los estudiantes pertenecen al grupo padre
      if (studentIds && studentIds.length > 0) {
        for (const studentId of studentIds) {
          const hasStudent = await groupRepository.hasStudent(parentGroupId, studentId);
          if (!hasStudent) {
            return {
              success: false,
              error: `El estudiante ${studentId} no pertenece al grupo general`
            };
          }
        }
      }

      // Crear el subgrupo
      const groupId = await groupRepository.create({
        name: name,
        courseId: parentGroup.course_id,
        type: 'subgroup',
        parentGroupId: parentGroupId,
        createdBy: userId
      });

      // Agregar estudiantes al subgrupo
      let addedCount = 0;
      if (studentIds && studentIds.length > 0) {
        addedCount = await groupRepository.addStudents(groupId, studentIds);
      }

      // Obtener el subgrupo completo
      const subgroup = await groupRepository.findById(groupId);

      return {
        success: true,
        group: subgroup,
        studentsAdded: addedCount
      };
    } catch (error) {
      console.error('Error en createSubgroup:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Crear un grupo independiente (sin curso previo)
   * Crea el curso y los estudiantes al mismo tiempo
   */
  async createIndependentGroup(groupData, userId) {
    try {
      const { groupName, courseName, level, academicPeriod, students } = groupData;

      // Validaciones (se mantienen)
      if (!groupName || !courseName || !level || !academicPeriod) {
        return { success: false, error: 'Faltan datos requeridos' };
      }

      if (!students || students.length === 0) {
        return { success: false, error: 'Debes agregar al menos un estudiante' };
      }

      // CORRECCIÓN 1: Crear el curso (Usar .insert y argumentos posicionales)
      const courseResult = courseRepository.insert(
        userId,
        courseName,
        level,
        academicPeriod
      );
      // CORRECCIÓN 2: Obtener el ID correctamente del objeto devuelto
      const courseId = courseResult.lastInsertRowid;

      // Crear los estudiantes
      const createdStudents = [];
      for (let i = 0; i < students.length; i++) {
        const student = students[i];
        
        // CORRECCIÓN 3: Crear el estudiante (Usar .insert y argumentos posicionales)
        const studentResult = studentRepository.insert(
          courseId,
          student.fullName,
          student.studentCode || null,
          student.listNumber || (i + 1)
        );
        // CORRECCIÓN 4: Obtener el ID del estudiante
        const studentId = studentResult.lastInsertRowid;
        
        createdStudents.push(studentId);
      }

      // Crear el grupo independiente (se mantiene la lógica)
      const groupId = groupRepository.create({
        name: groupName,
        courseId: courseId,
        type: 'independent',
        parentGroupId: null,
        createdBy: userId
      });

      // Agregar estudiantes al grupo
      const addedCount = groupRepository.addStudents(groupId, createdStudents);

      // Obtener el grupo completo
      const group = groupRepository.findById(groupId);

      return {
        success: true,
        group: group,
        course: courseRepository.findById(courseId),
        studentsCreated: createdStudents.length,
        studentsAdded: addedCount
      };
    } catch (error) {
      console.error('Error en createIndependentGroup:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Obtener todos los grupos de un usuario
   */
  async getUserGroups(userId) {
    try {
      const groups = await groupRepository.findByUser(userId);

      return {
        success: true,
        groups: groups
      };
    } catch (error) {
      console.error('Error en getUserGroups:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Obtener grupos de un curso
   */
  async getCourseGroups(courseId, userId) {
    try {
      // Verificar permisos
      const course = await courseRepository.findById(courseId);
      if (!course) {
        return { success: false, error: 'Curso no encontrado' };
      }

      if (course.user_id !== userId) {
        return { success: false, error: 'No tienes permiso para este curso' };
      }

      const groups = await groupRepository.findByCourse(courseId);

      return {
        success: true,
        groups: groups
      };
    } catch (error) {
      console.error('Error en getCourseGroups:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Obtener detalles de un grupo
   */
  async createSubgroup(parentGroupId, name, studentIds, userId) {
    try {
      // Verificar que el grupo padre existe
      // findById() adjunta los estudiantes
      const parentGroup = groupRepository.findById(parentGroupId); 
      if (!parentGroup) {
        return { success: false, error: 'Grupo padre no encontrado' };
      }

      // Verificar permisos
      if (parentGroup.created_by !== userId) {
        return { success: false, error: 'No tienes permiso para crear subgrupos aquí' };
      }

      // Verificar que el grupo padre es tipo 'general'
      if (parentGroup.type !== 'general') {
        return { success: false, error: 'Solo puedes crear subgrupos dentro de grupos generales' };
      }
      
      // Validar que los estudiantes pertenecen al grupo padre
      if (studentIds && studentIds.length > 0) {
        // Obtenemos los IDs de los estudiantes del grupo padre de la lista adjunta (parentGroup.students)
        
        // Verificación de robustez para evitar fallos si el array está vacío o mal formado.
        const parentStudentIds = (parentGroup.students || []).map(s => s.id);

        for (const studentId of studentIds) {
          if (!parentStudentIds.includes(studentId)) {
            return {
              success: false,
              error: `El estudiante con ID ${studentId} no pertenece al grupo padre o al curso general`
            };
          }
        }
      }

      // Crear el subgrupo
      const groupId = groupRepository.create({
        name: name,
        courseId: parentGroup.course_id,
        type: 'subgroup',
        parentGroupId: parentGroupId,
        createdBy: userId
      });

      // Agregar estudiantes al subgrupo
      let addedCount = 0;
      if (studentIds && studentIds.length > 0) {
        addedCount = groupRepository.addStudents(groupId, studentIds);
      }

      // Obtener el subgrupo completo
      const subgroup = groupRepository.findById(groupId);

      return {
        success: true,
        group: subgroup,
        studentsAdded: addedCount
      };
    } catch (error) {
      console.error('Error en createSubgroup:', error);
      return { success: false, error: error.message };
    }
  }

  // ---

  /**
   * Obtener detalles de un grupo
   */
  async getGroupDetails(groupId, userId) {
    try {
      const group = groupRepository.findById(groupId);

      if (!group) {
        return { success: false, error: 'Grupo no encontrado' };
      }

      // Verificar permisos
      if (group.created_by !== userId) {
        return { success: false, error: 'No tienes permiso para ver este grupo' };
      }
      
      // VERIFICACIÓN DEFENSIVA CRÍTICA: Si group.students no se adjuntó o es null, adjuntarlo.
      if (!group.students) {
          group.students = groupRepository.getGroupStudents(groupId);
      }

      // Si es un grupo general o subgrupo, obtener subgrupos
      let subgroups = [];
      if (group.type === 'general') {
        subgroups = groupRepository.findSubgroups(groupId);
      }

      return {
        success: true,
        group: group,
        subgroups: subgroups
      };
    } catch (error) {
      console.error('Error en getGroupDetails:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Actualizar un grupo (nombre y estudiantes)
   */
  async updateGroup(groupId, updateData, userId) {
    try {
      const { name, studentIds } = updateData;

      // Verificar que el grupo existe
      const group = await groupRepository.findById(groupId);
      if (!group) {
        return { success: false, error: 'Grupo no encontrado' };
      }

      // Verificar permisos
      if (group.created_by !== userId) {
        return { success: false, error: 'No tienes permiso para editar este grupo' };
      }

      // Actualizar nombre si se proporcionó
      if (name && name !== group.name) {
        await groupRepository.update(groupId, { name });
      }

      // Actualizar estudiantes si se proporcionaron
      if (studentIds !== undefined) {
        // Si es un subgrupo, validar que los estudiantes pertenecen al grupo padre
        if (group.parent_group_id) {
          const parentGroup = await groupRepository.findById(group.parent_group_id);
          for (const studentId of studentIds) {
            const hasStudent = await groupRepository.hasStudent(parentGroup.id, studentId);
            if (!hasStudent) {
              return {
                success: false,
                error: `El estudiante ${studentId} no pertenece al grupo general`
              };
            }
          }
        }

        await groupRepository.replaceStudents(groupId, studentIds);
      }

      // Obtener el grupo actualizado
      const updatedGroup = await groupRepository.findById(groupId);

      return {
        success: true,
        group: updatedGroup
      };
    } catch (error) {
      console.error('Error en updateGroup:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Eliminar un grupo
   */
  async deleteGroup(groupId, userId) {
    try {
      // Verificar que el grupo existe
      const group = await groupRepository.findById(groupId);
      if (!group) {
        return { success: false, error: 'Grupo no encontrado' };
      }

      // Verificar permisos
      if (group.created_by !== userId) {
        return { success: false, error: 'No tienes permiso para eliminar este grupo' };
      }

      // Eliminar el grupo (el repository verifica subgrupos)
      await groupRepository.delete(groupId);

      return {
        success: true,
        message: 'Grupo eliminado correctamente'
      };
    } catch (error) {
      console.error('Error en deleteGroup:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Asignar puntos a todos los miembros de un grupo
   */
  async assignPointsToGroup(groupId, pointData, userId) {
    try {
      const { participationTypeId, pointsValue, reason } = pointData;

      // Verificar que el grupo existe
      const group = groupRepository.findById(groupId);
      if (!group) {
        return { success: false, error: 'Grupo no encontrado' };
      }

      // Verificar permisos
      if (group.created_by !== userId) {
        return { success: false, error: 'No tienes permiso para calificar este grupo' };
      }

      // Obtener estudiantes del grupo
      const students = group.students;

      if (!students || students.length === 0) {
        return { success: false, error: 'El grupo no tiene estudiantes' };
      }

      // Importar pointRepository aquí para evitar dependencias circulares
      const pointRepository = require('../database/repositories/pointRepository');

      // Asignar puntos a cada estudiante
      let successCount = 0;
      let failCount = 0;
      
      const defaultReason = reason || `Calificación grupal: ${group.name}`; // Razón por defecto si no se proporciona

      for (const student of students) {
        try {
          // CORRECCIÓN: Llamar al método .insert (no .create) y pasar los argumentos posicionalmente
          pointRepository.insert(
            student.id, // studentId (1er argumento)
            userId, // userId (2do argumento)
            participationTypeId, // participationTypeId (3er argumento)
            pointsValue, // pointsValue (4to argumento)
            defaultReason // reason (5to argumento)
          ); 
          
          // Además, forzar la actualización de totales para cada estudiante inmediatamente
          pointRepository.updateStudentTotals(student.id);

          successCount++;
        } catch (error) {
          console.error(`Error asignando puntos a estudiante ${student.id}:`, error);
          failCount++;
        }
      }

      return {
        success: true,
        successCount: successCount,
        failCount: failCount,
        totalStudents: students.length
      };
    } catch (error) {
      console.error('Error en assignPointsToGroup:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Cargar datos específicos para el formulario de subgrupo.
   * @param {number} parentGroupId
   * @param {number|null} subgroupId - ID del subgrupo a editar (o null si es creación)
   * @param {number} userId
   */
  async loadSubgroupFormData(parentGroupId, subgroupId = null, userId) {
    try {
      // 1. Obtener detalles completos del grupo padre
      const parentGroup = groupRepository.findById(parentGroupId);
      if (!parentGroup) {
        return { success: false, error: 'Grupo padre no encontrado' };
      }
      if (parentGroup.created_by !== userId) {
        return { success: false, error: 'No tienes permiso para acceder a este grupo' };
      }

      // Asegurar que los estudiantes del grupo padre estén adjuntos
      if (!parentGroup.students) {
          parentGroup.students = groupRepository.getGroupStudents(parentGroupId);
      }
      
      // 2. Obtener IDs de estudiantes ya asignados a OTROS subgrupos (excluye el subgrupo actual)
      const excludedIds = groupRepository.getStudentsInSubgroups(
          parentGroupId, 
          subgroupId
      );

      // 3. Si estamos editando, obtener los estudiantes actuales del subgrupo
      let currentSubgroupStudents = [];
      if (subgroupId) {
          const subgroupDetails = groupRepository.findById(subgroupId);
          if (subgroupDetails && subgroupDetails.students) {
              currentSubgroupStudents = subgroupDetails.students.map(s => s.id);
          }
      }

      return {
        success: true,
        parentGroup: parentGroup, // Contiene parentGroup.students
        excludedStudentIds: excludedIds,
        currentSubgroupStudents: currentSubgroupStudents
      };

    } catch (error) {
      console.error('Error en loadSubgroupFormData:', error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = new GroupService();
