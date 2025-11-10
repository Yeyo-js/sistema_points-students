import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import Button from '../../atoms/button';
import FormField from '../../molecules/formField';
import Card from '../../atoms/card';
import { useAuth } from '../../../context/authContext';
import './loginForm.css';

const LoginForm = ({ onSuccess }) => {
  const navigate = useNavigate();
  const { login } = useAuth();
  
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [generalError, setGeneralError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
    
    if (generalError) {
      setGeneralError('');
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.username.trim()) {
      newErrors.username = 'El nombre de usuario es requerido';
    }

    if (!formData.password) {
      newErrors.password = 'La contraseña es requerida';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setGeneralError('');

    try {
      const result = await login(formData.username, formData.password);

      if (result.success) {
        console.log('✅ Login exitoso en el formulario');
        
        if (onSuccess) {
          onSuccess();
        }
        
        // Navegar al dashboard
        navigate('/dashboard');
      } else {
        setGeneralError(result.message || result.error || 'Error al iniciar sesión');
      }
    } catch (error) {
      console.error('Error en login:', error);
      setGeneralError('Error de conexión. Intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoToRegister = () => {
    navigate('/register');
  };

  return (
    <Card variant="elevated" padding="large" className="login-form">
      <form onSubmit={handleSubmit} className="login-form__form">
        {generalError && (
          <div className="login-form__error-banner">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <span>{generalError}</span>
          </div>
        )}

        <FormField
          label="Nombre de Usuario"
          type="text"
          name="username"
          value={formData.username}
          onChange={handleChange}
          placeholder="Ingresa tu usuario"
          error={errors.username}
          required
          disabled={loading}
          autoComplete="username"
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
          }
        />

        <FormField
          label="Contraseña"
          type="password"
          name="password"
          value={formData.password}
          onChange={handleChange}
          placeholder="Ingresa tu contraseña"
          error={errors.password}
          required
          disabled={loading}
          autoComplete="current-password"
        />

        <div className="login-form__actions">
          <Button
            type="submit"
            variant="primary"
            size="large"
            fullWidth
            loading={loading}
            disabled={loading}
          >
            {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
          </Button>
        </div>

        <div className="login-form__divider">
          <span>¿No tienes una cuenta?</span>
        </div>

        <Button
          type="button"
          variant="ghost"
          size="medium"
          fullWidth
          onClick={handleGoToRegister}
          disabled={loading}
        >
          Crear Cuenta Nueva
        </Button>
      </form>
    </Card>
  );
};

LoginForm.propTypes = {
  onSuccess: PropTypes.func
};

export default LoginForm;