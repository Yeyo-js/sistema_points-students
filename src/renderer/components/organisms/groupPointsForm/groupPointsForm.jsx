import React, { useState, useEffect } from 'react';
import Button from '../../atoms/button';
import Input from '../../atoms/input';
import Label from '../../atoms/label';
import Select from '../../atoms/select';
import { groupService, participationTypeService } from '../../../services';
import './groupPointsForm.css';

const GroupPointsForm = ({ group, userId, onSuccess, onCancel }) => {
  const [participationTypes, setParticipationTypes] = useState([]);
  const [selectedTypeId, setSelectedTypeId] = useState('');
  const [pointsValue, setPointsValue] = useState(0);
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [groupDetails, setGroupDetails] = useState(null);

  useEffect(() => {
    loadParticipationTypes();
    loadGroupDetails();
  }, []);

  const loadParticipationTypes = async () => {
    try {
      const result = await participationTypeService.getByUser(userId);
      if (result.success) {
        setParticipationTypes(result.participationTypes || []);
      }
    } catch (error) {
      console.error('Error al cargar tipos de participación:', error);
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
    }
  };

  const handleTypeChange = (e) => {
    const typeId = e.target.value;
    setSelectedTypeId(typeId);

    // Auto-fill points value from selected type
    const selectedType = participationTypes.find(t => t.id === parseInt(typeId));
    if (selectedType) {
      setPointsValue(selectedType.default_points);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedTypeId) {
      alert('Selecciona un tipo de participación');
      return;
    }

    if (!groupDetails || !groupDetails.students || groupDetails.students.length === 0) {
      alert('El grupo no tiene estudiantes para calificar');
      return;
    }

    const confirmMessage = `¿Asignar ${pointsValue} puntos a todos los ${groupDetails.students.length} estudiantes del grupo "${group.name}"?`;

    if (!window.confirm(confirmMessage)) {
      return;
    }

    setLoading(true);
    try {
      const result = await groupService.assignPoints(
        group.id,
        {
          participationTypeId: parseInt(selectedTypeId),
          pointsValue: parseInt(pointsValue),
          reason: reason.trim() || undefined
        },
        userId
      );

      if (result.success) {
        alert(`Puntos asignados exitosamente!\n\n✅ ${result.successCount} estudiantes calificados${result.failCount > 0 ? `\n❌ ${result.failCount} fallaron` : ''}`);
        onSuccess();
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (error) {
      console.error('Error al asignar puntos:', error);
      alert('Error al asignar puntos al grupo');
    } finally {
      setLoading(false);
    }
  };

  const typeOptions = participationTypes.map(type => ({
    value: type.id,
    label: `${type.name} (${type.default_points > 0 ? '+' : ''}${type.default_points} pts)`
  }));

  if (!groupDetails) {
    return (
      <div className="group-points-form__loading">
        <div className="group-points-form__spinner"></div>
        <p>Cargando...</p>
      </div>
    );
  }

  return (
    <form className="group-points-form" onSubmit={handleSubmit}>
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
        />
      </div>

      <div className="group-points-form__field">
        <Label htmlFor="pointsValue">Puntos *</Label>
        <Input
          type="number"
          name="pointsValue"
          value={pointsValue}
          onChange={(e) => setPointsValue(e.target.value)}
          placeholder="Cantidad de puntos"
          required
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
        >
          Asignar Puntos a Todos
        </Button>
      </div>
    </form>
  );
};

export default GroupPointsForm;
