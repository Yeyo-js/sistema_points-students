import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/authContext';
import AuthLayout from '../../components/templates/authLayout';
import LoginForm from '../../components/organisms/loginForm';

const LoginPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleLoginSuccess = async (user) => {
    console.log('✅ Usuario logueado:', user);
    // El contexto ya manejó el estado, solo navegamos
    navigate('/dashboard');
  };

  return (
    <AuthLayout
      title="Bienvenido de nuevo"
      subtitle="Inicia sesión para gestionar tus cursos y estudiantes"
    >
      <LoginForm onSuccess={handleLoginSuccess} />
    </AuthLayout>
  );
};

export default LoginPage;