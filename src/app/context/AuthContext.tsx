'use client';

import { getCurrentUser, signin, signout, signup } from '@/app/services/auth';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { createContext, ReactNode, useContext, useEffect, useRef, useState } from 'react';

interface User {
  id: string;
  username: string;
  email: string;
  roles: string[];
  displayName?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (credentials: any) => Promise<void>;
  register: (userData: any) => Promise<void>;
  logout: () => Promise<void>;
  loading: boolean;
  error: string | null;
  clearError: () => void;
  checkComplete: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [checkComplete, setCheckComplete] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  // ✅ CRÍTICO: Evitar múltiples redirects y verificaciones
  const redirectingRef = useRef(false);
  const authCheckingRef = useRef(false);
  const logoutTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Páginas que NO requieren autenticación
  const publicPages = ['/login', '/register', '/'];

  // ✅ Verificar parámetros de seguridad (solo una vez)
  useEffect(() => {
    const securityLogout = searchParams.get('security_logout');
    const sessionExpired = searchParams.get('session_expired');
    
    if (securityLogout === 'true') {
      setError('Sesión cerrada por razones de seguridad. Por favor, cambia tu contraseña si usas credenciales por defecto.');
      setUser(null);
    }
    
    if (sessionExpired === 'true') {
      setError('Tu sesión ha expirado. Por favor, inicia sesión nuevamente.');
      setUser(null);
    }
  }, [searchParams]);

  // ✅ FUNCIÓN MEJORADA para manejar redirects (más conservadora)
  const handleAuthFailure = (errorMessage: string, shouldRedirect: boolean = true) => {
    console.log('🚨 AuthContext: Manejando fallo de autenticación:', errorMessage);
    
    // Prevenir múltiples redirects
    if (redirectingRef.current) {
      console.log('⏸️ AuthContext: Redirect ya en progreso, ignorando...');
      return;
    }
    
    setUser(null);
    
    // Solo establecer error si no estamos en página pública
    if (!publicPages.includes(pathname)) {
      setError(errorMessage);
    }
    
    // Solo redirigir si estamos en página protegida Y no estamos ya redirigiendo
    if (shouldRedirect && !publicPages.includes(pathname) && !redirectingRef.current) {
      redirectingRef.current = true;
      console.log('🔄 AuthContext: Programando redirect...');
      
      // Limpiar timeout anterior
      if (logoutTimeoutRef.current) {
        clearTimeout(logoutTimeoutRef.current);
      }
      
      // Delay más corto para mejor UX
      logoutTimeoutRef.current = setTimeout(() => {
        console.log('🔄 AuthContext: Ejecutando redirect...');
        // Usar replace para no agregar a history
        router.replace('/login?session_expired=true');
        redirectingRef.current = false;
      }, 800);
    }
  };

  // ✅ VERIFICACIÓN DE AUTENTICACIÓN OPTIMIZADA
  useEffect(() => {
    const loadUser = async () => {
      // Evitar verificaciones múltiples simultáneas
      if (authCheckingRef.current) {
        console.log('🔄 AuthContext: Verificación ya en progreso, saltando...');
        return;
      }

      console.log('🔍 AuthContext: Verificando autenticación en:', pathname);
      authCheckingRef.current = true;
      
      // Resetear flags de redirect
      redirectingRef.current = false;
      if (logoutTimeoutRef.current) {
        clearTimeout(logoutTimeoutRef.current);
        logoutTimeoutRef.current = null;
      }
      
      // Si estamos en página pública, no verificar autenticación
      if (publicPages.includes(pathname)) {
        console.log('📄 AuthContext: Página pública detectada:', pathname);
        setLoading(false);
        setCheckComplete(true);
        setError(null);
        authCheckingRef.current = false;
        return;
      }

      // Si ya tenemos usuario y no es una verificación forzada, reutilizar
      if (user && user.id && checkComplete) {
        console.log('✅ AuthContext: Usuario ya verificado, saltando verificación');
        setLoading(false);
        authCheckingRef.current = false;
        return;
      }

      try {
        setError(null);
        setLoading(true);
        console.log('🔍 AuthContext: Llamando getCurrentUser...');
        
        const response = await getCurrentUser();
        console.log('🔍 AuthContext: Respuesta getCurrentUser:', response);
        
        // ✅ MANEJO ROBUSTO DE RESPUESTAS
        let userData: User | null = null;
        
        if (response) {
          // Intenta extraer usuario de diferentes estructuras posibles
          const rawUser = response.user || response.data || response;
          
          if (rawUser && rawUser.id && rawUser.username) {
            userData = {
              id: rawUser.id.toString(),
              username: rawUser.username,
              email: rawUser.email || '',
              roles: Array.isArray(rawUser.roles) ? rawUser.roles : [],
              displayName: rawUser.displayName || rawUser.username
            };
            console.log('✅ AuthContext: Usuario extraído exitosamente:', userData);
          }
        }
        
        if (userData) {
          setUser(userData);
          console.log('✅ AuthContext: Usuario establecido exitosamente');
          
          // Verificar credenciales por defecto (solo warning, no error)
          if (['admin_test', 'admin', 'Auren'].includes(userData.username)) {
            console.log('⚠️ AuthContext: Credenciales por defecto detectadas');
            // No establecer como error, solo log
          }
        } else {
          console.log('❌ AuthContext: No se pudo extraer datos de usuario válidos');
          handleAuthFailure('Sesión inválida. Redirigiendo...', true);
        }
        
      } catch (error: any) {
        console.error('❌ AuthContext: Error en getCurrentUser:', error);
        
        // ✅ MANEJO MÁS ESPECÍFICO DE ERRORES
        const errorMessage = error.message || error.toString();
        const isAuthError = 
          errorMessage.includes('401') || 
          errorMessage.includes('Unauthorized') ||
          errorMessage.includes('No authenticated user') ||
          error.response?.status === 401;
        
        if (isAuthError) {
          console.log('🔒 AuthContext: Error de autenticación confirmado (401)');
          handleAuthFailure('Sesión expirada. Redirigiendo...', true);
        } else {
          // Para otros errores, solo log pero no redirect inmediato
          console.error('💥 AuthContext: Error de conexión:', error);
          setError('Error de conexión. Verifica tu conexión a internet.');
          // No redirigir automáticamente en errores de conexión
        }
        
      } finally {
        setLoading(false);
        setCheckComplete(true);
        authCheckingRef.current = false;
        console.log('🏁 AuthContext: Verificación completada');
      }
    };
    
    // Solo ejecutar si no estamos verificando
    if (!authCheckingRef.current) {
      loadUser();
    }
    
    // ✅ Cleanup
    return () => {
      if (logoutTimeoutRef.current) {
        clearTimeout(logoutTimeoutRef.current);
      }
    };
  }, [pathname]); // ✅ Solo dependiente de pathname, no de router

  // ✅ LOGIN OPTIMIZADO
  const login = async (credentials: any) => {
    setLoading(true);
    setError(null);
    redirectingRef.current = false;
    console.log('🔐 AuthContext: Iniciando login...');
    
    try {
      const data = await signin(credentials);
      console.log('🔍 AuthContext: Respuesta signin:', data);
      
      // Extraer usuario de forma robusta
      const rawUser = data.user || data.data || data;
      let userData: User | null = null;
      
      if (rawUser && rawUser.id && rawUser.username) {
        userData = {
          id: rawUser.id.toString(),
          username: rawUser.username,
          email: rawUser.email || '',
          roles: Array.isArray(rawUser.roles) ? rawUser.roles : [],
          displayName: rawUser.displayName || rawUser.username
        };
      }
      
      if (userData) {
        setUser(userData);
        setCheckComplete(true);
        console.log('✅ AuthContext: Login exitoso');
        
        // Usar replace para evitar loops de navegación
        router.replace('/dashboard');
      } else {
        throw new Error('No se pudo obtener información del usuario');
      }
      
    } catch (error: any) {
      console.error('❌ AuthContext: Login error:', error);
      const errorMessage = error.message || error.toString() || 'Error al iniciar sesión';
      setError(errorMessage);
      setUser(null);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // ✅ REGISTER OPTIMIZADO
  const register = async (userData: any) => {
    setLoading(true);
    setError(null);
    console.log('📝 AuthContext: Iniciando registro...');
    
    try {
      await signup(userData);
      console.log('✅ AuthContext: Registro exitoso');
      router.replace('/login?registered=true');
    } catch (error: any) {
      console.error('❌ AuthContext: Register error:', error);
      const errorMessage = error.message || error.toString() || 'Error al registrarse';
      setError(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // ✅ LOGOUT OPTIMIZADO
  const logout = async () => {
    if (redirectingRef.current) {
      console.log('🚪 AuthContext: Logout ya en progreso...');
      return;
    }
    
    redirectingRef.current = true;
    setLoading(true);
    setError(null);
    console.log('🚪 AuthContext: Iniciando logout...');
    
    if (logoutTimeoutRef.current) {
      clearTimeout(logoutTimeoutRef.current);
      logoutTimeoutRef.current = null;
    }
    
    try {
      await signout();
      console.log('✅ AuthContext: Logout exitoso');
    } catch (error: any) {
      console.error('⚠️ AuthContext: Error en logout:', error);
    } finally {
      setUser(null);
      setCheckComplete(true);
      setLoading(false);
      console.log('🏁 AuthContext: Usuario deslogueado');
      router.replace('/login');
      redirectingRef.current = false;
    }
  };

  const clearError = () => {
    setError(null);
  };

  // ✅ VERIFICACIONES ROBUSTAS
  const isAuthenticated = !!user && !!user.id && checkComplete;
  const isAdmin = user?.roles?.includes('ROLE_ADMIN') || 
                  user?.roles?.includes('admin') || 
                  user?.username === 'admin' || 
                  false;

  // ✅ Debug mejorado
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('🔍 AuthContext State:', {
        user: user ? { 
          id: user.id, 
          username: user.username, 
          roles: user.roles 
        } : null,
        isAuthenticated,
        isAdmin,
        loading,
        checkComplete,
        error: error ? error.substring(0, 100) : null,
        pathname,
        isPublicPage: publicPages.includes(pathname),
        redirecting: redirectingRef.current,
        checking: authCheckingRef.current
      });
    }
  }, [user, isAuthenticated, isAdmin, loading, checkComplete, error, pathname]);

  return (
    <AuthContext.Provider value={{ 
      user, 
      isAuthenticated, 
      isAdmin, 
      login, 
      register, 
      logout, 
      loading,
      error,
      clearError,
      checkComplete
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};