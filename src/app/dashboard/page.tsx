'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/context/AuthContext';

// Definición de las opciones de navegación
const dashboardOptions = [
  {
    id: 'informe',
    title: 'Informes',
    subtitle: 'Reportes y análisis de ventas',
    description: 'Consulta reportes detallados, estadísticas de vendedores y análisis de rendimiento por zonas.',
    icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
    route: '/dashboard/informe',
    gradient: 'from-blue-500 to-cyan-600',
    bgGradient: 'from-blue-50/80 via-cyan-50/60 to-blue-100/80',
    borderColor: 'border-blue-200/60',
    hoverShadow: 'hover:shadow-blue-500/20'
  },
  {
    id: 'cuotas',
    title: 'Feedback',
    subtitle: 'Gestión de objetivos y metas',
    description: 'Administra cuotas de ventas, seguimiento de objetivos y evaluación del cumplimiento de metas.',
    icon: 'M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.196-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z',
    route: '/dashboard/feedback',
    gradient: 'from-emerald-500 to-teal-600',
    bgGradient: 'from-emerald-50/80 via-teal-50/60 to-emerald-100/80',
    borderColor: 'border-emerald-200/60',
    hoverShadow: 'hover:shadow-emerald-500/20'
  },
  {
    id: 'supervisores',
    title: 'Supervisores',
    subtitle: 'Gestión de equipos y personal',
    description: 'Gestiona  y válida los ingresos de ventas regulares al Contorlnet.',
    icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z',
    route: '/dashboard/supervisores',
    gradient: 'from-purple-500 to-indigo-600',
    bgGradient: 'from-purple-50/80 via-indigo-50/60 to-purple-100/80',
    borderColor: 'border-purple-200/60',
    hoverShadow: 'hover:shadow-purple-500/20'
  }
];

// Componente de loading minimalista
const LoadingSpinner = () => (
  <div className="flex items-center justify-center py-20">
    <div className="text-center space-y-4">
      <div className="relative">
        <div className="animate-spin rounded-full h-12 w-12 border-3 border-slate-300/50 mx-auto"></div>
        <div className="animate-spin rounded-full h-12 w-12 border-t-3 border-blue-600 absolute top-0 left-1/2 transform -translate-x-1/2"></div>
      </div>
      <p className="text-slate-600 text-sm font-medium">Cargando dashboard...</p>
    </div>
  </div>
);

// Componente de tarjeta de opción mejorada y responsiva
const DashboardCard = ({ option, onClick, isLoading }: {
  option: typeof dashboardOptions[0];
  onClick: () => void;
  isLoading: boolean;
}) => {
  return (
    <article
      onClick={onClick}
      className={`
        relative overflow-hidden cursor-pointer group
        bg-gradient-to-br ${option.bgGradient}
        border-2 ${option.borderColor}
        rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-8
        shadow-lg ${option.hoverShadow}
        transform transition-all duration-300 ease-out
        hover:scale-102 sm:hover:scale-105 hover:shadow-xl
        active:scale-98 
        ${isLoading ? 'pointer-events-none opacity-70' : ''}
        backdrop-blur-sm
      `}
      role="button"
      tabIndex={0}
      aria-label={`Acceder a ${option.title}`}
    >
      {/* Efecto de brillo sutil */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 opacity-0 group-hover:opacity-100 group-hover:translate-x-full transition-all duration-700 ease-out"></div>
      
      {/* Contenido principal */}
      <div className="relative z-10">
        {/* Header de la tarjeta */}
        <div className="flex items-start justify-between mb-4 sm:mb-6">
          <div className={`p-3 sm:p-4 bg-gradient-to-r ${option.gradient} rounded-xl sm:rounded-2xl shadow-lg group-hover:shadow-xl transition-all duration-300`}>
            <svg 
              className="w-6 h-6 sm:w-8 sm:h-8 lg:w-10 lg:h-10 text-white" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
              strokeWidth="2"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                d={option.icon}
              />
            </svg>
          </div>
          
          {/* Flecha indicativa - solo visible en hover en desktop */}
          <div className="hidden sm:block opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <svg 
              className="w-5 h-5 text-slate-400 group-hover:text-slate-600 transform group-hover:translate-x-1 transition-all duration-300" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth="2" 
                d="M9 5l7 7-7 7"
              />
            </svg>
          </div>
        </div>
        
        {/* Contenido de texto */}
        <div className="space-y-2 sm:space-y-3">
          <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-800 group-hover:text-slate-900 transition-colors duration-300 leading-tight">
            {option.title}
          </h3>
          
          <p className="text-sm sm:text-base lg:text-lg font-semibold text-slate-600 group-hover:text-slate-700 transition-colors duration-300 leading-snug">
            {option.subtitle}
          </p>
          
          <p className="text-xs sm:text-sm lg:text-base text-slate-500 group-hover:text-slate-600 transition-colors duration-300 leading-relaxed line-clamp-3">
            {option.description}
          </p>
        </div>
        
        {/* Call to action */}
        <div className="mt-4 sm:mt-6 flex items-center space-x-2 text-slate-600 group-hover:text-slate-800 transition-colors duration-300">
          <span className="text-xs sm:text-sm font-semibold">Acceder</span>
          <svg 
            className="w-3 h-3 sm:w-4 sm:h-4 transform group-hover:translate-x-1 transition-transform duration-300" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
            strokeWidth="2"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              d="M17 8l4 4m0 0l-4 4m4-4H3"
            />
          </svg>
        </div>
      </div>
      
      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-20 rounded-2xl sm:rounded-3xl">
          <div className="flex flex-col items-center space-y-2">
            <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-2 border-slate-400 border-t-transparent"></div>
            <span className="text-xs text-slate-600">Cargando...</span>
          </div>
        </div>
      )}
    </article>
  );
};

// Componente principal del Dashboard
export default function DashboardPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [navigating, setNavigating] = useState<string | null>(null);

  // Carga inicial optimizada
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 800);

    return () => clearTimeout(timer);
  }, []);

  // Función para manejar navegación con feedback visual
  const handleNavigation = async (option: typeof dashboardOptions[0]) => {
    if (navigating) return; // Prevenir múltiples clics
    
    setNavigating(option.id);
    
    // Feedback táctil en móviles si está disponible
    if (navigator.vibrate) {
      navigator.vibrate(50);
    }
    
    // Delay para mostrar la animación
    await new Promise(resolve => setTimeout(resolve, 400));
    
    router.push(option.route);
  };

  // Función para obtener el saludo basado en la hora
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Buenos días';
    if (hour < 18) return 'Buenas tardes';
    return 'Buenas noches';
  };

  // Función para formatear la fecha de manera responsiva
  const getCurrentDate = () => {
    const now = new Date();
    const isSmallScreen = typeof window !== 'undefined' && window.innerWidth < 640;
    
    if (isSmallScreen) {
      return now.toLocaleDateString('es-ES', {
        weekday: 'short',
        month: 'short',
        day: 'numeric'
      });
    }
    
    return now.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const [currentDate, setCurrentDate] = useState('');

  useEffect(() => {
    setCurrentDate(getCurrentDate());
    
    const handleResize = () => {
      setCurrentDate(getCurrentDate());
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-full">
      {/* Saludo principal - Sin posición fija para evitar conflictos */}
      <div className="mb-8 sm:mb-12">
        <div className="text-center sm:text-left">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800 bg-clip-text text-transparent mb-2 sm:mb-3">
            {getGreeting()}, {user?.displayName || user?.username || 'Usuario'}
          </h1>
          <p className="text-slate-600 text-sm sm:text-base lg:text-lg capitalize">
            {currentDate}
          </p>
        </div>
      </div>

      {/* Introducción */}
      <div className="text-center mb-8 sm:mb-12 lg:mb-16">
        <h2 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold text-slate-800 mb-3 sm:mb-4 lg:mb-6 leading-tight">
          Panel de Control
        </h2>
        <p className="text-base sm:text-lg lg:text-xl text-slate-600 max-w-4xl mx-auto leading-relaxed px-4 sm:px-0">
          Selecciona una opción para acceder a las diferentes funcionalidades del sistema de gestión de ventas.
        </p>
      </div>

      {/* Grid de opciones - Completamente responsivo */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 mb-12 sm:mb-16 lg:mb-20">
        {dashboardOptions.map((option) => (
          <DashboardCard
            key={option.id}
            option={option}
            onClick={() => handleNavigation(option)}
            isLoading={navigating === option.id}
          />
        ))}
      </div>

      {/* Footer informativo - Mejorado y responsivo */}
      <div className="text-center">
        <div className="bg-white/60 backdrop-blur-sm rounded-xl sm:rounded-2xl border border-slate-200/60 p-4 sm:p-6 lg:p-8 shadow-lg max-w-2xl mx-auto">
          <div className="flex items-center justify-center space-x-3 mb-3">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <h3 className="text-base sm:text-lg lg:text-xl font-bold text-slate-800">
              Sistema de Gestión de Ventas
            </h3>
          </div>
          <p className="text-xs sm:text-sm lg:text-base text-slate-600 leading-relaxed">
            Versión 1.0 - Desarrollado para optimizar la gestión y seguimiento de ventas regulares
          </p>
        </div>
      </div>

      {/* Estilos adicionales para mejorar la responsividad */}
      <style jsx>{`
        @media (max-width: 640px) {
          .hover\\:scale-102:hover {
            transform: scale(1.02);
          }
        }
        
        .line-clamp-3 {
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
}