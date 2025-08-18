// app/services/reports.ts
import axios, { AxiosError } from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL + '/api/reports/';

// ✅ CRÍTICO: Configurar para cookies HTTP-only
axios.defaults.withCredentials = true;
axios.defaults.timeout = 60000; // 30 segundos para reportes

// Tipos para los filtros de reportes
interface ReportsFilters {
  fecha?: string;
  zonal?: string;
  supervisor?: string;
  limit?: number;
  offset?: number;
}

interface VendedorVentaResumen {
  zonal: string;
  supervisor: string;
  vendedores_con_ventas: number;
  pedidos_distintos: number;
  total_vendedores_activos: number;
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

interface ReportsResponse<T> {
  success: boolean;
  data: T;
  count?: number;
  filters?: any;
  pagination?: PaginationInfo;
  error?: string;
  timestamp?: string;
}

interface ApiError {
  success: false;
  error: string;
  timestamp?: string;
  data?: never;
}

// ✅ ACTUALIZAR: Interceptor para cookies HTTP-only
axios.interceptors.request.use((config) => {
  // ✅ ELIMINAR: Ya no usamos tokens en localStorage
  // const token = localStorage.getItem('token');
  // if (token) {
  //   config.headers.Authorization = `Bearer ${token}`;
  // }
  
  // ✅ AGREGAR: Headers necesarios para CORS
  config.headers['Origin'] = window.location.origin;
  config.withCredentials = true;
  
  return config;
});

axios.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiError>) => {
    console.error('Error en API:', error);
    
    if (error.response?.status === 401) {
      // ✅ ACTUALIZAR: Redireccionar sin limpiar localStorage
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
 * Servicio para manejo de reportes con cookies HTTP-only
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
   * Obtiene resumen de vendedores y ventas
   */
  static async getVendedoresVentas(filters: ReportsFilters = {}): Promise<ReportsResponse<VendedorVentaResumen[]> | ApiError> {
    try {
      const params = new URLSearchParams();
      
      if (filters.fecha) params.append('fecha', filters.fecha);
      if (filters.zonal) params.append('zonal', filters.zonal);
      if (filters.supervisor) params.append('supervisor', filters.supervisor);
      
      const response = await axios.get(`${API_URL}vendedores-ventas?${params.toString()}`, {
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
   * Obtiene detalle de ventas con paginación
   */
  static async getDetalleVentas(filters: ReportsFilters = {}): Promise<ReportsResponse<DetalleVenta[]> | ApiError> {
    try {
      const params = new URLSearchParams();
      
      if (filters.fecha) params.append('fecha', filters.fecha);
      if (filters.zonal) params.append('zonal', filters.zonal);
      if (filters.supervisor) params.append('supervisor', filters.supervisor);
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
   * Exporta datos a CSV
   */
  static async exportToCSV(data: any[], filename: string): Promise<void> {
    try {
      if (!data || data.length === 0) {
        throw new Error('No hay datos para exportar');
      }

      const headers = Object.keys(data[0]).join(',');
      const rows = data.map(row => 
        Object.values(row).map(value => 
          typeof value === 'string' && value.includes(',') 
            ? `"${value}"` 
            : value
        ).join(',')
      );

      const csvContent = [headers, ...rows].join('\n');
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      
      if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `${filename}.csv`);
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
   * Obtiene fecha actual en formato YYYY-MM-DD
   */
  static getCurrentDate(): string {
    return new Date().toISOString().split('T')[0];
  }

  /**
   * Valida filtros antes de enviar
   */
  static validateFilters(filters: ReportsFilters): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (filters.fecha) {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(filters.fecha)) {
        errors.push('Formato de fecha inválido. Use YYYY-MM-DD');
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
}

// Funciones de conveniencia para compatibilidad
export const getVendedoresVentasResumen = ReportsService.getVendedoresVentas;
export const getDetalleVentas = ReportsService.getDetalleVentas;
export const getZonalesDisponibles = ReportsService.getZonales;
export const getSupervisoresDisponibles = ReportsService.getSupervisores;

// Exportar tipos
export type {
  ReportsFilters,
  VendedorVentaResumen,
  DetalleVenta,
  PaginationInfo,
  ReportsResponse,
  ApiError
};