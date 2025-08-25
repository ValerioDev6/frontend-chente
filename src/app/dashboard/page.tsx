'use client';

import { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import { 
  ReportsService,
  VendedorVentaResumen,
  DetalleVenta,
  ReportsFilters,
  ApiError
} from '@/app/services/reports';

interface DashboardStats {
  totalVendedores: number;
  totalVentas: number;
  totalQvdd: number; // Nuevo campo para estadísticas
  PctQvdd: number
}

interface FrontendFilters {
  fecha?: string;
  zonal?: string;
  supervisor?: string;
}

const isApiError = (response: any): response is ApiError => {
  return response && response.success === false && 'error' in response;
};

// Loading component simplificado
const DataLoadingSpinner = ({ text = "Cargando datos..." }: { text?: string }) => (
  <div className="p-8 sm:p-12 text-center">
    <div className="animate-spin rounded-full h-8 w-8 sm:h-12 sm:w-12 border-4 border-slate-300 border-t-blue-600 mx-auto mb-4"></div>
    <p className="text-slate-600 font-medium text-sm sm:text-base">{text}</p>
  </div>
);

// Panel de filtros optimizado
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
    <div className="bg-white/90 backdrop-blur-sm rounded-2xl border border-slate-200/50 p-4 sm:p-6 mb-6 sm:mb-8 shadow-xl">
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
      
      <div className={`${isCollapsed ? 'hidden sm:block' : 'block'}`}>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
          {/* FECHA */}
          <div className="space-y-3">
            <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
              <div className="flex items-center space-x-2">
                <div className="p-1 bg-blue-100 rounded">
                  <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                  </svg>
                </div>
                <span>Fecha</span>
              </div>
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
            <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
              <div className="flex items-center space-x-2">
                <div className="p-1 bg-emerald-100 rounded">
                  <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
                  </svg>
                </div>
                <span>Zonal</span>
              </div>
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
            <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
              <div className="flex items-center space-x-2">
                <div className="p-1 bg-purple-100 rounded">
                  <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
                  </svg>
                </div>
                <span>Supervisor</span>
              </div>
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
      </div>
    </div>
  );
};

// Header simplificado - solo acciones de exportación
const ExportHeader = ({ onExportResumen, onExportDetalle, loading, counts }: {
  onExportResumen: () => void;
  onExportDetalle: () => void;
  loading: boolean;
  counts: { resumen: number; detalle: number };
}) => {
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  return (
    <div className="mb-6 sm:mb-8">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
            Dashboard
          </h1>
          <p className="text-slate-600 text-sm sm:text-base mt-1">
            Gestión de ventas regulares
          </p>
        </div>
        
        {/* Botón menú móvil */}
        <div className="sm:hidden">
          <button
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            className="p-3 bg-white/90 backdrop-blur-sm rounded-xl border border-slate-200 shadow-lg w-full"
          >
            <div className="flex items-center justify-center space-x-2">
              <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
              </svg>
              <span className="font-medium">Exportar Datos</span>
            </div>
          </button>
        </div>
        
        {/* Botones desktop */}
        <div className="hidden sm:flex gap-3">
          <button
            onClick={onExportResumen}
            disabled={loading || counts.resumen === 0}
            className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white rounded-xl font-semibold disabled:opacity-50 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 text-sm"
          >
            <div className="flex items-center space-x-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
              </svg>
              <span>Resumen ({counts.resumen})</span>
            </div>
          </button>
          <button
            onClick={onExportDetalle}
            disabled={loading || counts.detalle === 0}
            className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl font-semibold disabled:opacity-50 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 text-sm"
          >
            <div className="flex items-center space-x-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
              </svg>
              <span>Detalle ({counts.detalle})</span>
            </div>
          </button>
        </div>
      </div>
      
      {/* Menú móvil */}
      {showMobileMenu && (
        <div className="sm:hidden mt-4">
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
          </div>
        </div>
      )}
    </div>
  );
};

// Estadísticas optimizadas - AGREGADO QVDD
const StatsGrid = ({ stats, zonales, supervisores }: {
  stats: { totalVendedores: number; totalVentas: number; totalQvdd: number; PctQvdd: number };
  zonales: string[];
  supervisores: string[];
}) => {
  const statsData = [
    {
      title: "HC-Venta",
      value: stats.totalVendedores,
      subtitle: "Vendedores con ventas",
      icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z",
      gradient: "from-blue-500 to-blue-600",
      textGradient: "from-blue-600 to-blue-800"
    },
    {
      title: "Ventas Regulares",
      value: stats.totalVentas,
      subtitle: "Ventas reportadas",
      icon: "M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z",
      gradient: "from-emerald-500 to-emerald-600",
      textGradient: "from-emerald-600 to-emerald-800"
    },
    {
      title: "Cantidad Vendedores",
      value: stats.totalQvdd,
      subtitle: "Vendedores en campo",
      icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z",
      gradient: "from-indigo-500 to-indigo-600", 
      textGradient: "from-indigo-600 to-indigo-800"
    },
    {
      title: "Zonales",
      value: zonales.length,
      subtitle: "Zonas operativas",
      icon: "M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z",
      gradient: "from-purple-500 to-purple-600",
      textGradient: "from-purple-600 to-purple-800"
    }
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-8">
      {statsData.map((stat, index) => (
        <div key={index} className="bg-white/90 backdrop-blur-sm p-4 sm:p-6 rounded-2xl border border-slate-200/50 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div className="flex-1 mb-3 lg:mb-0">
              <p className="text-xs sm:text-sm font-semibold text-slate-600 uppercase tracking-wide mb-1 sm:mb-2">
                {stat.title}
              </p>
              <p className={`text-2xl sm:text-3xl font-bold bg-gradient-to-r ${stat.textGradient} bg-clip-text text-transparent`}>
                {stat.value.toLocaleString()}
              </p>
              <p className="text-xs sm:text-sm text-slate-500 mt-1 hidden sm:block">
                {stat.subtitle}
              </p>
            </div>
            <div className={`p-2 sm:p-3 bg-gradient-to-br ${stat.gradient} rounded-2xl shadow-lg self-center lg:self-auto`}>
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={stat.icon}></path>
              </svg>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

// Componente de card para la última venta
const UltimaVentaCard = ({ venta }: { venta: DetalleVenta }) => (
  <div className="p-4 sm:p-6 bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 border-2 border-amber-200 rounded-2xl shadow-xl mb-4 relative overflow-hidden">
    {/* Badge de "Última Venta" */}
    <div className="absolute -top-2 -right-2">
      <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-4 py-2 rounded-full text-xs font-bold shadow-lg transform rotate-12">
        🔥 ÚLTIMA VENTA
      </div>
    </div>
    
    {/* Efecto de brillo */}
    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 opacity-30"></div>
    
    <div className="relative z-10">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-3">
            <div className="p-2 bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl shadow-lg">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
              </svg>
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-lg">{venta.vendedor_nombre}</h3>
              <p className="text-sm text-amber-700 font-medium">Última venta registrada del día</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex items-center space-x-2">
              <div className="p-1.5 bg-amber-100 rounded-lg">
                <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                </svg>
              </div>
              <div>
                <p className="text-xs text-slate-600 font-medium">Zonal</p>
                <p className="font-bold text-slate-900">{venta.zonal}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <div className="p-1.5 bg-orange-100 rounded-lg">
                <svg className="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
                </svg>
              </div>
              <div>
                <p className="text-xs text-slate-600 font-medium">Supervisor</p>
                <p className="font-bold text-slate-900">{venta.supervisor}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <div className="p-1.5 bg-yellow-100 rounded-lg">
                <svg className="w-4 h-4 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
              </div>
              <div>
                <p className="text-xs text-slate-600 font-medium">Hora</p>
                <p className="font-bold text-slate-900">{venta.hora_min_segundo}</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="text-center sm:text-right flex-shrink-0">
          <div className="inline-flex items-center px-4 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-2xl font-bold shadow-2xl transform hover:scale-105 transition-all duration-200">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
            </svg>
            <span>#{venta.nro_pedido_orig}</span>
          </div>
          <p className="text-xs text-amber-700 mt-2 font-medium">Número de Pedido</p>
        </div>
      </div>
    </div>
  </div>
);

// Componente principal optimizado - sin lógica de autenticación
export default function DashboardPage() {
  const { user, logout } = useAuth(); // Solo necesitamos user para logout
  
  const [allVendedoresData, setAllVendedoresData] = useState<VendedorVentaResumen[]>([]);
  const [allDetalleData, setAllDetalleData] = useState<DetalleVenta[]>([]);
  const [filters, setFilters] = useState<FrontendFilters>({ fecha: ReportsService.getCurrentDate() });
  const [loadingData, setLoadingData] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { filteredVendedores, filteredDetalle, zonales, supervisores, stats, ultimaVenta } = useMemo(() => {
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

    // // Ordenar por hora para obtener la última venta
    // const sortedDetalle = [...filteredDetalleData].sort((a, b) => {
    //   // Asumiendo que hora_min_segundo está en formato HH:MM:SS
    //   return b.hora_min_segundo?.localeCompare(a.hora_min_segundo?);
    // });
    const sortedDetalle = [...filteredDetalleData].sort((a, b) => {
      // Si ambos son undefined, son iguales
      if (!a.hora_min_segundo && !b.hora_min_segundo) return 0;
      
      // Si solo a es undefined, va al final
      if (!a.hora_min_segundo) return 1;
      
      // Si solo b es undefined, va al final
      if (!b.hora_min_segundo) return -1;
      
      // Ambos tienen valor, comparar normalmente (orden descendente para la última venta)
      return b.hora_min_segundo.localeCompare(a.hora_min_segundo);
    });
    const totalVendedores = filteredVendedoresData.reduce((sum, item) => sum + (item.vendedores_con_ventas || 0), 0);
    const totalVentas = filteredVendedoresData.reduce((sum, item) => sum + (item.pedidos_distintos || 0), 0);
    const totalQvdd = filteredVendedoresData.reduce((sum, item) => sum + (item.qvdd || 0), 0);
    const PctQvdd = filteredVendedoresData.reduce((sum, item) => sum + (item.hc_venta_pct || 0), 0);

    return {
      filteredVendedores: filteredVendedoresData,
      filteredDetalle: sortedDetalle,
      zonales: zonalesArray,
      supervisores: supervisoresArray,
      stats: { totalVendedores, totalVentas, totalQvdd, PctQvdd },
      ultimaVenta: sortedDetalle[0] || null // Primera venta del array ordenado = última del día
    };
  }, [allVendedoresData, allDetalleData, filters.zonal, filters.supervisor]);

  const loadDashboardData = async () => {
    if (loadingData) return;
    
    setLoadingData(true);
    setError(null);
    
    try {
      const backendFilters: ReportsFilters = filters.fecha ? { fecha: filters.fecha } : {};
      
      const [resumenResponse, detalleResponse] = await Promise.all([
        ReportsService.getVendedoresVentas(backendFilters),
        ReportsService.getDetalleVentas({ ...backendFilters, limit: 200, offset: 0 })
      ]);

      if (!isApiError(resumenResponse)) {
        setAllVendedoresData(resumenResponse.data || []);
      } else {
        setError(`Error cargando resumen: ${resumenResponse.error}`);
      }

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
    loadDashboardData();
  }, []);

  useEffect(() => {
    const timer = setTimeout(loadDashboardData, 500);
    return () => clearTimeout(timer);
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-slate-50 to-blue-50 p-3 sm:p-4 lg:p-6">
      <ExportHeader
        onExportResumen={() => exportToCSV('resumen')}
        onExportDetalle={() => exportToCSV('detalle')}
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

      {/* Tablas responsivas */}
      <div className="space-y-6 lg:space-y-0 lg:grid lg:grid-cols-2 lg:gap-8">
        {/* Resumen Table - AGREGADA COLUMNA QVDD */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl border border-slate-200/50 shadow-xl overflow-hidden">
          <div className="p-4 sm:p-6 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-blue-50">
            <h2 className="text-lg sm:text-xl font-bold text-slate-800 mb-1">Ventas por Supervisor</h2>
            <p className="text-sm sm:text-base text-slate-600">
              {filteredVendedores.length} de {allVendedoresData.length} registros
            </p>
          </div>
          
          <div className="overflow-auto max-h-80 sm:max-h-96">
            {loadingData ? (
              <DataLoadingSpinner text="Cargando resumen..." />
            ) : filteredVendedores.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gradient-to-r from-slate-100 to-slate-200 sticky top-0">
                    <tr>
                      <th className="px-2 sm:px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase">Zonal</th>
                      <th className="px-2 sm:px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase">Supervisor</th>
                      <th className="px-2 sm:px-3 py-3 text-right text-xs font-bold text-slate-600 uppercase">HC</th>
                      <th className="px-2 sm:px-3 py-3 text-right text-xs font-bold text-slate-600 uppercase">Ventas</th>
                      <th className="px-2 sm:px-3 py-3 text-right text-xs font-bold text-slate-600 uppercase">QVDD</th>
                      <th className="px-2 sm:px-3 py-3 text-right text-xs font-bold text-slate-600 uppercase">% HC VTA.</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {filteredVendedores.map((item, index) => (
                      <tr key={index} className="hover:bg-gradient-to-r hover:from-slate-50 hover:to-blue-50 transition-colors duration-200">
                        <td className="px-2 sm:px-4 py-3 font-bold text-slate-900 text-xs sm:text-sm">{item.zonal}</td>
                        <td className="px-2 sm:px-4 py-3 font-medium text-slate-700 text-xs sm:text-sm">{item.supervisor}</td>
                        <td className="px-2 sm:px-3 py-3 text-right">
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-bold">
                            {item.vendedores_con_ventas}
                          </span>
                        </td>
                        <td className="px-2 sm:px-3 py-3 text-right">
                          <span className="px-2 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-bold">
                            {item.pedidos_distintos}
                          </span>
                        </td>
                        <td className="px-2 sm:px-3 py-3 text-right">
                          <span className="px-2 py-1 bg-indigo-100 text-indigo-800 rounded-full text-xs font-bold">
                            {item.qvdd || 0}
                          </span>
                        </td>
                        <td className="px-2 sm:px-3 py-3 text-right">
                          <span className="px-2 py-1 bg-purple-100 text-indigo-800 rounded-full text-xs font-bold">
                            {Math.round(item.hc_venta_pct || 0)}%
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
                <p className="text-xs sm:text-sm text-slate-500">Intenta cambiar los filtros o la fecha</p>
              </div>
            )}
          </div>
        </div>

        {/* Detalle Cards - CON ÚLTIMA VENTA DESTACADA */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl border border-slate-200/50 shadow-xl overflow-hidden">
          <div className="p-4 sm:p-6 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-emerald-50">
            <h2 className="text-lg sm:text-xl font-bold text-slate-800 mb-1">Detalle de Ventas</h2>
            <p className="text-sm sm:text-base text-slate-600">
              {filteredDetalle.length} de {allDetalleData.length} registros
            </p>
          </div>
          
          <div className="overflow-auto max-h-80 sm:max-h-96 p-3 sm:p-4">
            {loadingData ? (
              <DataLoadingSpinner text="Cargando detalles..." />
            ) : filteredDetalle.length > 0 ? (
              <div className="space-y-3 sm:space-y-4">
                {/* Mostrar la última venta destacada si existe */}
                {ultimaVenta && (
                  <UltimaVentaCard venta={ultimaVenta} />
                )}

                {/* Mostrar el resto de ventas (excluyendo la primera que ya se mostró como última) */}
                {filteredDetalle.slice(ultimaVenta ? 1 : 0).map((venta, index) => (
                  <div key={index + 1} className="p-3 sm:p-4 bg-gradient-to-r from-slate-50 to-white rounded-xl border border-slate-200 hover:shadow-lg transition-all duration-300 transform hover:scale-[1.02]">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 sm:space-x-3 mb-2">
                          <div className="p-1.5 sm:p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex-shrink-0">
                            <svg className="w-3 h-3 sm:w-4 sm:h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                            </svg>
                          </div>
                          <h3 className="font-bold text-slate-900 text-sm sm:text-base truncate">{venta.vendedor_nombre}</h3>
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
                            <span className="font-medium truncate">{venta.supervisor}</span>
                          </span>
                          <span className="flex items-center space-x-1">
                            <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                            </svg>
                            <span className="font-medium truncate">{venta.hora_min_segundo}</span>
                          </span>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <span className="inline-flex items-center px-2 sm:px-3 py-1 sm:py-2 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-full text-xs sm:text-sm font-bold shadow-lg">
                          <svg className="w-3 h-3 sm:w-4 sm:h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                <p className="text-xs sm:text-sm text-slate-500">Intenta cambiar los filtros o la fecha</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}