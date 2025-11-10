import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/authContext';
import LoginPage from './pages/auth/login';
import RegisterPage from './pages/auth/register';
import DashboardPage from './pages/dashboard/dashboard';
import CoursesPage from './pages/courses/courses';
import StudentsPage from './pages/students/students';

// Componente de loading
const LoadingScreen = () => (
  <div style={{
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'var(--color-bg-dark)',
    color: 'var(--color-primary)'
  }}>
    <div style={{ textAlign: 'center' }}>
      <div style={{
        width: '60px',
        height: '60px',
        border: '4px solid var(--color-primary-light)',
        borderTop: '4px solid var(--color-primary)',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite',
        margin: '0 auto 1rem'
      }}></div>
      <p>Cargando...</p>
    </div>
  </div>
);

// Componente para rutas protegidas
const PrivateRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return <LoadingScreen />;
  }
  
  return isAuthenticated ? children : <Navigate to="/login" />;
};

// Componente para rutas públicas (solo accesibles si NO está autenticado)
const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return <LoadingScreen />;
  }
  
  return !isAuthenticated ? children : <Navigate to="/dashboard" />;
};

// Componente de rutas
const AppRoutes = () => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <Routes>
      {/* Ruta raíz */}
      <Route 
        path="/" 
        element={
          isAuthenticated 
            ? <Navigate to="/dashboard" /> 
            : <Navigate to="/login" />
        } 
      />

      {/* Rutas públicas */}
      <Route 
        path="/login" 
        element={
          <PublicRoute>
            <LoginPage />
          </PublicRoute>
        } 
      />
      <Route 
        path="/register" 
        element={
          <PublicRoute>
            <RegisterPage />
          </PublicRoute>
        } 
      />

      {/* Rutas privadas */}
      <Route 
        path="/dashboard" 
        element={
          <PrivateRoute>
            <DashboardPage />
          </PrivateRoute>
        } 
      />
      
      <Route 
        path="/dashboard/courses" 
        element={
          <PrivateRoute>
            <CoursesPage />
          </PrivateRoute>
        } 
      />

      {/* RUTA DE ESTUDIANTES */}
      <Route 
        path="/dashboard/students" 
        element={
          <PrivateRoute>
            <StudentsPage />
          </PrivateRoute>
        } 
      />

      {/* Ruta 404 */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
}

export default App;