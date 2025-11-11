import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/templates/dashboardLayout';
import Card from '../../components/atoms/card';
import Button from '../../components/atoms/button';
import Modal from '../../components/atoms/modal';
import EmptyState from '../../components/atoms/emptyState';
import Select from '../../components/atoms/select';
import Label from '../../components/atoms/label';
import StudentForm from '../../components/organisms/studentForm';
import { studentService, courseService, excelService } from '../../services';
import { useAuth } from '../../context/authContext';
import './students.css';

const StudentsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [students, setStudents] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [showImportModal, setShowImportModal] = useState(false);

  useEffect(() => {
    loadCourses();
  }, []);

  useEffect(() => {
    if (selectedCourseId) {
      loadStudents(selectedCourseId);
    }
  }, [selectedCourseId]);

  const loadCourses = async () => {
    setLoading(true);
    try {
      const result = await courseService.getCoursesByUser(user.id);
      if (result.success) {
        setCourses(result.courses || []);
        // Si hay cursos, seleccionar el primero automáticamente
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

  const loadStudents = async (courseId) => {
    setLoadingStudents(true);
    try {
      console.log("📚 Cargando estudiantes para curso:", courseId);
      const result = await studentService.getStudentsByCourse(courseId);

      console.log("📊 Resultado de getStudentsByCourse:", result);

      if (result && result.success) {
        const studentsArray = Array.isArray(result.students)
          ? result.students
          : [];
        console.log("✅ Estudiantes cargados:", studentsArray.length);
        setStudents(studentsArray);
      } else {
        console.warn("⚠️ No se pudieron cargar estudiantes");
        setStudents([]);
      }
    } catch (error) {
      console.error("❌ Error al cargar estudiantes:", error);
      setStudents([]);
    } finally {
      setLoadingStudents(false);
    }
  };

  const handleCourseChange = (e) => {
    const courseId = parseInt(e.target.value);
    setSelectedCourseId(courseId);
    setSearchTerm('');
  };

  const handleCreateStudent = () => {
    if (!selectedCourseId) {
      alert('Por favor selecciona un curso primero');
      return;
    }
    setSelectedStudent(null);
    setIsModalOpen(true);
  };

  const handleEditStudent = (student) => {
    setSelectedStudent(student);
    setIsModalOpen(true);
  };

  const handleDeleteStudent = async (studentId) => {
    if (!window.confirm('¿Estás seguro de eliminar este estudiante? Esta acción no se puede deshacer.')) {
      return;
    }

    try {
      const result = await studentService.deleteStudent(studentId);
      if (result.success) {
        await loadStudents(selectedCourseId);
      } else {
        alert(result.error || 'Error al eliminar estudiante');
      }
    } catch (error) {
      console.error('Error al eliminar estudiante:', error);
      alert('Error al eliminar estudiante');
    }
  };

  const handleFormSuccess = async () => {
    setIsModalOpen(false);
    setSelectedStudent(null);
    await loadStudents(selectedCourseId);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedStudent(null);
  };

  const handleExportStudents = async () => {
    if (!selectedCourseId) {
      alert('Selecciona un curso primero');
      return;
    }

    const course = courses.find(c => c.id === parseInt(selectedCourseId));
    if (!course) return;

    setLoading(true);
    try {
      const result = await excelService.exportStudents(course.id, course.name);

      if (result.success) {
        alert(`Exportación exitosa!\n\nArchivo: ${result.fileName}\nEstudiantes: ${result.studentsCount}\n\nEl archivo se abrió en tu carpeta de Descargas.`);
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error al exportar estudiantes');
    } finally {
      setLoading(false);
    }
  };

  const handleImportStudents = async () => {
    if (!selectedCourseId) {
      alert('Selecciona un curso primero');
      return;
    }

    setImporting(true);
    try {
      const result = await excelService.importStudents(parseInt(selectedCourseId));

      if (result.canceled) {
        setImporting(false);
        return;
      }

      if (result.success) {
        setImportResult(result);
        setShowImportModal(true);

        // Recargar estudiantes
        if (result.imported && result.imported.length > 0) {
          loadStudents(selectedCourseId);
        }
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error al importar estudiantes');
    } finally {
      setImporting(false);
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      const result = await excelService.downloadTemplate();

      if (result.success) {
        alert(`Plantilla descargada!\n\nArchivo: ${result.fileName}\n\nSe abrió en tu carpeta de Descargas.`);
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error al descargar plantilla');
    }
  };

  const filteredStudents = students.filter(student =>
    student.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (student.student_code && student.student_code.toLowerCase().includes(searchTerm.toLowerCase())) ||
    student.list_number.toString().includes(searchTerm)
  );

  const selectedCourse = courses.find(c => c.id === selectedCourseId);

  const courseOptions = courses.map(course => ({
    value: course.id,
    label: `${course.name} - ${course.level}`
  }));

  return (
    <DashboardLayout>
      <div className="students-page">
        {/* Header con selector de curso y búsqueda */}
        <div className="students-page__header">
          <div className="students-page__course-selector">
            <Label htmlFor="courseSelect">Seleccionar Curso</Label>
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
              <div className="students-page__search">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8"/>
                  <path d="m21 21-4.35-4.35"/>
                </svg>
                <input
                  type="text"
                  placeholder="Buscar estudiantes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="students-page__search-input"
                />
              </div>
              <div className="students-page__actions">
                <Button
                  variant="outline"
                  size="medium"
                  onClick={handleDownloadTemplate}
                  title="Descargar plantilla Excel"
                >
                  📥 Plantilla
                </Button>
                <Button
                  variant="secondary"
                  size="medium"
                  onClick={handleImportStudents}
                  loading={importing}
                  title="Importar desde Excel"
                >
                  📤 Importar
                </Button>
                <Button
                  variant="secondary"
                  size="medium"
                  onClick={handleExportStudents}
                  loading={loading}
                  title="Exportar a Excel"
                >
                  📊 Exportar
                </Button>
                <Button
                  variant="primary"
                  size="medium"
                  onClick={handleCreateStudent}
                  icon={
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="12" y1="5" x2="12" y2="19"/>
                      <line x1="5" y1="12" x2="19" y2="12"/>
                    </svg>
                  }
                >
                  Agregar Estudiante
                </Button>
              </div>
            </>
          )}
        </div>

        {/* Información del curso seleccionado */}
        {selectedCourse && (
          <Card variant="outlined" padding="medium" className="students-page__course-info">
            <div className="students-page__course-details">
              <h3>{selectedCourse.name}</h3>
              <div className="students-page__course-meta">
                <span>{selectedCourse.level}</span>
                <span>•</span>
                <span>{selectedCourse.academic_period}</span>
                <span>•</span>
                <span>{students.length} estudiante(s)</span>
              </div>
            </div>
          </Card>
        )}

        {/* Lista de estudiantes */}
        {loading ? (
          <div className="students-page__loading">
            <div className="students-page__spinner"></div>
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
            description="Primero crea un curso para poder agregar estudiantes"
            action={
              <Button variant="primary" size="large" onClick={() => navigate('/dashboard/courses')}>
                Ir a Cursos
              </Button>
            }
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
            description="Elige un curso para ver y gestionar sus estudiantes"
          />
        ) : loadingStudents ? (
          <div className="students-page__loading">
            <div className="students-page__spinner"></div>
            <p>Cargando estudiantes...</p>
          </div>
        ) : filteredStudents.length === 0 ? (
          students.length === 0 ? (
            <EmptyState
              icon={
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                  <circle cx="9" cy="7" r="4"/>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                </svg>
              }
              title="No hay estudiantes en este curso"
              description="Agrega tu primer estudiante para comenzar a gestionar sus puntos"
              action={
                <Button variant="primary" size="large" onClick={handleCreateStudent}>
                  Agregar Primer Estudiante
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
              title="No se encontraron estudiantes"
              description={`No hay estudiantes que coincidan con "${searchTerm}"`}
            />
          )
        ) : (
          <div className="students-page__table-container">
            <table className="students-table">
              <thead>
                <tr>
                  <th>N°</th>
                  <th>Nombre Completo</th>
                  <th>Código</th>
                  <th>Puntos</th>
                  <th>Promedio</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map(student => (
                  <tr key={student.id} className="student-row">
                    <td className="student-row__number">{student.list_number}</td>
                    <td className="student-row__name">
                      <div className="student-row__avatar">
                        {student.full_name.charAt(0).toUpperCase()}
                      </div>
                      <span>{student.full_name}</span>
                    </td>
                    <td>{student.student_code || '-'}</td>
                    <td className="student-row__points">{student.total_points || 0}</td>
                    <td className="student-row__average">{student.rounded_average || 0}</td>
                    <td className="student-row__actions">
                      <Button
                        variant="secondary"
                        size="small"
                        onClick={() => handleEditStudent(student)}
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
                        onClick={() => handleDeleteStudent(student.id)}
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

        {/* Modal para crear/editar estudiante */}
        <Modal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          title={selectedStudent ? 'Editar Estudiante' : 'Agregar Nuevo Estudiante'}
          size="medium"
        >
          <StudentForm
            student={selectedStudent}
            courseId={selectedCourseId}
            onSuccess={handleFormSuccess}
            onCancel={handleCloseModal}
          />
        </Modal>

        {/* Modal de resultados de importación */}
        {showImportModal && importResult && (
          <Modal
            isOpen={showImportModal}
            onClose={() => {
              setShowImportModal(false);
              setImportResult(null);
            }}
            title="Resultado de Importación"
            size="large"
          >
            <div className="import-result">
              <div className="import-result__summary">
                <div className="import-result__stat import-result__stat--success">
                  <h3>{importResult.imported?.length || 0}</h3>
                  <p>Importados</p>
                </div>
                <div className="import-result__stat import-result__stat--warning">
                  <h3>{importResult.duplicates?.length || 0}</h3>
                  <p>Duplicados</p>
                </div>
                <div className="import-result__stat import-result__stat--error">
                  <h3>{importResult.errors?.length || 0}</h3>
                  <p>Errores</p>
                </div>
              </div>

              {importResult.imported && importResult.imported.length > 0 && (
                <div className="import-result__section">
                  <h4>✅ Estudiantes Importados ({importResult.imported.length})</h4>
                  <ul>
                    {importResult.imported.slice(0, 10).map(item => (
                      <li key={item.row}>
                        Fila {item.row}: {item.data.fullName}
                      </li>
                    ))}
                    {importResult.imported.length > 10 && (
                      <li>... y {importResult.imported.length - 10} más</li>
                    )}
                  </ul>
                </div>
              )}

              {importResult.duplicates && importResult.duplicates.length > 0 && (
                <div className="import-result__section import-result__section--warning">
                  <h4>⚠️ Duplicados ({importResult.duplicates.length})</h4>
                  <ul>
                    {importResult.duplicates.slice(0, 5).map((item, idx) => (
                      <li key={idx}>
                        Fila {item.row}: {item.data.fullName} - {item.reason}
                      </li>
                    ))}
                    {importResult.duplicates.length > 5 && (
                      <li>... y {importResult.duplicates.length - 5} más</li>
                    )}
                  </ul>
                </div>
              )}

              {importResult.errors && importResult.errors.length > 0 && (
                <div className="import-result__section import-result__section--error">
                  <h4>❌ Errores ({importResult.errors.length})</h4>
                  <ul>
                    {importResult.errors.slice(0, 5).map((item, idx) => (
                      <li key={idx}>
                        Fila {item.row}: {item.error}
                      </li>
                    ))}
                    {importResult.errors.length > 5 && (
                      <li>... y {importResult.errors.length - 5} más</li>
                    )}
                  </ul>
                </div>
              )}

              <div className="import-result__actions">
                <Button
                  variant="primary"
                  size="medium"
                  onClick={() => {
                    setShowImportModal(false);
                    setImportResult(null);
                  }}
                >
                  Cerrar
                </Button>
              </div>
            </div>
          </Modal>
        )}
      </div>
    </DashboardLayout>
  );
};

export default StudentsPage;