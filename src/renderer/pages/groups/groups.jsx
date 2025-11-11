import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/templates/dashboardLayout';
import Card from '../../components/atoms/card';
import Button from '../../components/atoms/button';
import Modal from '../../components/atoms/modal';
import EmptyState from '../../components/atoms/emptyState';
import Select from '../../components/atoms/select';
import Label from '../../components/atoms/label';
import SubgroupForm from '../../components/organisms/subgroupForm/subgroupForm';
import ManualGroupForm from '../../components/organisms/manualGroupForm/manualGroupForm';
import GroupPointsForm from '../../components/organisms/groupPointsForm/groupPointsForm';
import { groupService, courseService } from '../../services';
import { useAuth } from '../../context/authContext';
import './groups.css';

const GroupsPage = () => {
  const { user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [groups, setGroups] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingGroups, setLoadingGroups] = useState(false);

  // Modales
  const [showManualModal, setShowManualModal] = useState(false);
  const [showSubgroupModal, setShowSubgroupModal] = useState(false);
  const [showPointsModal, setShowPointsModal] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [selectedParentGroup, setSelectedParentGroup] = useState(null);

  useEffect(() => {
    loadCourses();
  }, []);

  useEffect(() => {
    if (selectedCourseId) {
      loadCourseGroups(selectedCourseId);
    }
  }, [selectedCourseId]);

  const loadCourses = async () => {
    setLoading(true);
    try {
      const result = await courseService.getCoursesByUser(user.id);
      if (result.success) {
        setCourses(result.courses || []);
        if (result.courses && result.courses.length > 0) {
          setSelectedCourseId(result.courses[0].id);
        }
      }
    } catch (error) {
      console.error('Error al cargar cursos:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCourseGroups = async (courseId) => {
    setLoadingGroups(true);
    try {
      const result = await groupService.getByCourse(courseId, user.id);
      if (result.success) {
        setGroups(result.groups || []);
      } else {
        setGroups([]);
      }
    } catch (error) {
      console.error('Error al cargar grupos:', error);
      setGroups([]);
    } finally {
      setLoadingGroups(false);
    }
  };

  const handleCourseChange = (e) => {
    const courseId = parseInt(e.target.value);
    setSelectedCourseId(courseId);
  };

  const handleCreateGeneralGroup = async () => {
    if (!selectedCourseId) {
      alert('Selecciona un curso primero');
      return;
    }

    setLoading(true);
    try {
      const result = await groupService.createFromCourse(selectedCourseId, user.id);

      if (result.success) {
        alert(`Grupo general creado exitosamente!\n\n${result.studentsAdded} estudiantes agregados al grupo.`);
        await loadCourseGroups(selectedCourseId);
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error al crear grupo general');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSubgroup = (parentGroup) => {
    setSelectedParentGroup(parentGroup);
    setSelectedGroup(null);
    setShowSubgroupModal(true);
  };

  const handleEditGroup = (group) => {
    if (group.type === 'subgroup') {
      // Cargar el grupo padre
      const parentGroup = groups.find(g => g.id === group.parent_group_id);
      setSelectedParentGroup(parentGroup);
      setSelectedGroup(group);
      setShowSubgroupModal(true);
    } else {
      // Editar nombre del grupo general o independiente
      const newName = prompt('Nuevo nombre del grupo:', group.name);
      if (newName && newName !== group.name) {
        handleUpdateGroup(group.id, { name: newName });
      }
    }
  };

  const handleUpdateGroup = async (groupId, updateData) => {
    try {
      const result = await groupService.update(groupId, updateData, user.id);

      if (result.success) {
        await loadCourseGroups(selectedCourseId);
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error al actualizar grupo');
    }
  };

  const handleDeleteGroup = async (group) => {
    if (!window.confirm(`¿Estás seguro de eliminar el grupo "${group.name}"?`)) {
      return;
    }

    try {
      const result = await groupService.delete(group.id, user.id);

      if (result.success) {
        await loadCourseGroups(selectedCourseId);
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error al eliminar grupo');
    }
  };

  const handleAssignPoints = (group) => {
    setSelectedGroup(group);
    setShowPointsModal(true);
  };

  const handleSubgroupFormSuccess = async () => {
    setShowSubgroupModal(false);
    setSelectedParentGroup(null);
    setSelectedGroup(null);
    await loadCourseGroups(selectedCourseId);
  };

  const handleManualFormSuccess = async () => {
    setShowManualModal(false);
    await loadCourses();
  };

  const handlePointsFormSuccess = async () => {
    setShowPointsModal(false);
    setSelectedGroup(null);
  };

  const selectedCourse = courses.find(c => c.id === selectedCourseId);
  const courseOptions = courses.map(course => ({
    value: course.id,
    label: `${course.name} - ${course.level}`
  }));

  // Organizar grupos: generales/independientes primero, luego subgrupos
  const generalGroups = groups.filter(g => g.type === 'general' || g.type === 'independent');
  const subgroupsByParent = groups
    .filter(g => g.type === 'subgroup')
    .reduce((acc, subgroup) => {
      if (!acc[subgroup.parent_group_id]) {
        acc[subgroup.parent_group_id] = [];
      }
      acc[subgroup.parent_group_id].push(subgroup);
      return acc;
    }, {});

  return (
    <DashboardLayout>
      <div className="groups-page">
        {/* Header */}
        <div className="groups-page__header">
          <div className="groups-page__header-left">
            <h1 className="groups-page__title">Grupos</h1>
            <p className="groups-page__subtitle">
              Gestiona grupos y subgrupos de estudiantes
            </p>
          </div>

          <div className="groups-page__actions">
            <Button
              variant="outline"
              size="medium"
              onClick={() => setShowManualModal(true)}
              title="Crear grupo independiente"
            >
              ➕ Grupo Manual
            </Button>
            {selectedCourseId && (
              <Button
                variant="primary"
                size="medium"
                onClick={handleCreateGeneralGroup}
                loading={loading}
                title="Importar todos los estudiantes del curso"
              >
                📥 Crear Grupo General
              </Button>
            )}
          </div>
        </div>

        {/* Selector de curso */}
        {courses.length > 0 && (
          <div className="groups-page__course-selector">
            <Label htmlFor="courseSelect">Filtrar por Curso</Label>
            <Select
              name="courseSelect"
              value={selectedCourseId}
              onChange={handleCourseChange}
              options={courseOptions}
              placeholder="Selecciona un curso"
              disabled={loading}
              icon={
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
                  <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
                </svg>
              }
            />
          </div>
        )}

        {/* Contenido principal */}
        {loading ? (
          <div className="groups-page__loading">
            <div className="groups-page__spinner"></div>
            <p>Cargando...</p>
          </div>
        ) : courses.length === 0 ? (
          <EmptyState
            icon={
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
            }
            title="No tienes cursos creados"
            description="Crea un curso primero o crea un grupo manual independiente"
            action={
              <Button variant="primary" size="large" onClick={() => setShowManualModal(true)}>
                Crear Grupo Manual
              </Button>
            }
          />
        ) : loadingGroups ? (
          <div className="groups-page__loading">
            <div className="groups-page__spinner"></div>
            <p>Cargando grupos...</p>
          </div>
        ) : generalGroups.length === 0 ? (
          <EmptyState
            icon={
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
            }
            title="No hay grupos en este curso"
            description="Crea un grupo general importando estudiantes del curso o crea subgrupos personalizados"
            action={
              <Button variant="primary" size="large" onClick={handleCreateGeneralGroup}>
                Crear Grupo General
              </Button>
            }
          />
        ) : (
          <div className="groups-page__groups-list">
            {generalGroups.map(group => (
              <div key={group.id} className="group-container">
                {/* Grupo principal */}
                <Card variant="elevated" padding="large" className={`group-card group-card--${group.type}`}>
                  <div className="group-card__header">
                    <div className="group-card__info">
                      <div className="group-card__badge">
                        {group.type === 'general' ? '📚 General' : '🔧 Independiente'}
                      </div>
                      <h3 className="group-card__name">{group.name}</h3>
                      {group.course_name && (
                        <p className="group-card__course">{group.course_name}</p>
                      )}
                    </div>
                    <div className="group-card__stats">
                      <div className="group-card__stat">
                        <span className="group-card__stat-value">{group.student_count || 0}</span>
                        <span className="group-card__stat-label">Estudiantes</span>
                      </div>
                      {group.type === 'general' && subgroupsByParent[group.id] && (
                        <div className="group-card__stat">
                          <span className="group-card__stat-value">{subgroupsByParent[group.id].length}</span>
                          <span className="group-card__stat-label">Subgrupos</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="group-card__actions">
                    {group.type === 'general' && (
                      <Button
                        variant="secondary"
                        size="small"
                        onClick={() => handleCreateSubgroup(group)}
                      >
                        ➕ Crear Subgrupo
                      </Button>
                    )}
                    <Button
                      variant="secondary"
                      size="small"
                      onClick={() => handleEditGroup(group)}
                    >
                      ✏️ Editar
                    </Button>
                    <Button
                      variant="primary"
                      size="small"
                      onClick={() => handleAssignPoints(group)}
                    >
                      ⭐ Calificar
                    </Button>
                    <Button
                      variant="danger"
                      size="small"
                      onClick={() => handleDeleteGroup(group)}
                    >
                      🗑️ Eliminar
                    </Button>
                  </div>
                </Card>

                {/* Subgrupos */}
                {subgroupsByParent[group.id] && subgroupsByParent[group.id].length > 0 && (
                  <div className="subgroups-container">
                    <h4 className="subgroups-container__title">Subgrupos:</h4>
                    <div className="subgroups-grid">
                      {subgroupsByParent[group.id].map(subgroup => (
                        <Card key={subgroup.id} variant="outlined" padding="medium" className="subgroup-card">
                          <div className="subgroup-card__header">
                            <h5 className="subgroup-card__name">{subgroup.name}</h5>
                            <span className="subgroup-card__count">{subgroup.student_count || 0} estudiantes</span>
                          </div>
                          <div className="subgroup-card__actions">
                            <Button
                              variant="secondary"
                              size="small"
                              onClick={() => handleEditGroup(subgroup)}
                            >
                              ✏️
                            </Button>
                            <Button
                              variant="primary"
                              size="small"
                              onClick={() => handleAssignPoints(subgroup)}
                            >
                              ⭐
                            </Button>
                            <Button
                              variant="danger"
                              size="small"
                              onClick={() => handleDeleteGroup(subgroup)}
                            >
                              🗑️
                            </Button>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Modal de grupo manual */}
        <Modal
          isOpen={showManualModal}
          onClose={() => setShowManualModal(false)}
          title="Crear Grupo Independiente"
          size="large"
        >
          <ManualGroupForm
            userId={user.id}
            onSuccess={handleManualFormSuccess}
            onCancel={() => setShowManualModal(false)}
          />
        </Modal>

        {/* Modal de subgrupo */}
        <Modal
          isOpen={showSubgroupModal}
          onClose={() => {
            setShowSubgroupModal(false);
            setSelectedParentGroup(null);
            setSelectedGroup(null);
          }}
          title={selectedGroup ? 'Editar Subgrupo' : 'Crear Subgrupo'}
          size="large"
        >
          {selectedParentGroup && (
            <SubgroupForm
              parentGroup={selectedParentGroup}
              subgroup={selectedGroup}
              userId={user.id}
              onSuccess={handleSubgroupFormSuccess}
              onCancel={() => {
                setShowSubgroupModal(false);
                setSelectedParentGroup(null);
                setSelectedGroup(null);
              }}
            />
          )}
        </Modal>

        {/* Modal de calificación */}
        <Modal
          isOpen={showPointsModal}
          onClose={() => {
            setShowPointsModal(false);
            setSelectedGroup(null);
          }}
          title="Calificar Grupo"
          size="medium"
        >
          {selectedGroup && (
            <GroupPointsForm
              group={selectedGroup}
              userId={user.id}
              onSuccess={handlePointsFormSuccess}
              onCancel={() => {
                setShowPointsModal(false);
                setSelectedGroup(null);
              }}
            />
          )}
        </Modal>
      </div>
    </DashboardLayout>
  );
};

export default GroupsPage;
