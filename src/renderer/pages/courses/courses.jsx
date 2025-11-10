import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/templates/dashboardLayout';
import Card from '../../components/atoms/card';
import Button from '../../components/atoms/button';
import Modal from '../../components/atoms/modal';
import EmptyState from '../../components/atoms/emptyState';
import CourseForm from '../../components/organisms/courseForm';
import { courseService } from '../../services';
import { useAuth } from '../../context/authContext';
import './courses.css';

const CoursesPage = () => {
  const { user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    setLoading(true);
    try {
      const result = await courseService.getCoursesByUser(user.id);
      if (result.success) {
        setCourses(result.courses || []);
      }
    } catch (error) {
      console.error('Error al cargar cursos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCourse = () => {
    setSelectedCourse(null);
    setIsModalOpen(true);
  };

  const handleEditCourse = (course) => {
    setSelectedCourse(course);
    setIsModalOpen(true);
  };

  const handleDeleteCourse = async (courseId) => {
    if (!window.confirm('¿Estás seguro de eliminar este curso? Esta acción no se puede deshacer.')) {
      return;
    }

    try {
      const result = await courseService.deleteCourse(courseId, user.id);
      if (result.success) {
        await loadCourses();
      } else {
        alert(result.message || result.error || 'Error al eliminar curso');
      }
    } catch (error) {
      console.error('Error al eliminar curso:', error);
      alert('Error al eliminar curso');
    }
  };

  const handleFormSuccess = async () => {
    setIsModalOpen(false);
    setSelectedCourse(null);
    await loadCourses();
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedCourse(null);
  };

  const filteredCourses = courses.filter(course =>
    course.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    course.level.toLowerCase().includes(searchTerm.toLowerCase()) ||
    course.academic_period.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="courses-page">
        {/* Header con búsqueda y botón crear */}
        <div className="courses-page__header">
          <div className="courses-page__search">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/>
              <path d="m21 21-4.35-4.35"/>
            </svg>
            <input
              type="text"
              placeholder="Buscar cursos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="courses-page__search-input"
            />
          </div>
          <Button
            variant="primary"
            size="medium"
            onClick={handleCreateCourse}
            icon={
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="5" x2="12" y2="19"/>
                <line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
            }
          >
            Crear Curso
          </Button>
        </div>

        {/* Lista de cursos */}
        {loading ? (
          <div className="courses-page__loading">
            <div className="courses-page__spinner"></div>
            <p>Cargando cursos...</p>
          </div>
        ) : filteredCourses.length === 0 ? (
          courses.length === 0 ? (
            <EmptyState
              icon={
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
                  <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
                </svg>
              }
              title="No tienes cursos creados"
              description="Crea tu primer curso para comenzar a gestionar estudiantes y puntos de participación"
              action={
                <Button variant="primary" size="large" onClick={handleCreateCourse}>
                  Crear Mi Primer Curso
                </Button>
              }
            />
          ) : (
            <EmptyState
              icon={
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8"/>
                  <path d="m21 21-4.35-4.35"/>
                </svg>
              }
              title="No se encontraron cursos"
              description={`No hay cursos que coincidan con "${searchTerm}"`}
            />
          )
        ) : (
          <div className="courses-page__grid">
            {filteredCourses.map(course => (
              <Card key={course.id} variant="elevated" padding="medium" className="course-card">
                <div className="course-card__header">
                  <div className="course-card__icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
                      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
                    </svg>
                  </div>
                  <h3 className="course-card__title">{course.name}</h3>
                </div>

                <div className="course-card__info">
                  <div className="course-card__info-item">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                      <path d="M2 17l10 5 10-5"/>
                      <path d="M2 12l10 5 10-5"/>
                    </svg>
                    <span>{course.level}</span>
                  </div>
                  <div className="course-card__info-item">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                      <line x1="16" y1="2" x2="16" y2="6"/>
                      <line x1="8" y1="2" x2="8" y2="6"/>
                      <line x1="3" y1="10" x2="21" y2="10"/>
                    </svg>
                    <span>{course.academic_period}</span>
                  </div>
                </div>

                <div className="course-card__stats">
                  <div className="course-card__stat">
                    <span className="course-card__stat-value">{course.student_count || 0}</span>
                    <span className="course-card__stat-label">Estudiantes</span>
                  </div>
                </div>

                <div className="course-card__actions">
                  <Button
                    variant="secondary"
                    size="small"
                    onClick={() => handleEditCourse(course)}
                    icon={
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                      </svg>
                    }
                  >
                    Editar
                  </Button>
                  <Button
                    variant="danger"
                    size="small"
                    onClick={() => handleDeleteCourse(course.id)}
                    icon={
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="3 6 5 6 21 6"/>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                      </svg>
                    }
                  >
                    Eliminar
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Modal para crear/editar curso */}
        <Modal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          title={selectedCourse ? 'Editar Curso' : 'Crear Nuevo Curso'}
          size="medium"
        >
          <CourseForm
            course={selectedCourse}
            onSuccess={handleFormSuccess}
            onCancel={handleCloseModal}
          />
        </Modal>
      </div>
    </DashboardLayout>
  );
};

export default CoursesPage;