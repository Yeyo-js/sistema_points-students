import React, { useState } from 'react';
import Button from '../../atoms/button';
import FormField from '../../molecules/formField'; // Importar FormField
import { groupService } from '../../../services';
import './manualGroupForm.css';

const ManualGroupForm = ({ userId, onSuccess, onCancel }) => {
  const [groupName, setGroupName] = useState('');
  const [courseName, setCourseName] = useState('');
  const [level, setLevel] = useState('');
  const [academicPeriod, setAcademicPeriod] = useState('');
  const [students, setStudents] = useState([
    { fullName: '', studentCode: '', listNumber: 1 }
  ]);
  const [loading, setLoading] = useState(false);
  const [generalError, setGeneralError] = useState('');
  const [errors, setErrors] = useState({});

  const handleAddStudent = () => {
    setStudents([
      ...students,
      { fullName: '', studentCode: '', listNumber: students.length + 1 }
    ]);
  };

  const handleRemoveStudent = (index) => {
    if (students.length === 1) {
      setGeneralError('Debe haber al menos un estudiante.');
      return;
    }
    const newStudents = students.filter((_, i) => i !== index);
    // Renumerar
    newStudents.forEach((student, i) => {
      student.listNumber = i + 1;
    });
    setStudents(newStudents);
    setGeneralError(''); // Limpiar error si se elimina un estudiante
  };

  const handleStudentChange = (index, field, value) => {
    const newStudents = [...students];
    newStudents[index][field] = value;
    setStudents(newStudents);
    // Limpiar errores específicos de estudiantes si se edita
    if (errors[`student-${index}-${field}`]) {
      setErrors(prev => ({ ...prev, [`student-${index}-${field}`]: '' }));
    }
    setGeneralError(''); // Limpiar error general si se edita
  };

  const validateForm = () => {
    const newErrors = {};
    let isValid = true;

    if (!groupName.trim()) {
      newErrors.groupName = 'El nombre del grupo es requerido.';
      isValid = false;
    }

    if (!courseName.trim()) {
      newErrors.courseName = 'El nombre del curso es requerido.';
      isValid = false;
    }

    if (!level.trim()) {
      newErrors.level = 'El nivel es requerido.';
      isValid = false;
    }

    if (!academicPeriod.trim()) {
      newErrors.academicPeriod = 'El período académico es requerido.';
      isValid = false;
    }

    const validStudents = students.filter(s => s.fullName.trim());
    if (validStudents.length === 0) {
      setGeneralError('Debes agregar al menos un estudiante con nombre.');
      isValid = false;
    } else {
      // Validar que no haya estudiantes con nombre vacío si hay más de uno
      students.forEach((student, index) => {
        if (!student.fullName.trim() && students.length > 1) {
          newErrors[`student-${index}-fullName`] = 'El nombre del estudiante no puede estar vacío.';
          isValid = false;
        }
      });
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setGeneralError('');
    setErrors({});

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const result = await groupService.createIndependent(
        {
          groupName,
          courseName,
          level,
          academicPeriod,
          students: students.filter(s => s.fullName.trim()) // Solo enviar estudiantes con nombre
        },
        userId
      );

      if (result.success) {
        // Podríamos añadir un mensaje de éxito temporal aquí si fuera necesario
        onSuccess();
      } else {
        setGeneralError(result.error || 'Error al crear el grupo independiente.');
      }
    } catch (error) {
      console.error('Error al crear grupo:', error);
      setGeneralError('Error de conexión al crear el grupo. Intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="manual-group-form" onSubmit={handleSubmit}>
      {generalError && (
        <div className="manual-group-form__error-banner">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <span>{generalError}</span>
        </div>
      )}

      <div className="manual-group-form__section">
        <h3 className="manual-group-form__section-title">Información del Grupo</h3>

        <FormField
          label="Nombre del Grupo"
          type="text"
          name="groupName"
          value={groupName}
          onChange={(e) => setGroupName(e.target.value)}
          placeholder="Ej: Grupo de Investigación, Equipo A, etc."
          required
          error={errors.groupName}
          disabled={loading}
        />
      </div>

      <div className="manual-group-form__section">
        <h3 className="manual-group-form__section-title">Información del Curso</h3>

        <div className="manual-group-form__row">
          <FormField
            label="Nombre del Curso"
            type="text"
            name="courseName"
            value={courseName}
            onChange={(e) => setCourseName(e.target.value)}
            placeholder="Ej: Matemáticas Avanzadas"
            required
            error={errors.courseName}
            disabled={loading}
          />

          <FormField
            label="Nivel"
            type="text"
            name="level"
            value={level}
            onChange={(e) => setLevel(e.target.value)}
            placeholder="Ej: 5to Secundaria"
            required
            error={errors.level}
            disabled={loading}
          />
        </div>

        <FormField
          label="Período Académico"
          type="text"
          name="academicPeriod"
          value={academicPeriod}
          onChange={(e) => setAcademicPeriod(e.target.value)}
          placeholder="Ej: 2024-1, Primer Semestre 2024"
          required
          error={errors.academicPeriod}
          disabled={loading}
        />
      </div>

      <div className="manual-group-form__section">
        <div className="manual-group-form__section-header">
          <h3 className="manual-group-form__section-title">
            Estudiantes ({students.filter(s => s.fullName.trim()).length})
          </h3>
          <Button
            type="button"
            variant="secondary"
            size="small"
            onClick={handleAddStudent}
            disabled={loading}
          >
            ➕ Agregar Estudiante
          </Button>
        </div>

        <div className="manual-group-form__students">
          {students.map((student, index) => (
            <div key={index} className="manual-group-form__student">
              <div className="manual-group-form__student-number">
                #{student.listNumber}
              </div>

              <div className="manual-group-form__student-fields">
                <FormField
                  type="text"
                  placeholder="Nombre completo *"
                  value={student.fullName}
                  onChange={(e) => handleStudentChange(index, 'fullName', e.target.value)}
                  required
                  error={errors[`student-${index}-fullName`]}
                  disabled={loading}
                />
                <FormField
                  type="text"
                  placeholder="Código (opcional)"
                  value={student.studentCode}
                  onChange={(e) => handleStudentChange(index, 'studentCode', e.target.value)}
                  disabled={loading}
                />
              </div>

              {students.length > 1 && (
                <button
                  type="button"
                  className="manual-group-form__remove-btn"
                  onClick={() => handleRemoveStudent(index)}
                  title="Eliminar estudiante"
                  disabled={loading}
                >
                  🗑️
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="manual-group-form__actions">
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
          disabled={loading}
        >
          Crear Grupo Independiente
        </Button>
      </div>
    </form>
  );
};

export default ManualGroupForm;
