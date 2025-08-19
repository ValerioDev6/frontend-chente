'use client';

import { useAuth } from '@/app/context/AuthContext';
import {
  ApiError,
  DetalleVenta,
  ReportsFilters,
  ReportsService,
  VendedorVentaResumen
} from '@/app/services/reports';
import { useEffect, useMemo, useState } from 'react';

interface DashboardStats {
  totalVendedores: number;
  totalVentas: number;
}

interface FrontendFilters {
  fecha?: string;
  zonal?: string;
  supervisor?: string;
}

// Helper para detectar errores de API
const isApiError = (response: any): response is ApiError => {
  return response && response.success === false && 'error' in response;
};

// Loading component responsive
const LoadingSpinner = ({ text = "Cargando..." }: { text?: string }) => (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-4">
    <div className="text-center">
      <div className="relative">
        <div className="animate-spin rounded-full h-16 w-16 sm:h-20 sm:w-20 border-4 border-slate-600 mx-auto mb-4 sm:mb-6"></div>
        <div className="animate-spin rounded-full h-16 w-16 sm:h-20 sm:w-20 border-t-4 border-blue-500 absolute top-0 left-1/2 transform -translate-x-1/2"></div>
      </div>
      <p className="text-slate-300 text-base sm:text-lg font-medium px-4">{text}</p>
    </div>
  </div>
);

// Access screen responsive
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

// ✅ PANEL DE FILTROS RESPONSIVE
const FiltersPanel = ({ 
  filters, 
  onFiltersChange, 
  zonales, 
  supervisores, 
  loading,
  onRefresh
}: {
  filters: FrontendFilters;
  onFiltersChange: (filters: FrontendFilters) => void;
  zonales: string[];
  supervisores: string[];
  loading: boolean;
  onRefresh: () => void;
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-2xl border border-slate-200/50 p-4 sm:p-6 lg:p-8 mb-6 sm:mb-8 shadow-xl">
      {/* Header del panel */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 sm:mb-6 gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg">
              <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4"></path>
              </svg>
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-800">Filtros</h2>
          </div>
          
          {/* Botón colapsar solo en móvil */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="sm:hidden p-2 text-slate-600 hover:text-slate-800 rounded-lg hover:bg-slate-100"
          >
            <svg 
              className={`w-5 h-5 transform transition-transform ${isCollapsed ? 'rotate-180' : ''}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
            </svg>
          </button>
        </div>
        
        {/* Botón actualizar */}
        <button
          onClick={onRefresh}
          disabled={loading}
          className="w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white rounded-xl font-semibold disabled:opacity-50 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
        >
          {loading ? (
            <div className="flex items-center justify-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
              <span>Cargando...</span>
            </div>
          ) : (
            <div className="flex items-center justify-center sm:justify-start space-x-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
              </svg>
              <span>Actualizar</span>
            </div>
          )}
        </button>
      </div>
      
      {/* Contenido colapsable */}
      <div className={`${isCollapsed ? 'hidden sm:block' : 'block'}`}>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
          {/* FECHA */}
          <div className="space-y-3">
            <label className="flex flex-wrap items-center gap-2 text-sm font-semibold text-slate-700">
              <div className="flex items-center space-x-2">
                <div className="p-1 bg-blue-100 rounded">
                  <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                  </svg>
                </div>
                <span>Fecha</span>
              </div>
              {/* <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full font-medium">Backend</span> */}
            </label>
            <input
              type="date"
              value={filters.fecha || ''}
              onChange={(e) => onFiltersChange({ 
                ...filters, 
                fecha: e.target.value || undefined 
              })}
              className="w-full px-3 sm:px-4 py-2 sm:py-3 border-2 border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 bg-white/80 text-sm sm:text-base"
              disabled={loading}
            />
          </div>

          {/* ZONAL */}
          <div className="space-y-3">
            <label className="flex flex-wrap items-center gap-2 text-sm font-semibold text-slate-700">
              <div className="flex items-center space-x-2">
                <div className="p-1 bg-emerald-100 rounded">
                  <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
                  </svg>
                </div>
                <span>Zonal</span>
              </div>
              {/* <span className="text-xs px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full font-medium">Frontend</span> */}
              <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                zonales.length > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
              }`}>
                {zonales.length}
              </span>
            </label>
            <select
              value={filters.zonal || ''}
              onChange={(e) => onFiltersChange({ 
                ...filters, 
                zonal: e.target.value || undefined,
                supervisor: undefined
              })}
              className="w-full px-3 sm:px-4 py-2 sm:py-3 border-2 border-slate-200 rounded-xl focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all duration-200 bg-white/80 text-sm sm:text-base"
              disabled={loading || zonales.length === 0}
            >
              <option value="">Todas las zonales</option>
              {zonales.map((zonal) => (
                <option key={zonal} value={zonal}>{zonal}</option>
              ))}
            </select>
          </div>

          {/* SUPERVISOR */}
          <div className="space-y-3 md:col-span-2 xl:col-span-1">
            <label className="flex flex-wrap items-center gap-2 text-sm font-semibold text-slate-700">
              <div className="flex items-center space-x-2">
                <div className="p-1 bg-purple-100 rounded">
                  <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
                  </svg>
                </div>
                <span>Supervisor</span>
              </div>
              {/* <span className="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded-full font-medium">Frontend</span> */}
              <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                supervisores.length > 0 ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
              }`}>
                {supervisores.length}
              </span>
            </label>
            <select
              value={filters.supervisor || ''}
              onChange={(e) => onFiltersChange({ 
                ...filters, 
                supervisor: e.target.value || undefined 
              })}
              className="w-full px-3 sm:px-4 py-2 sm:py-3 border-2 border-slate-200 rounded-xl focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 transition-all duration-200 bg-white/80 text-sm sm:text-base"
              disabled={loading || !filters.zonal}
            >
              <option value="">
                {!filters.zonal ? 'Selecciona zonal primero' : 'Todos los supervisores'}
              </option>
              {supervisores.map((supervisor) => (
                <option key={supervisor} value={supervisor}>{supervisor}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Filtros activos */}



      </div>
    </div>
  );
};

// ✅ HEADER RESPONSIVE CON NAVEGACIÓN MÓVIL
const ResponsiveHeader = ({ user, onExportResumen, onExportDetalle, onLogout, loading, counts }: {
  user: any;
  onExportResumen: () => void;
  onExportDetalle: () => void;
  onLogout: () => void;
  loading: boolean;
  counts: { resumen: number; detalle: number };
}) => {
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  return (
    <div className="mb-6 sm:mb-8">
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center mb-4 sm:mb-6 gap-4">
        {/* Logo y título */}
        <div className="flex items-center space-x-3 sm:space-x-4">
          <div className="p-2 sm:p-3 bg-gradient-to-r from-blue-600 to-purple-700 rounded-2xl shadow-lg">
            <svg className="w-6 h-6 sm:w-8 sm:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
            </svg>
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
              Dashboard FTTH
            </h1>
            <p className="text-slate-600 text-sm sm:text-base lg:text-lg mt-1">
              Bienvenido, <span className="font-semibold text-slate-800">{user.displayName || user.username}</span>
            </p>
          </div>
        </div>
        
        {/* Botón menú móvil */}
        <div className="lg:hidden">
          <button
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            className="p-3 bg-white/90 backdrop-blur-sm rounded-xl border border-slate-200 shadow-lg"
          >
            <svg className="w-6 h-6 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path>
            </svg>
          </button>
        </div>
        
        {/* Botones desktop */}
        <div className="hidden lg:flex gap-3">
          <button
            onClick={onExportResumen}
            disabled={loading || counts.resumen === 0}
            className="px-4 xl:px-6 py-2 xl:py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white rounded-xl font-semibold disabled:opacity-50 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 text-sm xl:text-base"
          >
            <div className="flex items-center space-x-2">
              <svg className="w-4 h-4 xl:w-5 xl:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
              </svg>
              <span>Resumen ({counts.resumen})</span>
            </div>
          </button>
          <button
            onClick={onExportDetalle}
            disabled={loading || counts.detalle === 0}
            className="px-4 xl:px-6 py-2 xl:py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl font-semibold disabled:opacity-50 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 text-sm xl:text-base"
          >
            <div className="flex items-center space-x-2">
              <svg className="w-4 h-4 xl:w-5 xl:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
              </svg>
              <span>Detalle ({counts.detalle})</span>
            </div>
          </button>
          <button
            onClick={onLogout}
            className="px-4 xl:px-6 py-2 xl:py-3 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 text-sm xl:text-base"
          >
            <div className="flex items-center space-x-2">
              <svg className="w-4 h-4 xl:w-5 xl:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
              </svg>
              <span>Cerrar Sesión</span>
            </div>
          </button>
        </div>
      </div>
      
      {/* Menú móvil */}
      {showMobileMenu && (
        <div className="lg:hidden mb-6">
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl border border-slate-200 shadow-xl p-4 space-y-3">
            <button
              onClick={() => {
                onExportResumen();
                setShowMobileMenu(false);
              }}
              disabled={loading || counts.resumen === 0}
              className="w-full px-4 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white rounded-xl font-semibold disabled:opacity-50 transition-all duration-200"
            >
              <div className="flex items-center justify-center space-x-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                </svg>
                <span>Resumen ({counts.resumen})</span>
              </div>
            </button>
            <button
              onClick={() => {
                onExportDetalle();
                setShowMobileMenu(false);
              }}
              disabled={loading || counts.detalle === 0}
              className="w-full px-4 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl font-semibold disabled:opacity-50 transition-all duration-200"
            >
              <div className="flex items-center justify-center space-x-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                </svg>
                <span>Detalle ({counts.detalle})</span>
              </div>
            </button>
            <button
              onClick={() => {
                onLogout();
                setShowMobileMenu(false);
              }}
              className="w-full px-4 py-3 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-xl font-semibold transition-all duration-200"
            >
              <div className="flex items-center justify-center space-x-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
                </svg>
                <span>Cerrar Sesión</span>
              </div>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// ✅ ESTADÍSTICAS RESPONSIVE
const StatsGrid = ({ stats, zonales, supervisores }: {
  stats: { totalVendedores: number; totalVentas: number };
  zonales: string[];
  supervisores: string[];
}) => {
  const statsData = [
    {
      title: "HC-Venta",
      value: stats.totalVendedores,
      subtitle: "Vendedores activos",
      icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z",
      gradient: "from-blue-500 to-blue-600",
      textGradient: "from-blue-600 to-blue-800"
    },
    {
      title: "Total Ventas",
      value: stats.totalVentas,
      subtitle: "Pedidos procesados",
      icon: "M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z",
      gradient: "from-emerald-500 to-emerald-600",
      textGradient: "from-emerald-600 to-emerald-800"
    },
    {
      title: "Zonales",
      value: zonales.length,
      subtitle: "Zonas operativas",
      icon: "M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z",
      gradient: "from-purple-500 to-purple-600",
      textGradient: "from-purple-600 to-purple-800"
    },
    {
      title: "Supervisores",
      value: supervisores.length,
      subtitle: "Supervisores activos",
      icon: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4",
      gradient: "from-orange-500 to-orange-600",
      textGradient: "from-orange-600 to-orange-800"
    }
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-8">
      {statsData.map((stat, index) => (
        <div key={index} className="bg-white/90 backdrop-blur-sm p-4 sm:p-6 lg:p-8 rounded-2xl border border-slate-200/50 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div className="flex-1 mb-3 lg:mb-0">
              <p className="text-xs sm:text-sm font-semibold text-slate-600 uppercase tracking-wide mb-1 sm:mb-2">
                {stat.title}
              </p>
              <p className={`text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r ${stat.textGradient} bg-clip-text text-transparent`}>
                {stat.value.toLocaleString()}
              </p>
              <p className="text-xs sm:text-sm text-slate-500 mt-1 lg:mt-2 hidden sm:block">
                {stat.subtitle}
              </p>
            </div>
            <div className={`p-2 sm:p-3 lg:p-4 bg-gradient-to-br ${stat.gradient} rounded-2xl shadow-lg self-center lg:self-auto`}>
              <svg className="w-5 h-5 sm:w-6 sm:h-6 lg:w-8 lg:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={stat.icon}></path>
              </svg>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

// ✅ COMPONENTE PRINCIPAL COMPLETO
export default function DashboardPage() {
  const { user, isAuthenticated, loading, logout, error: authError, checkComplete } = useAuth();
  
  const [allVendedoresData, setAllVendedoresData] = useState<VendedorVentaResumen[]>([]);
  const [allDetalleData, setAllDetalleData] = useState<DetalleVenta[]>([]);
  const [filters, setFilters] = useState<FrontendFilters>({ fecha: ReportsService.getCurrentDate() });
  const [loadingData, setLoadingData] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { filteredVendedores, filteredDetalle, zonales, supervisores, stats } = useMemo(() => {
    const zonalesSet = new Set(allVendedoresData.map(item => item.zonal).filter(Boolean));
    const zonalesArray = Array.from(zonalesSet).sort();

    const supervisoresArray = filters.zonal 
      ? Array.from(new Set(
          allVendedoresData
            .filter(item => item.zonal === filters.zonal)
            .map(item => item.supervisor)
            .filter(Boolean)
        )).sort()
      : [];

    let filteredVendedoresData = allVendedoresData;
    if (filters.zonal) {
      filteredVendedoresData = filteredVendedoresData.filter(item => item.zonal === filters.zonal);
    }
    if (filters.supervisor) {
      filteredVendedoresData = filteredVendedoresData.filter(item => item.supervisor === filters.supervisor);
    }

    let filteredDetalleData = allDetalleData;
    if (filters.zonal) {
      filteredDetalleData = filteredDetalleData.filter(item => item.zonal === filters.zonal);
    }
    if (filters.supervisor) {
      filteredDetalleData = filteredDetalleData.filter(item => item.supervisor === filters.supervisor);
    }

    const totalVendedores = filteredVendedoresData.reduce((sum, item) => sum + (item.vendedores_con_ventas || 0), 0);
    const totalVentas = filteredVendedoresData.reduce((sum, item) => sum + (item.pedidos_distintos || 0), 0);

    return {
      filteredVendedores: filteredVendedoresData,
      filteredDetalle: filteredDetalleData,
      zonales: zonalesArray,
      supervisores: supervisoresArray,
      stats: { totalVendedores, totalVentas }
    };
  }, [allVendedoresData, allDetalleData, filters.zonal, filters.supervisor]);

  const loadDashboardData = async () => {
    if (!isAuthenticated || loadingData) return;
    
    setLoadingData(true);
    setError(null);
    
    try {
      const backendFilters: ReportsFilters = filters.fecha ? { fecha: filters.fecha } : {};
      
      const resumenResponse = await ReportsService.getVendedoresVentas(backendFilters);
      if (!isApiError(resumenResponse)) {
        setAllVendedoresData(resumenResponse.data || []);
      } else {
        setError(`Error cargando resumen: ${resumenResponse.error}`);
      }

      const detalleResponse = await ReportsService.getDetalleVentas({ 
        ...backendFilters, 
        limit: 200,
        offset: 0 
      });
      if (!isApiError(detalleResponse)) {
        setAllDetalleData(detalleResponse.data || []);
      }
      
    } catch (err: any) {
      if (err.response?.status === 401) {
        logout();
      } else {
        setError(`Error: ${err.message}`);
      }
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    if (checkComplete && isAuthenticated && user && !authError) {
      loadDashboardData();
    }
  }, [checkComplete, isAuthenticated, user?.id, authError]);

  useEffect(() => {
    if (isAuthenticated && user) {
      const timer = setTimeout(loadDashboardData, 500);
      return () => clearTimeout(timer);
    }
  }, [filters.fecha]);

  const exportToCSV = async (type: 'resumen' | 'detalle') => {
    try {
      const data = type === 'resumen' ? filteredVendedores : filteredDetalle;
      const filename = `${type}_ventas_${filters.fecha || 'todas'}_${filters.zonal || 'todas_zonales'}`;
      await ReportsService.exportToCSV(data, filename);
    } catch (err: any) {
      setError(`Error exportando: ${err.message}`);
    }
  };

  if (loading || !checkComplete) {
    return <LoadingSpinner text="Verificando sesión..." />;
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-slate-50 to-blue-50 p-3 sm:p-4 lg:p-6">
      <ResponsiveHeader
        user={user}
        onExportResumen={() => exportToCSV('resumen')}
        onExportDetalle={() => exportToCSV('detalle')}
        onLogout={logout}
        loading={loadingData}
        counts={{ resumen: filteredVendedores.length, detalle: filteredDetalle.length }}
      />

      {error && (
        <div className="bg-gradient-to-r from-red-50 to-red-100 border-l-4 border-red-500 p-4 sm:p-6 mb-4 sm:mb-6 rounded-xl shadow-lg">
          <div className="flex items-start">
            <div className="p-2 bg-red-100 rounded-full mr-4 flex-shrink-0">
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-base sm:text-lg font-semibold text-red-800 mb-2">Error en el Sistema</h3>
              <p className="text-sm sm:text-base text-red-700">{error}</p>
            </div>
            <button 
              onClick={() => setError(null)} 
              className="p-2 text-red-400 hover:text-red-600 hover:bg-red-200 rounded-full transition-all duration-200 flex-shrink-0"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>
        </div>
      )}

      <FiltersPanel
        filters={filters}
        onFiltersChange={setFilters}
        zonales={zonales}
        supervisores={supervisores}
        loading={loadingData}
        onRefresh={loadDashboardData}
      />

      <StatsGrid stats={stats} zonales={zonales} supervisores={supervisores} />

      {/* Tablas y contenido - Versión responsive */}
      <div className="space-y-6 lg:space-y-0 lg:grid lg:grid-cols-2 lg:gap-8">
        {/* Resumen Table */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl border border-slate-200/50 shadow-xl overflow-hidden">
          <div className="p-4 sm:p-6 lg:p-8 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-blue-50">
            <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-slate-800 mb-1">Resumen por Zonales</h2>
            <p className="text-sm sm:text-base text-slate-600">
              {filteredVendedores.length} de {allVendedoresData.length} registros
            </p>
          </div>
          
          <div className="overflow-auto max-h-80 sm:max-h-96">
            {loadingData ? (
              <div className="p-8 sm:p-12 text-center">
                <div className="animate-spin rounded-full h-8 w-8 sm:h-12 sm:w-12 border-4 border-slate-300 border-t-blue-600 mx-auto mb-4"></div>
                <p className="text-slate-600 font-medium">Cargando datos...</p>
              </div>
            ) : filteredVendedores.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gradient-to-r from-slate-100 to-slate-200">
                    <tr>
                      <th className="px-3 sm:px-6 lg:px-8 py-3 sm:py-4 text-left text-xs font-bold text-slate-600 uppercase">Zonal</th>
                      <th className="px-3 sm:px-6 lg:px-8 py-3 sm:py-4 text-left text-xs font-bold text-slate-600 uppercase">Supervisor</th>
                      <th className="px-3 sm:px-6 lg:px-8 py-3 sm:py-4 text-right text-xs font-bold text-slate-600 uppercase">Vendedores</th>
                      <th className="px-3 sm:px-6 lg:px-8 py-3 sm:py-4 text-right text-xs font-bold text-slate-600 uppercase">Ventas</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {filteredVendedores.map((item, index) => (
                      <tr key={index} className="hover:bg-gradient-to-r hover:from-slate-50 hover:to-blue-50">
                        <td className="px-3 sm:px-6 lg:px-8 py-3 sm:py-5 font-bold text-slate-900 text-xs sm:text-sm">{item.zonal}</td>
                        <td className="px-3 sm:px-6 lg:px-8 py-3 sm:py-5 font-medium text-slate-700 text-xs sm:text-sm">{item.supervisor}</td>
                        <td className="px-3 sm:px-6 lg:px-8 py-3 sm:py-5 text-right">
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-bold">
                            {item.vendedores_con_ventas}
                          </span>
                        </td>
                        <td className="px-3 sm:px-6 lg:px-8 py-3 sm:py-5 text-right">
                          <span className="px-2 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-bold">
                            {item.pedidos_distintos}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-8 sm:p-12 text-center">
                <div className="p-4 sm:p-6 bg-slate-100 rounded-2xl inline-block mb-4">
                  <svg className="w-8 h-8 sm:w-12 sm:h-12 text-slate-400 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 009.586 13H7"></path>
                  </svg>
                </div>
                <p className="text-slate-600 font-medium mb-2 text-sm sm:text-base">No hay datos disponibles</p>
                <p className="text-xs sm:text-sm text-slate-500">Intenta cambiar los filtros</p>
              </div>
            )}
          </div>
        </div>

        {/* Detalle Cards */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl border border-slate-200/50 shadow-xl overflow-hidden">
          <div className="p-4 sm:p-6 lg:p-8 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-emerald-50">
            <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-slate-800 mb-1">Detalle de Ventas</h2>
            <p className="text-sm sm:text-base text-slate-600">
              {filteredDetalle.length} de {allDetalleData.length} registros
            </p>
          </div>
          
          <div className="overflow-auto max-h-80 sm:max-h-96 p-3 sm:p-4 lg:p-6">
            {loadingData ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 sm:h-12 sm:w-12 border-4 border-slate-300 border-t-emerald-600 mx-auto mb-4"></div>
                <p className="text-slate-600 font-medium text-sm sm:text-base">Cargando detalles...</p>
              </div>
            ) : filteredDetalle.length > 0 ? (
              <div className="space-y-3 sm:space-y-4">
                {filteredDetalle.map((venta, index) => (
                  <div key={index} className="p-3 sm:p-4 lg:p-6 bg-gradient-to-r from-slate-50 to-white rounded-xl border border-slate-200 hover:shadow-lg transition-all duration-300">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 sm:gap-6">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 sm:space-x-3 mb-2 sm:mb-3">
                          <div className="p-1.5 sm:p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex-shrink-0">
                            <svg className="w-3 h-3 sm:w-4 sm:h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                            </svg>
                          </div>
                          <h3 className="font-bold text-slate-900 text-sm sm:text-base lg:text-lg truncate">{venta.vendedor_nombre}</h3>
                        </div>
                        <div className="flex flex-wrap gap-2 sm:gap-4 text-xs sm:text-sm text-slate-600">
                          <span className="flex items-center space-x-1">
                            <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                            </svg>
                            <span className="font-medium">{venta.zonal}</span>
                          </span>
                          <span className="flex items-center space-x-1">
                            <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                            </svg>
                            <span className="font-medium truncate">{venta.hora_min_segundo}</span>
                          </span>
                        </div>
                      </div>
                      <div className="text-right sm:ml-6 flex-shrink-0">
                        <span className="inline-flex items-center px-2 sm:px-4 py-1 sm:py-2 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-full text-xs sm:text-sm font-bold shadow-lg">
                          <svg className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                          </svg>
                          #{venta.nro_pedido_orig}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center">
                <div className="p-4 sm:p-6 bg-slate-100 rounded-2xl inline-block mb-4">
                  <svg className="w-8 h-8 sm:w-12 sm:h-12 text-slate-400 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                  </svg>
                </div>
                <p className="text-slate-600 font-medium mb-2 text-sm sm:text-base">No hay ventas disponibles</p>
                <p className="text-xs sm:text-sm text-slate-500">Intenta cambiar los filtros</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}