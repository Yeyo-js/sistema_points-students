import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import Button from '../../atoms/button';
import FormField from '../../molecules/formField';
import Select from '../../atoms/select';
import Label from '../../atoms/label';
import { participationTypeService, pointService } from '../../../services';
import './pointForm.css';

const PointForm = ({ point = null, studentId, studentName, onSuccess, onCancel }) => {
  const isEditMode = !!point;

  const [formData, setFormData] = useState({
    participationTypeId: '',
    pointsValue: '',
    reason: '',
    customTypeName: '' //nombre personalizado cuando se selecciona "Otros"
  });

  const [participationTypes, setParticipationTypes] = useState([]);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [loadingTypes, setLoadingTypes] = useState(true);
  const [generalError, setGeneralError] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false); //controlar visibilidad del input

  useEffect(() => {
    loadParticipationTypes();
  }, []);

  useEffect(() => {
    if (point) {
      setFormData({
        participationTypeId: point.participation_type_id || '',
        pointsValue: point.points_value || '',
        reason: point.reason || '',
        customTypeName: ''
      });
    }
  }, [point]);

  // Cuando cambia el tipo de participación, auto-completar puntos
  useEffect(() => {
    if (formData.participationTypeId && !isEditMode) {
      // Si selecciona "otros", mostrar input personalizado y no autocompletar puntos
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
    } else if (formData.participationTypeId === 'otros') {
      setShowCustomInput(true);
    } else {
      setShowCustomInput(false);
    }
  }, [formData.participationTypeId, participationTypes, isEditMode]);

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

    // Validar nombre personalizado si seleccionó "Otros"
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
      let finalParticipationTypeId = formData.participationTypeId;

      // Si seleccionó "Otros", crear el tipo de participación personalizado primero
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

      let result;

      if (isEditMode) {
        result = await pointService.updatePoint(
          point.id,
          parseInt(finalParticipationTypeId),
          parseInt(formData.pointsValue),
          formData.reason || null
        );
      } else {
        result = await pointService.assignPoints(
          studentId,
          parseInt(finalParticipationTypeId),
          parseInt(formData.pointsValue),
          formData.reason || null
        );
      }

      if (result.success) {
        console.log(`✅ Punto ${isEditMode ? 'actualizado' : 'asignado'} exitosamente`);
        if (onSuccess) {
          onSuccess(result);
        }
      } else {
        setGeneralError(result.error || `Error al ${isEditMode ? 'actualizar' : 'asignar'} punto`);
      }
    } catch (error) {
      console.error('Error en formulario de puntos:', error);
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
    // Agregar opción "Otros" al final
    {
      value: 'otros',
      label: '➕ Otros (personalizado)'
    }
  ];

  return (
    <form onSubmit={handleSubmit} className="point-form">
      {generalError && (
        <div className="point-form__error-banner">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <span>{generalError}</span>
        </div>
      )}

      {/* Mostrar estudiante seleccionado */}
      <div className="point-form__student-info">
        <div className="point-form__student-avatar">
          {studentName?.charAt(0).toUpperCase()}
        </div>
        <div className="point-form__student-details">
          <span className="point-form__student-label">Asignando puntos a:</span>
          <span className="point-form__student-name">{studentName}</span>
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

      {/* Input personalizado cuando se selecciona "Otros" */}
      {showCustomInput && (
        <div className="point-form__custom-type">
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
          <p className="point-form__custom-hint">
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
        placeholder="Ej: Excelente participación en clase"
        error={errors.reason}
        disabled={loading}
        maxLength={500}
        icon={
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
        }
      />

      <div className="point-form__actions">
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
          {loading 
            ? (isEditMode ? 'Actualizando...' : 'Asignando...') 
            : (isEditMode ? 'Actualizar Punto' : 'Asignar Puntos')
          }
        </Button>
      </div>
    </form>
  );
};

PointForm.propTypes = {
  point: PropTypes.object,
  studentId: PropTypes.number.isRequired,
  studentName: PropTypes.string.isRequired,
  onSuccess: PropTypes.func,
  onCancel: PropTypes.func
};

export default PointForm;