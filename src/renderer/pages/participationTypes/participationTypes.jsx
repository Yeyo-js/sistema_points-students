import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/templates/dashboardLayout/dashboardLayout';
import Card from '../../components/atoms/card';
import Button from '../../components/atoms/button';
import Modal from '../../components/molecules/modal';
import ParticipationTypeForm from '../../components/organisms/participationTypeForm/participationTypeForm';
import { participationTypeService } from '../../services';
import './participationTypes.css';

const ParticipationTypesPage = () => {
  const [participationTypes, setParticipationTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingType, setEditingType] = useState(null);

  useEffect(() => {
    loadParticipationTypes();
  }, []);

  const loadParticipationTypes = async () => {
    setLoading(true);
    try {
      const result = await participationTypeService.getParticipationTypes();

      if (result.success) {
        setParticipationTypes(result.participationTypes || []);
      } else {
        console.error('Error al cargar tipos de participación:', result.error);
        alert('Error al cargar los tipos de participación');
      }
    } catch (error) {
      console.error('Error al cargar tipos de participación:', error);
      alert('Error al cargar los tipos de participación');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingType(null);
    setShowModal(true);
  };

  const handleEdit = (type) => {
    setEditingType(type);
    setShowModal(true);
  };

  const handleDelete = async (type) => {
    if (!window.confirm(`¿Estás seguro de eliminar el tipo "${type.name}"?\n\nSi tiene puntos asignados, no se podrá eliminar.`)) {
      return;
    }

    try {
      const result = await participationTypeService.deleteParticipationType(type.id);

      if (result.success) {
        alert('Tipo de participación eliminado exitosamente');
        loadParticipationTypes();
      } else {
        alert(result.error || 'Error al eliminar el tipo de participación');
      }
    } catch (error) {
      console.error('Error al eliminar tipo:', error);
      alert('Error al eliminar el tipo de participación');
    }
  };

  const handleFormSuccess = () => {
    setShowModal(false);
    setEditingType(null);
    loadParticipationTypes();
  };

  const handleFormCancel = () => {
    setShowModal(false);
    setEditingType(null);
  };

  return (
    <DashboardLayout>
      <div className="participation-types-page">
        {/* Header */}
        <div className="participation-types-page__header">
          <div>
            <h1 className="participation-types-page__title">Tipos de Participación</h1>
            <p className="participation-types-page__subtitle">
              Gestiona los tipos de participación para asignar puntos
            </p>
          </div>
          <Button variant="primary" size="medium" onClick={handleCreate}>
            + Crear Tipo
          </Button>
        </div>

        {/* Content */}
        {loading ? (
          <Card variant="elevated" padding="large">
            <p className="participation-types-page__loading">Cargando tipos de participación...</p>
          </Card>
        ) : participationTypes.length === 0 ? (
          <Card variant="elevated" padding="large">
            <div className="participation-types-page__empty">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="8" y1="6" x2="21" y2="6"/>
                <line x1="8" y1="12" x2="21" y2="12"/>
                <line x1="8" y1="18" x2="21" y2="18"/>
                <line x1="3" y1="6" x2="3.01" y2="6"/>
                <line x1="3" y1="12" x2="3.01" y2="12"/>
                <line x1="3" y1="18" x2="3.01" y2="18"/>
              </svg>
              <h3>No hay tipos de participación</h3>
              <p>Crea tu primer tipo de participación para comenzar a asignar puntos</p>
              <Button variant="primary" size="medium" onClick={handleCreate}>
                + Crear Primer Tipo
              </Button>
            </div>
          </Card>
        ) : (
          <div className="participation-types-page__grid">
            {participationTypes.map((type) => (
              <Card key={type.id} variant="elevated" padding="medium" className="participation-type-card">
                <div className="participation-type-card__header">
                  <div className="participation-type-card__icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"/>
                      <path d="M12 6v6l4 2"/>
                    </svg>
                  </div>
                  <div className="participation-type-card__info">
                    <h3 className="participation-type-card__name">{type.name}</h3>
                    <p className="participation-type-card__points">
                      {type.default_points > 0 ? '+' : ''}{type.default_points} puntos
                    </p>
                  </div>
                </div>

                <div className="participation-type-card__meta">
                  {type.is_predefined ? (
                    <span className="participation-type-card__badge participation-type-card__badge--predefined">
                      Predefinido
                    </span>
                  ) : (
                    <span className="participation-type-card__badge participation-type-card__badge--custom">
                      Personalizado
                    </span>
                  )}
                  <span className="participation-type-card__date">
                    {new Date(type.created_at).toLocaleDateString('es-ES', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    })}
                  </span>
                </div>

                <div className="participation-type-card__actions">
                  <Button
                    variant="outline"
                    size="small"
                    onClick={() => handleEdit(type)}
                  >
                    Editar
                  </Button>
                  {!type.is_predefined && (
                    <Button
                      variant="danger-outline"
                      size="small"
                      onClick={() => handleDelete(type)}
                    >
                      Eliminar
                    </Button>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Modal para crear/editar */}
        {showModal && (
          <Modal
            isOpen={showModal}
            onClose={handleFormCancel}
            title={editingType ? 'Editar Tipo de Participación' : 'Crear Tipo de Participación'}
          >
            <ParticipationTypeForm
              participationType={editingType}
              onSuccess={handleFormSuccess}
              onCancel={handleFormCancel}
            />
          </Modal>
        )}
      </div>
    </DashboardLayout>
  );
};

export default ParticipationTypesPage;
