'use client';

import { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import { 
  ReportsService,
  VendedorVentaResumen,
  ReportsFilters,
  ApiError
} from '@/app/services/reports';
import {
  FeedbackService,
  ApiError as FeedbackApiError,
  FeedbackResponse
} from '@/app/services/feedback';

interface FrontendFilters {
  fecha?: string;
  zonal?: string;
  supervisor?: string;
}

// Función para exportar a Excel con formato específico
const exportToExcel = (data: VendedorVentaResumen[], filename: string) => {
  // Definir el mapeo de columnas con orden, nombre original y nombre para Excel
  const columnMapping = [
    { order: 1, key: 'zonal', excelName: 'Zonal' },
    { order: 2, key: 'supervisor', excelName: 'Supervisor' },
    { order: 3, key: 'qvdd', excelName: 'Cantidad Vdd' },
    { order: 4, key: 'vendedores_con_ventas', excelName: 'HC' },
    { order: 5, key: 'qvdd_comis', excelName: 'Cantidad Vdd Comis.' },
    { order: 6, key: 'qvdd_plan', excelName: 'Cantidad Vdd Plan.' },
    { order: 7, key: 'pedidos_distintos', excelName: 'Ventas Regulares' },
    { order: 8, key: 'cuota_diaria', excelName: 'Cuota' },
    { order: 9, key: 'porcentaje_cuota', excelName: '% Cobertura' },
    { order: 10, key: 'hc_venta_pct', excelName: '% HC con Venta' },
    { order: 11, key: 'comentarios_supervisor', excelName: 'Comentarios Supervisor' },
    { order: 12, key: 'comentarios_jefe', excelName: 'Comentarios Jefe' }
  ];

  // Ordenar por el orden especificado
  const orderedColumns = columnMapping.sort((a, b) => a.order - b.order);

  // Crear encabezados para Excel
  const headers = orderedColumns.map(col => col.excelName);

  // Transformar los datos según el mapeo
  const excelData = data.map(item => {
    const row: any = {};
    orderedColumns.forEach(col => {
      let value = item[col.key as keyof VendedorVentaResumen];
      
      // Formatear valores específicos
      switch (col.key) {
        case 'hc_venta_pct':
        case 'porcentaje_cuota':
          // Formatear porcentajes
          value = typeof value === 'number' ? Math.round(value * 100) / 100 : 0;
          break;
        case 'cuota_diaria':
          // Formatear números grandes
          value = typeof value === 'number' ? value : 0;
          break;
        case 'comentarios_jefe':
        case 'comentarios_supervisor':
          // Limpiar comentarios (remover saltos de línea extra)
          value = typeof value === 'string' ? value.trim() : '';
          break;
        default:
          // Para otros campos, asegurar que no sean undefined
          value = value || '';
      }
      
      row[col.excelName] = value;
    });
    return row;
  });

  // Crear el contenido CSV con el formato correcto
  const csvContent = [
    headers.join(','),
    ...excelData.map(row => 
      headers.map(header => {
        let value = row[header];
        
        // Si el valor contiene comas, comillas o saltos de línea, envolvemos en comillas
        if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
          value = `"${value.replace(/"/g, '""')}"`;
        }
        
        return value;
      }).join(',')
    )
  ].join('\n');

  // Crear y descargar el archivo
  const blob = new Blob(['\uFEFF' + csvContent], { 
    type: 'text/csv;charset=utf-8;' 
  });
  
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

// Helper para detectar errores de API
const isApiError = (response: any): response is ApiError => {
  return response && response.success === false && 'error' in response;
};

// Helper para detectar errores de Feedback API
const isFeedbackApiError = (response: any): response is FeedbackApiError => {
  return response && response.success === false && 'error' in response;
};

// Loading component
const DataLoadingSpinner = ({ text = "Cargando datos..." }: { text?: string }) => (
  <div className="p-4 sm:p-8 text-center">
    <div className="animate-spin rounded-full h-8 w-8 sm:h-12 sm:w-12 border-4 border-slate-300 border-t-blue-600 mx-auto mb-4"></div>
    <p className="text-slate-600 font-medium text-sm sm:text-base">{text}</p>
  </div>
);

// Panel de filtros mejorado con supervisores independientes - RESPONSIVO
const FiltersPanel = ({ 
  filters, 
  onFiltersChange, 
  zonales, 
  supervisores,
  allSupervisores,
  loading,
  onRefresh
}: {
  filters: FrontendFilters;
  onFiltersChange: (filters: FrontendFilters) => void;
  zonales: string[];
  supervisores: string[];
  allSupervisores: string[];
  loading: boolean;
  onRefresh: () => void;
}) => {
  return (
    <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-200 p-4 sm:p-6 mb-6 sm:mb-8 shadow-xl">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 sm:mb-6 space-y-4 sm:space-y-0">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg">
            <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4"></path>
            </svg>
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-800">Filtros de Análisis</h2>
        </div>
        
        <button
          onClick={onRefresh}
          disabled={loading}
          className="w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white rounded-lg sm:rounded-xl font-semibold disabled:opacity-50 transition-all duration-200 shadow-lg hover:shadow-xl text-sm sm:text-base"
        >
          {loading ? (
            <div className="flex items-center justify-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
              <span>Actualizando...</span>
            </div>
          ) : (
            <div className="flex items-center justify-center space-x-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
              </svg>
              <span>Actualizar</span>
            </div>
          )}
        </button>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* FECHA */}
        <div className="space-y-2 sm:space-y-3">
          <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
            <div className="p-1 bg-blue-100 rounded">
              <svg className="w-3 h-3 sm:w-4 sm:h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
              </svg>
            </div>
            <span className="text-xs sm:text-sm">Fecha de Análisis</span>
          </label>
          <input
            type="date"
            value={filters.fecha || ''}
            onChange={(e) => onFiltersChange({ 
              ...filters, 
              fecha: e.target.value || undefined 
            })}
            className="w-full px-3 sm:px-4 py-2 sm:py-3 border-2 border-slate-200 rounded-lg sm:rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 bg-white text-sm sm:text-base"
            disabled={loading}
          />
        </div>

        {/* ZONAL */}
        <div className="space-y-2 sm:space-y-3">
          <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
            <div className="p-1 bg-emerald-100 rounded">
              <svg className="w-3 h-3 sm:w-4 sm:h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
              </svg>
            </div>
            <span className="text-xs sm:text-sm">Zonal</span>
            <span className="text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full bg-green-100 text-green-700 font-medium">
              {zonales.length}
            </span>
          </label>
          <select
            value={filters.zonal || ''}
            onChange={(e) => onFiltersChange({ 
              ...filters, 
              zonal: e.target.value || undefined
            })}
            className="w-full px-3 sm:px-4 py-2 sm:py-3 border-2 border-slate-200 rounded-lg sm:rounded-xl focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all duration-200 bg-white text-sm sm:text-base"
            disabled={loading || zonales.length === 0}
          >
            <option value="">Todas las zonales</option>
            {zonales.map((zonal) => (
              <option key={zonal} value={zonal}>{zonal}</option>
            ))}
          </select>
        </div>

        {/* SUPERVISOR */}
        <div className="space-y-2 sm:space-y-3 sm:col-span-2 lg:col-span-1">
          <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
            <div className="p-1 bg-purple-100 rounded">
              <svg className="w-3 h-3 sm:w-4 sm:h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
              </svg>
            </div>
            <span className="text-xs sm:text-sm">Supervisor</span>
            <span className="text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full bg-purple-100 text-purple-700 font-medium">
              {allSupervisores.length}
            </span>
          </label>
          <select
            value={filters.supervisor || ''}
            onChange={(e) => onFiltersChange({ 
              ...filters, 
              supervisor: e.target.value || undefined 
            })}
            className="w-full px-3 sm:px-4 py-2 sm:py-3 border-2 border-slate-200 rounded-lg sm:rounded-xl focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 transition-all duration-200 bg-white text-sm sm:text-base"
            disabled={loading || allSupervisores.length === 0}
          >
            <option value="">Todos los supervisores</option>
            {allSupervisores.map((supervisor) => (
              <option key={supervisor} value={supervisor}>{supervisor}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Indicador de filtros activos - RESPONSIVO */}
      {(filters.zonal || filters.supervisor || filters.fecha) && (
        <div className="mt-4 p-3 sm:p-4 bg-blue-50 rounded-lg sm:rounded-xl border border-blue-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
            <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-2">
              <div className="flex items-center space-x-2">
                <svg className="w-4 h-4 text-blue-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.207A1 1 0 013 6.5V4z"></path>
                </svg>
                <span className="text-sm font-medium text-blue-800">Filtros activos:</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {filters.fecha && (
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                    📅 {filters.fecha}
                  </span>
                )}
                {filters.zonal && (
                  <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                    📍 {filters.zonal}
                  </span>
                )}
                {filters.supervisor && (
                  <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">
                    👤 {filters.supervisor}
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={() => onFiltersChange({ fecha: ReportsService.getCurrentDate() })}
              className="text-xs px-3 py-1 text-blue-600 hover:bg-blue-100 rounded-full transition-colors duration-200 self-start sm:self-auto"
            >
              Limpiar filtros
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// Header ejecutivo - RESPONSIVO
const ExecutiveHeader = ({ onExport, loading, totalRecords }: {
  onExport: () => void;
  loading: boolean;
  totalRecords: number;
}) => {
  return (
    <div className="mb-6 sm:mb-8">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start space-y-4 sm:space-y-0">
        <div className="text-center sm:text-left">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent mb-2">
            Informe Ejecutivo
          </h1>
          <p className="text-slate-600 text-sm sm:text-base lg:text-lg">
            Dashboard de Gestión Comercial - Análisis de Rendimiento
          </p>
        </div>
        
        <button
          onClick={onExport}
          disabled={loading || totalRecords === 0}
          className="w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg sm:rounded-xl font-semibold disabled:opacity-50 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 text-sm sm:text-base"
        >
          <div className="flex items-center justify-center space-x-2">
            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
            </svg>
            <span>Exportar Excel ({totalRecords})</span>
          </div>
        </button>
      </div>
    </div>
  );
};

// Métricas ejecutivas mejoradas - RESPONSIVO
const ExecutiveMetrics = ({ data }: { data: VendedorVentaResumen[] }) => {
  const metrics = useMemo(() => {
    const totalQvdd = data.reduce((sum, item) => sum + (item.qvdd || 0), 0);
    const totalVendedoresConVentas = data.reduce((sum, item) => sum + (item.vendedores_con_ventas || 0), 0);
    const totalVentas = data.reduce((sum, item) => sum + (item.pedidos_distintos || 0), 0);
    const totalCuotaDiaria = data.reduce((sum, item) => sum + (item.cuota_diaria || 0), 0);
    
    // MÉTRICAS DE SUPERVISORES
    const totalSupervisores = data.length;
    
    // Supervisores CON ventas (HC-Venta > 0)
    const supervisoresConVentas = data.filter(item => (item.vendedores_con_ventas || 0) > 0).length;
    
    // Supervisores SIN ventas (HC-Venta = 0)
    const supervisoresSinVentas = data.filter(item => (item.vendedores_con_ventas || 0) === 0).length;
    
    // Supervisores con alto rendimiento (más de 80% de eficiencia)
    const supervisoresAltoRendimiento = data.filter(item => (item.hc_venta_pct || 0) >= 80).length;
    
    // Porcentaje promedio de cuota
    const promedioPortajeCuota = data.length > 0 
      ? data.reduce((sum, item) => sum + (item.porcentaje_cuota || 0), 0) / data.length 
      : 0;

    // Porcentaje promedio HC-Venta
    const promedioHcVentaPct = data.length > 0 
      ? data.reduce((sum, item) => sum + (item.hc_venta_pct || 0), 0) / data.length 
      : 0;

    return {
      totalQvdd,
      totalVendedoresConVentas,
      totalVentas,
      totalCuotaDiaria,
      totalSupervisores,
      supervisoresConVentas,
      supervisoresSinVentas,
      supervisoresAltoRendimiento,
      promedioPortajeCuota,
      promedioHcVentaPct,
      eficienciaVentas: totalQvdd > 0 ? (totalVendedoresConVentas / totalQvdd) * 100 : 0
    };
  }, [data]);

  const metricsCards = [
    {
      title: "Fuerza de Ventas",
      primary: {
        label: "Vendedores con Venta",
        value: metrics.totalVendedoresConVentas,
        color: "text-emerald-600"
      },
      secondary: {
        label: "Total QVDD",
        value: metrics.totalQvdd,
        color: "text-slate-600"
      },
      percentage: {
        label: "Eficiencia",
        value: metrics.eficienciaVentas,
        color: metrics.eficienciaVentas >= 70 ? "text-green-600" : "text-red-600"
      },
      icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z",
      gradient: "from-emerald-500 to-green-600"
    },
    {
      title: "Rendimiento Comercial",
      primary: {
        label: "Ventas Regulares",
        value: metrics.totalVentas,
        color: "text-blue-600"
      },
      secondary: {
        label: "Cuota Diaria",
        value: metrics.totalCuotaDiaria,
        color: "text-slate-600"
      },
      percentage: {
        label: "% Cuota Promedio",
        value: metrics.promedioPortajeCuota,
        color: metrics.promedioPortajeCuota >= 100 ? "text-green-600" : "text-amber-600"
      },
      icon: "M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z",
      gradient: "from-blue-500 to-indigo-600"
    },
    {
      title: "Supervisores con Ventas",
      primary: {
        label: "Con Ventas",
        value: metrics.supervisoresConVentas,
        color: "text-green-600"
      },
      secondary: {
        label: "Total Supervisores",
        value: metrics.totalSupervisores,
        color: "text-slate-600"
      },
      percentage: {
        label: "% Con Actividad",
        value: metrics.totalSupervisores > 0 ? (metrics.supervisoresConVentas / metrics.totalSupervisores) * 100 : 0,
        color: "text-green-600"
      },
      icon: "M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z",
      gradient: "from-green-500 to-emerald-600"
    },
    {
      title: "Supervisores sin Ventas",
      primary: {
        label: "Sin Ventas",
        value: metrics.supervisoresSinVentas,
        color: "text-red-600"
      },
      secondary: {
        label: "Total Supervisores",
        value: metrics.totalSupervisores,
        color: "text-slate-600"
      },
      percentage: {
        label: "% Sin Actividad",
        value: metrics.totalSupervisores > 0 ? (metrics.supervisoresSinVentas / metrics.totalSupervisores) * 100 : 0,
        color: "text-red-600"
      },
      icon: "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z",
      gradient: "from-red-500 to-pink-600"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
      {metricsCards.map((metric, index) => (
        <div key={index} className="bg-white rounded-xl sm:rounded-2xl border border-slate-200 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 overflow-hidden">
          {/* Header con gradiente */}
          <div className={`bg-gradient-to-r ${metric.gradient} p-3 sm:p-4`}>
            <div className="flex items-center justify-between text-white">
              <h3 className="font-bold text-xs sm:text-sm uppercase tracking-wide">{metric.title}</h3>
              <div className="p-1.5 sm:p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={metric.icon}></path>
                </svg>
              </div>
            </div>
          </div>
          
          {/* Content */}
          <div className="p-4 sm:p-6">
            {/* Métrica principal */}
            <div className="mb-3 sm:mb-4">
              <p className="text-xs font-medium text-slate-500 uppercase mb-1">{metric.primary.label}</p>
              <p className={`text-2xl sm:text-3xl font-bold ${metric.primary.color}`}>
                {metric.primary.value.toLocaleString()}
              </p>
            </div>
            
            {/* Métrica secundaria */}
            <div className="flex justify-between items-center text-sm mb-2 sm:mb-3">
              <span className="text-slate-500 text-xs sm:text-sm">{metric.secondary.label}</span>
              <span className={`font-semibold text-xs sm:text-sm ${metric.secondary.color}`}>
                {metric.secondary.value.toLocaleString()}
              </span>
            </div>
            
            {/* Porcentaje */}
            <div className="flex justify-between items-center">
              <span className="text-xs text-slate-500">{metric.percentage.label}</span>
              <span className={`text-sm font-bold ${metric.percentage.color}`}>
                {metric.percentage.value.toFixed(1)}%
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

// Tabla completa con todos los campos - RESPONSIVO
const ExecutiveTable = ({ data, loading }: { data: VendedorVentaResumen[], loading: boolean }) => {
  const [showMobileCards, setShowMobileCards] = useState(false);

  if (loading) {
    return (
      <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-200 shadow-xl">
        <DataLoadingSpinner text="Cargando datos ejecutivos..." />
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-200 shadow-xl p-8 sm:p-12 text-center">
        <div className="p-4 sm:p-6 bg-slate-100 rounded-xl sm:rounded-2xl inline-block mb-4">
          <svg className="w-8 h-8 sm:w-12 sm:h-12 text-slate-400 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 009.586 13H7"></path>
          </svg>
        </div>
        <h3 className="text-lg sm:text-xl font-semibold text-slate-600 mb-2">No hay datos disponibles</h3>
        <p className="text-slate-500 text-sm sm:text-base">Ajusta los filtros para ver información</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-200 shadow-xl overflow-hidden">
      <div className="p-4 sm:p-6 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-blue-50">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-2 sm:space-y-0">
          <div>
            <h2 className="text-lg sm:text-2xl font-bold text-slate-800 mb-1">Análisis Detallado por Supervisor</h2>
            <p className="text-slate-600 text-sm sm:text-base">{data.length} registros encontrados</p>
          </div>
          
          {/* Toggle para vista móvil */}
          <div className="sm:hidden">
            <button
              onClick={() => setShowMobileCards(!showMobileCards)}
              className="w-full px-4 py-2 bg-blue-100 hover:bg-blue-200 text-blue-800 rounded-lg font-medium transition-colors duration-200"
            >
              {showMobileCards ? 'Ver Tabla' : 'Ver Tarjetas'}
            </button>
          </div>
        </div>
      </div>
      
      {/* Vista móvil - Tarjetas */}
      <div className={`${showMobileCards ? 'block' : 'hidden'} sm:hidden`}>
        <div className="p-4 space-y-4">
          {data.map((item, index) => {
            const isLowPerformance = (item.hc_venta_pct || 0) < 50;
            const isHighPerformance = (item.hc_venta_pct || 0) >= 80;
            const hasNoSales = (item.vendedores_con_ventas || 0) === 0;
            
            return (
              <div 
                key={index} 
                className={`p-4 rounded-lg border-l-4 shadow-sm ${
                  hasNoSales ? 'bg-red-50 border-red-500' : 
                  isHighPerformance ? 'bg-green-50 border-green-500' : 
                  isLowPerformance ? 'bg-yellow-50 border-yellow-500' : 
                  'bg-white border-blue-500'
                }`}
              >
                {/* Header de la tarjeta */}
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">{item.supervisor}</h3>
                    <p className="text-xs text-slate-600">{item.zonal}</p>
                  </div>
                  <div className="text-right">
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                      (item.hc_venta_pct || 0) >= 80 ? 'bg-green-100 text-green-800' :
                      (item.hc_venta_pct || 0) >= 50 ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {Math.round(item.hc_venta_pct || 0)}% HC
                    </span>
                  </div>
                </div>
                
                {/* Métricas en grid */}
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div className="bg-slate-50 p-2 rounded">
                    <p className="text-xs text-slate-500">QVDD</p>
                    <p className="font-semibold text-slate-800">{item.qvdd || 0}</p>
                  </div>
                  <div className="bg-blue-50 p-2 rounded">
                    <p className="text-xs text-slate-500">HC-Venta</p>
                    <p className="font-semibold text-blue-800">{item.vendedores_con_ventas || 0}</p>
                  </div>
                  <div className="bg-emerald-50 p-2 rounded">
                    <p className="text-xs text-slate-500">Ventas</p>
                    <p className="font-semibold text-emerald-800">{item.pedidos_distintos || 0}</p>
                  </div>
                  <div className="bg-purple-50 p-2 rounded">
                    <p className="text-xs text-slate-500">% Cuota</p>
                    <p className="font-semibold text-purple-800">{Math.round(item.porcentaje_cuota || 0)}%</p>
                  </div>
                </div>
                
                {/* Comentarios */}
                {(item.comentarios_jefe || item.comentarios_supervisor) && (
                  <div className="pt-2 border-t border-slate-200">
                    <div className="space-y-1">
                      {item.comentarios_jefe && (
                        <div className="text-xs">
                          <span className="font-semibold text-blue-600">Jefe:</span>
                          <span className="text-slate-600 ml-1">{item.comentarios_jefe}</span>
                        </div>
                      )}
                      {item.comentarios_supervisor && (
                        <div className="text-xs">
                          <span className="font-semibold text-purple-600">Supervisor:</span>
                          <span className="text-slate-600 ml-1">{item.comentarios_supervisor}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Vista de escritorio y tablet - Tabla */}
      <div className={`${showMobileCards ? 'hidden' : 'block'} sm:block overflow-x-auto`}>
        <table className="w-full">
          <thead className="bg-gradient-to-r from-slate-100 to-slate-200">
            <tr>
              <th className="px-2 sm:px-4 py-3 sm:py-4 text-left text-xs font-bold text-slate-700 uppercase whitespace-nowrap">Zonal</th>
              <th className="px-2 sm:px-4 py-3 sm:py-4 text-left text-xs font-bold text-slate-700 uppercase whitespace-nowrap">Supervisor</th>
              <th className="px-2 sm:px-3 py-3 sm:py-4 text-right text-xs font-bold text-slate-700 uppercase">QVDD</th>
              <th className="px-2 sm:px-3 py-3 sm:py-4 text-right text-xs font-bold text-slate-700 uppercase hidden md:table-cell">QVDD Comis</th>
              <th className="px-2 sm:px-3 py-3 sm:py-4 text-right text-xs font-bold text-slate-700 uppercase hidden lg:table-cell">QVDD Plan</th>
              <th className="px-2 sm:px-3 py-3 sm:py-4 text-right text-xs font-bold text-slate-700 uppercase">HC-Venta</th>
              <th className="px-2 sm:px-3 py-3 sm:py-4 text-right text-xs font-bold text-slate-700 uppercase hidden sm:table-cell">Ventas</th>
              <th className="px-2 sm:px-3 py-3 sm:py-4 text-right text-xs font-bold text-slate-700 uppercase hidden xl:table-cell">Cuota</th>
              <th className="px-2 sm:px-3 py-3 sm:py-4 text-right text-xs font-bold text-slate-700 uppercase">% HC</th>
              <th className="px-2 sm:px-3 py-3 sm:py-4 text-right text-xs font-bold text-slate-700 uppercase hidden md:table-cell">% Cuota</th>
              <th className="px-2 sm:px-4 py-3 sm:py-4 text-left text-xs font-bold text-slate-700 uppercase hidden lg:table-cell">Comentarios</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {data.map((item, index) => {
              const isLowPerformance = (item.hc_venta_pct || 0) < 50;
              const isHighPerformance = (item.hc_venta_pct || 0) >= 80;
              const hasNoSales = (item.vendedores_con_ventas || 0) === 0;
              
              return (
                <tr 
                  key={index} 
                  className={`hover:bg-slate-50 transition-colors duration-200 ${
                    hasNoSales ? 'bg-red-50 hover:bg-red-100' : 
                    isHighPerformance ? 'bg-green-50 hover:bg-green-100' : 
                    isLowPerformance ? 'bg-yellow-50 hover:bg-yellow-100' : ''
                  }`}
                >
                  <td className="px-2 sm:px-4 py-3 sm:py-4 font-bold text-slate-900 text-xs sm:text-sm">{item.zonal}</td>
                  <td className="px-2 sm:px-4 py-3 sm:py-4 font-semibold text-slate-700 text-xs sm:text-sm max-w-[120px] sm:max-w-none truncate">{item.supervisor}</td>
                  
                  <td className="px-2 sm:px-3 py-3 sm:py-4 text-right">
                    <span className="px-1.5 sm:px-2 py-1 bg-slate-100 text-slate-800 rounded-full text-xs font-semibold">
                      {item.qvdd || 0}
                    </span>
                  </td>
                  
                  <td className="px-2 sm:px-3 py-3 sm:py-4 text-right hidden md:table-cell">
                    <span className="px-1.5 sm:px-2 py-1 bg-indigo-100 text-indigo-800 rounded-full text-xs font-semibold">
                      {item.qvdd_comis || 0}
                    </span>
                  </td>
                  
                  <td className="px-2 sm:px-3 py-3 sm:py-4 text-right hidden lg:table-cell">
                    <span className="px-1.5 sm:px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-semibold">
                      {item.qvdd_plan || 0}
                    </span>
                  </td>
                  
                  <td className="px-2 sm:px-3 py-3 sm:py-4 text-right">
                    <span className={`px-1.5 sm:px-2 py-1 rounded-full text-xs font-semibold ${
                      hasNoSales ? 'bg-red-100 text-red-800' :
                      isHighPerformance ? 'bg-green-100 text-green-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {item.vendedores_con_ventas || 0}
                    </span>
                  </td>
                  
                  <td className="px-2 sm:px-3 py-3 sm:py-4 text-right hidden sm:table-cell">
                    <span className="px-1.5 sm:px-2 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-semibold">
                      {item.pedidos_distintos || 0}
                    </span>
                  </td>
                  
                  <td className="px-2 sm:px-3 py-3 sm:py-4 text-right text-xs font-semibold text-slate-700 hidden xl:table-cell">
                    {(item.cuota_diaria || 0).toLocaleString()}
                  </td>
                  
                  <td className="px-2 sm:px-3 py-3 sm:py-4 text-right">
                    <span className={`px-1.5 sm:px-2 py-1 rounded-full text-xs font-bold ${
                      (item.hc_venta_pct || 0) >= 80 ? 'bg-green-100 text-green-800' :
                      (item.hc_venta_pct || 0) >= 50 ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {Math.round(item.hc_venta_pct || 0)}%
                    </span>
                  </td>
                  
                  <td className="px-2 sm:px-3 py-3 sm:py-4 text-right hidden md:table-cell">
                    <span className={`px-1.5 sm:px-2 py-1 rounded-full text-xs font-bold ${
                      (item.porcentaje_cuota || 0) >= 100 ? 'bg-green-100 text-green-800' :
                      (item.porcentaje_cuota || 0) >= 75 ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {Math.round(item.porcentaje_cuota || 0)}%
                    </span>
                  </td>
                  
                  <td className="px-2 sm:px-4 py-3 sm:py-4 max-w-xs hidden lg:table-cell">
                    <div className="space-y-1">
                      {item.comentarios_jefe && (
                        <div className="text-xs">
                          <span className="font-semibold text-blue-600">Jefe:</span>
                          <span className="text-slate-600 ml-1">{item.comentarios_jefe}</span>
                        </div>
                      )}
                      {item.comentarios_supervisor && (
                        <div className="text-xs">
                          <span className="font-semibold text-purple-600">Supervisor:</span>
                          <span className="text-slate-600 ml-1">{item.comentarios_supervisor}</span>
                        </div>
                      )}
                      {!item.comentarios_jefe && !item.comentarios_supervisor && (
                        <span className="text-xs text-slate-400 italic">Sin comentarios</span>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// Componente principal del informe ejecutivo mejorado - RESPONSIVO
export default function InformeGerenciaPage() {
  const { user, logout } = useAuth();
  
  const [allData, setAllData] = useState<VendedorVentaResumen[]>([]);
  const [allSupervisores, setAllSupervisores] = useState<string[]>([]);
  const [filters, setFilters] = useState<FrontendFilters>({ 
    fecha: ReportsService.getCurrentDate() 
  });
  const [loading, setLoading] = useState(false);
  const [loadingSupervisores, setLoadingSupervisores] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Datos filtrados y procesados
  const { filteredData, zonales, supervisores } = useMemo(() => {
    const zonalesSet = new Set(allData.map(item => item.zonal).filter(Boolean));
    const zonalesArray = Array.from(zonalesSet).sort();

    // Supervisores de la zonal seleccionada (para compatibilidad)
    const supervisoresArray = filters.zonal 
      ? Array.from(new Set(
          allData
            .filter(item => item.zonal === filters.zonal)
            .map(item => item.supervisor)
            .filter(Boolean)
        )).sort()
      : [];

    let filteredResult = allData;
    if (filters.zonal) {
      filteredResult = filteredResult.filter(item => item.zonal === filters.zonal);
    }
    if (filters.supervisor) {
      filteredResult = filteredResult.filter(item => item.supervisor === filters.supervisor);
    }

    return {
      filteredData: filteredResult,
      zonales: zonalesArray,
      supervisores: supervisoresArray
    };
  }, [allData, filters.zonal, filters.supervisor]);

  // ✅ NUEVA FUNCIÓN: Cargar lista de supervisores usando FeedbackService
  const loadSupervisores = async (fecha?: string) => {
    setLoadingSupervisores(true);
    try {
      console.log('🔍 Cargando supervisores con FeedbackService...', { fecha });
      
      const response = await FeedbackService.getSupervisoresConFeedback(fecha);
      
      if (FeedbackService.isSuccess(response) && FeedbackService.isSupervisorListResponse(response)) {
        console.log('✅ Supervisores cargados exitosamente:', {
          total: response.data.length,
          supervisores: response.data.slice(0, 5) // Mostrar solo los primeros 5 para logging
        });
        setAllSupervisores(response.data);
      } else if (isFeedbackApiError(response)) {
        console.error('❌ Error de API al cargar supervisores:', response.error);
        setError(`Error cargando supervisores: ${response.error}`);
        setAllSupervisores([]);
      } else {
        console.warn('⚠️ Respuesta inesperada al cargar supervisores:', response);
        setAllSupervisores([]);
      }
      
    } catch (err: any) {
      console.error('❌ Error cargando supervisores:', err);
      if (err.response?.status === 401) {
        logout();
      } else {
        setError(`Error cargando supervisores: ${err.message}`);
      }
      setAllSupervisores([]);
    } finally {
      setLoadingSupervisores(false);
    }
  };

  // Cargar datos principales
  const loadData = async () => {
    if (loading) return;
    
    setLoading(true);
    setError(null);
    
    try {
      console.log('🔍 Cargando datos principales...', { filters });
      
      const backendFilters: ReportsFilters = filters.fecha ? { fecha: filters.fecha } : {};
      const response = await ReportsService.getVendedoresVentas(backendFilters);

      if (!isApiError(response)) {
        console.log('✅ Datos principales cargados exitosamente:', {
          total: response.data?.length || 0,
          hasData: !!response.data
        });
        setAllData(response.data || []);
      } else {
        console.error('❌ Error de API al cargar datos:', response.error);
        setError(`Error cargando datos: ${response.error}`);
        setAllData([]);
      }
      
    } catch (err: any) {
      console.error('❌ Error cargando datos:', err);
      if (err.response?.status === 401) {
        logout();
      } else {
        setError(`Error: ${err.message}`);
      }
      setAllData([]);
    } finally {
      setLoading(false);
    }
  };

  // Cargar ambos conjuntos de datos al inicializar
  useEffect(() => {
    console.log('🚀 Inicializando componente InformeGerencia...');
    loadData();
    loadSupervisores();
  }, []);

  // Recargar cuando cambia la fecha
  useEffect(() => {
    const timer = setTimeout(() => {
      console.log('🔄 Fecha cambió, recargando datos...', { nuevaFecha: filters.fecha });
      loadData();
      loadSupervisores(filters.fecha);
    }, 500);
    return () => clearTimeout(timer);
  }, [filters.fecha]);

  // Función para refrescar todos los datos
  const refreshAllData = () => {
    console.log('🔄 Refrescando todos los datos...');
    loadData();
    loadSupervisores(filters.fecha);
  };

  // Exportar informe usando la nueva función
  const exportReport = async () => {
    try {
      console.log('📊 Exportando informe...', {
        totalRegistros: filteredData.length,
        filtros: filters
      });
      
      const fecha = filters.fecha || 'todas_fechas';
      const zonal = filters.zonal || 'todas_zonales';
      const supervisor = filters.supervisor || 'todos_supervisores';
      const filename = `informe_gerencia_${fecha}_${zonal}_${supervisor}`;
      
      exportToExcel(filteredData, filename);
      
      console.log('✅ Informe exportado exitosamente:', filename);
    } catch (err: any) {
      console.error('❌ Error exportando informe:', err);
      setError(`Error exportando: ${err.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-slate-50 to-blue-50 p-3 sm:p-6">
      <ExecutiveHeader
        onExport={exportReport}
        loading={loading}
        totalRecords={filteredData.length}
      />

      {error && (
        <div className="bg-gradient-to-r from-red-50 to-red-100 border-l-4 border-red-500 p-4 sm:p-6 mb-4 sm:mb-6 rounded-lg sm:rounded-xl shadow-lg">
          <div className="flex items-start">
            <div className="p-2 bg-red-100 rounded-full mr-3 sm:mr-4 flex-shrink-0">
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-base sm:text-lg font-semibold text-red-800 mb-2">Error del Sistema</h3>
              <p className="text-red-700 text-sm sm:text-base">{error}</p>
            </div>
            <button 
              onClick={() => setError(null)} 
              className="p-2 text-red-400 hover:text-red-600 hover:bg-red-200 rounded-full transition-all duration-200 flex-shrink-0"
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
        allSupervisores={allSupervisores}
        loading={loading || loadingSupervisores}
        onRefresh={refreshAllData}
      />

      <ExecutiveMetrics data={filteredData} />

      <ExecutiveTable data={filteredData} loading={loading} />
    </div>
  );
}