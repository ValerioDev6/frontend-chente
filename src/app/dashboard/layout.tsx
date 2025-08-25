// app/dashboard/layout.tsx
'use client';

import React from 'react';
import { useAuth } from '@/app/context/AuthContext';

// Componente de protección específico para Layout
const ProtectedLayoutWrapper = ({ children }: { children: React.ReactNode }) => {
  const { 
    user, 
    isAuthenticated, 
    loading, 
    checkComplete, 
    error: authError 
  } = useAuth();

  // Loading spinner
  const LoadingSpinner = () => (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-4">
      <div className="text-center">
        <div className="relative">
          <div className="animate-spin rounded-full h-16 w-16 sm:h-20 sm:w-20 border-4 border-slate-600 mx-auto mb-4 sm:mb-6"></div>
          <div className="animate-spin rounded-full h-16 w-16 sm:h-20 sm:w-20 border-t-4 border-blue-500 absolute top-0 left-1/2 transform -translate-x-1/2"></div>
        </div>
        <p className="text-slate-300 text-base sm:text-lg font-medium px-4">Verificando sesión...</p>
      </div>
    </div>
  );

  // Access screen
  const AccessScreen = ({ type, message, onAction }: { 
    type: 'expired' | 'denied'; 
    message: string; 
    onAction: () => void 
  }) => {
    const config = {
      expired: { icon: "⏰", title: "Sesión Expirada", buttonText: "Ir al Login" },
      denied: { icon: "🔒", title: "Acceso Denegado", buttonText: "Ir al Login" }
    };
    
    const { icon, title, buttonText } = config[type];
    
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
        <div className="bg-white/10 backdrop-blur-lg p-6 sm:p-8 rounded-2xl border border-white/20 text-center max-w-md w-full">
          <div className="text-4xl sm:text-6xl mb-4">{icon}</div>
          <h1 className="text-xl sm:text-2xl font-bold text-white mb-2">{title}</h1>
          <p className="text-slate-300 mb-6 text-sm sm:text-base">{message}</p>
          <button
            onClick={onAction}
            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 transform hover:scale-105"
          >
            {buttonText}
          </button>
        </div>
      </div>
    );
  };

  // 1. Loading inicial
  if (loading || !checkComplete) {
    return <LoadingSpinner />;
  }

  // 2. Error de autenticación (sesión expirada)
  if (authError?.includes('expirado')) {
    return (
      <AccessScreen 
        type="expired" 
        message={authError}
        onAction={() => window.location.href = '/login'}
      />
    );
  }

  // 3. No autenticado
  if (!isAuthenticated || !user) {
    return (
      <AccessScreen 
        type="denied" 
        message="Inicia sesión para acceder al dashboard"
        onAction={() => window.location.href = '/login'}
      />
    );
  }

  // 4. Usuario autenticado - renderizar layout
  return (
    <div className="flex flex-col min-h-screen">
      <header className="bg-blue-600 text-white p-4 shadow-md">
        <nav className="container mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold">Canal Fija Auren</h1>
          <div className="flex items-center space-x-4">
            <span className="text-sm">
              Bienvenido, <span className="font-semibold">{user.displayName || user.username}</span>
            </span>
            <button 
              onClick={() => window.location.href = '/login'}
              className="bg-red-500 hover:bg-red-600 px-3 py-1 rounded text-sm transition-colors"
            >
              Salir
            </button>
          </div>
        </nav>
      </header>
      <main className="flex-grow container mx-auto py-8">
        {children}
      </main>
      <footer className="bg-gray-800 text-white p-4 text-center">
        <p>&copy; 2025 Canal Fija</p>
      </footer>
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