// services/vendedores.service.ts - VERSIÓN ACTUALIZADA
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL + '/api/vendedores';

axios.defaults.withCredentials = true;
axios.defaults.timeout = 30000;

// Interfaces básicas
export interface Vendedor {
  dni_hash: string;
  nombre: string;
  zonal: string;
  supervisor: string;
  rol: string;
  cluster_antiguedad: string;
  whatsapp_numero: string | null;
  whatsapp_url: string | null;
  vta_regular: number;
  vta_flex: number;
  total_ventas: number;
  fecha_ingreso: string;
}

export interface VendedoresFilters {
  fecha?: string;
  zonal?: string;
  supervisor?: string;
  rol?: string;
  nombre?: string;
  sin_ventas?: boolean; // true = solo SIN ventas, false = solo CON ventas, undefined = todos
  cluster_antiguedad?: string;
}

export interface VendedoresResponse {
  success: boolean;
  data: Vendedor[];
  fecha_consulta: string;
  summary: {
    total_vendedores: number;
    vendedores_con_ventas: number;
    vendedores_sin_ventas: number;
    total_vta_regular: number;
    total_vta_flex: number;
    total_ventas_global: number;
  };
  filters_applied: Record<string, any>;
  top_performers?: {
    mejor_regular: Vendedor | null;
    mejor_total: Vendedor | null;
  };
}

export interface FiltersResponse {
  success: boolean;
  filters: {
    zonal: string[];
    supervisor: string[];
    rol: string[];
    cluster_antiguedad: string[];
  };
}

// Utilidades para WhatsApp
export const WhatsAppUtils = {
  // Detectar si es móvil
  isMobile: (): boolean => {
    if (typeof window === 'undefined') return false;
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  },

  // Generar URL de WhatsApp
  generateWhatsAppUrl: (numero: string, isMobile: boolean = WhatsAppUtils.isMobile()): string => {
    const cleanNumber = numero.replace(/\D/g, '');
    
    if (isMobile) {
      return `whatsapp://send?phone=${cleanNumber}`;
    } else {
      return `https://web.whatsapp.com/send?phone=${cleanNumber}`;
    }
  },

  // Abrir WhatsApp con fallback
  openWhatsApp: (numero: string): void => {
    const mobileUrl = WhatsAppUtils.generateWhatsAppUrl(numero, true);
    const webUrl = WhatsAppUtils.generateWhatsAppUrl(numero, false);
    
    if (WhatsAppUtils.isMobile()) {
      // En móvil, intentar app primero, luego web
      window.location.href = mobileUrl;
      setTimeout(() => {
        window.open(webUrl, '_blank');
      }, 1000);
    } else {
      // En desktop, abrir WhatsApp Web directamente
      window.open(webUrl, '_blank');
    }
  }
};

// Servicio actualizado
export class VendedoresService {
  
  // Obtener todos los vendedores con mejores vendedores
  static async getVendedores(filters: VendedoresFilters = {}): Promise<VendedoresResponse> {
    try {
      const params = new URLSearchParams();
      
      // Aplicar filtros
      if (filters.fecha) params.append('fecha', filters.fecha);
      if (filters.zonal) params.append('zonal', filters.zonal);
      if (filters.supervisor) params.append('supervisor', filters.supervisor);
      if (filters.rol) params.append('rol', filters.rol);
      if (filters.nombre) params.append('nombre', filters.nombre.trim());
      if (filters.cluster_antiguedad) params.append('cluster_antiguedad', filters.cluster_antiguedad);
      
      // Manejo mejorado del filtro de ventas
      if (filters.sin_ventas === true) {
        params.append('sin_ventas', 'true'); // Solo vendedores SIN ventas
      } else if (filters.sin_ventas === false) {
        params.append('con_ventas', 'true'); // Solo vendedores CON ventas
      }
      // Si es undefined, no añadir parámetro = todos los vendedores
      
      // Ordenamiento por defecto
      params.append('order_by', 'total_ventas');
      params.append('order_dir', 'DESC');
      
      // Solicitar mejores vendedores
      params.append('include_top_performers', 'true');
      
      const url = `${API_URL}/?${params.toString()}`;
      console.log('Consultando vendedores:', { filters });

      const response = await axios.get<VendedoresResponse>(url);
      
      if (!response.data?.success) {
        throw new Error('Error en la respuesta del servidor');
      }

      // Si el backend no incluye top_performers, calcularlos localmente
      if (!response.data.top_performers && response.data.data.length > 0) {
        response.data.top_performers = VendedoresService.calculateTopPerformers(response.data.data);
      }

      console.log(`Vendedores obtenidos: ${response.data.data.length}`);
      console.log(`Con ventas: ${response.data.summary.vendedores_con_ventas}`);
      console.log(`Sin ventas: ${response.data.summary.vendedores_sin_ventas}`);
      
      return response.data;
      
    } catch (error: any) {
      console.error('Error obteniendo vendedores:', error);
      throw new Error(error.response?.data?.message || error.message || 'Error desconocido');
    }
  }

  // Calcular mejores vendedores localmente si el backend no lo hace
  static calculateTopPerformers(vendedores: Vendedor[]) {
    const vendedoresConVentas = vendedores.filter(v => v.total_ventas > 0 || v.vta_regular > 0);
    
    const mejor_regular = vendedoresConVentas.length > 0 
      ? vendedoresConVentas.reduce((prev, current) => 
          (prev.vta_regular > current.vta_regular) ? prev : current
        )
      : null;
    
    const mejor_total = vendedoresConVentas.length > 0
      ? vendedoresConVentas.reduce((prev, current) => 
          (prev.total_ventas > current.total_ventas) ? prev : current
        )
      : null;
    
    return { mejor_regular, mejor_total };
  }

  // Obtener filtros disponibles
  static async getFilters(): Promise<FiltersResponse> {
    try {
      const response = await axios.get<FiltersResponse>(`${API_URL}/filters`);
      
      if (!response.data?.success) {
        throw new Error('Error obteniendo filtros');
      }
      
      return response.data;
      
    } catch (error: any) {
      console.error('Error obteniendo filtros:', error);
      throw new Error(error.response?.data?.message || 'Error obteniendo filtros');
    }
  }

  // Obtener estadísticas rápidas
  static async getStats(fecha?: string): Promise<VendedoresResponse['summary']> {
    try {
      const params = new URLSearchParams();
      if (fecha) params.append('fecha', fecha);
      
      const response = await axios.get(`${API_URL}/stats?${params.toString()}`);
      
      if (!response.data?.success) {
        throw new Error('Error obteniendo estadísticas');
      }
      
      return response.data.stats;
      
    } catch (error: any) {
      console.error('Error obteniendo estadísticas:', error);
      throw new Error(error.response?.data?.message || 'Error obteniendo estadísticas');
    }
  }
}