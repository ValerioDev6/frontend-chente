// app/services/reports.ts
import axios, { AxiosError } from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL + '/api/reports/';

// ✅ CRÍTICO: Configurar para cookies HTTP-only
axios.defaults.withCredentials = true;
axios.defaults.timeout = 60000; // 60 segundos para reportes

// Tipos para los filtros de reportes
interface ReportsFilters {
  fecha?: string;
  zonal?: string;
  supervisor?: string;
  hora_inicio?: string;
  hora_fin?: string;
  limit?: number;
  offset?: number;
}


interface VendedorVentaResumen {
  // Campos principales
  zonal: string;
  supervisor: string;
  superior: string; // ✅ NUEVO: Campo que existe en backend
  
  // Métricas principales
  qvdd: number;                    // ✅ Cantidad vendedores del día
  qvdd_comis: number;             // ✅ NUEVO: QVDD comisiones
  qvdd_plan: number;              // ✅ NUEVO: QVDD plan
  vendedores_con_ventas: number;   // ✅ Vendedores con ventas
  pedidos_distintos: number;       // ✅ Pedidos distintos
  
  // Cuotas y porcentajes
  cuota_diaria: number;           // ✅ Cuota diaria
  hc_venta_pct: number;           // ✅ CORREGIDO: Nombre real del backend
  porcentaje_cuota: number;       // ✅ CORREGIDO: Nombre real del backend
  
  // Comentarios (nuevos campos)
  comentarios_jefe: string;       // ✅ NUEVO
  comentarios_supervisor: string; // ✅ NUEVO
}


// ✅ NUEVO: Estadísticas de resumen globales
interface SummaryStats {
  total_vendedores_con_ventas: number;
  total_pedidos_distintos: number;
  total_qvdd: number;
  total_cuota_diaria: number;
  promedio_hc_venta_pct: number;
  promedio_cumplimiento_cuota_pct: number;
}



// ✅ NUEVO: Información de la query optimizada
interface QueryInfo {
  version: string;
  optimization: string;
  tables_used: string[];
  performance: string;
}

interface DetalleVenta {
  zonal: string;
  supervisor: string;
  dni_ccnet: string;
  nro_pedido_orig: string;
  identificador_venta: string;
  vendedor_nombre: string;
  fecha: string;
  producto: string;
  nombre_del_cliente: string;
  es_venta_de_hoy: string;
  scoring_dito: string;
  hora_min_segundo?: string;
}

interface PaginationInfo {
  total: number;
  limit: number;
  offset: number;
  pages: number;
}

// ✅ ACTUALIZADO: Response con nuevos campos
interface ReportsResponse<T> {
  success: boolean;
  data: T;
  count?: number;
  summary_stats?: SummaryStats; // ✅ NUEVO: Solo para vendedores-ventas
  filters?: {
    fecha: string;
    zonal?: string;
    supervisor?: string;
    hora_inicio?: string;
    hora_fin?: string;
  };
  query_info?: QueryInfo; // ✅ NUEVO: Info de optimización
  pagination?: PaginationInfo;
  error?: string;
  message?: string; // ✅ NUEVO: Mensajes del backend
  timestamp?: string;
}

interface ApiError {
  success: false;
  error: string;
  message?: string;
  timestamp?: string;
  provided_date?: string; // Para errores de validación de fecha
  data?: never;
}

// ✅ ACTUALIZAR: Interceptor para cookies HTTP-only
axios.interceptors.request.use((config) => {
  // ✅ Headers necesarios para CORS
  config.headers['Origin'] = window.location.origin;
  config.withCredentials = true;
  
  return config;
});

axios.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiError>) => {
    console.error('Error en API:', error);
    
    if (error.response?.status === 401) {
      console.warn('Sesión expirada, redirigiendo a login...');
      window.location.href = '/login?session_expired=true';
    } else if (error.response?.status === 503) {
      console.error('Error de base de datos:', error.response.data?.error);
    }
    
    return Promise.reject(error);
  }
);

/**
 * Maneja errores de API de forma consistente
 */
const handleApiError = (error: AxiosError<ApiError> | any): ApiError => {
  if (error.response?.data) {
    return error.response.data;
  }
  
  if (error.code === 'ECONNABORTED') {
    return {
      success: false,
      error: 'Timeout: La solicitud tardó demasiado tiempo'
    };
  }
  
  if (!navigator.onLine) {
    return {
      success: false,
      error: 'Error de conexión: Verifique su conexión a internet'
    };
  }
  
  return {
    success: false,
    error: error.message || 'Error desconocido'
  };
};

/**
 * Servicio para manejo de reportes con cookies HTTP-only - v2.0
 */
export class ReportsService {
  
  /**
   * Verifica la salud del servicio de reportes
   */
  static async healthCheck(): Promise<ReportsResponse<any> | ApiError> {
    try {
      const response = await axios.get(`${API_URL}health`, {
        headers: {
          'Origin': window.location.origin
        }
      });
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  }

  /**
   * ✅ ACTUALIZADO: Obtiene resumen de vendedores y ventas con estadísticas v2.0
   */
  static async getVendedoresVentas(filters: ReportsFilters = {}): Promise<ReportsResponse<VendedorVentaResumen[]> | ApiError> {
    try {
      const params = new URLSearchParams();
      
      if (filters.fecha) params.append('fecha', filters.fecha);
      if (filters.zonal) params.append('zonal', filters.zonal);
      if (filters.supervisor) params.append('supervisor', filters.supervisor);
      if (filters.hora_inicio) params.append('hora_inicio', filters.hora_inicio);
      if (filters.hora_fin) params.append('hora_fin', filters.hora_fin);
      
      const response = await axios.get(`${API_URL}vendedores-ventas?${params.toString()}`, {
        headers: {
          'Origin': window.location.origin
        }
      });
      
      // ✅ NUEVO: Log para debug de la respuesta
      console.log('📊 Respuesta vendedores-ventas v2.0:', {
        count: response.data.count,
        hasSummaryStats: !!response.data.summary_stats,
        queryVersion: response.data.query_info?.version
      });
      
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  }

  /**
   * Obtiene detalle de ventas con paginación
   */
  static async getDetalleVentas(filters: ReportsFilters = {}): Promise<ReportsResponse<DetalleVenta[]> | ApiError> {
    try {
      const params = new URLSearchParams();
      
      if (filters.fecha) params.append('fecha', filters.fecha);
      if (filters.zonal) params.append('zonal', filters.zonal);
      if (filters.supervisor) params.append('supervisor', filters.supervisor);
      if (filters.hora_inicio) params.append('hora_inicio', filters.hora_inicio);
      if (filters.hora_fin) params.append('hora_fin', filters.hora_fin);
      if (filters.limit) params.append('limit', filters.limit.toString());
      if (filters.offset) params.append('offset', filters.offset.toString());
      
      const response = await axios.get(`${API_URL}detalle-ventas?${params.toString()}`, {
        headers: {
          'Origin': window.location.origin
        }
      });
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  }

  /**
   * Obtiene lista de zonales disponibles
   */
  static async getZonales(): Promise<ReportsResponse<string[]> | ApiError> {
    try {
      const response = await axios.get(`${API_URL}zonales`, {
        headers: {
          'Origin': window.location.origin
        }
      });
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  }

  /**
   * Obtiene lista de supervisores disponibles
   */
  static async getSupervisores(zonal?: string): Promise<ReportsResponse<string[]> | ApiError> {
    try {
      const params = zonal ? new URLSearchParams({ zonal }) : '';
      const response = await axios.get(`${API_URL}supervisores?${params.toString()}`, {
        headers: {
          'Origin': window.location.origin
        }
      });
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  }

  /**
   * Obtiene información de la base de datos (solo admin)
   */
  static async getDatabaseInfo(): Promise<ReportsResponse<any> | ApiError> {
    try {
      const response = await axios.get(`${API_URL}database-info`, {
        headers: {
          'Origin': window.location.origin
        }
      });
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  }

  /**
   * ✅ NUEVO: Exporta datos mejorados a CSV con estadísticas
   */
  static async exportToCSV(
    data: VendedorVentaResumen[] | DetalleVenta[], 
    filename: string, 
    summaryStats?: SummaryStats
  ): Promise<void> {
    try {
      if (!data || data.length === 0) {
        throw new Error('No hay datos para exportar');
      }

      let csvContent = '';
      
      // ✅ NUEVO: Agregar estadísticas de resumen al CSV si existen
      if (summaryStats) {
        csvContent += '=== RESUMEN GENERAL ===\n';
        csvContent += `Total Vendedores con Ventas,${summaryStats.total_vendedores_con_ventas}\n`;
        csvContent += `Total Pedidos Distintos,${summaryStats.total_pedidos_distintos}\n`;
        csvContent += `Total QVDD,${summaryStats.total_qvdd}\n`;
        csvContent += `Total Cuota Diaria,${summaryStats.total_cuota_diaria}\n`;
        csvContent += `Promedio HC Venta (%),${summaryStats.promedio_hc_venta_pct}\n`;
        csvContent += `Promedio Cumplimiento Cuota (%),${summaryStats.promedio_cumplimiento_cuota_pct}\n`;
        csvContent += '\n=== DETALLE POR SUPERVISOR ===\n';
      }

      // Headers y datos
      const headers = Object.keys(data[0]).join(',');
      const rows = data.map(row => 
        Object.values(row).map(value => 
          typeof value === 'string' && value.includes(',') 
            ? `"${value}"` 
            : value
        ).join(',')
      );

      csvContent += [headers, ...rows].join('\n');
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      
      if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `${filename}_${this.getCurrentDate()}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (error) {
      console.error('Error exportando CSV:', error);
      throw error;
    }
  }

  /**
   * ✅ NUEVO: Calcula KPIs locales para verificación
   */
  static calculateKPIs(data: VendedorVentaResumen[]): SummaryStats {
    const totals = data.reduce((acc, item) => ({
      total_vendedores_con_ventas: acc.total_vendedores_con_ventas + item.vendedores_con_ventas,
      total_pedidos_distintos: acc.total_pedidos_distintos + item.pedidos_distintos,
      total_qvdd: acc.total_qvdd + item.qvdd,
      total_cuota_diaria: acc.total_cuota_diaria + item.cuota_diaria
    }), {
      total_vendedores_con_ventas: 0,
      total_pedidos_distintos: 0,
      total_qvdd: 0,
      total_cuota_diaria: 0
    });

    return {
      ...totals,
      promedio_hc_venta_pct: totals.total_qvdd > 0 
        ? Math.round((totals.total_vendedores_con_ventas / totals.total_qvdd) * 100 * 100) / 100
        : 0,
      promedio_cumplimiento_cuota_pct: totals.total_cuota_diaria > 0
        ? Math.round((totals.total_pedidos_distintos / totals.total_cuota_diaria) * 100 * 100) / 100
        : 0
    };
  }

  /**
   * Formatea fecha para mostrar
   */
  static formatDate(dateString: string): string {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('es-PE', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
    } catch {
      return dateString;
    }
  }

  /**
   * ✅ NUEVO: Formatea hora para mostrar
   */
  static formatTime(timeString: string): string {
    try {
      return timeString.length === 8 ? timeString : `${timeString}:00`;
    } catch {
      return timeString;
    }
  }

  /**
   * Obtiene fecha actual en formato YYYY-MM-DD
   */
  static getCurrentDate(): string {
    return new Date().toISOString().split('T')[0];
  }

  /**
   * ✅ ACTUALIZADO: Valida filtros con nuevos parámetros de hora
   */
  static validateFilters(filters: ReportsFilters): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (filters.fecha) {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(filters.fecha)) {
        errors.push('Formato de fecha inválido. Use YYYY-MM-DD');
      }
    }

    if (filters.hora_inicio) {
      const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/;
      if (!timeRegex.test(filters.hora_inicio)) {
        errors.push('Formato de hora_inicio inválido. Use HH:MM o HH:MM:SS');
      }
    }

    if (filters.hora_fin) {
      const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/;
      if (!timeRegex.test(filters.hora_fin)) {
        errors.push('Formato de hora_fin inválido. Use HH:MM o HH:MM:SS');
      }
    }

    if (filters.limit && (filters.limit < 1 || filters.limit > 500)) {
      errors.push('Límite debe estar entre 1 y 500');
    }

    if (filters.offset && filters.offset < 0) {
      errors.push('Offset debe ser mayor o igual a 0');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * ✅ NUEVO: Helper para verificar si hay datos optimizados
   */
  static isOptimizedResponse(response: ReportsResponse<any>): boolean {
    return !!(response.summary_stats && response.query_info?.version === '2.0');
  }
}

// Funciones de conveniencia para compatibilidad
export const getVendedoresVentasResumen = ReportsService.getVendedoresVentas;
export const getDetalleVentas = ReportsService.getDetalleVentas;
export const getZonalesDisponibles = ReportsService.getZonales;
export const getSupervisoresDisponibles = ReportsService.getSupervisores;

// ✅ ACTUALIZADO: Exportar tipos nuevos
export type {
  ReportsFilters,
  VendedorVentaResumen,
  DetalleVenta,
  PaginationInfo,
  ReportsResponse,
  ApiError,
  SummaryStats,
  QueryInfo
};
