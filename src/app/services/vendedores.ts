// app/services/vendedores.ts
import axios, { AxiosError } from 'axios';

// ==================== CONFIGURACIÓN ====================
const API_URL = process.env.NEXT_PUBLIC_API_URL + '/api/vendedores';
const SUPERVISORES_URL = process.env.NEXT_PUBLIC_API_URL + '/api/feedback/supervisores';

// Configuración básica para cookies HTTP-only
axios.defaults.withCredentials = true;
axios.defaults.timeout = 30000;

// ==================== INTERFACES ====================
interface Vendedor {
  cluster_antiguedad: string;
  dni_hash: string;
  fecha_ingreso: string;
  nombre: string;
  rol: string;
  supervisor: string;
  total_ventas: number;
  vta_flex: number;
  vta_regular: number;
  whatsapp_numero: string | null;
  whatsapp_url: string | null;
  zonal: string;
}

interface VendedoresFilters {
  fecha?: string;
  order_by?: string;
  order_dir?: 'ASC' | 'DESC';
  zonal?: string;
  supervisor?: string;
  search?: string;
  page?: number;
  per_page?: number;
}

interface VendedoresResponse {
  data: Vendedor[];
  fecha_consulta: string;
  filters_applied: Record<string, any>;
  pagination: {
    has_next: boolean;
    has_prev: boolean;
    page: number;
    per_page: number;
    total_pages: number;
    total_records: number;
  };
  success: boolean;
  summary: {
    fecha_metricas: string;
    showing: number;
    total_vendedores: number;
  };
}

interface SupervisoresResponse {
  count: number;
  data: string[];
  dia_filter?: string;
  success: boolean;
}

interface ApiError {
  success: false;
  error: string;
  message?: string;
}

interface ZonalStats {
  zonal: string;
  totalVendedores: number;
  conVentas: number;
  sinVentas: number;
  planillaSinVentas: number;
  comisionistasSinVentas: number;
  totalVentasRegulares: number;
  totalVentasFlex: number;
  totalVentasGeneral: number;
  porcentajeConVentas: number;
  vendedores: Vendedor[];
}

interface VendedorStats {
  totalVendedores: number;
  conVentas: number;
  sinVentas: number;
  totalVentasRegulares: number;
  totalVentasFlex: number;
  totalVentasGeneral: number;
}

// ==================== INTERCEPTORS ====================
// Interceptor para manejo de errores de autenticación
axios.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiError>) => {
    if (error.response?.status === 401) {
      window.location.href = '/login?session_expired=true';
    }
    return Promise.reject(error);
  }
);

// ==================== UTILIDADES PRIVADAS ====================
const handleError = (error: any): ApiError => {
  console.error('❌ Error en VendedoresService:', error);
  
  if (error.response?.data) {
    return error.response.data;
  }
  
  if (error.code === 'ECONNABORTED') {
    return { success: false, error: 'Timeout: La solicitud tardó demasiado' };
  }
  
  if (error.message === 'Network Error') {
    return { success: false, error: 'Error de conexión: Verifique su conexión a internet' };
  }
  
  return { 
    success: false, 
    error: error.message || 'Error desconocido',
    message: 'Ha ocurrido un error inesperado. Por favor, intente nuevamente.'
  };
};

const buildQueryParams = (filters: VendedoresFilters): URLSearchParams => {
  const params = new URLSearchParams();
  
  // Filtros básicos
  if (filters.fecha) params.append('fecha', filters.fecha);
  if (filters.order_by) params.append('order_by', filters.order_by);
  if (filters.order_dir) params.append('order_dir', filters.order_dir);
  
  // Filtros de negocio
  if (filters.zonal) params.append('zonal', filters.zonal);
  if (filters.supervisor) params.append('supervisor', filters.supervisor);
  if (filters.search) params.append('search', filters.search.trim());
  
  // Paginación
  if (filters.page) params.append('page', filters.page.toString());
  if (filters.per_page) params.append('per_page', filters.per_page.toString());
  
  return params;
};

// ==================== SERVICIO PRINCIPAL ====================
export class VendedoresService {
  
  // ==================== MÉTODOS DE API ====================
  
  /**
   * Obtiene la lista de vendedores con filtros
   */
  static async getVendedores(filters: VendedoresFilters = {}): Promise<VendedoresResponse | ApiError> {
    try {
      const params = buildQueryParams(filters);
      const url = `${API_URL}?${params.toString()}`;

      console.log('🔍 Obteniendo vendedores:', { url, filters });

      const response = await axios.get<VendedoresResponse>(url);
      
      // Validar estructura de respuesta
      if (!response.data || typeof response.data !== 'object') {
        throw new Error('Respuesta inválida del servidor');
      }

      console.log('✅ Vendedores obtenidos:', {
        total: response.data.summary?.total_vendedores || 0,
        showing: response.data.summary?.showing || 0,
        fecha: response.data.fecha_consulta
      });
      
      return response.data;
    } catch (error) {
      return handleError(error);
    }
  }

  /**
   * Obtiene lista de supervisores disponibles
   */
  static async getSupervisores(fecha?: string): Promise<SupervisoresResponse | ApiError> {
    try {
      const params = new URLSearchParams();
      if (fecha) {
        params.append('dia_actualizacion', fecha);
      }
      
      const url = `${SUPERVISORES_URL}?${params.toString()}`;
      console.log('🔍 Obteniendo supervisores:', { url, fecha });
      
      const response = await axios.get<SupervisoresResponse>(url);
      
      // Validar y procesar respuesta
      if (!response.data || !response.data.success) {
        throw new Error('Error al obtener supervisores');
      }

      if (!Array.isArray(response.data.data)) {
        throw new Error('Formato de supervisores inválido');
      }
      
      // Procesar y ordenar supervisores
      const supervisoresOrdenados = response.data.data
        .filter(supervisor => supervisor && typeof supervisor === 'string')
        .sort((a: string, b: string) => 
          a.localeCompare(b, 'es', { sensitivity: 'base' })
        );
      
      console.log('✅ Supervisores obtenidos:', {
        total: supervisoresOrdenados.length,
        fecha: fecha || 'todas_fechas'
      });
      
      return {
        ...response.data,
        data: supervisoresOrdenados
      };
    } catch (error) {
      return handleError(error);
    }
  }

  // ==================== MÉTODOS DE EXTRACCIÓN ====================
  
  /**
   * Obtiene lista única de zonales desde los vendedores
   */
  static extractZonales(vendedores: Vendedor[]): string[] {
    if (!Array.isArray(vendedores)) {
      console.warn('⚠️ extractZonales: vendedores no es un array');
      return [];
    }

    const zonalesSet = new Set(
      vendedores
        .map(v => v?.zonal)
        .filter((zonal): zonal is string => Boolean(zonal))
    );
    
    return Array.from(zonalesSet).sort((a, b) => 
      a.localeCompare(b, 'es', { sensitivity: 'base' })
    );
  }

  /**
   * Obtiene lista única de supervisores desde los vendedores filtrados por zonal
   */
  static extractSupervisores(vendedores: Vendedor[], zonal?: string): string[] {
    if (!Array.isArray(vendedores)) {
      console.warn('⚠️ extractSupervisores: vendedores no es un array');
      return [];
    }

    const filteredVendedores = zonal 
      ? vendedores.filter(v => v?.zonal === zonal)
      : vendedores;
    
    const supervisoresSet = new Set(
      filteredVendedores
        .map(v => v?.supervisor)
        .filter((supervisor): supervisor is string => Boolean(supervisor))
    );
    
    return Array.from(supervisoresSet).sort((a, b) => 
      a.localeCompare(b, 'es', { sensitivity: 'base' })
    );
  }

  // ==================== MÉTODOS DE FILTRADO ====================
  
  /**
   * Filtra vendedores por texto libre (nombre)
   */
  static filterBySearch(vendedores: Vendedor[], searchText: string): Vendedor[] {
    if (!Array.isArray(vendedores)) {
      console.warn('⚠️ filterBySearch: vendedores no es un array');
      return [];
    }

    if (!searchText?.trim()) return vendedores;
    
    const search = searchText.toLowerCase().trim();
    return vendedores.filter(vendedor => 
      vendedor?.nombre?.toLowerCase().includes(search)
    );
  }

  // ==================== MÉTODOS DE FECHA ====================
  
  /**
   * Obtiene la fecha actual en formato YYYY-MM-DD (Perú timezone)
   */
  static getCurrentDate(): string {
    try {
      const now = new Date();
      const peruTime = new Date(now.toLocaleString("en-US", {timeZone: "America/Lima"}));
      
      const year = peruTime.getFullYear();
      const month = String(peruTime.getMonth() + 1).padStart(2, '0');
      const day = String(peruTime.getDate()).padStart(2, '0');
      
      return `${year}-${month}-${day}`;
    } catch (error) {
      console.error('❌ Error obteniendo fecha actual:', error);
      // Fallback a fecha UTC
      const now = new Date();
      return now.toISOString().split('T')[0];
    }
  }

  /**
   * Formatea una fecha para mostrar
   */
  static formatDate(dateString: string): string {
    try {
      if (!dateString) return 'Fecha no disponible';
      
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        throw new Error('Fecha inválida');
      }
      
      return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        timeZone: 'America/Lima'
      });
    } catch (error) {
      console.warn('⚠️ Error formateando fecha:', dateString, error);
      return dateString || 'Fecha inválida';
    }
  }

  // ==================== MÉTODOS DE ESTADÍSTICAS ====================
  
  /**
   * Calcula estadísticas de vendedores
   */
  static calculateStats(vendedores: Vendedor[]): VendedorStats {
    if (!Array.isArray(vendedores)) {
      console.warn('⚠️ calculateStats: vendedores no es un array');
      return {
        totalVendedores: 0,
        conVentas: 0,
        sinVentas: 0,
        totalVentasRegulares: 0,
        totalVentasFlex: 0,
        totalVentasGeneral: 0
      };
    }

    return {
      totalVendedores: vendedores.length,
      conVentas: vendedores.filter(v => (v?.total_ventas || 0) > 0).length,
      sinVentas: vendedores.filter(v => (v?.total_ventas || 0) === 0).length,
      totalVentasRegulares: vendedores.reduce((sum, v) => sum + (v?.vta_regular || 0), 0),
      totalVentasFlex: vendedores.reduce((sum, v) => sum + (v?.vta_flex || 0), 0),
      totalVentasGeneral: vendedores.reduce((sum, v) => sum + (v?.total_ventas || 0), 0)
    };
  }

  /**
   * Calcula estadísticas agrupadas por zonal
   */
  static calculateZonalStats(vendedores: Vendedor[]): ZonalStats[] {
    if (!Array.isArray(vendedores)) {
      console.warn('⚠️ calculateZonalStats: vendedores no es un array');
      return [];
    }

    // Agrupar vendedores por zonal
    const vendedoresPorZonal = vendedores.reduce((acc, vendedor) => {
      const zonal = vendedor?.zonal;
      if (!zonal) return acc;
      
      if (!acc[zonal]) {
        acc[zonal] = [];
      }
      acc[zonal].push(vendedor);
      return acc;
    }, {} as Record<string, Vendedor[]>);

    // Calcular estadísticas para cada zonal
    const zonalStats: ZonalStats[] = Object.entries(vendedoresPorZonal).map(([zonal, vendedoresZonal]) => {
      const totalVendedores = vendedoresZonal.length;
      const conVentas = vendedoresZonal.filter(v => (v?.total_ventas || 0) > 0).length;
      const sinVentas = vendedoresZonal.filter(v => (v?.total_ventas || 0) === 0).length;
      
      // Desglose por tipo de contrato para los sin ventas
      const vendedoresSinVentas = vendedoresZonal.filter(v => (v?.total_ventas || 0) === 0);
      const planillaSinVentas = vendedoresSinVentas.filter(v => {
        const rol = v?.rol?.toLowerCase() || '';
        return rol.includes('planilla') || rol.includes('empleado') || rol.includes('fijo');
      }).length;
      
      const comisionistasSinVentas = vendedoresSinVentas.filter(v => {
        const rol = v?.rol?.toLowerCase() || '';
        return rol.includes('comision') || rol.includes('freelance') || rol.includes('independiente');
      }).length;
      
      const totalVentasRegulares = vendedoresZonal.reduce((sum, v) => sum + (v?.vta_regular || 0), 0);
      const totalVentasFlex = vendedoresZonal.reduce((sum, v) => sum + (v?.vta_flex || 0), 0);
      const totalVentasGeneral = vendedoresZonal.reduce((sum, v) => sum + (v?.total_ventas || 0), 0);
      const porcentajeConVentas = totalVendedores > 0 ? (conVentas / totalVendedores) * 100 : 0;

      return {
        zonal,
        totalVendedores,
        conVentas,
        sinVentas,
        planillaSinVentas,
        comisionistasSinVentas,
        totalVentasRegulares,
        totalVentasFlex,
        totalVentasGeneral,
        porcentajeConVentas,
        vendedores: vendedoresZonal
      };
    });

    // Ordenar por total de vendedores (descendente)
    return zonalStats.sort((a, b) => b.totalVendedores - a.totalVendedores);
  }

  // ==================== MÉTODOS DE UI/UX ====================
  
  /**
   * Obtiene el color de estado basado en el nivel de ventas
   */
  static getVentasStatusColor(ventas: number): string {
    if (typeof ventas !== 'number' || ventas < 0) return 'gray';
    if (ventas === 0) return 'red';
    if (ventas >= 5) return 'green';
    if (ventas >= 2) return 'yellow';
    return 'orange';
  }

  /**
   * Obtiene el color de estado basado en la antigüedad
   */
  static getAntiguedadColor(antiguedad: string): string {
    if (!antiguedad || typeof antiguedad !== 'string') return 'gray';
    
    const antigLower = antiguedad.toLowerCase();
    if (antigLower.includes('<=15') || antigLower.includes('≤15')) return 'blue';
    if (antigLower.includes('<=30') || antigLower.includes('≤30')) return 'indigo';
    if (antigLower.includes('<=45') || antigLower.includes('≤45')) return 'purple';
    if (antigLower.includes('<=90') || antigLower.includes('≤90')) return 'green';
    return 'slate';
  }

  /**
   * Obtiene el color de estado basado en el porcentaje de vendedores con ventas
   */
  static getZonalPerformanceColor(porcentaje: number): string {
    if (typeof porcentaje !== 'number' || porcentaje < 0) return 'gray';
    if (porcentaje >= 80) return 'green';   // Excelente
    if (porcentaje >= 60) return 'yellow';  // Bueno
    if (porcentaje >= 40) return 'orange';  // Regular
    return 'red';                           // Necesita atención
  }

  /**
   * Obtiene el texto de estado basado en el porcentaje
   */
  static getZonalPerformanceText(porcentaje: number): string {
    if (typeof porcentaje !== 'number' || porcentaje < 0) return 'Sin datos';
    if (porcentaje >= 80) return 'Excelente';
    if (porcentaje >= 60) return 'Bueno';
    if (porcentaje >= 40) return 'Regular';
    return 'Crítico';
  }

  // ==================== MÉTODOS DE FORMATO ====================
  
  /**
   * Formatea el número de teléfono para mostrar
   */
  static formatPhoneNumber(phone: string | null): string {
    if (!phone || typeof phone !== 'string') return 'No disponible';
    
    // Limpiar el teléfono
    const cleanPhone = phone.trim();
    if (!cleanPhone) return 'No disponible';
    
    // Si ya tiene formato internacional, devolverlo
    if (cleanPhone.startsWith('+51')) return cleanPhone;
    
    // Si es número peruano sin código, agregarlo
    if (cleanPhone.length === 9 && /^[0-9]+$/.test(cleanPhone)) {
      return `+51${cleanPhone}`;
    }
    
    return cleanPhone;
  }

  /**
   * Genera URL de WhatsApp para contacto directo
   */
  static generateWhatsAppUrl(phone: string | null): string | null {
    if (!phone || typeof phone !== 'string') return null;
    
    const cleanPhone = phone.replace(/[^\d]/g, '');
    if (cleanPhone.length >= 9) {
      const formattedPhone = cleanPhone.startsWith('51') ? cleanPhone : `51${cleanPhone}`;
      return `https://wa.me/${formattedPhone}`;
    }
    
    return null;
  }

  // ==================== MÉTODOS DE EXPORTACIÓN ====================
  
  /**
   * Exporta datos a CSV
   */
  static async exportToCSV(vendedores: Vendedor[], filename: string): Promise<void> {
    try {
      if (!Array.isArray(vendedores) || vendedores.length === 0) {
        throw new Error('No hay datos para exportar');
      }

      const headers = [
        'Nombre',
        'Zonal', 
        'Supervisor',
        'Rol',
        'Antigüedad',
        'Fecha Ingreso',
        'Total Ventas',
        'Ventas Regulares',
        'Ventas Flex',
        'Teléfono',
        'DNI Hash'
      ];

      const csvContent = [
        headers.join(','),
        ...vendedores.map(v => [
          `"${v?.nombre || ''}"`,
          `"${v?.zonal || ''}"`,
          `"${v?.supervisor || ''}"`,
          `"${v?.rol || ''}"`,
          `"${v?.cluster_antiguedad || ''}"`,
          v?.fecha_ingreso || '',
          v?.total_ventas || 0,
          v?.vta_regular || 0,
          v?.vta_flex || 0,
          `"${this.formatPhoneNumber(v?.whatsapp_numero)}"`,
          v?.dni_hash || ''
        ].join(','))
      ].join('\n');

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
        URL.revokeObjectURL(url); // Limpiar memoria
      } else {
        throw new Error('Descarga no soportada en este navegador');
      }
    } catch (error) {
      console.error('❌ Error exportando CSV:', error);
      throw error;
    }
  }

  // ==================== MÉTODOS DE UTILIDAD ====================
  
  /**
   * Verifica si la respuesta es exitosa
   */
  static isSuccess<T>(response: T | ApiError): response is T {
    return (response as any)?.success !== false;
  }

  /**
   * Debug helper - imprime información del estado actual
   */
  static debugInfo(data: any, context: string = ''): void {
    if (process.env.NODE_ENV === 'development') {
      console.group(`🔍 Debug VendedoresService ${context}`);
      console.log('Timestamp:', new Date().toISOString());
      console.log('Data:', data);
      console.log('Type:', typeof data);
      console.log('Keys:', data && typeof data === 'object' ? Object.keys(data) : 'No keys');
      if (Array.isArray(data)) {
        console.log('Array length:', data.length);
      }
      console.groupEnd();
    }
  }
}

// ==================== EXPORTS ====================
export type { 
  Vendedor, 
  VendedoresFilters, 
  VendedoresResponse,
  SupervisoresResponse,
  ApiError,
  ZonalStats,
  VendedorStats
};