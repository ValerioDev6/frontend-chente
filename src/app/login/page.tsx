'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/app/context/AuthContext';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, loading, isAuthenticated, checkComplete, error: authError, clearError } = useAuth();

  // Manejar parámetros de URL para mostrar mensajes
  useEffect(() => {
    const registered = searchParams.get('registered');
    const sessionExpired = searchParams.get('session_expired');
    const securityLogout = searchParams.get('security_logout');
    
    if (registered === 'true') {
      setError('Registro exitoso. Por favor, inicia sesión con tus credenciales.');
    } else if (sessionExpired === 'true') {
      setError('Tu sesión ha expirado. Por favor, inicia sesión nuevamente.');
    } else if (securityLogout === 'true') {
      setError('Sesión cerrada por seguridad. Cambia tu contraseña si usas credenciales por defecto.');
    }
  }, [searchParams]);

  // Mostrar errores del AuthContext
  useEffect(() => {
    if (authError) {
      setError(authError);
    }
  }, [authError]);

  // Redirigir si ya está autenticado (solo después de que la verificación esté completa)
  useEffect(() => {
    if (checkComplete && isAuthenticated && !loading) {
      console.log('✅ LoginPage: Usuario autenticado, redirigiendo a dashboard');
      router.push('/dashboard');
    }
  }, [checkComplete, isAuthenticated, loading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validaciones básicas
    if (!username.trim() || !password.trim()) {
      setError('Por favor, completa todos los campos.');
      return;
    }
    
    setError(null);
    setIsSubmitting(true);
    
    // Limpiar errores previos del AuthContext
    if (authError) {
      clearError();
    }
    
    try {
      console.log('🔐 LoginPage: Iniciando proceso de login...');
      await login({ username: username.trim(), password });
      
      // El redirect se maneja automáticamente en el useEffect de arriba
      console.log('✅ LoginPage: Login completado exitosamente');
      
    } catch (err: any) {
      console.error('❌ LoginPage: Error en login:', err);
      
      // Manejar diferentes tipos de errores de forma robusta
      let errorMessage = 'Error al iniciar sesión. Verifica tus credenciales.';
      
      if (err) {
        if (typeof err === 'string') {
          errorMessage = err;
        } else if (err.message) {
          errorMessage = err.message;
        } else if (err.error) {
          errorMessage = err.error;
        } else if (err.response?.data?.message) {
          errorMessage = err.response.data.message;
        }
        
        // Mensajes específicos para errores comunes
        if (errorMessage.toLowerCase().includes('unauthorized') || 
            errorMessage.toLowerCase().includes('401')) {
          errorMessage = 'Credenciales incorrectas. Verifica tu usuario y contraseña.';
        } else if (errorMessage.toLowerCase().includes('network') ||
                   errorMessage.toLowerCase().includes('fetch')) {
          errorMessage = 'Error de conexión. Verifica tu conexión a internet.';
        }
      }
      
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const clearCurrentError = () => {
    setError(null);
    if (authError) {
      clearError();
    }
  };

  // Mostrar spinner si está verificando la autenticación inicial
  if (!checkComplete && loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white p-8 rounded shadow-md w-full max-w-md text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-4"></div>
          <p className="text-gray-600">Verificando sesión...</p>
        </div>
      </div>
    );
  }

  // No mostrar el formulario si ya está autenticado
  if (checkComplete && isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white p-8 rounded shadow-md w-full max-w-md text-center">
          <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mb-4"></div>
          <p className="text-gray-600">Redirigiendo al dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6 text-center text-gray-800">
          Iniciar Sesión
        </h1>
        
        {/* Mostrar errores con opción de cerrar */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 relative">
            <button
              onClick={clearCurrentError}
              className="absolute top-2 right-2 text-red-500 hover:text-red-700"
              type="button"
              title="Cerrar mensaje"
            >
              ✕
            </button>
            <p className="pr-6">{error}</p>
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="username" className="block text-gray-700 text-sm font-bold mb-2">
              Usuario
            </label>
            <input
              type="text"
              id="username"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline focus:border-blue-500"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              disabled={isSubmitting}
              placeholder="Ingresa tu usuario"
              autoComplete="username"
              maxLength={50}
            />
          </div>
          
          <div className="mb-6">
            <label htmlFor="password" className="block text-gray-700 text-sm font-bold mb-2">
              Contraseña
            </label>
            <input
              type="password"
              id="password"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline focus:border-blue-500"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isSubmitting}
              placeholder="Ingresa tu contraseña"
              autoComplete="current-password"
              maxLength={100}
            />
          </div>
          
          <div className="flex items-center justify-between flex-col sm:flex-row gap-4">
            <button
              type="submit"
              disabled={isSubmitting || !username.trim() || !password.trim()}
              className="w-full sm:w-auto bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded focus:outline-none focus:shadow-outline disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Iniciando sesión...
                </span>
              ) : (
                'Iniciar Sesión'
              )}
            </button>
            
            <a 
              href="/register" 
              className="text-center font-bold text-sm text-blue-500 hover:text-blue-800 transition-colors duration-200"
              tabIndex={isSubmitting ? -1 : 0}
            >
              ¿No tienes cuenta?<br className="sm:hidden" /> Regístrate
            </a>
          </div>
        </form>
        
        {/* Información adicional para desarrollo */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-6 p-3 bg-gray-100 rounded text-xs text-gray-600">
            <details>
              <summary className="cursor-pointer font-semibold mb-2">
                Información de Desarrollo
              </summary>
              <div className="space-y-1">
                <p><strong>API URL:</strong> {process.env.NEXT_PUBLIC_API_URL || 'No configurada'}</p>
                <p><strong>Usuario de prueba:</strong> admin_test</p>
                <p><strong>Contraseña de prueba:</strong> password</p>
                <p><strong>Estado auth:</strong> {JSON.stringify({ 
                  isAuthenticated, 
                  checkComplete, 
                  loading 
                })}</p>
              </div>
            </details>
          </div>
        )}
      </div>
    </div>
  );
}