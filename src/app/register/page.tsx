'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/context/AuthContext';

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const router = useRouter();
  const { register, loading, isAuthenticated } = useAuth();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = () => {
    if (!formData.username.trim()) {
      return 'El nombre de usuario es requerido';
    }
    if (!formData.email.trim()) {
      return 'El email es requerido';
    }
    if (!formData.password) {
      return 'La contraseña es requerida';
    }
    if (formData.password.length < 6) {
      return 'La contraseña debe tener al menos 6 caracteres';
    }
    if (formData.password !== formData.confirmPassword) {
      return 'Las contraseñas no coinciden';
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    // Validar formulario
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // ✅ USAR el método register del AuthContext
      await register({
        username: formData.username.trim(),
        email: formData.email.trim(),
        password: formData.password,
        roles: ['ROLE_USER'] // Rol por defecto
      });
      
      // El router.push('/login') se maneja automáticamente en el AuthContext
    } catch (err: any) {
      console.error('Register error:', err);
      
      // ✅ Manejar diferentes tipos de errores
      let errorMessage = 'Error al registrar usuario';
      
      if (err && typeof err === 'object') {
        if (err.message) {
          errorMessage = err.message;
        } else if (err.error) {
          errorMessage = err.error;
        } else if (typeof err === 'string') {
          errorMessage = err;
        }
      }
      
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Si ya está autenticado, redirigir
  if (isAuthenticated && !loading) {
    router.push('/dashboard');
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6 text-center">Crear Cuenta</h1>
        
        {/* Mostrar estado de carga */}
        {loading && (
          <div className="text-center mb-4">
            <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
            <p className="text-gray-600 mt-2">Verificando sesión...</p>
          </div>
        )}
        
        {/* Mostrar errores */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className={loading ? 'opacity-50 pointer-events-none' : ''}>
          <div className="mb-4">
            <label htmlFor="username" className="block text-gray-700 text-sm font-bold mb-2">
              Usuario:
            </label>
            <input
              type="text"
              id="username"
              name="username"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              value={formData.username}
              onChange={handleInputChange}
              required
              disabled={isSubmitting || loading}
              placeholder="Ingresa tu usuario"
            />
          </div>
          
          <div className="mb-4">
            <label htmlFor="email" className="block text-gray-700 text-sm font-bold mb-2">
              Email:
            </label>
            <input
              type="email"
              id="email"
              name="email"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              value={formData.email}
              onChange={handleInputChange}
              required
              disabled={isSubmitting || loading}
              placeholder="tu@email.com"
            />
          </div>
          
          <div className="mb-4">
            <label htmlFor="password" className="block text-gray-700 text-sm font-bold mb-2">
              Contraseña:
            </label>
            <input
              type="password"
              id="password"
              name="password"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              value={formData.password}
              onChange={handleInputChange}
              required
              disabled={isSubmitting || loading}
              placeholder="Mínimo 6 caracteres"
            />
          </div>
          
          <div className="mb-6">
            <label htmlFor="confirmPassword" className="block text-gray-700 text-sm font-bold mb-2">
              Confirmar Contraseña:
            </label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none focus:shadow-outline"
              value={formData.confirmPassword}
              onChange={handleInputChange}
              required
              disabled={isSubmitting || loading}
              placeholder="Confirma tu contraseña"
            />
          </div>
          
          <div className="flex items-center justify-between">
            <button
              type="submit"
              disabled={isSubmitting || loading}
              className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Registrando...
                </>
              ) : (
                'Crear Cuenta'
              )}
            </button>
            
            <a 
              href="/login" 
              className="inline-block align-baseline font-bold text-sm text-blue-500 hover:text-blue-800"
            >
              ¿Ya tienes cuenta? Inicia sesión
            </a>
          </div>
        </form>
        
        {/* Información de desarrollo */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-6 p-3 bg-gray-100 rounded text-xs text-gray-600">
            <p><strong>Desarrollo:</strong></p>
            <p>API URL: {process.env.NEXT_PUBLIC_API_URL}</p>
          </div>
        )}
      </div>
    </div>
  );
}