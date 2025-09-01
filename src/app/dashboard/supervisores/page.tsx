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

interface FrontendFilters {
  fecha?: string;
  zonal?: string;
  supervisor?: string;
  vendedor_busqueda?: string; // Búsqueda de texto, no select
  nro_pedido?: string;
}

const isApiError = (response: any): response is ApiError => {
  return response && response.success === false && 'error' in response;
};

// Loading component
const DataLoadingSpinner = ({ text = "Cargando datos..." }: { text?: string }) => (
  <div className="p-8 sm:p-12 text-center">
    <div className="animate-spin rounded-full h-8 w-8 sm:h-12 sm:w-12 border-4 border-slate-300 border-t-blue-600 mx-auto mb-4"></div>
    <p className="text-slate-600 font-medium text-sm sm:text-base">{text}</p>
  </div>
);

// Panel de filtros mejorado
const FiltersPanel = ({ 
  filters, 
  onFiltersChange, 
  zonales, 
  supervisores,
  loading,
  onRefresh,
  onClearFilters
}: {
  filters: FrontendFilters;
  onFiltersChange: (filters: FrontendFilters) => void;
  zonales: string[];
  supervisores: string[];
  loading: boolean;
  onRefresh: () => void;
  onClearFilters: () => void;
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
            <h2 className="text-lg sm:text-xl font-bold text-slate-800">Filtros de Búsqueda</h2>
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
        
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          <button
            onClick={onClearFilters}
            className="px-4 py-2 bg-gradient-to-r from-slate-500 to-slate-600 hover:from-slate-600 hover:to-slate-700 text-white rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl text-sm"
          >
            <div className="flex items-center justify-center space-x-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
              <span>Limpiar</span>
            </div>
          </button>
          
          <button
            onClick={onRefresh}
            disabled={loading}
            className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white rounded-xl font-semibold disabled:opacity-50 transition-all duration-200 shadow-lg hover:shadow-xl text-sm"
          >
            {loading ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                <span>Cargando...</span>
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
                zonal: e.target.value || undefined
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

          {/* SUPERVISOR - MEJORADO (independiente) */}
          <div className="space-y-3">
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
              disabled={loading}
            >
              <option value="">Todos los supervisores</option>
              {supervisores.map((supervisor) => (
                <option key={supervisor} value={supervisor}>{supervisor}</option>
              ))}
            </select>
          </div>

          {/* BÚSQUEDA DE VENDEDOR - Como input de texto */}
          <div className="space-y-3">
            <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
              <div className="flex items-center space-x-2">
                <div className="p-1 bg-orange-100 rounded">
                  <svg className="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                  </svg>
                </div>
                <span>Buscar Vendedor</span>
              </div>
            </label>
            <input
              type="text"
              placeholder="Nombre del vendedor..."
              value={filters.vendedor_busqueda || ''}
              onChange={(e) => onFiltersChange({ 
                ...filters, 
                vendedor_busqueda: e.target.value || undefined 
              })}
              className="w-full px-3 sm:px-4 py-2 sm:py-3 border-2 border-slate-200 rounded-xl focus:ring-4 focus:ring-orange-500/20 focus:border-orange-500 transition-all duration-200 bg-white/80 text-sm sm:text-base placeholder-slate-400"
              disabled={loading}
            />
          </div>

          {/* BÚSQUEDA DE PEDIDO */}
          <div className="space-y-3">
            <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
              <div className="flex items-center space-x-2">
                <div className="p-1 bg-teal-100 rounded">
                  <svg className="w-4 h-4 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                  </svg>
                </div>
                <span>Buscar Pedido</span>
              </div>
            </label>
            <input
              type="text"
              placeholder="Número de pedido..."
              value={filters.nro_pedido || ''}
              onChange={(e) => onFiltersChange({ 
                ...filters, 
                nro_pedido: e.target.value || undefined 
              })}
              className="w-full px-3 sm:px-4 py-2 sm:py-3 border-2 border-slate-200 rounded-xl focus:ring-4 focus:ring-teal-500/20 focus:border-teal-500 transition-all duration-200 bg-white/80 text-sm sm:text-base placeholder-slate-400"
              disabled={loading}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

// Header simplificado
const ExportHeader = ({ onExportDetalle, loading, count }: {
  onExportDetalle: () => void;
  loading: boolean;
  count: number;
}) => {
  return (
    <div className="mb-6 sm:mb-8">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
            Gestión Peticiones Regulares
          </h1>
          <p className="text-slate-600 text-sm sm:text-base mt-1">
            Detalle y búsqueda de ventas regulares
          </p>
        </div>
        
        <button
          onClick={onExportDetalle}
          disabled={loading || count === 0}
          className="px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl font-semibold disabled:opacity-50 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
        >
          <div className="flex items-center justify-center space-x-2">
            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
            </svg>
            <span>Exportar ({count})</span>
          </div>
        </button>
      </div>
    </div>
  );
};

// Componente de card para la última venta (CONSERVADO del original)
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

// Componente principal
export default function DashboardPage() {
  const { user, logout } = useAuth();
  
  const [allVendedoresData, setAllVendedoresData] = useState<VendedorVentaResumen[]>([]);
  const [allDetalleData, setAllDetalleData] = useState<DetalleVenta[]>([]);
  const [filters, setFilters] = useState<FrontendFilters>({ fecha: ReportsService.getCurrentDate() });
  const [loadingData, setLoadingData] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { filteredDetalle, zonales, supervisores, ultimaVenta } = useMemo(() => {
    // Extraer valores únicos para filtros (de ambos datasets)
    const zonalesFromVendedores = new Set(allVendedoresData.map(item => item.zonal).filter(Boolean));
    const zonalesFromDetalle = new Set(allDetalleData.map(item => item.zonal).filter(Boolean));
    const zonalesSet = new Set([...zonalesFromVendedores, ...zonalesFromDetalle]);
    const zonalesArray = Array.from(zonalesSet).sort();

    // Supervisores independientes (de ambos datasets)
    const supervisoresFromVendedores = new Set(allVendedoresData.map(item => item.supervisor).filter(Boolean));
    const supervisoresFromDetalle = new Set(allDetalleData.map(item => item.supervisor).filter(Boolean));
    const supervisoresSet = new Set([...supervisoresFromVendedores, ...supervisoresFromDetalle]);
    const supervisoresArray = Array.from(supervisoresSet).sort();

    // Aplicar filtros al detalle
    let filteredData = allDetalleData;

    if (filters.zonal) {
      filteredData = filteredData.filter(item => item.zonal === filters.zonal);
    }
    if (filters.supervisor) {
      filteredData = filteredData.filter(item => item.supervisor === filters.supervisor);
    }
    if (filters.vendedor_busqueda) {
      const searchTerm = filters.vendedor_busqueda.toLowerCase();
      filteredData = filteredData.filter(item => 
        item.vendedor_nombre?.toLowerCase().includes(searchTerm)
      );
    }
    if (filters.nro_pedido) {
      const searchTerm = filters.nro_pedido.toLowerCase();
      filteredData = filteredData.filter(item => 
        item.nro_pedido_orig?.toLowerCase().includes(searchTerm) ||
        item.identificador_venta?.toLowerCase().includes(searchTerm)
      );
    }

    // Ordenar por hora (más reciente primero)
    const sortedDetalle = [...filteredData].sort((a, b) => {
      if (!a.hora_min_segundo && !b.hora_min_segundo) return 0;
      if (!a.hora_min_segundo) return 1;
      if (!b.hora_min_segundo) return -1;
      return b.hora_min_segundo.localeCompare(a.hora_min_segundo);
    });

    return {
      filteredDetalle: sortedDetalle,
      zonales: zonalesArray,
      supervisores: supervisoresArray,
      ultimaVenta: sortedDetalle[0] || null
    };
  }, [allVendedoresData, allDetalleData, filters]);

  const loadDashboardData = async () => {
    if (loadingData) return;
    
    setLoadingData(true);
    setError(null);
    
    try {
      const backendFilters: ReportsFilters = filters.fecha ? { fecha: filters.fecha } : {};
      
      // Cargar ambos datasets para tener filtros completos
      const [resumenResponse, detalleResponse] = await Promise.all([
        ReportsService.getVendedoresVentas(backendFilters),
        ReportsService.getDetalleVentas({ ...backendFilters, limit: 500, offset: 0 })
      ]);

      if (!isApiError(resumenResponse)) {
        setAllVendedoresData(resumenResponse.data || []);
      }

      if (!isApiError(detalleResponse)) {
        setAllDetalleData(detalleResponse.data || []);
      } else {
        setError(`Error cargando datos: ${detalleResponse.error}`);
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

  const exportToCSV = async () => {
    try {
      const filename = `detalle_ventas_${filters.fecha || 'todas'}_${Date.now()}`;
      await ReportsService.exportToCSV(filteredDetalle, filename);
    } catch (err: any) {
      setError(`Error exportando: ${err.message}`);
    }
  };

  const clearFilters = () => {
    setFilters({ fecha: ReportsService.getCurrentDate() });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-slate-50 to-blue-50 p-3 sm:p-4 lg:p-6">
      <ExportHeader
        onExportDetalle={exportToCSV}
        loading={loadingData}
        count={filteredDetalle.length}
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
        onClearFilters={clearFilters}
      />

      {/* Contador de resultados */}
      <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <svg className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
              </svg>
            </div>
            <div>
              <p className="text-sm sm:text-base font-bold text-slate-800">
                {filteredDetalle.length} de {allDetalleData.length} ventas
              </p>
              <p className="text-xs sm:text-sm text-slate-600">
                {filteredDetalle.length !== allDetalleData.length ? "Filtros aplicados" : "Mostrando todas"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Detalle de Ventas - CONSERVADO del original */}
      <div className="bg-white/90 backdrop-blur-sm rounded-2xl border border-slate-200/50 shadow-xl overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-emerald-50">
          <h2 className="text-lg sm:text-xl font-bold text-slate-800 mb-1">Detalle de Ventas</h2>
          <p className="text-sm sm:text-base text-slate-600">
            {filteredDetalle.length} registros encontrados
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
  );
}