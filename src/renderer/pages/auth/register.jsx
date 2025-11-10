import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/authContext';
import AuthLayout from '../../components/templates/authLayout';
import RegisterForm from '../../components/organisms/registerForm';

const RegisterPage = () => {
  const navigate = useNavigate();
  const { register } = useAuth();

  const handleRegisterSuccess = async (user) => {
    console.log('✅ Usuario registrado:', user);
    // El contexto ya manejó el estado, solo navegamos
    navigate('/dashboard');
  };

  return (
    <AuthLayout
      title="Crea tu cuenta"
      subtitle="Comienza a gestionar la participación de tus estudiantes"
    >
      <RegisterForm onSuccess={handleRegisterSuccess} />
    </AuthLayout>
  );
};

export default RegisterPage;