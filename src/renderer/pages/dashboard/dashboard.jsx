import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/templates/dashboardLayout/dashboardLayout';
import Card from '../../components/atoms/card';
import { useAuth } from '../../context/authContext';
import './dashboard.css';

const DashboardPage = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalCourses: 0,
    totalStudents: 0,
    totalPoints: 0,
    totalParticipationTypes: 7
  });

  useEffect(() => {
    // TODO: Cargar estadísticas reales desde la base de datos
    loadStats();
  }, []);

  const loadStats = async () => {
    // Por ahora dejamos valores por defecto
    setStats({
      totalCourses: 0,
      totalStudents: 0,
      totalPoints: 0,
      totalParticipationTypes: 7
    });
  };

  const statCards = [
    {
      id: 'courses',
      title: 'Cursos',
      value: stats.totalCourses,
      icon: (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
          <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
        </svg>
      ),
      color: 'primary',
      description: 'Cursos activos'
    },
    {
      id: 'students',
      title: 'Estudiantes',
      value: stats.totalStudents,
      icon: (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
          <circle cx="9" cy="7" r="4"/>
          <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
          <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
        </svg>
      ),
      color: 'secondary',
      description: 'Total de estudiantes'
    },
    {
      id: 'points',
      title: 'Puntos Asignados',
      value: stats.totalPoints,
      icon: (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10"/>
          <path d="M12 6v6l4 2"/>
        </svg>
      ),
      color: 'warning',
      description: 'Puntos totales'
    },
    {
      id: 'types',
      title: 'Tipos de Participación',
      value: stats.totalParticipationTypes,
      icon: (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="8" y1="6" x2="21" y2="6"/>
          <line x1="8" y1="12" x2="21" y2="12"/>
          <line x1="8" y1="18" x2="21" y2="18"/>
          <line x1="3" y1="6" x2="3.01" y2="6"/>
          <line x1="3" y1="12" x2="3.01" y2="12"/>
          <line x1="3" y1="18" x2="3.01" y2="18"/>
        </svg>
      ),
      color: 'purple',
      description: 'Tipos configurados'
    }
  ];

  const quickActions = [
    {
      id: 'create-course',
      title: 'Crear Curso',
      description: 'Configura un nuevo curso',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="12" y1="5" x2="12" y2="19"/>
          <line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
      ),
      action: () => console.log('Crear curso')
    },
    {
      id: 'add-student',
      title: 'Agregar Estudiante',
      description: 'Registra un nuevo estudiante',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
          <circle cx="8.5" cy="7" r="4"/>
          <line x1="20" y1="8" x2="20" y2="14"/>
          <line x1="23" y1="11" x2="17" y2="11"/>
        </svg>
      ),
      action: () => console.log('Agregar estudiante')
    },
    {
      id: 'assign-points',
      title: 'Asignar Puntos',
      description: 'Registra participación',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="9 11 12 14 22 4"/>
          <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
        </svg>
      ),
      action: () => console.log('Asignar puntos')
    }
  ];

  return (
    <DashboardLayout>
      <div className="dashboard-page">
        {/* Welcome Section */}
        <div className="dashboard-page__welcome">
          <div>
            <h2 className="dashboard-page__welcome-title">
              ¡Hola, {user?.full_name}! 👋
            </h2>
            <p className="dashboard-page__welcome-subtitle">
              Aquí tienes un resumen de tu actividad
            </p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="dashboard-page__stats-grid">
          {statCards.map(stat => (
            <Card key={stat.id} variant="elevated" padding="medium" className={`dashboard-page__stat-card dashboard-page__stat-card--${stat.color}`}>
              <div className="dashboard-page__stat-icon">
                {stat.icon}
              </div>
              <div className="dashboard-page__stat-content">
                <span className="dashboard-page__stat-label">{stat.title}</span>
                <span className="dashboard-page__stat-value">{stat.value}</span>
                <span className="dashboard-page__stat-description">{stat.description}</span>
              </div>
            </Card>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="dashboard-page__section">
          <h3 className="dashboard-page__section-title">Acciones Rápidas</h3>
          <div className="dashboard-page__actions-grid">
            {quickActions.map(action => (
              <Card 
                key={action.id} 
                variant="elevated" 
                padding="medium" 
                className="dashboard-page__action-card"
                onClick={action.action}
              >
                <div className="dashboard-page__action-icon">
                  {action.icon}
                </div>
                <h4 className="dashboard-page__action-title">{action.title}</h4>
                <p className="dashboard-page__action-description">{action.description}</p>
              </Card>
            ))}
          </div>
        </div>

        {/* Getting Started */}
        <Card variant="outlined" padding="large" className="dashboard-page__getting-started">
          <div className="dashboard-page__getting-started-header">
            <div>
              <h3 className="dashboard-page__getting-started-title">🚀 Comienza Ahora</h3>
              <p className="dashboard-page__getting-started-subtitle">
                Sigue estos pasos para configurar tu sistema
              </p>
            </div>
          </div>
          
          <div className="dashboard-page__steps">
            <div className="dashboard-page__step">
              <div className="dashboard-page__step-number">1</div>
              <div className="dashboard-page__step-content">
                <h4>Crea tu primer curso</h4>
                <p>Define el nombre, nivel y período académico</p>
              </div>
            </div>
            
            <div className="dashboard-page__step">
              <div className="dashboard-page__step-number">2</div>
              <div className="dashboard-page__step-content">
                <h4>Agrega estudiantes</h4>
                <p>Registra a tus estudiantes manualmente o importa desde Excel</p>
              </div>
            </div>
            
            <div className="dashboard-page__step">
              <div className="dashboard-page__step-number">3</div>
              <div className="dashboard-page__step-content">
                <h4>Configura tipos de participación</h4>
                <p>Ya tienes 7 tipos predeterminados, personalízalos si lo necesitas</p>
              </div>
            </div>
            
            <div className="dashboard-page__step">
              <div className="dashboard-page__step-number">4</div>
              <div className="dashboard-page__step-content">
                <h4>Comienza a asignar puntos</h4>
                <p>Registra la participación de tus estudiantes</p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default DashboardPage;