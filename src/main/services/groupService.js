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
      // Verificar que el curso existe y pertenece al usuario
      const course = courseRepository.findById(courseId);
      if (!course) {
        return { success: false, error: 'Curso no encontrado' };
      }

      if (course.user_id !== userId) {
        return { success: false, error: 'No tienes permiso para este curso' };
      }

      // Verificar si ya existe un grupo general para este curso
      const existingGroups = groupRepository.findByCourse(courseId);
      const generalGroup = existingGroups.find(g => g.type === 'general');

      if (generalGroup) {
        return {
          success: false,
          error: 'Ya existe un grupo general para este curso',
          existingGroup: generalGroup
        };
      }

      // Obtener todos los estudiantes del curso
      const students = studentRepository.findByCourse(courseId);

      if (students.length === 0) {
        return { success: false, error: 'El curso no tiene estudiantes' };
      }

      // Crear el grupo general
      const groupId = groupRepository.create({
        name: `${course.name} - Grupo General`,
        courseId: courseId,
        type: 'general',
        parentGroupId: null,
        createdBy: userId
      });

      // Agregar todos los estudiantes al grupo
      const studentIds = students.map(s => s.id);
      const addedCount = groupRepository.addStudents(groupId, studentIds);

      // Obtener el grupo completo con estudiantes
      const group = groupRepository.findById(groupId);

      return {
        success: true,
        group: group,
        studentsAdded: addedCount
      };
    } catch (error) {
      console.error('Error en createGeneralGroupFromCourse:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Crear un subgrupo dentro de un grupo general
   */
  async createSubgroup(parentGroupId, name, studentIds, userId) {
    try {
      // Verificar que el grupo padre existe
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
        for (const studentId of studentIds) {
          if (!groupRepository.hasStudent(parentGroupId, studentId)) {
            return {
              success: false,
              error: `El estudiante ${studentId} no pertenece al grupo general`
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

  /**
   * Crear un grupo independiente (sin curso previo)
   * Crea el curso y los estudiantes al mismo tiempo
   */
  async createIndependentGroup(groupData, userId) {
    try {
      const { groupName, courseName, level, academicPeriod, students } = groupData;

      // Validaciones
      if (!groupName || !courseName || !level || !academicPeriod) {
        return { success: false, error: 'Faltan datos requeridos' };
      }

      if (!students || students.length === 0) {
        return { success: false, error: 'Debes agregar al menos un estudiante' };
      }

      // Crear el curso
      const courseId = courseRepository.create({
        userId: userId,
        name: courseName,
        level: level,
        academicPeriod: academicPeriod
      });

      // Crear los estudiantes
      const createdStudents = [];
      for (let i = 0; i < students.length; i++) {
        const student = students[i];
        const studentId = studentRepository.create({
          courseId: courseId,
          fullName: student.fullName,
          studentCode: student.studentCode || null,
          listNumber: student.listNumber || (i + 1)
        });
        createdStudents.push(studentId);
      }

      // Crear el grupo independiente
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
      const groups = groupRepository.findByUser(userId);

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
      const course = courseRepository.findById(courseId);
      if (!course) {
        return { success: false, error: 'Curso no encontrado' };
      }

      if (course.user_id !== userId) {
        return { success: false, error: 'No tienes permiso para este curso' };
      }

      const groups = groupRepository.findByCourse(courseId);

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
      const group = groupRepository.findById(groupId);
      if (!group) {
        return { success: false, error: 'Grupo no encontrado' };
      }

      // Verificar permisos
      if (group.created_by !== userId) {
        return { success: false, error: 'No tienes permiso para editar este grupo' };
      }

      // Actualizar nombre si se proporcionó
      if (name && name !== group.name) {
        groupRepository.update(groupId, { name });
      }

      // Actualizar estudiantes si se proporcionaron
      if (studentIds !== undefined) {
        // Si es un subgrupo, validar que los estudiantes pertenecen al grupo padre
        if (group.parent_group_id) {
          const parentGroup = groupRepository.findById(group.parent_group_id);
          for (const studentId of studentIds) {
            if (!groupRepository.hasStudent(parentGroup.id, studentId)) {
              return {
                success: false,
                error: `El estudiante ${studentId} no pertenece al grupo general`
              };
            }
          }
        }

        groupRepository.replaceStudents(groupId, studentIds);
      }

      // Obtener el grupo actualizado
      const updatedGroup = groupRepository.findById(groupId);

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
      const group = groupRepository.findById(groupId);
      if (!group) {
        return { success: false, error: 'Grupo no encontrado' };
      }

      // Verificar permisos
      if (group.created_by !== userId) {
        return { success: false, error: 'No tienes permiso para eliminar este grupo' };
      }

      // Eliminar el grupo (el repository verifica subgrupos)
      groupRepository.delete(groupId);

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

      for (const student of students) {
        try {
          pointRepository.create({
            studentId: student.id,
            userId: userId,
            participationTypeId: participationTypeId,
            pointsValue: pointsValue,
            reason: reason || `Calificación grupal: ${group.name}`
          });
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
}

module.exports = new GroupService();
