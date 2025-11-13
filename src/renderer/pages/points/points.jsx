import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/templates/dashboardLayout';
import Card from '../../components/atoms/card';
import Button from '../../components/atoms/button';
import Modal from '../../components/atoms/modal';
import EmptyState from '../../components/atoms/emptyState';
import Select from '../../components/atoms/select';
import Label from '../../components/atoms/label';
import PointForm from '../../components/organisms/pointForm';
import BulkPointForm from '../../components/organisms/bulkPointForm';
import { studentService, courseService, pointService, excelService } from '../../services';
import { useAuth } from '../../context/authContext';
import './points.css';

const PointsPage = () => {
  const { user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [students, setStudents] = useState([]);
  const [points, setPoints] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [loadingPoints, setLoadingPoints] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPoint, setSelectedPoint] = useState(null);
  const [filterType, setFilterType] = useState('all'); // 'all', 'course', 'student'
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false); // Nuevo: modal de asignación masiva

  useEffect(() => {
    loadCourses();
  }, []);

  useEffect(() => {
    if (selectedCourseId) {
      loadStudents(selectedCourseId);
      if (filterType === 'course') {
        loadCoursePoints(selectedCourseId);
      }
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
          setFilterType('course');
        }
      }
    } catch (error) {
      console.error('Error al cargar cursos:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStudents = async (courseId) => {
    setLoadingStudents(true);
    try {
      const result = await studentService.getStudentsByCourse(courseId);
      if (result && result.success) {
        const studentsArray = Array.isArray(result.students) ? result.students : [];
        setStudents(studentsArray);
      } else {
        setStudents([]);
      }
    } catch (error) {
      console.error('Error al cargar estudiantes:', error);
      setStudents([]);
    } finally {
      setLoadingStudents(false);
    }
  };

  const loadCoursePoints = async () => {
    setLoading(true);
    try {
      const result = await courseService.getCoursesByUser(user.id);
      if (result.success) {
        const newCourses = result.courses || [];
        setCourses(newCourses);
        
        // **CORRECCIÓN CRÍTICA DE ESTADO HUÉRFANO:**
        // 1. Obtener el ID seleccionado actualmente.
        const currentSelectedCourseId = selectedCourseId;
        // 2. Verificar si este ID todavía existe en la nueva lista de cursos.
        const exists = newCourses.some(c => c.id === currentSelectedCourseId);

        if (currentSelectedCourseId && exists) {
            // Si el ID aún existe, mantenerlo (no hacer nada).
        } else if (newCourses.length > 0) {
          // Si el ID fue eliminado o estaba vacío, seleccionar el primer curso.
          setSelectedCourseId(newCourses[0].id);
        } else {
          // Si no hay cursos, limpiar todo para evitar referencias a null.
          setSelectedCourseId('');
          setStudents([]); 
        }
      }
    } catch (error) {
      console.error('Error al cargar cursos:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStudentPoints = async (studentId) => {
    setLoadingPoints(true);
    try {
      const result = await pointService.getStudentHistory(studentId, 50);
      if (result.success) {
        setPoints(result.points || []);
      } else {
        setPoints([]);
      }
    } catch (error) {
      console.error('Error al cargar puntos del estudiante:', error);
      setPoints([]);
    } finally {
      setLoadingPoints(false);
    }
  };

  const handleCourseChange = (e) => {
    const courseId = parseInt(e.target.value);
    setSelectedCourseId(courseId);
    setSelectedStudentId('');
    setFilterType('course');
  };

  const handleStudentChange = (e) => {
    const studentId = e.target.value;
    setSelectedStudentId(studentId);
    if (studentId) {
      setFilterType('student');
      loadStudentPoints(parseInt(studentId));
    } else {
      setFilterType('course');
      if (selectedCourseId) {
        loadCoursePoints(selectedCourseId);
      }
    }
  };

  const handleAssignPoints = () => {
    if (!selectedStudentId) {
      // Si no hay estudiante seleccionado, abrir modal de asignación masiva
      if (students.length === 0) {
        alert('No hay estudiantes en este curso');
        return;
      }
      setIsBulkModalOpen(true);
      return;
    }
    // Si hay estudiante seleccionado, abrir modal normal
    setSelectedPoint(null);
    setIsModalOpen(true);
  };

  const handleEditPoint = (point) => {
    // Establecer el estudiante correcto
    const student = students.find(s => s.id === point.student_id);
    if (student) {
      setSelectedStudentId(student.id);
    }
    setSelectedPoint(point);
    setIsModalOpen(true);
  };

  const handleDeletePoint = async (pointId) => {
    if (!window.confirm('¿Estás seguro de eliminar este registro de puntos?')) {
      return;
    }

    try {
      const result = await pointService.deletePoint(pointId);
      if (result.success) {
        // Recargar la lista según el filtro actual
        if (filterType === 'student' && selectedStudentId) {
          await loadStudentPoints(selectedStudentId);
        } else if (filterType === 'course' && selectedCourseId) {
          await loadCoursePoints(selectedCourseId);
        }
        // Recargar estudiantes para actualizar totales
        await loadStudents(selectedCourseId);
      } else {
        alert(result.error || 'Error al eliminar punto');
      }
    } catch (error) {
      console.error('Error al eliminar punto:', error);
      alert('Error al eliminar punto');
    }
  };

  const handleFormSuccess = async (updateResult) => { // AHORA RECIBE EL RESULTADO
    setIsModalOpen(false);
    setSelectedPoint(null);
    
    // Recargar estudiantes primero para actualizar totales y forzar recálculo de selectedStudent
    // Este re-fetch es necesario para que el nuevo estado de 'students' actualice la variable derivada 'selectedStudent'
    await loadStudents(selectedCourseId); 
    
    // Luego recargar la lista según el filtro actual
    if (selectedStudentId) {
      await loadStudentPoints(parseInt(selectedStudentId));
    } else if (selectedCourseId) {
      await loadCoursePoints(selectedCourseId);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedPoint(null);
  };

  const handleBulkFormSuccess = async ({ successCount, failCount }) => {
    setIsBulkModalOpen(false);
    
    // Recargar estudiantes y puntos
    await loadStudents(selectedCourseId);
    if (filterType === 'course' && selectedCourseId) {
      await loadCoursePoints(selectedCourseId);
    }
    
    // Mostrar mensaje de éxito
    alert(`✅ Puntos asignados a ${successCount} estudiante(s)${failCount > 0 ? `\n⚠️ ${failCount} falló(s)` : ''}`);
  };

  const handleCloseBulkModal = () => {
    setIsBulkModalOpen(false);
  };

  const handleExportPoints = async () => {
    if (!selectedCourseId) {
      alert('Selecciona un curso primero');
      return;
    }

    const course = courses.find(c => c.id === parseInt(selectedCourseId));
    if (!course) return;

    setLoading(true);
    try {
      const result = await excelService.exportPoints(course.id, course.name);

      if (result.success) {
        alert(`Exportación exitosa!\n\nArchivo: ${result.fileName}\nPuntos: ${result.pointsCount}\n\nEl archivo se abrió en tu carpeta de Descargas.`);
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error al exportar puntos');
    } finally {
      setLoading(false);
    }
  };


  const selectedCourse = courses.find(c => c.id === selectedCourseId);
  const selectedStudent = students.find(s => s.id === parseInt(selectedStudentId));

  const courseOptions = courses.map(course => ({
    value: course.id,
    label: `${course.name} - ${course.level}`
  }));

  const studentOptions = [
    { value: '', label: 'Todos los estudiantes' },
    ...students.map(student => ({
      value: student.id,
      label: `${student.list_number}. ${student.full_name}`
    }))
  ];

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-PE', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <DashboardLayout>
      <div className="points-page">
        {/* Header con selectores */}
        <div className="points-page__header">
          <div className="points-page__course-selector">
            <Label htmlFor="courseSelect">Curso</Label>
            <Select
              name="courseSelect"
              value={selectedCourseId}
              onChange={handleCourseChange}
              options={courseOptions}
              placeholder="Selecciona un curso"
              disabled={loading || courses.length === 0}
              icon={
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
                  <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
                </svg>
              }
            />
          </div>

          {selectedCourseId && (
            <>
              <div className="points-page__student-selector">
                <Label htmlFor="studentSelect">Estudiante</Label>
                <Select
                  name="studentSelect"
                  value={selectedStudentId}
                  onChange={handleStudentChange}
                  options={studentOptions}
                  disabled={loadingStudents || students.length === 0}
                  icon={
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                      <circle cx="12" cy="7" r="4"/>
                    </svg>
                  }
                />
              </div>
              <div className="points-page__actions">
                <Button
                  variant="secondary"
                  size="medium"
                  onClick={handleExportPoints}
                  loading={loading}
                  title="Exportar a Excel"
                >
                  📊 Exportar
                </Button>
                <Button
                  variant="primary"
                  size="medium"
                  onClick={handleAssignPoints}
                  icon={
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="12" y1="5" x2="12" y2="19"/>
                      <line x1="5" y1="12" x2="19" y2="12"/>
                    </svg>
                  }
                >
                  {selectedStudentId ? 'Asignar Puntos' : 'Asignar a Todos'}
                </Button>
              </div>
            </>
          )}
        </div>

        {/* Información del curso/estudiante seleccionado */}
        {selectedCourse && (
          <Card variant="outlined" padding="medium" className="points-page__info-card">
            <div className="points-page__info-content">
              <div className="points-page__info-main">
                <h3>{selectedCourse.name}</h3>
                <div className="points-page__info-meta">
                  <span>{selectedCourse.level}</span>
                  <span>•</span>
                  <span>{selectedCourse.academic_period}</span>
                  {selectedStudent && (
                    <>
                      <span>•</span>
                      <span className="points-page__student-highlight">
                        {selectedStudent.full_name}
                      </span>
                    </>
                  )}
                </div>
              </div>
              {selectedStudent && (
                <div className="points-page__student-stats">
                  <div className="points-page__stat">
                    <span className="points-page__stat-value">{selectedStudent.total_points || 0}</span>
                    <span className="points-page__stat-label">Puntos Totales</span>
                  </div>
                  <div className="points-page__stat">
                    <span className="points-page__stat-value">{selectedStudent.rounded_average || 0}</span>
                    <span className="points-page__stat-label">Promedio</span>
                  </div>
                </div>
              )}
            </div>
          </Card>
        )}

        {/* Lista de puntos */}
        {loading ? (
          <div className="points-page__loading">
            <div className="points-page__spinner"></div>
            <p>Cargando...</p>
          </div>
        ) : courses.length === 0 ? (
          <EmptyState
            icon={
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
                <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
              </svg>
            }
            title="No tienes cursos creados"
            description="Primero crea un curso y agrega estudiantes para poder asignar puntos"
          />
        ) : !selectedCourseId ? (
          <EmptyState
            icon={
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
                <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
              </svg>
            }
            title="Selecciona un curso"
            description="Elige un curso para ver el historial de puntos"
          />
        ) : loadingPoints ? (
          <div className="points-page__loading">
            <div className="points-page__spinner"></div>
            <p>Cargando historial...</p>
          </div>
        ) : points.length === 0 ? (
          <EmptyState
            icon={
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <path d="M12 6v6l4 2"/>
              </svg>
            }
            title={selectedStudent ? `${selectedStudent.full_name} aún no tiene puntos` : "No hay puntos asignados"}
            description={selectedStudent ? "Asigna los primeros puntos para comenzar el seguimiento" : "Asigna puntos a tus estudiantes para ver el historial aquí"}
            action={
              selectedStudent && (
                <Button variant="primary" size="large" onClick={handleAssignPoints}>
                  Asignar Primeros Puntos
                </Button>
              )
            }
          />
        ) : (
          <div className="points-page__table-container">
            <table className="points-table">
              <thead>
                <tr>
                  <th>Fecha</th>
                  {!selectedStudent && <th>Estudiante</th>}
                  <th>Tipo de Participación</th>
                  <th>Puntos</th>
                  <th>Razón</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {points.map(point => (
                  <tr key={point.id} className="point-row">
                    <td className="point-row__date">{formatDate(point.created_at)}</td>
                    {!selectedStudent && (
                      <td className="point-row__student">
                        <div className="point-row__student-info">
                          <div className="point-row__student-avatar">
                            {point.student_name?.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="point-row__student-name">{point.student_name}</div>
                            <div className="point-row__student-list">N° {point.list_number}</div>
                          </div>
                        </div>
                      </td>
                    )}
                    <td className="point-row__type">{point.participation_type_name}</td>
                    <td className={`point-row__points ${point.points_value > 0 ? 'positive' : 'negative'}`}>
                      {point.points_value > 0 ? '+' : ''}{point.points_value}
                    </td>
                    <td className="point-row__reason">{point.reason || '-'}</td>
                    <td className="point-row__actions">
                      <Button
                        variant="secondary"
                        size="small"
                        onClick={() => handleEditPoint(point)}
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
                        onClick={() => handleDeletePoint(point.id)}
                        icon={
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="3 6 5 6 21 6"/>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                          </svg>
                        }
                      >
                        Eliminar
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Modal para asignar/editar puntos */}
        <Modal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          title={selectedPoint ? 'Editar Puntos' : 'Asignar Puntos'}
          size="medium"
        >
          <PointForm
            point={selectedPoint}
            studentId={parseInt(selectedStudentId)}
            studentName={selectedStudent?.full_name || ''}
            onSuccess={handleFormSuccess}
            onCancel={handleCloseModal}
          />
        </Modal>

        {/* Modal para asignación masiva */}
        <Modal
          isOpen={isBulkModalOpen}
          onClose={handleCloseBulkModal}
          title="Asignar Puntos a Todos los Estudiantes"
          size="medium"
        >
          <BulkPointForm
            students={students}
            courseId={selectedCourseId}
            courseName={selectedCourse?.name || ''}
            onSuccess={handleBulkFormSuccess}
            onCancel={handleCloseBulkModal}
          />
        </Modal>
      </div>
    </DashboardLayout>
  );
};

export default PointsPage;