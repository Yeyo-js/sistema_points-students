import React, { useState, useEffect } from 'react';
import Button from '../../atoms/button';
import Input from '../../atoms/input';
import Label from '../../atoms/label';
import Select from '../../atoms/select';
import FormField from '../../molecules/formField/formField'; // Importamos FormField para el input personalizado
import { groupService, participationTypeService } from '../../../services';
import './groupPointsForm.css';

const GroupPointsForm = ({ group, userId, onSuccess, onCancel }) => {
  const [participationTypes, setParticipationTypes] = useState([]);
  const [selectedTypeId, setSelectedTypeId] = useState('');
  const [pointsValue, setPointsValue] = useState(0);
  const [reason, setReason] = useState('');
  const [customTypeName, setCustomTypeName] = useState(''); // Nuevo estado para el tipo personalizado
  const [showCustomInput, setShowCustomInput] = useState(false); // Nuevo estado para el input personalizado
  
  const [loading, setLoading] = useState(false);
  const [loadingTypes, setLoadingTypes] = useState(true);
  const [generalError, setGeneralError] = useState('');
  const [groupDetails, setGroupDetails] = useState(null);

  useEffect(() => {
    loadParticipationTypes();
    loadGroupDetails();
  }, []);
  
  // Efecto para actualizar puntos y visibilidad del input personalizado
  useEffect(() => {
    if (selectedTypeId) {
      if (selectedTypeId === 'otros') {
        setShowCustomInput(true);
        setPointsValue(''); // Limpiar puntos para que el usuario los ingrese
        return;
      }

      setShowCustomInput(false);
      const selectedType = participationTypes.find(t => t.id === parseInt(selectedTypeId));
      if (selectedType) {
        setPointsValue(selectedType.default_points);
      }
    } else {
      setShowCustomInput(false);
    }
  }, [selectedTypeId, participationTypes]);


  const loadParticipationTypes = async () => {
    setLoadingTypes(true);
    try {
      // CORRECCIÓN 1: El método es getParticipationTypes(), no getByUser(userId)
      const result = await participationTypeService.getParticipationTypes();
      if (result.success) {
        setParticipationTypes(result.participationTypes || []);
      }
    } catch (error) {
      console.error('Error al cargar tipos de participación:', error);
      setGeneralError('Error al cargar tipos de participación.');
    } finally {
      setLoadingTypes(false);
    }
  };

  const loadGroupDetails = async () => {
    try {
      const result = await groupService.getDetails(group.id, userId);
      if (result.success) {
        setGroupDetails(result.group);
      }
    } catch (error) {
      console.error('Error al cargar detalles del grupo:', error);
      setGeneralError('Error al cargar detalles del grupo.');
    }
  };

  const handleTypeChange = (e) => {
    const typeId = e.target.value;
    setSelectedTypeId(typeId);
    setGeneralError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setGeneralError('');

    if (!selectedTypeId) {
      setGeneralError('Selecciona un tipo de participación');
      return;
    }
    
    // Validaciones de formulario
    if (selectedTypeId === 'otros') {
        if (!customTypeName || customTypeName.trim() === '' || customTypeName.length < 3 || customTypeName.length > 100) {
            setGeneralError('Debes especificar el tipo de participación (3-100 caracteres).');
            return;
        }
    }
    if (pointsValue === '' || pointsValue === null || !Number.isInteger(parseInt(pointsValue)) || parseInt(pointsValue) === 0 || parseInt(pointsValue) < -100 || parseInt(pointsValue) > 100) {
        setGeneralError('Los puntos deben ser un número entero entre -100 y +100 y no pueden ser cero.');
        return;
    }


    if (!groupDetails || !groupDetails.students || groupDetails.students.length === 0) {
      setGeneralError('El grupo no tiene estudiantes para calificar');
      return;
    }

    const confirmMessage = `¿Asignar ${pointsValue} puntos a todos los ${groupDetails.students.length} estudiantes del grupo "${group.name}"?`;

    if (!window.confirm(confirmMessage)) {
      return;
    }

    setLoading(true);
    try {
      let finalParticipationTypeId = parseInt(selectedTypeId);
      
      // Lógica de creación de tipo personalizado
      if (selectedTypeId === 'otros') {
          const createTypeResult = await participationTypeService.createParticipationType(
              customTypeName.trim(),
              parseInt(pointsValue)
          );

          if (!createTypeResult.success) {
              setGeneralError(createTypeResult.error || 'Error al crear el tipo de participación personalizado.');
              setLoading(false);
              return;
          }
          finalParticipationTypeId = createTypeResult.participationType.id;
      }
      
      // Asignar puntos al grupo
      const result = await groupService.assignPoints(
        group.id,
        {
          participationTypeId: finalParticipationTypeId,
          pointsValue: parseInt(pointsValue),
          reason: reason.trim() || undefined
        },
        userId
      );

      if (result.success) {
        alert(`Puntos asignados exitosamente!\n\n✅ ${result.successCount} estudiantes calificados${result.failCount > 0 ? `\n❌ ${result.failCount} fallaron` : ''}`);
        onSuccess();
      } else {
        setGeneralError(result.error || 'Error al asignar puntos');
      }
    } catch (error) {
      console.error('Error al asignar puntos:', error);
      setGeneralError('Error al asignar puntos al grupo');
    } finally {
      setLoading(false);
    }
  };

  const typeOptions = [
    ...participationTypes.map(type => ({
      value: type.id,
      label: `${type.name} (${type.default_points > 0 ? '+' : ''}${type.default_points} pts)`
    })),
    {
        value: 'otros',
        label: '➕ Otros (personalizado)'
    }
  ];

  if (!groupDetails || loadingTypes) {
    return (
      <div className="group-points-form__loading">
        <div className="group-points-form__spinner"></div>
        <p>Cargando Tipos de Participación...</p>
      </div>
    );
  }

  return (
    <form className="group-points-form" onSubmit={handleSubmit}>
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

      <div className="group-points-form__info">
        <h3 className="group-points-form__group-name">{group.name}</h3>
        <p className="group-points-form__group-students">
          {groupDetails.students?.length || 0} estudiantes serán calificados
        </p>
      </div>

      <div className="group-points-form__field">
        <Label htmlFor="participationType">Tipo de Participación *</Label>
        <Select
          name="participationType"
          value={selectedTypeId}
          onChange={handleTypeChange}
          options={typeOptions}
          placeholder="Selecciona un tipo"
          required
          disabled={loading || loadingTypes}
        />
      </div>

      {/* Nuevo: Input para tipo de participación personalizado */}
      {showCustomInput && (
        <div className="point-form__custom-type">
          <FormField
            label="¿Qué tipo de participación?"
            type="text"
            name="customTypeName"
            value={customTypeName}
            onChange={(e) => setCustomTypeName(e.target.value)}
            placeholder="Ej: Trabajo grupal, Exposición especial, etc."
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
            💡 Este tipo se guardará en tu lista para usarlo en el futuro.
          </p>
        </div>
      )}

      <div className="group-points-form__field">
        <Label htmlFor="pointsValue">Puntos *</Label>
        <Input
          type="number"
          name="pointsValue"
          value={pointsValue}
          onChange={(e) => setPointsValue(e.target.value === '' ? '' : parseInt(e.target.value))}
          placeholder="Cantidad de puntos"
          required
          disabled={loading}
          min="-100"
          max="100"
        />
        <p className="group-points-form__hint">
          {pointsValue > 0 ? '✅ Puntos positivos' : pointsValue < 0 ? '❌ Puntos negativos' : 'ℹ️ Sin puntos'}
        </p>
      </div>

      <div className="group-points-form__field">
        <Label htmlFor="reason">Razón (Opcional)</Label>
        <textarea
          name="reason"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Describe el motivo de la calificación..."
          className="group-points-form__textarea"
          rows="3"
        />
      </div>

      {groupDetails.students && groupDetails.students.length > 0 && (
        <div className="group-points-form__preview">
          <h4 className="group-points-form__preview-title">
            Vista previa de estudiantes ({groupDetails.students.length})
          </h4>
          <div className="group-points-form__students-preview">
            {groupDetails.students.slice(0, 5).map(student => (
              <div key={student.id} className="group-points-form__student">
                <span className="group-points-form__student-number">N° {student.list_number}</span>
                <span className="group-points-form__student-name">{student.full_name}</span>
              </div>
            ))}
            {groupDetails.students.length > 5 && (
              <p className="group-points-form__more">
                ... y {groupDetails.students.length - 5} más
              </p>
            )}
          </div>
        </div>
      )}

      <div className="group-points-form__actions">
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
          Asignar Puntos a Todos
        </Button>
      </div>
    </form>
  );
};

export default GroupPointsForm;