import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import Button from '../../atoms/button';
import FormField from '../../molecules/formField';
import { studentService } from '../../../services';
import './studentForm.css';

const StudentForm = ({ student = null, courseId, onSuccess, onCancel }) => {
  const isEditMode = !!student;

  const [formData, setFormData] = useState({
    fullName: '',
    studentCode: '',
    listNumber: ''
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [generalError, setGeneralError] = useState('');

  useEffect(() => {
    if (student) {
      setFormData({
        fullName: student.full_name || '',
        studentCode: student.student_code || '',
        listNumber: student.list_number || ''
      });
    }
  }, [student]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }

    if (generalError) {
      setGeneralError('');
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'El nombre completo es requerido';
    } else if (formData.fullName.length < 3) {
      newErrors.fullName = 'El nombre debe tener al menos 3 caracteres';
    }

    if (!formData.listNumber) {
      newErrors.listNumber = 'El número de lista es requerido';
    } else if (formData.listNumber < 1) {
      newErrors.listNumber = 'El número de lista debe ser mayor a 0';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setGeneralError('');

    try {
      let result;

      if (isEditMode) {
        result = await studentService.updateStudent(
          student.id,
          formData.fullName,
          formData.studentCode || null,
          parseInt(formData.listNumber)
        );
      } else {
        result = await studentService.createStudent(
          courseId,
          formData.fullName,
          formData.studentCode || null,
          parseInt(formData.listNumber)
        );
      }

      if (result.success) {
        console.log(`✅ Estudiante ${isEditMode ? 'actualizado' : 'creado'} exitosamente`);
        if (onSuccess) {
          onSuccess(result);
        }
      } else {
        setGeneralError(result.error || `Error al ${isEditMode ? 'actualizar' : 'crear'} estudiante`);
      }
    } catch (error) {
      console.error('Error en formulario de estudiante:', error);
      setGeneralError('Error de conexión. Intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="student-form">
      {generalError && (
        <div className="student-form__error-banner">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <span>{generalError}</span>
        </div>
      )}

      <FormField
        label="Nombre Completo"
        type="text"
        name="fullName"
        value={formData.fullName}
        onChange={handleChange}
        placeholder="Ej: Juan Pérez García"
        error={errors.fullName}
        required
        disabled={loading}
        icon={
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
            <circle cx="12" cy="7" r="4"/>
          </svg>
        }
      />

      <FormField
        label="Código de Estudiante"
        type="text"
        name="studentCode"
        value={formData.studentCode}
        onChange={handleChange}
        placeholder="Ej: 2024001 (Opcional)"
        error={errors.studentCode}
        disabled={loading}
        maxLength={14}
        icon={
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
        }
      />

      <FormField
        label="Número de Lista"
        type="number"
        name="listNumber"
        value={formData.listNumber}
        onChange={handleChange}
        placeholder="Ej: 15"
        error={errors.listNumber}
        required
        disabled={loading}
        min="1"
        max="999"
        icon={
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="8" y1="6" x2="21" y2="6"/>
            <line x1="8" y1="12" x2="21" y2="12"/>
            <line x1="8" y1="18" x2="21" y2="18"/>
            <line x1="3" y1="6" x2="3.01" y2="6"/>
            <line x1="3" y1="12" x2="3.01" y2="12"/>
            <line x1="3" y1="18" x2="3.01" y2="18"/>
          </svg>
        }
      />

      <div className="student-form__actions">
        {onCancel && (
          <Button
            type="button"
            variant="secondary"
            size="large"
            onClick={onCancel}
            disabled={loading}
          >
            Cancelar
          </Button>
        )}
        <Button
          type="submit"
          variant="primary"
          size="large"
          loading={loading}
          disabled={loading}
        >
          {loading 
            ? (isEditMode ? 'Actualizando...' : 'Creando...') 
            : (isEditMode ? 'Actualizar Estudiante' : 'Crear Estudiante')
          }
        </Button>
      </div>
    </form>
  );
};

StudentForm.propTypes = {
  student: PropTypes.object,
  courseId: PropTypes.number.isRequired,
  onSuccess: PropTypes.func,
  onCancel: PropTypes.func
};

export default StudentForm;