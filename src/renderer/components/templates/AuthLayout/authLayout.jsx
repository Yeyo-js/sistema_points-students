import React from 'react';
import PropTypes from 'prop-types';
import './authLayout.css';

const AuthLayout = ({ children, title, subtitle }) => {
  return (
    <div className="auth-layout">
      {/* Lado izquierdo - Imagen de fondo */}
      <div className="auth-layout__image-side">
        <div className="auth-layout__overlay">
          <div className="auth-layout__branding">
            <div className="auth-layout__logo">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                <path d="M2 17l10 5 10-5"/>
                <path d="M2 12l10 5 10-5"/>
              </svg>
            </div>
            <h1 className="auth-layout__title">Sistema de Puntos</h1>
            <p className="auth-layout__tagline">
              Gestiona la participación de tus estudiantes de forma simple y efectiva
            </p>
          </div>
          
          <div className="auth-layout__features">
            <div className="auth-layout__feature">
              <div className="auth-layout__feature-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                  <circle cx="9" cy="7" r="4"/>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                </svg>
              </div>
              <div>
                <h3>Gestión de Estudiantes</h3>
                <p>Organiza y administra fácilmente</p>
              </div>
            </div>

            <div className="auth-layout__feature">
              <div className="auth-layout__feature-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
                </svg>
              </div>
              <div>
                <h3>Seguimiento en Tiempo Real</h3>
                <p>Monitorea el progreso instantáneamente</p>
              </div>
            </div>

            <div className="auth-layout__feature">
              <div className="auth-layout__feature-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                  <line x1="16" y1="13" x2="8" y2="13"/>
                  <line x1="16" y1="17" x2="8" y2="17"/>
                  <polyline points="10 9 9 9 8 9"/>
                </svg>
              </div>
              <div>
                <h3>Reportes Detallados</h3>
                <p>Exporta datos a Excel fácilmente</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Lado derecho - Formulario */}
      <div className="auth-layout__form-side">
        <div className="auth-layout__form-container">
          <div className="auth-layout__form-header">
            <h2 className="auth-layout__form-title">{title}</h2>
            {subtitle && <p className="auth-layout__form-subtitle">{subtitle}</p>}
          </div>
          
          <div className="auth-layout__form-content">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

AuthLayout.propTypes = {
  children: PropTypes.node.isRequired,
  title: PropTypes.string.isRequired,
  subtitle: PropTypes.string
};

export default AuthLayout;