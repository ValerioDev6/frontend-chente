// components/VendedoresTable.tsx - DISEÑO MEJORADO
'use client';
import React, { useState, useEffect, useMemo } from 'react';
import { VendedoresService, Vendedor, VendedoresFilters, FiltersResponse, WhatsAppUtils } from '@/app/services/vendedores';

interface VendedoresStats {
  total_vendedores: number;
  vendedores_con_ventas: number;
  vendedores_sin_ventas: number;
  total_vta_regular: number;
  total_vta_flex: number;
  total_ventas_global: number;
}

interface TopPerformers {
  mejor_regular: Vendedor | null;
  mejor_total: Vendedor | null;
}

// Componente para tarjeta de mejor vendedor
const TopPerformerCard: React.FC<{
  title: string;
  vendedor: Vendedor | null;
  metric: 'regular' | 'total';
  icon: string;
  bgGradient: string;
  textColor: string;
  borderColor: string;
}> = ({ title, vendedor, metric, icon, bgGradient, textColor, borderColor }) => {
  if (!vendedor) {
    return (
      <div className={`${bgGradient} p-6 rounded-2xl border-2 ${borderColor} shadow-lg backdrop-blur-sm`}>
        <div className="flex items-center justify-between mb-4">
          <div className="text-3xl opacity-50">{icon}</div>
          <div className="text-xs font-semibold text-gray-500 bg-white/20 px-3 py-1 rounded-full">
            SIN DATOS
          </div>
        </div>
        <div>
          <p className={`text-sm ${textColor} font-medium mb-1 opacity-75`}>{title}</p>
          <p className="text-2xl font-bold text-gray-400">Sin datos disponibles</p>
        </div>
      </div>
    );
  }

  const value = metric === 'regular' ? vendedor.vta_regular : vendedor.total_ventas;

  return (
    <div className={`${bgGradient} p-6 rounded-2xl border-2 ${borderColor} shadow-xl hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300 backdrop-blur-sm`}>
      <div className="flex items-center justify-between mb-4">
        <div className="text-4xl drop-shadow-lg">{icon}</div>
        <div className="text-xs font-bold text-white bg-white/20 px-3 py-1 rounded-full backdrop-blur-sm">
          #{metric === 'regular' ? '1' : '1'} TOP
        </div>
      </div>
      
      <div className="mb-4">
        <p className={`text-sm ${textColor} font-semibold mb-2 opacity-90`}>{title}</p>
        <p className={`text-3xl font-black ${textColor} drop-shadow-sm`}>{value}</p>
      </div>
      
      <div className="space-y-2">
        <div className="bg-white/10 rounded-lg p-3 backdrop-blur-sm">
          <p className={`font-bold ${textColor} text-lg truncate`}>{vendedor.nombre}</p>
          <div className={`text-sm ${textColor} opacity-80 space-y-1 mt-2`}>
            <p className="flex items-center gap-2">
              <span className="text-lg">🎯</span>
              <span>{vendedor.rol} • {vendedor.zonal}</span>
            </p>
            <p className="flex items-center gap-2">
              <span className="text-lg">👤</span>
              <span>Sup: {vendedor.supervisor}</span>
            </p>
            <p className="flex items-center gap-2">
              <span className="text-lg">📅</span>
              <span>{vendedor.cluster_antiguedad}</span>
            </p>
          </div>
        </div>
        
        {/* Mini métricas con mejor diseño */}
        <div className="flex justify-between text-xs font-semibold bg-black/10 rounded-lg p-2 backdrop-blur-sm">
          <div className="flex flex-col items-center">
            <span className="opacity-70">Regular</span>
            <span className="text-base font-bold">{vendedor.vta_regular}</span>
          </div>
          <div className="w-px bg-white/30"></div>
          <div className="flex flex-col items-center">
            <span className="opacity-70">Flex</span>
            <span className="text-base font-bold">{vendedor.vta_flex}</span>
          </div>
          <div className="w-px bg-white/30"></div>
          <div className="flex flex-col items-center">
            <span className="opacity-70">Total</span>
            <span className="text-base font-bold">{vendedor.total_ventas}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const VendedoresTable: React.FC = () => {
  // Estados principales
  const [vendedores, setVendedores] = useState<Vendedor[]>([]);
  const [stats, setStats] = useState<VendedoresStats | null>(null);
  const [topPerformers, setTopPerformers] = useState<TopPerformers | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Estados de filtros
  const [filters, setFilters] = useState<VendedoresFilters>({
    fecha: new Date().toISOString().split('T')[0]
  });
  const [availableFilters, setAvailableFilters] = useState<FiltersResponse['filters'] | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Estados de UI - Actualizado para manejar 3 opciones
  const [salesFilter, setSalesFilter] = useState<'all' | 'with_sales' | 'without_sales'>('all');

  // Cargar filtros disponibles
  useEffect(() => {
    const loadFilters = async () => {
      try {
        const response = await VendedoresService.getFilters();
        setAvailableFilters(response.filters);
      } catch (err) {
        console.error('Error cargando filtros:', err);
      }
    };
    loadFilters();
  }, []);

  // Cargar vendedores
  const loadVendedores = async () => {
    try {
      setLoading(true);
      setError(null);

      // Convertir salesFilter a formato del servicio
      let sin_ventas: boolean | undefined;
      if (salesFilter === 'without_sales') sin_ventas = true;
      else if (salesFilter === 'with_sales') sin_ventas = false;
      else sin_ventas = undefined;

      const response = await VendedoresService.getVendedores({
        ...filters,
        nombre: searchTerm || undefined,
        sin_ventas
      });

      setVendedores(response.data);
      setStats(response.summary);
      setTopPerformers(response.top_performers || null);
      
    } catch (err: any) {
      setError(err.message);
      setVendedores([]);
      setStats(null);
      setTopPerformers(null);
    } finally {
      setLoading(false);
    }
  };

  // Efecto para cargar datos cuando cambian filtros
  useEffect(() => {
    loadVendedores();
  }, [filters, searchTerm, salesFilter]);

  // Calcular totales de la tabla actual (memoizado para optimizar)
  const tableTotals = useMemo(() => {
    if (vendedores.length === 0) return null;
    
    return vendedores.reduce(
      (acc, vendedor) => ({
        count: acc.count + 1,
        vta_regular: acc.vta_regular + vendedor.vta_regular,
        vta_flex: acc.vta_flex + vendedor.vta_flex,
        total_ventas: acc.total_ventas + vendedor.total_ventas
      }),
      { count: 0, vta_regular: 0, vta_flex: 0, total_ventas: 0 }
    );
  }, [vendedores]);

  // Manejar cambios de filtros
  const handleFilterChange = (key: keyof VendedoresFilters, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value === '' ? undefined : value
    }));
  };

  // Limpiar filtros
  const clearFilters = () => {
    setFilters({
      fecha: new Date().toISOString().split('T')[0]
    });
    setSearchTerm('');
    setSalesFilter('all');
  };

  // Manejar click de WhatsApp con detección automática
  const handleWhatsAppClick = (numero: string | null, e: React.MouseEvent) => {
    e.preventDefault();
    if (!numero) return;
    
    WhatsAppUtils.openWhatsApp(numero);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex justify-center items-center">
        <div className="bg-white p-8 rounded-3xl shadow-2xl">
          <div className="flex items-center space-x-4">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
            <div>
              <h3 className="text-xl font-semibold text-gray-800">Cargando vendedores</h3>
              <p className="text-gray-600">Obteniendo información...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-pink-50 to-rose-100 flex justify-center items-center p-4">
        <div className="bg-white p-8 rounded-3xl shadow-2xl border-2 border-red-200 max-w-md w-full">
          <div className="text-center">
            <div className="text-6xl mb-4">⚠️</div>
            <h3 className="text-2xl font-bold text-red-800 mb-2">Error al cargar</h3>
            <p className="text-red-600 mb-6">{error}</p>
            <button 
              onClick={loadVendedores}
              className="bg-gradient-to-r from-red-600 to-red-700 text-white px-6 py-3 rounded-xl hover:from-red-700 hover:to-red-800 transform hover:scale-105 transition-all duration-200 font-semibold shadow-lg"
            >
              🔄 Reintentar
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="p-4 md:p-6 max-w-7xl mx-auto">
        {/* Header mejorado */}
        <div className="mb-8 text-center">
          <div className="inline-block p-1 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl mb-4">
            <div className="bg-white rounded-xl px-6 py-3">
              <h1 className="text-3xl font-black bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                📊 Reporte de Vendedores
              </h1>
            </div>
          </div>
          <p className="text-gray-600 text-lg font-medium">Gestión inteligente de vendedores con seguimiento de ventas</p>
        </div>

        {/* Tarjetas de Mejores Vendedores */}
        {topPerformers && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <TopPerformerCard
              title="🏆 Mejor en Ventas Regulares"
              vendedor={topPerformers.mejor_regular}
              metric="regular"
              icon="🎯"
              bgGradient="bg-gradient-to-br from-emerald-400 via-green-500 to-teal-600"
              textColor="text-white"
              borderColor="border-emerald-300"
            />
            <TopPerformerCard
              title="👑 Mejor en Ventas Totales"
              vendedor={topPerformers.mejor_total}
              metric="total"
              icon="💎"
              bgGradient="bg-gradient-to-br from-blue-500 via-indigo-600 to-purple-700"
              textColor="text-white"
              borderColor="border-blue-300"
            />
          </div>
        )}

        {/* Estadísticas mejoradas */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-4 rounded-2xl text-white shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300">
              <div className="flex items-center justify-between mb-2">
                <span className="text-2xl">👥</span>
                <div className="bg-white/20 rounded-lg px-2 py-1">
                  <span className="text-xs font-bold">TOTAL</span>
                </div>
              </div>
              <p className="text-xs opacity-90 mb-1">Vendedores</p>
              <p className="text-2xl font-black">{stats.total_vendedores}</p>
            </div>
            
            <div className="bg-gradient-to-br from-emerald-500 to-green-600 p-4 rounded-2xl text-white shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300">
              <div className="flex items-center justify-between mb-2">
                <span className="text-2xl">✅</span>
                <div className="bg-white/20 rounded-lg px-2 py-1">
                  <span className="text-xs font-bold">ACTIVOS</span>
                </div>
              </div>
              <p className="text-xs opacity-90 mb-1">Con Ventas</p>
              <p className="text-2xl font-black">{stats.vendedores_con_ventas}</p>
            </div>
            
            <div className="bg-gradient-to-br from-red-500 to-rose-600 p-4 rounded-2xl text-white shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300">
              <div className="flex items-center justify-between mb-2">
                <span className="text-2xl">⚠️</span>
                <div className="bg-white/20 rounded-lg px-2 py-1">
                  <span className="text-xs font-bold">ALERTA</span>
                </div>
              </div>
              <p className="text-xs opacity-90 mb-1">Sin Ventas</p>
              <p className="text-2xl font-black">{stats.vendedores_sin_ventas}</p>
            </div>
            
            <div className="bg-gradient-to-br from-purple-500 to-violet-600 p-4 rounded-2xl text-white shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300">
              <div className="flex items-center justify-between mb-2">
                <span className="text-2xl">🎯</span>
                <div className="bg-white/20 rounded-lg px-2 py-1">
                  <span className="text-xs font-bold">REGULAR</span>
                </div>
              </div>
              <p className="text-xs opacity-90 mb-1">Vta Regular</p>
              <p className="text-2xl font-black">{stats.total_vta_regular}</p>
            </div>
            
            <div className="bg-gradient-to-br from-amber-500 to-orange-600 p-4 rounded-2xl text-white shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300">
              <div className="flex items-center justify-between mb-2">
                <span className="text-2xl">⚡</span>
                <div className="bg-white/20 rounded-lg px-2 py-1">
                  <span className="text-xs font-bold">FLEX</span>
                </div>
              </div>
              <p className="text-xs opacity-90 mb-1">Vta Flex</p>
              <p className="text-2xl font-black">{stats.total_vta_flex}</p>
            </div>
            
            <div className="bg-gradient-to-br from-gray-800 to-slate-900 p-4 rounded-2xl text-white shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300">
              <div className="flex items-center justify-between mb-2">
                <span className="text-2xl">🚀</span>
                <div className="bg-white/20 rounded-lg px-2 py-1">
                  <span className="text-xs font-bold">TOTAL</span>
                </div>
              </div>
              <p className="text-xs opacity-90 mb-1">Total Ventas</p>
              <p className="text-2xl font-black">{stats.total_ventas_global}</p>
            </div>
          </div>
        )}

        {/* Panel de filtros mejorado */}
        <div className="bg-white/80 backdrop-blur-sm p-6 rounded-3xl shadow-xl border border-white/50 mb-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-2 rounded-xl">
              <span className="text-white text-xl">🔍</span>
            </div>
            <h3 className="text-2xl font-bold text-gray-800">Filtros Avanzados</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {/* Fecha */}
            <div className="group">
              <label className="block text-sm font-semibold text-gray-700 mb-2 group-hover:text-indigo-600 transition-colors">
                📅 Fecha
              </label>
              <input
                type="date"
                value={filters.fecha || ''}
                onChange={(e) => handleFilterChange('fecha', e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 bg-white/50 backdrop-blur-sm hover:bg-white"
              />
            </div>

            {/* Zonal */}
            <div className="group">
              <label className="block text-sm font-semibold text-gray-700 mb-2 group-hover:text-indigo-600 transition-colors">
                🗺️ Zonal
              </label>
              <select
                value={filters.zonal || ''}
                onChange={(e) => handleFilterChange('zonal', e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 bg-white/50 backdrop-blur-sm hover:bg-white"
              >
                <option value="">Todos los zonales</option>
                {availableFilters?.zonal.map(zonal => (
                  <option key={zonal} value={zonal}>{zonal}</option>
                ))}
              </select>
            </div>

            {/* Supervisor */}
            <div className="group">
              <label className="block text-sm font-semibold text-gray-700 mb-2 group-hover:text-indigo-600 transition-colors">
                👤 Supervisor
              </label>
              <select
                value={filters.supervisor || ''}
                onChange={(e) => handleFilterChange('supervisor', e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 bg-white/50 backdrop-blur-sm hover:bg-white"
              >
                <option value="">Todos los supervisores</option>
                {availableFilters?.supervisor.map(supervisor => (
                  <option key={supervisor} value={supervisor}>{supervisor}</option>
                ))}
              </select>
            </div>

            {/* Rol */}
            <div className="group">
              <label className="block text-sm font-semibold text-gray-700 mb-2 group-hover:text-indigo-600 transition-colors">
                🎭 Rol
              </label>
              <select
                value={filters.rol || ''}
                onChange={(e) => handleFilterChange('rol', e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 bg-white/50 backdrop-blur-sm hover:bg-white"
              >
                <option value="">Todos los roles</option>
                {availableFilters?.rol.map(rol => (
                  <option key={rol} value={rol}>{rol}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {/* Búsqueda por nombre */}
            <div className="group">
              <label className="block text-sm font-semibold text-gray-700 mb-2 group-hover:text-indigo-600 transition-colors">
                🔎 Buscar Vendedor
              </label>
              <input
                type="text"
                placeholder="Nombre del vendedor..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 bg-white/50 backdrop-blur-sm hover:bg-white placeholder-gray-400"
              />
            </div>

            {/* Cluster */}
            <div className="group">
              <label className="block text-sm font-semibold text-gray-700 mb-2 group-hover:text-indigo-600 transition-colors">
                📅 Antigüedad
              </label>
              <select
                value={filters.cluster_antiguedad || ''}
                onChange={(e) => handleFilterChange('cluster_antiguedad', e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 bg-white/50 backdrop-blur-sm hover:bg-white"
              >
                <option value="">Todas las antigüedades</option>
                {availableFilters?.cluster_antiguedad.map(cluster => (
                  <option key={cluster} value={cluster}>{cluster}</option>
                ))}
              </select>
            </div>

            {/* Filtro de ventas mejorado */}
            <div className="group">
              <label className="block text-sm font-semibold text-gray-700 mb-2 group-hover:text-indigo-600 transition-colors">
                📊 Filtrar por Ventas
              </label>
              <select
                value={salesFilter}
                onChange={(e) => setSalesFilter(e.target.value as typeof salesFilter)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 bg-white/50 backdrop-blur-sm hover:bg-white"
              >
                <option value="all">🌐 Todos los vendedores</option>
                <option value="with_sales">✅ Solo con ventas</option>
                <option value="without_sales">⚠️ Solo sin ventas</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={clearFilters}
              className="bg-gradient-to-r from-gray-600 to-gray-700 text-white px-6 py-3 rounded-xl hover:from-gray-700 hover:to-gray-800 transform hover:scale-105 transition-all duration-200 font-semibold shadow-lg flex items-center gap-2"
            >
              🗑️ Limpiar Filtros
            </button>
          </div>
        </div>

        {/* Tabla Responsiva con diseño mejorado */}
        <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl overflow-hidden border border-white/50">
          {/* Vista Desktop - Tabla tradicional */}
          <div className="hidden lg:block">
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gradient-to-r from-gray-50 to-blue-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wider border-b border-gray-200">
                      👤 Vendedor
                    </th>
                    <th className="px-4 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wider border-b border-gray-200">
                      📍 Ubicación
                    </th>
                    <th className="px-4 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wider border-b border-gray-200">
                      🎭 Rol
                    </th>
                    <th className="px-4 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wider border-b border-gray-200">
                      📅 Antigüedad
                    </th>
                    <th className="px-4 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wider border-b border-gray-200">
                      📊 Ventas
                    </th>
                    <th className="px-4 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wider border-b border-gray-200">
                      📱 Contacto
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {vendedores.map((vendedor) => (
                    <tr key={vendedor.dni_hash} className="hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 transition-all duration-200">
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <div className="bg-gradient-to-br from-blue-500 to-indigo-600 w-10 h-10 rounded-full flex items-center justify-center text-white font-bold">
                            {vendedor.nombre.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-gray-900 truncate max-w-[200px]" title={vendedor.nombre}>
                              {vendedor.nombre}
                            </div>
                            <div className="text-xs text-gray-500 flex items-center gap-1">
                              <span>📅</span>
                              {new Date(vendedor.fecha_ingreso).toLocaleDateString('es-PE', { year: '2-digit', month: '2-digit', day: '2-digit' })}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="text-sm text-gray-900 truncate max-w-[150px] font-medium" title={vendedor.zonal}>
                          {vendedor.zonal}
                        </div>
                        <div className="text-xs text-gray-500 truncate max-w-[150px]" title={vendedor.supervisor}>
                          👤 {vendedor.supervisor}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-purple-100 to-pink-100 text-purple-800 border border-purple-200">
                          {vendedor.rol}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-md">
                          {vendedor.cluster_antiguedad}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex flex-col gap-2">
                          <div className="flex gap-2">
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-sm">
                              🎯 {vendedor.vta_regular}
                            </span>
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-purple-500 to-pink-600 text-white shadow-sm">
                              ⚡ {vendedor.vta_flex}
                            </span>
                          </div>
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-black bg-gradient-to-r from-gray-800 to-slate-900 text-white shadow-lg w-fit">
                            🚀 {vendedor.total_ventas}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        {vendedor.whatsapp_numero ? (
                          <button
                            onClick={(e) => handleWhatsAppClick(vendedor.whatsapp_numero, e)}
                            className="group relative inline-flex items-center px-4 py-2 rounded-xl text-sm font-bold bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:from-green-600 hover:to-emerald-700 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
                            title={`Abrir WhatsApp con ${vendedor.nombre} - ${WhatsAppUtils.isMobile() ? 'App' : 'Web'}`}
                          >
                            📱
                            <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs rounded px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
                              WhatsApp
                            </span>
                          </button>
                        ) : (
                          <span className="text-sm text-gray-400 font-medium">Sin contacto</span>
                        )}
                      </td>
                    </tr>
                  ))}
                  
                  {/* Fila de totales - Desktop */}
                  {tableTotals && (
                    <tr className="bg-gradient-to-r from-gray-100 to-blue-100 border-t-4 border-indigo-500">
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <div className="bg-gradient-to-br from-indigo-600 to-purple-700 w-10 h-10 rounded-full flex items-center justify-center text-white font-black text-lg">
                            Σ
                          </div>
                          <div className="text-lg font-black text-gray-900">
                            TOTALES ({tableTotals.count})
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm font-medium text-gray-600">-</td>
                      <td className="px-4 py-4 text-sm font-medium text-gray-600">-</td>
                      <td className="px-4 py-4 text-sm font-medium text-gray-600">-</td>
                      <td className="px-4 py-4">
                        <div className="flex flex-col gap-2">
                          <div className="flex gap-2">
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-black bg-gradient-to-r from-emerald-600 to-green-700 text-white shadow-lg">
                              🎯 {tableTotals.vta_regular}
                            </span>
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-black bg-gradient-to-r from-purple-600 to-pink-700 text-white shadow-lg">
                              ⚡ {tableTotals.vta_flex}
                            </span>
                          </div>
                          <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-black bg-gradient-to-r from-gray-900 to-black text-white shadow-xl w-fit">
                            🚀 {tableTotals.total_ventas}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm font-medium text-gray-600">-</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Vista Tablet - Tabla compacta */}
          <div className="hidden md:block lg:hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gradient-to-r from-gray-50 to-blue-50">
                  <tr>
                    <th className="px-4 py-4 text-left text-sm font-bold text-gray-700 uppercase">👤 Vendedor</th>
                    <th className="px-4 py-4 text-left text-sm font-bold text-gray-700 uppercase">ℹ️ Info</th>
                    <th className="px-4 py-4 text-left text-sm font-bold text-gray-700 uppercase">📊 Ventas</th>
                    <th className="px-4 py-4 text-left text-sm font-bold text-gray-700 uppercase">📱 Contacto</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {vendedores.map((vendedor) => (
                    <tr key={`tablet-${vendedor.dni_hash}`} className="hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 transition-all duration-200">
                      <td className="px-4 py-4">
                        <div className="flex items-center space-x-2">
                          <div className="bg-gradient-to-br from-blue-500 to-indigo-600 w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm">
                            {vendedor.nombre.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-gray-900">{vendedor.nombre}</div>
                            <div className="text-xs text-gray-500">{new Date(vendedor.fecha_ingreso).toLocaleDateString('es-PE', { year: '2-digit', month: '2-digit' })}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="text-xs space-y-1">
                          <div className="text-gray-900 font-medium">{vendedor.zonal}</div>
                          <div className="text-gray-600">{vendedor.supervisor}</div>
                          <div className="text-gray-600">{vendedor.rol}</div>
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-gradient-to-r from-blue-500 to-indigo-600 text-white">
                            {vendedor.cluster_antiguedad}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex flex-col gap-1">
                          <span className="text-xs bg-gradient-to-r from-emerald-500 to-green-600 text-white px-2 py-1 rounded-full font-bold">🎯 {vendedor.vta_regular}</span>
                          <span className="text-xs bg-gradient-to-r from-purple-500 to-pink-600 text-white px-2 py-1 rounded-full font-bold">⚡ {vendedor.vta_flex}</span>
                          <span className="text-xs bg-gradient-to-r from-gray-800 to-slate-900 text-white px-2 py-1 rounded-full font-black">🚀 {vendedor.total_ventas}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        {vendedor.whatsapp_numero ? (
                          <button
                            onClick={(e) => handleWhatsAppClick(vendedor.whatsapp_numero, e)}
                            className="text-sm bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:from-green-600 hover:to-emerald-700 px-3 py-2 rounded-full font-bold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
                          >
                            📱
                          </button>
                        ) : (
                          <span className="text-sm text-gray-400 font-medium">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                  
                  {/* Fila de totales - Tablet */}
                  {tableTotals && (
                    <tr className="bg-gradient-to-r from-gray-100 to-blue-100 border-t-4 border-indigo-500">
                      <td className="px-4 py-4">
                        <div className="flex items-center space-x-2">
                          <div className="bg-gradient-to-br from-indigo-600 to-purple-700 w-8 h-8 rounded-full flex items-center justify-center text-white font-black">
                            Σ
                          </div>
                          <div className="text-sm font-black text-gray-900">TOTALES ({tableTotals.count})</div>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm font-medium text-gray-600">-</td>
                      <td className="px-4 py-4">
                        <div className="flex flex-col gap-1">
                          <span className="text-xs bg-gradient-to-r from-emerald-600 to-green-700 text-white px-2 py-1 rounded-full font-black">🎯 {tableTotals.vta_regular}</span>
                          <span className="text-xs bg-gradient-to-r from-purple-600 to-pink-700 text-white px-2 py-1 rounded-full font-black">⚡ {tableTotals.vta_flex}</span>
                          <span className="text-xs bg-gradient-to-r from-gray-900 to-black text-white px-2 py-1 rounded-full font-black">🚀 {tableTotals.total_ventas}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm font-medium text-gray-600">-</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Vista Mobile - Cards mejoradas */}
          <div className="block md:hidden">
            <div className="divide-y divide-gray-200">
              {vendedores.map((vendedor) => (
                <div key={`mobile-${vendedor.dni_hash}`} className="p-5 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 transition-all duration-200">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                      <div className="bg-gradient-to-br from-blue-500 to-indigo-600 w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg">
                        {vendedor.nombre.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="text-base font-bold text-gray-900 truncate pr-2">{vendedor.nombre}</h3>
                        <p className="text-sm text-gray-500 flex items-center gap-1">
                          <span>📅</span>
                          Desde: {new Date(vendedor.fecha_ingreso).toLocaleDateString('es-PE')}
                        </p>
                      </div>
                    </div>
                    {vendedor.whatsapp_numero && (
                      <button
                        onClick={(e) => handleWhatsAppClick(vendedor.whatsapp_numero, e)}
                        className="flex-shrink-0 bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:from-green-600 hover:to-emerald-700 px-4 py-2 rounded-xl text-sm font-bold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 flex items-center gap-2"
                      >
                        📱 WhatsApp
                      </button>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="bg-gradient-to-br from-gray-50 to-blue-50 p-3 rounded-xl">
                      <p className="text-xs text-gray-500 mb-1 font-semibold">🗺️ Zonal</p>
                      <p className="text-sm text-gray-900 font-medium truncate" title={vendedor.zonal}>{vendedor.zonal}</p>
                    </div>
                    <div className="bg-gradient-to-br from-gray-50 to-purple-50 p-3 rounded-xl">
                      <p className="text-xs text-gray-500 mb-1 font-semibold">👤 Supervisor</p>
                      <p className="text-sm text-gray-900 font-medium truncate" title={vendedor.supervisor}>{vendedor.supervisor}</p>
                    </div>
                    <div className="bg-gradient-to-br from-gray-50 to-pink-50 p-3 rounded-xl">
                      <p className="text-xs text-gray-500 mb-1 font-semibold">🎭 Rol</p>
                      <p className="text-sm text-gray-900 font-medium truncate" title={vendedor.rol}>{vendedor.rol}</p>
                    </div>
                    <div className="bg-gradient-to-br from-gray-50 to-indigo-50 p-3 rounded-xl">
                      <p className="text-xs text-gray-500 mb-1 font-semibold">📅 Antigüedad</p>
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-md">
                        {vendedor.cluster_antiguedad}
                      </span>
                    </div>
                  </div>
                  
                  <div className="bg-gradient-to-br from-gray-50 to-slate-100 p-4 rounded-xl">
                    <p className="text-xs text-gray-600 mb-3 font-bold uppercase tracking-wide">📊 Ventas</p>
                    <div className="flex flex-wrap gap-2">
                      <span className="inline-flex items-center px-3 py-2 rounded-xl text-sm font-bold bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-lg">
                        🎯 Regular: {vendedor.vta_regular}
                      </span>
                      <span className="inline-flex items-center px-3 py-2 rounded-xl text-sm font-bold bg-gradient-to-r from-purple-500 to-pink-600 text-white shadow-lg">
                        ⚡ Flex: {vendedor.vta_flex}
                      </span>
                      <span className="inline-flex items-center px-4 py-2 rounded-xl text-sm font-black bg-gradient-to-r from-gray-800 to-slate-900 text-white shadow-xl">
                        🚀 Total: {vendedor.total_ventas}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
              
              {/* Card de totales - Mobile */}
              {tableTotals && (
                <div className="p-5 bg-gradient-to-br from-gray-100 to-blue-100 border-t-4 border-indigo-500">
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="bg-gradient-to-br from-indigo-600 to-purple-700 w-12 h-12 rounded-full flex items-center justify-center text-white font-black text-xl shadow-lg">
                        Σ
                      </div>
                      <div>
                        <h3 className="text-lg font-black text-gray-900">TOTALES</h3>
                        <span className="text-sm font-bold text-gray-700">{tableTotals.count} vendedores</span>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white/60 p-4 rounded-xl backdrop-blur-sm">
                    <div className="flex flex-wrap gap-2">
                      <span className="inline-flex items-center px-3 py-2 rounded-xl text-sm font-black bg-gradient-to-r from-emerald-600 to-green-700 text-white shadow-lg">
                        🎯 Regular: {tableTotals.vta_regular}
                      </span>
                      <span className="inline-flex items-center px-3 py-2 rounded-xl text-sm font-black bg-gradient-to-r from-purple-600 to-pink-700 text-white shadow-lg">
                        ⚡ Flex: {tableTotals.vta_flex}
                      </span>
                      <span className="inline-flex items-center px-4 py-2 rounded-xl text-sm font-black bg-gradient-to-r from-gray-900 to-black text-white shadow-xl">
                        🚀 Total: {tableTotals.total_ventas}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {vendedores.length === 0 && (
            <div className="text-center py-16">
              <div className="text-8xl mb-6">🔍</div>
              <h3 className="text-2xl font-bold text-gray-800 mb-2">No se encontraron vendedores</h3>
              <p className="text-gray-600 text-lg">Intenta ajustar los filtros de búsqueda</p>
            </div>
          )}
        </div>

        {/* Footer mejorado */}
        <div className="mt-8 bg-white/80 backdrop-blur-sm p-6 rounded-3xl shadow-lg border border-white/50">
          <div className="flex flex-col md:flex-row justify-between items-center text-sm space-y-3 md:space-y-0">
            <div className="flex items-center gap-4 text-gray-700">
              <div className="flex items-center gap-2 bg-blue-100 px-4 py-2 rounded-xl">
                <span className="text-blue-600 font-bold">📊</span>
                <span className="font-semibold">Mostrando {vendedores.length} vendedores</span>
              </div>
              {tableTotals && (
                <div className="flex items-center gap-2 bg-green-100 px-4 py-2 rounded-xl">
                  <span className="text-green-600 font-bold">🚀</span>
                  <span className="font-semibold">Total Ventas: {tableTotals.total_ventas}</span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2 text-gray-500 bg-gray-100 px-4 py-2 rounded-xl">
              <span className="text-green-600">📱</span>
              <span className="text-xs font-medium">
                WhatsApp se abre en {WhatsAppUtils.isMobile() ? 'app móvil' : 'navegador web'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VendedoresTable;