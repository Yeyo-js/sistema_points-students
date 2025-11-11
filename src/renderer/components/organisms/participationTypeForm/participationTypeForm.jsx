import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import Button from '../../atoms/button';
import FormField from '../../molecules/formField';
import { participationTypeService } from '../../../services';
import './participationTypeForm.css';

const ParticipationTypeForm = ({ participationType = null, onSuccess, onCancel }) => {
  const isEditMode = !!participationType;

  const [formData, setFormData] = useState({
    name: '',
    defaultPoints: ''
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [generalError, setGeneralError] = useState('');

  useEffect(() => {
    if (participationType) {
      setFormData({
        name: participationType.name || '',
        defaultPoints: participationType.default_points || ''
      });
    }
  }, [participationType]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'defaultPoints' ? (value === '' ? '' : parseInt(value)) : value
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

    if (!formData.name || formData.name.trim() === '') {
      newErrors.name = 'El nombre es requerido';
    } else if (formData.name.length < 3) {
      newErrors.name = 'El nombre debe tener al menos 3 caracteres';
    } else if (formData.name.length > 100) {
      newErrors.name = 'El nombre no puede exceder 100 caracteres';
    }

    if (formData.defaultPoints === '' || formData.defaultPoints === null) {
      newErrors.defaultPoints = 'Los puntos son requeridos';
    } else if (!Number.isInteger(formData.defaultPoints)) {
      newErrors.defaultPoints = 'Los puntos deben ser un número entero';
    } else if (formData.defaultPoints === 0) {
      newErrors.defaultPoints = 'Los puntos no pueden ser cero';
    } else if (formData.defaultPoints < -100 || formData.defaultPoints > 100) {
      newErrors.defaultPoints = 'Los puntos deben estar entre -100 y +100';
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
        result = await participationTypeService.updateParticipationType(
          participationType.id,
          formData.name.trim(),
          parseInt(formData.defaultPoints)
        );
      } else {
        result = await participationTypeService.createParticipationType(
          formData.name.trim(),
          parseInt(formData.defaultPoints)
        );
      }

      if (result.success) {
        if (onSuccess) {
          onSuccess(result);
        }
      } else {
        setGeneralError(result.error || `Error al ${isEditMode ? 'actualizar' : 'crear'} el tipo de participación`);
      }
    } catch (error) {
      console.error('Error en formulario:', error);
      setGeneralError('Error inesperado. Por favor intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="participation-type-form" onSubmit={handleSubmit}>
      {generalError && (
        <div className="participation-type-form__error">
          {generalError}
        </div>
      )}

      <FormField
        label="Nombre del Tipo"
        name="name"
        type="text"
        value={formData.name}
        onChange={handleChange}
        error={errors.name}
        placeholder="Ej: Respuesta Correcta, Participación Voluntaria"
        required
        disabled={loading}
      />

      <FormField
        label="Puntos por Defecto"
        name="defaultPoints"
        type="number"
        value={formData.defaultPoints}
        onChange={handleChange}
        error={errors.defaultPoints}
        placeholder="Ej: 5"
        required
        disabled={loading}
        helperText="Los puntos pueden ser positivos o negativos. Rango: -100 a +100"
      />

      <div className="participation-type-form__info">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="16" x2="12" y2="12"/>
          <line x1="12" y1="8" x2="12.01" y2="8"/>
        </svg>
        <span>
          Los puntos positivos (+) aumentan el puntaje del estudiante.
          Los puntos negativos (-) lo disminuyen.
        </span>
      </div>

      <div className="participation-type-form__actions">
        <Button
          type="button"
          variant="outline"
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
          {isEditMode ? 'Actualizar' : 'Crear'} Tipo
        </Button>
      </div>
    </form>
  );
};

ParticipationTypeForm.propTypes = {
  participationType: PropTypes.shape({
    id: PropTypes.number.isRequired,
    name: PropTypes.string.isRequired,
    default_points: PropTypes.number.isRequired
  }),
  onSuccess: PropTypes.func,
  onCancel: PropTypes.func
};

export default ParticipationTypeForm;
