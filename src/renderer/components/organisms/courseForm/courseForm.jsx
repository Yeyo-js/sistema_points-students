import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import Button from '../../atoms/button';
import FormField from '../../molecules/formField';
import Select from '../../atoms/select';
import Label from '../../atoms/label';
import { courseService } from '../../../services';
import { useAuth } from '../../../context/authContext';
import './courseForm.css';

const CourseForm = ({ course = null, onSuccess, onCancel }) => {
  const { user } = useAuth();
  const isEditMode = !!course;

  const [formData, setFormData] = useState({
    name: '',
    level: '',
    academicPeriod: ''
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [generalError, setGeneralError] = useState('');

  // Opciones para los selects
  const levelOptions = [
    { value: '1° Grado', label: '1° Grado' },
    { value: '2° Grado', label: '2° Grado' },
    { value: '3° Grado', label: '3° Grado' },
    { value: '4° Grado', label: '4° Grado' },
    { value: '5° Grado', label: '5° Grado' },
    { value: '6° Grado', label: '6° Grado' },
    { value: '1° Secundaria', label: '1° Secundaria' },
    { value: '2° Secundaria', label: '2° Secundaria' },
    { value: '3° Secundaria', label: '3° Secundaria' },
    { value: '4° Secundaria', label: '4° Secundaria' },
    { value: '5° Secundaria', label: '5° Secundaria' }
  ];

  const academicPeriodOptions = [
    { value: '2024 - I', label: '2024 - I' },
    { value: '2024 - II', label: '2024 - II' },
    { value: '2025 - I', label: '2025 - I' },
    { value: '2025 - II', label: '2025 - II' },
    { value: '2026 - I', label: '2026 - I' },
    { value: '2026 - II', label: '2026 - II' }
  ];

  useEffect(() => {
    if (course) {
      setFormData({
        name: course.name || '',
        level: course.level || '',
        academicPeriod: course.academic_period || ''
      });
    }
  }, [course]);

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

    if (!formData.name.trim()) {
      newErrors.name = 'El nombre del curso es requerido';
    } else if (formData.name.length < 3) {
      newErrors.name = 'El nombre debe tener al menos 3 caracteres';
    }

    if (!formData.level) {
      newErrors.level = 'El nivel es requerido';
    }

    if (!formData.academicPeriod) {
      newErrors.academicPeriod = 'El período académico es requerido';
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
        result = await courseService.updateCourse(
          course.id,
          user.id,
          formData.name,
          formData.level,
          formData.academicPeriod
        );
      } else {
        result = await courseService.createCourse(
          user.id,
          formData.name,
          formData.level,
          formData.academicPeriod
        );
      }

      if (result.success) {
        console.log(`✅ Curso ${isEditMode ? 'actualizado' : 'creado'} exitosamente`);
        if (onSuccess) {
          onSuccess(result.course);
        }
      } else {
        setGeneralError(result.message || result.error || `Error al ${isEditMode ? 'actualizar' : 'crear'} curso`);
      }
    } catch (error) {
      console.error('Error en formulario de curso:', error);
      setGeneralError('Error de conexión. Intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="course-form">
      {generalError && (
        <div className="course-form__error-banner">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <span>{generalError}</span>
        </div>
      )}

      <FormField
        label="Nombre del Curso"
        type="text"
        name="name"
        value={formData.name}
        onChange={handleChange}
        placeholder="Ej: Matemáticas A"
        error={errors.name}
        required
        disabled={loading}
        icon={
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
            <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
          </svg>
        }
      />

      <div className="form-field">
        <Label htmlFor="level" required>
          Nivel / Grado
        </Label>
        <Select
          name="level"
          value={formData.level}
          onChange={handleChange}
          options={levelOptions}
          placeholder="Selecciona el nivel"
          error={!!errors.level}
          disabled={loading}
          required
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2L2 7l10 5 10-5-10-5z"/>
              <path d="M2 17l10 5 10-5"/>
              <path d="M2 12l10 5 10-5"/>
            </svg>
          }
        />
        {errors.level && (
          <span className="form-field__error">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            {errors.level}
          </span>
        )}
      </div>

      <div className="form-field">
        <Label htmlFor="academicPeriod" required>
          Período Académico
        </Label>
        <Select
          name="academicPeriod"
          value={formData.academicPeriod}
          onChange={handleChange}
          options={academicPeriodOptions}
          placeholder="Selecciona el período"
          error={!!errors.academicPeriod}
          disabled={loading}
          required
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/>
              <line x1="8" y1="2" x2="8" y2="6"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
          }
        />
        {errors.academicPeriod && (
          <span className="form-field__error">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            {errors.academicPeriod}
          </span>
        )}
      </div>

      <div className="course-form__actions">
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
            : (isEditMode ? 'Actualizar Curso' : 'Crear Curso')
          }
        </Button>
      </div>
    </form>
  );
};

CourseForm.propTypes = {
  course: PropTypes.object,
  onSuccess: PropTypes.func,
  onCancel: PropTypes.func
};

export default CourseForm;