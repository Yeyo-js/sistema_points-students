import React, { useState, useEffect } from 'react';
import Button from '../../atoms/button';
import Input from '../../atoms/input';
import Label from '../../atoms/label';
import { groupService } from '../../../services';
import './subgroupForm.css';

const SubgroupForm = ({ parentGroup, subgroup, userId, onSuccess, onCancel }) => {
  const isEditMode = !!subgroup;
  const [name, setName] = useState('');
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [parentGroupData, setParentGroupData] = useState(null);
  const [excludedStudents, setExcludedStudents] = useState([]); // IDs de estudiantes en OTROS subgrupos

  useEffect(() => {
    loadSubgroupFormData(); // Función unificada de carga
  }, [parentGroup, subgroup]);

  const loadSubgroupFormData = async () => {
    if (!parentGroup) return;
    setLoading(true);

    try {
      // Usar el nuevo servicio especializado
      const result = await groupService.loadSubgroupForm(
        parentGroup.id,
        subgroup ? subgroup.id : null, 
        userId
      );
      
      if (result.success) {
        setParentGroupData(result.parentGroup);
        setExcludedStudents(result.excludedStudentIds); 
        
        if (subgroup) {
          setName(subgroup.name || '');
          // Usar los estudiantes que ya están en este subgrupo
          setSelectedStudents(result.currentSubgroupStudents);
        }
      }
    } catch (error) {
      console.error('Error al cargar datos del formulario de subgrupo:', error);
    } finally {
      setLoading(false);
    }
  };


  const handleStudentToggle = (studentId) => {
    // En modo creación, no se puede seleccionar si ya está en otro subgrupo
    const isExcluded = !isEditMode && excludedStudents.includes(studentId);
    if (isExcluded) {
        return; 
    }
    
    setSelectedStudents(prev => {
      if (prev.includes(studentId)) {
        return prev.filter(id => id !== studentId);
      } else {
        return [...prev, studentId];
      }
    });
  };

  const handleSelectAll = () => {
    if (!parentGroupData) return;
    
    // Solo seleccionar estudiantes que NO están excluidos (en modo creación)
    const availableStudents = parentGroupData.students.filter(s => 
        isEditMode || !excludedStudents.includes(s.id)
    );
    const allIds = availableStudents.map(s => s.id);
    setSelectedStudents(allIds);
  };

  const handleDeselectAll = () => {
    setSelectedStudents([]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!name.trim()) {
      alert('El nombre del subgrupo es requerido');
      return;
    }

    if (selectedStudents.length === 0) {
      alert('Debes seleccionar al menos un estudiante');
      return;
    }

    setLoading(true);
    try {
      let result;

      if (subgroup) {
        // Editar subgrupo existente
        result = await groupService.update(
          subgroup.id,
          { name, studentIds: selectedStudents },
          userId
        );
      } else {
        // Crear nuevo subgrupo
        result = await groupService.createSubgroup(
          parentGroup.id,
          name,
          selectedStudents,
          userId
        );
      }

      if (result.success) {
        onSuccess();
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (error) {
      console.error('Error al guardar subgrupo:', error);
      alert('Error al guardar subgrupo');
    } finally {
      setLoading(false);
    }
  };

  if (!parentGroupData) {
    return (
      <div className="subgroup-form__loading">
        <div className="subgroup-form__spinner"></div>
        <p>Cargando...</p>
      </div>
    );
  }

  return (
    <form className="subgroup-form" onSubmit={handleSubmit}>
      <div className="subgroup-form__info">
        <p className="subgroup-form__parent-name">
          Grupo padre: <strong>{parentGroup.name}</strong>
        </p>
        <p className="subgroup-form__parent-students">
          {parentGroupData.students?.length || 0} estudiantes disponibles
        </p>
        
        {/* Advertencia de exclusión */}
        {!isEditMode && excludedStudents.length > 0 && (
            <p className="subgroup-form__parent-students" style={{ color: 'var(--color-danger)', fontWeight: 'bold' }}>
                ⚠️ {excludedStudents.length} estudiante(s) ya están en otro subgrupo y no son seleccionables.
            </p>
        )}
      </div>

      <div className="subgroup-form__field">
        <Label htmlFor="name">Nombre del Subgrupo *</Label>
        <Input
          type="text"
          name="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ej: Grupo A, Equipo 1, etc."
          required
        />
      </div>

      <div className="subgroup-form__students">
        <div className="subgroup-form__students-header">
          <Label>Seleccionar Estudiantes ({selectedStudents.length} seleccionados)</Label>
          <div className="subgroup-form__students-actions">
            <button
              type="button"
              className="subgroup-form__btn-link"
              onClick={handleSelectAll}
            >
              Seleccionar todos
            </button>
            <button
              type="button"
              className="subgroup-form__btn-link"
              onClick={handleDeselectAll}
            >
              Deseleccionar todos
            </button>
          </div>
        </div>

        <div className="subgroup-form__students-list">
          {parentGroupData.students && parentGroupData.students.length > 0 ? (
            parentGroupData.students.map(student => {
                const isExcluded = !isEditMode && excludedStudents.includes(student.id);
                
                return (
                    <label 
                        key={student.id} 
                        className={`subgroup-form__student-item ${isExcluded ? 'subgroup-form__student-item--excluded' : ''}`}
                        style={{ opacity: isExcluded ? 0.5 : 1, cursor: isExcluded ? 'not-allowed' : 'pointer' }}
                    >
                        <input
                            type="checkbox"
                            checked={selectedStudents.includes(student.id)}
                            onChange={() => handleStudentToggle(student.id)}
                            className="subgroup-form__checkbox"
                            disabled={isExcluded} // Deshabilitar si está excluido
                        />
                        <div className="subgroup-form__student-info">
                            <span className="subgroup-form__student-number">
                                N° {student.list_number}
                            </span>
                            <span className="subgroup-form__student-name">
                                {student.full_name} {isExcluded ? '(Ya en otro subgrupo)' : ''}
                            </span>
                            {student.student_code && (
                                <span className="subgroup-form__student-code">
                                    {student.student_code}
                                </span>
                            )}
                        </div>
                    </label>
                );
            })
          ) : (
            <p className="subgroup-form__empty">No hay estudiantes en el grupo padre</p>
          )}
        </div>
      </div>

      <div className="subgroup-form__actions">
        <Button
          type="button"
          variant="secondary"
          size="medium"
          onClick={onCancel}
          disabled={loading}
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          variant="primary"
          size="medium"
          loading={loading}
        >
          {subgroup ? 'Actualizar Subgrupo' : 'Crear Subgrupo'}
        </Button>
      </div>
    </form>
  );
};

export default SubgroupForm;