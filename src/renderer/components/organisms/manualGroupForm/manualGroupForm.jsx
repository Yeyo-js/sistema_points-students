import React, { useState } from 'react';
import Button from '../../atoms/button';
import Input from '../../atoms/input';
import Label from '../../atoms/label';
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

  const handleAddStudent = () => {
    setStudents([
      ...students,
      { fullName: '', studentCode: '', listNumber: students.length + 1 }
    ]);
  };

  const handleRemoveStudent = (index) => {
    if (students.length === 1) {
      alert('Debe haber al menos un estudiante');
      return;
    }
    const newStudents = students.filter((_, i) => i !== index);
    // Renumerar
    newStudents.forEach((student, i) => {
      student.listNumber = i + 1;
    });
    setStudents(newStudents);
  };

  const handleStudentChange = (index, field, value) => {
    const newStudents = [...students];
    newStudents[index][field] = value;
    setStudents(newStudents);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validaciones
    if (!groupName.trim()) {
      alert('El nombre del grupo es requerido');
      return;
    }

    if (!courseName.trim()) {
      alert('El nombre del curso es requerido');
      return;
    }

    if (!level.trim()) {
      alert('El nivel es requerido');
      return;
    }

    if (!academicPeriod.trim()) {
      alert('El período académico es requerido');
      return;
    }

    // Validar estudiantes
    const validStudents = students.filter(s => s.fullName.trim());
    if (validStudents.length === 0) {
      alert('Debes agregar al menos un estudiante con nombre');
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
          students: validStudents
        },
        userId
      );

      if (result.success) {
        alert(`Grupo creado exitosamente!\n\n${result.studentsCreated} estudiantes creados\nCurso: ${result.course.name}`);
        onSuccess();
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (error) {
      console.error('Error al crear grupo:', error);
      alert('Error al crear grupo independiente');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="manual-group-form" onSubmit={handleSubmit}>
      <div className="manual-group-form__section">
        <h3 className="manual-group-form__section-title">Información del Grupo</h3>

        <div className="manual-group-form__field">
          <Label htmlFor="groupName">Nombre del Grupo *</Label>
          <Input
            type="text"
            name="groupName"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            placeholder="Ej: Grupo de Investigación, Equipo A, etc."
            required
          />
        </div>
      </div>

      <div className="manual-group-form__section">
        <h3 className="manual-group-form__section-title">Información del Curso</h3>

        <div className="manual-group-form__row">
          <div className="manual-group-form__field">
            <Label htmlFor="courseName">Nombre del Curso *</Label>
            <Input
              type="text"
              name="courseName"
              value={courseName}
              onChange={(e) => setCourseName(e.target.value)}
              placeholder="Ej: Matemáticas Avanzadas"
              required
            />
          </div>

          <div className="manual-group-form__field">
            <Label htmlFor="level">Nivel *</Label>
            <Input
              type="text"
              name="level"
              value={level}
              onChange={(e) => setLevel(e.target.value)}
              placeholder="Ej: 5to Secundaria"
              required
            />
          </div>
        </div>

        <div className="manual-group-form__field">
          <Label htmlFor="academicPeriod">Período Académico *</Label>
          <Input
            type="text"
            name="academicPeriod"
            value={academicPeriod}
            onChange={(e) => setAcademicPeriod(e.target.value)}
            placeholder="Ej: 2024-1, Primer Semestre 2024"
            required
          />
        </div>
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
                <Input
                  type="text"
                  placeholder="Nombre completo *"
                  value={student.fullName}
                  onChange={(e) => handleStudentChange(index, 'fullName', e.target.value)}
                  required
                />
                <Input
                  type="text"
                  placeholder="Código (opcional)"
                  value={student.studentCode}
                  onChange={(e) => handleStudentChange(index, 'studentCode', e.target.value)}
                />
              </div>

              {students.length > 1 && (
                <button
                  type="button"
                  className="manual-group-form__remove-btn"
                  onClick={() => handleRemoveStudent(index)}
                  title="Eliminar estudiante"
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
        >
          Crear Grupo Independiente
        </Button>
      </div>
    </form>
  );
};

export default ManualGroupForm;
