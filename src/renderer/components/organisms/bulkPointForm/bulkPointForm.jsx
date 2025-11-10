import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import Button from '../../atoms/button';
import FormField from '../../molecules/formField';
import Select from '../../atoms/select';
import Label from '../../atoms/label';
import { participationTypeService } from '../../../services';
import './bulkPointForm.css';

const BulkPointForm = ({ students, courseId, courseName, onSuccess, onCancel }) => {
  const [formData, setFormData] = useState({
    participationTypeId: '',
    pointsValue: '',
    reason: '',
    customTypeName: ''
  });

  const [participationTypes, setParticipationTypes] = useState([]);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [loadingTypes, setLoadingTypes] = useState(true);
  const [generalError, setGeneralError] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);

  useEffect(() => {
    loadParticipationTypes();
  }, []);

  useEffect(() => {
    if (formData.participationTypeId) {
      if (formData.participationTypeId === 'otros') {
        setShowCustomInput(true);
        setFormData(prev => ({
          ...prev,
          pointsValue: ''
        }));
        return;
      }

      setShowCustomInput(false);
      const selectedType = participationTypes.find(
        type => type.id === parseInt(formData.participationTypeId)
      );
      if (selectedType) {
        setFormData(prev => ({
          ...prev,
          pointsValue: selectedType.default_points
        }));
      }
    } else {
      setShowCustomInput(false);
    }
  }, [formData.participationTypeId, participationTypes]);

  const loadParticipationTypes = async () => {
    setLoadingTypes(true);
    try {
      const result = await participationTypeService.getParticipationTypes();
      if (result.success) {
        setParticipationTypes(result.participationTypes || []);
      }
    } catch (error) {
      console.error('Error al cargar tipos de participación:', error);
    } finally {
      setLoadingTypes(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'pointsValue' ? (value === '' ? '' : parseInt(value)) : value
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

    if (!formData.participationTypeId) {
      newErrors.participationTypeId = 'Debes seleccionar un tipo de participación';
    }

    if (formData.participationTypeId === 'otros') {
      if (!formData.customTypeName || formData.customTypeName.trim() === '') {
        newErrors.customTypeName = 'Debes especificar el tipo de participación';
      } else if (formData.customTypeName.length < 3) {
        newErrors.customTypeName = 'El tipo debe tener al menos 3 caracteres';
      } else if (formData.customTypeName.length > 100) {
        newErrors.customTypeName = 'El tipo no puede exceder 100 caracteres';
      }
    }

    if (formData.pointsValue === '' || formData.pointsValue === null) {
      newErrors.pointsValue = 'Los puntos son requeridos';
    } else if (!Number.isInteger(formData.pointsValue)) {
      newErrors.pointsValue = 'Los puntos deben ser un número entero';
    } else if (formData.pointsValue === 0) {
      newErrors.pointsValue = 'Los puntos no pueden ser cero';
    } else if (formData.pointsValue < -100 || formData.pointsValue > 100) {
      newErrors.pointsValue = 'Los puntos deben estar entre -100 y +100';
    }

    if (formData.reason && formData.reason.length > 500) {
      newErrors.reason = 'La razón no puede exceder 500 caracteres';
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
      const { pointService } = await import('../../../services');
      const { participationTypeService } = await import('../../../services');

      let finalParticipationTypeId = formData.participationTypeId;

      // Si seleccionó "Otros", crear el tipo personalizado primero
      if (formData.participationTypeId === 'otros') {
        console.log('📝 Creando tipo de participación personalizado:', formData.customTypeName);
        
        const createTypeResult = await participationTypeService.createParticipationType(
          formData.customTypeName.trim(),
          parseInt(formData.pointsValue)
        );

        if (!createTypeResult.success) {
          setGeneralError(createTypeResult.error || 'Error al crear el tipo de participación');
          setLoading(false);
          return;
        }

        finalParticipationTypeId = createTypeResult.participationType.id;
        console.log('✅ Tipo personalizado creado con ID:', finalParticipationTypeId);
      }

      // Asignar puntos a todos los estudiantes
      let successCount = 0;
      let failCount = 0;

      for (const student of students) {
        try {
          const result = await pointService.assignPoints(
            student.id,
            parseInt(finalParticipationTypeId),
            parseInt(formData.pointsValue),
            formData.reason || null
          );

          if (result.success) {
            successCount++;
          } else {
            failCount++;
            console.error(`Error al asignar puntos a ${student.full_name}:`, result.error);
          }
        } catch (error) {
          failCount++;
          console.error(`Error al asignar puntos a ${student.full_name}:`, error);
        }
      }

      if (successCount > 0) {
        console.log(`✅ Puntos asignados a ${successCount} estudiante(s)`);
        if (onSuccess) {
          onSuccess({ successCount, failCount });
        }
      } else {
        setGeneralError('No se pudo asignar puntos a ningún estudiante');
      }

    } catch (error) {
      console.error('Error en formulario masivo de puntos:', error);
      setGeneralError('Error de conexión. Intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const participationTypeOptions = [
    ...participationTypes.map(type => ({
      value: type.id,
      label: `${type.name} (${type.default_points > 0 ? '+' : ''}${type.default_points} pts)`
    })),
    {
      value: 'otros',
      label: '➕ Otros (personalizado)'
    }
  ];

  return (
    <form onSubmit={handleSubmit} className="bulk-point-form">
      {generalError && (
        <div className="bulk-point-form__error-banner">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <span>{generalError}</span>
        </div>
      )}

      {/* Info de asignación masiva */}
      <div className="bulk-point-form__info">
        <div className="bulk-point-form__info-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
            <circle cx="9" cy="7" r="4"/>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
          </svg>
        </div>
        <div className="bulk-point-form__info-details">
          <h4>Asignación Masiva</h4>
          <p>Los puntos se asignarán a <strong>{students.length}</strong> estudiante(s) del curso <strong>{courseName}</strong></p>
        </div>
      </div>

      <div className="form-field">
        <Label htmlFor="participationTypeId" required>
          Tipo de Participación
        </Label>
        <Select
          name="participationTypeId"
          value={formData.participationTypeId}
          onChange={handleChange}
          options={participationTypeOptions}
          placeholder={loadingTypes ? "Cargando tipos..." : "Selecciona un tipo"}
          error={!!errors.participationTypeId}
          disabled={loading || loadingTypes}
          required
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
        {errors.participationTypeId && (
          <span className="form-field__error">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            {errors.participationTypeId}
          </span>
        )}
      </div>

      {showCustomInput && (
        <div className="bulk-point-form__custom-type">
          <FormField
            label="¿Qué tipo de participación?"
            type="text"
            name="customTypeName"
            value={formData.customTypeName}
            onChange={handleChange}
            placeholder="Ej: Trabajo grupal, Exposición especial, etc."
            error={errors.customTypeName}
            required
            disabled={loading}
            maxLength={100}
            icon={
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 20h9"/>
                <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
              </svg>
            }
          />
          <p className="bulk-point-form__custom-hint">
            💡 Este tipo de participación se guardará en tu lista para usarlo en el futuro
          </p>
        </div>
      )}

      <FormField
        label="Puntos"
        type="number"
        name="pointsValue"
        value={formData.pointsValue}
        onChange={handleChange}
        placeholder="Ej: 5, -2"
        error={errors.pointsValue}
        required
        disabled={loading}
        min="-100"
        max="100"
        icon={
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/>
            <path d="M12 6v6l4 2"/>
          </svg>
        }
      />

      <FormField
        label="Razón (Opcional)"
        type="text"
        name="reason"
        value={formData.reason}
        onChange={handleChange}
        placeholder="Ej: Participación activa en clase"
        error={errors.reason}
        disabled={loading}
        maxLength={500}
        icon={
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
        }
      />

      <div className="bulk-point-form__actions">
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
          disabled={loading || loadingTypes}
        >
          {loading ? `Asignando a ${students.length} estudiantes...` : `Asignar a ${students.length} Estudiantes`}
        </Button>
      </div>
    </form>
  );
};

BulkPointForm.propTypes = {
  students: PropTypes.array.isRequired,
  courseId: PropTypes.number.isRequired,
  courseName: PropTypes.string.isRequired,
  onSuccess: PropTypes.func,
  onCancel: PropTypes.func
};

export default BulkPointForm;