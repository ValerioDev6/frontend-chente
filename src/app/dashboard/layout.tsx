// app/dashboard/layout.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import { useRouter } from 'next/navigation';

// Componente de protección específico para Layout
const ProtectedLayoutWrapper = ({ children }: { children: React.ReactNode }) => {
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { 
    user, 
    isAuthenticated, 
    loading, 
    checkComplete, 
    error: authError 
  } = useAuth();

  // Detectar scroll para efectos dinámicos
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Función para navegar al dashboard
  const goToDashboard = () => {
    router.push('/dashboard');
    setIsMobileMenuOpen(false);
  };

  // Función para cerrar sesión
  const handleLogout = () => {
    window.location.href = '/login';
  };

  // Loading spinner mejorado
  const LoadingSpinner = () => (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-blue-950 to-purple-950 px-4 relative overflow-hidden">
      {/* Elementos de fondo animados */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-blue-500/20 rounded-full blur-xl animate-pulse"></div>
        <div className="absolute top-3/4 right-1/4 w-48 h-48 bg-purple-500/20 rounded-full blur-xl animate-pulse delay-700"></div>
        <div className="absolute bottom-1/4 left-1/2 w-24 h-24 bg-cyan-500/20 rounded-full blur-xl animate-pulse delay-1000"></div>
      </div>
      
      <div className="text-center relative z-10">
        <div className="relative mb-8">
          {/* Spinner principal */}
          <div className="animate-spin rounded-full h-20 w-20 sm:h-24 sm:w-24 border-4 border-slate-700/50 mx-auto"></div>
          <div className="animate-spin rounded-full h-20 w-20 sm:h-24 sm:w-24 border-t-4 border-r-4 border-transparent border-t-blue-500 border-r-purple-500 absolute top-0 left-1/2 transform -translate-x-1/2 duration-1000"></div>
          
          {/* Puntos orbitales */}
          <div className="absolute inset-0 animate-spin" style={{animationDuration: '3s'}}>
            <div className="absolute top-0 left-1/2 w-2 h-2 bg-blue-400 rounded-full transform -translate-x-1/2 -translate-y-1"></div>
            <div className="absolute bottom-0 left-1/2 w-2 h-2 bg-purple-400 rounded-full transform -translate-x-1/2 translate-y-1"></div>
          </div>
        </div>
        
        <div className="space-y-2">
          <h3 className="text-white text-xl sm:text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            Canal Fija Auren
          </h3>
          <p className="text-slate-300 text-sm sm:text-base font-medium animate-pulse">
            Verificando sesión...
          </p>
        </div>
      </div>
    </div>
  );

  // Pantalla de acceso mejorada
  const AccessScreen = ({ type, message, onAction }: { 
    type: 'expired' | 'denied'; 
    message: string; 
    onAction: () => void 
  }) => {
    const config = {
      expired: { 
        icon: "⏰", 
        title: "Sesión Expirada", 
        buttonText: "Renovar Sesión",
        gradient: "from-amber-500 to-orange-600",
        bgGradient: "from-amber-950 via-orange-950 to-red-950"
      },
      denied: { 
        icon: "🔒", 
        title: "Acceso Denegado", 
        buttonText: "Iniciar Sesión",
        gradient: "from-red-500 to-pink-600",
        bgGradient: "from-red-950 via-pink-950 to-purple-950"
      }
    };
    
    const { icon, title, buttonText, gradient, bgGradient } = config[type];
    
    return (
      <div className={`min-h-screen flex items-center justify-center bg-gradient-to-br ${bgGradient} p-4 relative overflow-hidden`}>
        {/* Efectos de fondo */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-40 h-40 bg-white rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-20 w-60 h-60 bg-white rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>
        
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8 sm:p-12 text-center max-w-md w-full relative z-10 shadow-2xl transform hover:scale-105 transition-all duration-500">
          {/* Icono animado */}
          <div className="text-6xl sm:text-8xl mb-6 animate-bounce" style={{animationDuration: '2s'}}>
            {icon}
          </div>
          
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-4 tracking-tight">
            {title}
          </h1>
          
          <p className="text-slate-200 mb-8 text-sm sm:text-base leading-relaxed opacity-90">
            {message}
          </p>
          
          <button
            onClick={onAction}
            className={`w-full bg-gradient-to-r ${gradient} hover:shadow-xl text-white font-bold py-4 px-8 rounded-2xl transition-all duration-300 transform hover:scale-105 hover:-translate-y-1 focus:ring-4 focus:ring-white/30 active:scale-95`}
          >
            {buttonText}
          </button>
        </div>
      </div>
    );
  };

  // Componente de header innovador
  const ModernHeader = () => (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      scrolled 
        ? 'bg-slate-900/95 backdrop-blur-xl border-b border-slate-700/50 shadow-2xl' 
        : 'bg-gradient-to-r from-slate-800/98 to-slate-900/98 backdrop-blur-md'
    }`}>
      <nav className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 sm:h-20">
          {/* Logo y título */}
          <div className="flex items-center space-x-3 group cursor-pointer" onClick={goToDashboard}>
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center backdrop-blur-sm group-hover:scale-110 transition-all duration-200 shadow-lg border border-blue-400/30">
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" clipRule="evenodd" />
              </svg>
            </div>
            <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-white tracking-tight">
              Canal Fija <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">Auren</span>
            </h1>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-4 lg:space-x-6">
            {/* User Info */}
            <div className="flex items-center space-x-3 bg-slate-800/90 backdrop-blur-sm px-4 py-2 rounded-xl border border-slate-600/50 shadow-lg">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center shadow-md">
                <span className="text-white text-sm font-bold">
                  {(user?.displayName || user?.username || '').charAt(0).toUpperCase()}
                </span>
              </div>
              <span className="text-white text-sm font-medium">
                {user?.displayName || user?.username}
              </span>
            </div>

            {/* Logout Button */}
            <button 
              onClick={handleLogout}
              className="flex items-center space-x-2 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 px-4 py-2 rounded-xl text-sm font-medium text-white transition-all duration-200 hover:scale-105 shadow-lg hover:shadow-xl border border-red-500/30"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span>Salir</span>
            </button>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 rounded-xl bg-slate-800/90 backdrop-blur-sm border border-slate-600/50 hover:bg-slate-700/90 transition-colors duration-200 shadow-lg"
          >
            <svg className={`w-6 h-6 text-white transform transition-transform duration-200 ${isMobileMenuOpen ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isMobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Menu */}
        <div className={`md:hidden transition-all duration-300 overflow-hidden ${
          isMobileMenuOpen ? 'max-h-96 pb-6' : 'max-h-0'
        }`}>
          <div className="space-y-3 pt-4 border-t border-slate-600/50">
            {/* User Info Mobile */}
            <div className="flex items-center space-x-3 p-3 bg-slate-800/90 backdrop-blur-sm rounded-xl border border-slate-600/50 shadow-lg">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center shadow-md">
                <span className="text-white text-lg font-bold">
                  {(user?.displayName || user?.username || '').charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <p className="text-white font-medium text-sm">
                  {user?.displayName || user?.username}
                </p>
                <p className="text-slate-300 text-xs">Usuario activo</p>
              </div>
            </div>

            {/* Mobile Logout Button */}
            <button 
              onClick={handleLogout}
              className="w-full flex items-center space-x-3 p-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 rounded-xl text-white transition-all duration-200 shadow-lg border border-red-500/30"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span className="font-medium">Cerrar Sesión</span>
            </button>
          </div>
        </div>
      </nav>
    </header>
  );

  // Footer moderno
  const ModernFooter = () => (
    <footer className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border-t border-slate-700/50 backdrop-blur-sm">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <span className="text-slate-300 text-sm font-medium">Canal Fija Auren</span>
          </div>
          
          <div className="text-center">
            <p className="text-slate-400 text-sm">
              &copy; 2025 Canal Fija. 
              <span className="text-blue-400 ml-1">Todos los derechos reservados</span>
            </p>
          </div>

          <div className="flex items-center space-x-2 text-xs text-slate-500">
            <span>Powered by</span>
            <div className="px-2 py-1 bg-slate-800 rounded-md border border-slate-700">
              <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent font-semibold">
                Next.js
              </span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );

  // Estados de carga y error
  if (loading || !checkComplete) {
    return <LoadingSpinner />;
  }

  if (authError?.includes('expirado')) {
    return (
      <AccessScreen 
        type="expired" 
        message={authError}
        onAction={() => window.location.href = '/login'}
      />
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <AccessScreen 
        type="denied" 
        message="Inicia sesión para acceder al dashboard"
        onAction={() => window.location.href = '/login'}
      />
    );
  }

  // Layout principal
  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
      <ModernHeader />
      
      <main className="flex-grow pt-20 sm:pt-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-fade-in">
            {children}
          </div>
        </div>
      </main>
      
      <ModernFooter />

      {/* Styles */}
      <style jsx global>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fade-in {
          animation: fade-in 0.6s ease-out;
        }

        /* Smooth scrolling */
        html {
          scroll-behavior: smooth;
        }

        /* Custom scrollbar */
        ::-webkit-scrollbar {
          width: 8px;
        }
        
        ::-webkit-scrollbar-track {
          background: #f1f5f9;
        }
        
        ::-webkit-scrollbar-thumb {
          background: linear-gradient(to bottom, #3b82f6, #8b5cf6);
          border-radius: 4px;
        }
        
        ::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(to bottom, #2563eb, #7c3aed);
        }
      `}</style>
    </div>
  );
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedLayoutWrapper>
      {children}
    </ProtectedLayoutWrapper>
  );
}