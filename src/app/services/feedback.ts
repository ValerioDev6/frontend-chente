// app/services/feedback.ts
import axios, { AxiosError } from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL + '/api/feedback/';

// ✅ Configuración básica para cookies HTTP-only
axios.defaults.withCredentials = true;
axios.defaults.timeout = 30000;

// ✅ INTERFACES ACTUALIZADAS - Registros completos desde BD
interface FeedbackRecord {
  id: number;
  supervisor: string;
  dia_actualizacion: string; // Fecha del registro (auto-creado)
  fecha_creacion: string;
  fecha_modificacion: string;
  // Campos auto-calculados (NO editables) - AHORA INCLUIDOS EN RESPUESTA
  zonal?: string;
  qvdd?: number;
  vendedores_con_ventas?: number;
  pedidos_distintos?: number;
  hc_venta_pct?: number;
  porcentaje_cuota?: number;
  // Campos EDITABLES únicamente
  cuota_diaria: number;
  comentarios_supervisor: string | null;
  comentarios_jefe: string | null;
}

// 🔧 FIXED: Changed from string | undefined to string | null to match FeedbackRecord
interface FeedbackUpdateData {
  cuota_diaria?: number;
  comentarios_supervisor?: string | null;  // ✅ Changed from string | undefined
  comentarios_jefe?: string | null;        // ✅ Changed from string | undefined
}

interface FeedbackResponse<T> {
  success: boolean;
  data: T;
  filters?: {
    dia_actualizacion?: string;
    order_by?: string;
    order_desc?: boolean;
    supervisor?: string;
  };
  pagination?: {
    current_page: number;
    has_next: boolean;
    has_prev: boolean;
    limit: number;
    offset: number;
    pages: number;
    total: number;
  };
  count?: number;
  message?: string;
  updated_fields?: string[]; // Para saber qué campos se actualizaron
  error?: string;
}

// ✅ NUEVA INTERFAZ para respuesta de supervisores
interface SupervisorResponse {
  success: boolean;
  data: string[];
  count: number;
  dia_filter?: string;
  message?: string;
  error?: string;
}

interface ApiError {
  success: false;
  error: string;
  message?: string;
}

// ✅ INTERCEPTOR SIMPLE
axios.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiError>) => {
    if (error.response?.status === 401) {
      window.location.href = '/login?session_expired=true';
    }
    return Promise.reject(error);
  }
);

// ✅ MANEJO DE ERRORES
const handleError = (error: any): ApiError => {
  if (error.response?.data) return error.response.data;
  return { success: false, error: error.message || 'Error desconocido' };
};

// ✅ SERVICIO PRINCIPAL
export class FeedbackService {
  
  /**
   * ✅ NUEVO: Obtiene lista de supervisores que tienen feedback
   * Refactorizado desde el componente InformeGerenciaPage
   */
  static async getSupervisoresConFeedback(fecha?: string): Promise<FeedbackResponse<string[]> | ApiError> {
    try {
      const params = new URLSearchParams();
      if (fecha) {
        params.append('dia_actualizacion', fecha);
      }
      
      console.log('🔍 Obteniendo supervisores:', {
        url: `${API_URL}supervisores`,
        params: params.toString(),
        fecha
      });
      
      const response = await axios.get(`${API_URL}supervisores?${params.toString()}`);
      
      // Procesar respuesta y ordenar supervisores
      if (response.data.success && response.data.data) {
        const supervisoresOrdenados = response.data.data.sort((a: string, b: string) => 
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
      }
      
      return response.data;
    } catch (error) {
      console.error('❌ Error obteniendo supervisores:', error);
      return handleError(error);
    }
  }

  /**
   * Obtiene lista de supervisores que tienen feedback (método heredado)
   * Mantener compatibilidad con código existente
   * @deprecated Use getSupervisoresConFeedback instead
   */
  static async getSupervisores(dia_actualizacion?: string): Promise<FeedbackResponse<string[]> | ApiError> {
    return this.getSupervisoresConFeedback(dia_actualizacion);
  }

  /**
   * Obtiene feedback por supervisor y fecha específica
   */
  static async getFeedbackBySupervisor(
    supervisor: string, 
    dia_actualizacion?: string
  ): Promise<FeedbackResponse<FeedbackRecord> | ApiError> {
    try {
      const params = new URLSearchParams();
      if (dia_actualizacion) {
        params.append('dia_actualizacion', dia_actualizacion);
      }
      
      const response = await axios.get(`${API_URL}supervisor/${encodeURIComponent(supervisor)}?${params.toString()}`);
      return response.data;
    } catch (error) {
      return handleError(error);
    }
  }

  /**
   * Obtiene lista de todos los registros de feedback con filtros
   * ESTA ES LA FUNCIÓN PRINCIPAL QUE USA TU COMPONENTE
   */
  static async getFeedbackList(filters: {
    supervisor?: string;
    dia_actualizacion?: string;
    limit?: number;
    offset?: number;
  } = {}): Promise<FeedbackResponse<FeedbackRecord[]> | ApiError> {
    try {
      const params = new URLSearchParams();
      
      if (filters.supervisor) {
        params.append('supervisor', filters.supervisor);
      }
      if (filters.dia_actualizacion) {
        params.append('dia_actualizacion', filters.dia_actualizacion);
      }
      if (filters.limit) {
        params.append('limit', filters.limit.toString());
      }
      if (filters.offset) {
        params.append('offset', filters.offset.toString());
      }

      const response = await axios.get(`${API_URL}?${params.toString()}`);
      
      // ✅ PROCESAR DATOS PARA COMPLETAR INFORMACIÓN FALTANTE
      if (response.data.success && response.data.data) {
        const processedData = response.data.data.map((item: any) => ({
          ...item,
          // Asegurar que los campos calculados existan con valores por defecto
          zonal: item.zonal || 'N/A',
          qvdd: item.qvdd || 0,
          vendedores_con_ventas: item.vendedores_con_ventas || 0,
          pedidos_distintos: item.pedidos_distintos || 0,
          hc_venta_pct: item.hc_venta_pct || 0,
          porcentaje_cuota: item.porcentaje_cuota || this.calculateCuotaPercentage(item.qvdd || 0, item.cuota_diaria || 0),
          // Campos editables con valores seguros
          cuota_diaria: item.cuota_diaria || 0,
          comentarios_supervisor: item.comentarios_supervisor || null,
          comentarios_jefe: item.comentarios_jefe || null
        }));
        
        return {
          ...response.data,
          data: processedData
        };
      }
      
      return response.data;
    } catch (error) {
      return handleError(error);
    }
  }

  /**
   * ACTUALIZA únicamente campos editables por ID
   */
  static async updateFeedbackById(
    id: number, 
    data: FeedbackUpdateData
  ): Promise<FeedbackResponse<FeedbackRecord> | ApiError> {
    try {
      // Validar datos antes de enviar
      const validation = this.validateUpdateData(data);
      if (!validation.isValid) {
        return {
          success: false,
          error: `Datos inválidos: ${validation.errors.join(', ')}`
        };
      }

      // Limpiar datos undefined/null
      const cleanData = this.cleanUpdateData(data);
      
      console.log('🔄 Enviando actualización:', {
        id,
        data: cleanData,
        url: `${API_URL}${id}`
      });
      
      const response = await axios.put(`${API_URL}${id}`, cleanData, {
        headers: { 'Content-Type': 'application/json' }
      });
      
      console.log('✅ Respuesta de actualización:', response.data);
      
      return response.data;
    } catch (error) {
      console.error('❌ Error en actualización:', error);
      return handleError(error);
    }
  }

  /**
   * ACTUALIZA únicamente campos editables por supervisor y fecha
   */
  static async updateFeedbackBySupervisor(
    supervisor: string,
    data: FeedbackUpdateData & { dia_actualizacion?: string }
  ): Promise<FeedbackResponse<FeedbackRecord> | ApiError> {
    try {
      // Validar datos antes de enviar
      const validation = this.validateUpdateData(data);
      if (!validation.isValid) {
        return {
          success: false,
          error: `Datos inválidos: ${validation.errors.join(', ')}`
        };
      }

      // Limpiar datos undefined/null
      const cleanData = this.cleanUpdateData(data);
      
      console.log('🔄 Enviando actualización por supervisor:', {
        supervisor,
        data: cleanData,
        url: `${API_URL}supervisor/${encodeURIComponent(supervisor)}`
      });
      
      const response = await axios.put(`${API_URL}supervisor/${encodeURIComponent(supervisor)}`, cleanData, {
        headers: { 'Content-Type': 'application/json' }
      });
      
      console.log('✅ Respuesta de actualización por supervisor:', response.data);
      
      return response.data;
    } catch (error) {
      console.error('❌ Error en actualización por supervisor:', error);
      return handleError(error);
    }
  }

  /**
   * Obtener un registro específico por ID
   */
  static async getFeedbackById(id: number): Promise<FeedbackResponse<FeedbackRecord> | ApiError> {
    try {
      const response = await axios.get(`${API_URL}${id}`);
      return response.data;
    } catch (error) {
      return handleError(error);
    }
  }

  // ✅ HELPERS ÚTILES
  
  /**
   * Obtiene la fecha actual en formato YYYY-MM-DD (Perú timezone)
   */
  static getCurrentDate(): string {
    // Usar timezone de Lima, Perú
    const now = new Date();
    const peruTime = new Date(now.toLocaleString("en-US", {timeZone: "America/Lima"}));
    
    const year = peruTime.getFullYear();
    const month = String(peruTime.getMonth() + 1).padStart(2, '0');
    const day = String(peruTime.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
  }

  /**
   * Formatea una fecha para mostrar
   */
  static formatDate(dateString: string): string {
    try {
      return new Date(dateString).toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        timeZone: 'America/Lima'
      });
    } catch {
      return dateString;
    }
  }

  /**
   * Valida los datos de actualización
   */
  static validateUpdateData(data: Partial<FeedbackUpdateData>): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    // Validar cuota_diaria si se proporciona
    if (data.cuota_diaria !== undefined) {
      if (typeof data.cuota_diaria !== 'number') {
        errors.push('cuota_diaria debe ser un número');
      } else if (data.cuota_diaria < 0) {
        errors.push('cuota_diaria debe ser mayor o igual a 0');
      } else if (!Number.isInteger(data.cuota_diaria)) {
        errors.push('cuota_diaria debe ser un número entero');
      } else if (data.cuota_diaria > 10000) {
        errors.push('cuota_diaria no puede exceder 10,000');
      }
    }
    
    // 🔧 FIXED: Updated validation to handle null values
    if (data.comentarios_supervisor !== undefined) {
      if (data.comentarios_supervisor !== null && typeof data.comentarios_supervisor !== 'string') {
        errors.push('comentarios_supervisor debe ser texto o null');
      } else if (data.comentarios_supervisor && data.comentarios_supervisor.length > 500) {
        errors.push('comentarios_supervisor no puede exceder 500 caracteres');
      }
    }
    
    if (data.comentarios_jefe !== undefined) {
      if (data.comentarios_jefe !== null && typeof data.comentarios_jefe !== 'string') {
        errors.push('comentarios_jefe debe ser texto o null');
      } else if (data.comentarios_jefe && data.comentarios_jefe.length > 500) {
        errors.push('comentarios_jefe no puede exceder 500 caracteres');
      }
    }
    
    // Al menos un campo debe estar presente
    const hasFields = data.cuota_diaria !== undefined || 
                     data.comentarios_supervisor !== undefined || 
                     data.comentarios_jefe !== undefined;
    
    if (!hasFields) {
      errors.push('Debe proporcionar al menos un campo para actualizar');
    }
    
    return { isValid: errors.length === 0, errors };
  }

  /**
   * Limpia los datos eliminando campos undefined y trimmeando strings
   */
  static cleanUpdateData(data: FeedbackUpdateData): FeedbackUpdateData {
    const cleaned: FeedbackUpdateData = {};
    
    if (data.cuota_diaria !== undefined) {
      cleaned.cuota_diaria = data.cuota_diaria;
    }
    
    if (data.comentarios_supervisor !== undefined) {
      if (data.comentarios_supervisor === null) {
        cleaned.comentarios_supervisor = null;
      } else {
        const trimmed = data.comentarios_supervisor.trim();
        cleaned.comentarios_supervisor = trimmed || null;
      }
    }
    
    if (data.comentarios_jefe !== undefined) {
      if (data.comentarios_jefe === null) {
        cleaned.comentarios_jefe = null;
      } else {
        const trimmed = data.comentarios_jefe.trim();
        cleaned.comentarios_jefe = trimmed || null;
      }
    }
    
    return cleaned;
  }

  /**
   * Verifica si la respuesta es exitosa
   */
  static isSuccess<T>(response: FeedbackResponse<T> | ApiError): response is FeedbackResponse<T> {
    return response.success === true;
  }

  /**
   * ✅ NUEVO: Helper para verificar si una respuesta contiene supervisores
   */
  static isSupervisorListResponse(response: FeedbackResponse<any> | ApiError): response is FeedbackResponse<string[]> {
    return this.isSuccess(response) && Array.isArray(response.data) && 
           (response.data.length === 0 || typeof response.data[0] === 'string');
  }

  /**
   * Calcula el porcentaje de cumplimiento de cuota
   */
  static calculateCuotaPercentage(qvdd: number, cuota: number): number {
    if (!cuota || cuota <= 0) return 0;
    return Math.round((qvdd / cuota) * 100);
  }

  /**
   * Obtiene el color de estado basado en el porcentaje de cuota
   */
  static getCuotaStatusColor(percentage: number): string {
    if (percentage >= 100) return 'green';
    if (percentage >= 80) return 'yellow';
    return 'red';
  }

  /**
   * Genera un resumen de los datos para logging
   */
  static generateUpdateSummary(data: FeedbackUpdateData): string {
    const changes: string[] = [];
    
    if (data.cuota_diaria !== undefined) {
      changes.push(`Cuota: ${data.cuota_diaria}`);
    }
    
    if (data.comentarios_supervisor !== undefined) {
      const hasComment = data.comentarios_supervisor && data.comentarios_supervisor.trim();
      changes.push(`Com. Supervisor: ${hasComment ? 'Actualizado' : 'Eliminado'}`);
    }
    
    if (data.comentarios_jefe !== undefined) {
      const hasComment = data.comentarios_jefe && data.comentarios_jefe.trim();
      changes.push(`Com. Jefe: ${hasComment ? 'Actualizado' : 'Eliminado'}`);
    }
    
    return changes.join(', ');
  }

  /**
   * Transforma los datos de respuesta para asegurar consistencia
   */
  static transformFeedbackRecord(item: any): FeedbackRecord {
    return {
      id: item.id,
      supervisor: item.supervisor || '',
      dia_actualizacion: item.dia_actualizacion,
      fecha_creacion: item.fecha_creacion,
      fecha_modificacion: item.fecha_modificacion || item.fecha_creacion,
      // Campos calculados con fallbacks seguros
      zonal: item.zonal || 'N/A',
      qvdd: typeof item.qvdd === 'number' ? item.qvdd : 0,
      vendedores_con_ventas: typeof item.vendedores_con_ventas === 'number' ? item.vendedores_con_ventas : 0,
      pedidos_distintos: typeof item.pedidos_distintos === 'number' ? item.pedidos_distintos : 0,
      hc_venta_pct: typeof item.hc_venta_pct === 'number' ? item.hc_venta_pct : 0,
      porcentaje_cuota: typeof item.porcentaje_cuota === 'number' 
        ? item.porcentaje_cuota 
        : this.calculateCuotaPercentage(item.qvdd || 0, item.cuota_diaria || 0),
      // Campos editables
      cuota_diaria: typeof item.cuota_diaria === 'number' ? item.cuota_diaria : 0,
      comentarios_supervisor: item.comentarios_supervisor || null,
      comentarios_jefe: item.comentarios_jefe || null
    };
  }

  /**
   * Debug helper - imprime información del estado actual
   */
  static debugInfo(data: any, context: string = '') {
    console.group(`🔍 Debug FeedbackService ${context}`);
    console.log('Timestamp:', new Date().toISOString());
    console.log('Data:', data);
    console.log('Type:', typeof data);
    console.log('Keys:', data && typeof data === 'object' ? Object.keys(data) : 'No keys');
    console.groupEnd();
  }
}

// ✅ EXPORTS - Solo interfaces relevantes
export type { 
  FeedbackRecord, 
  FeedbackUpdateData, 
  FeedbackResponse,
  SupervisorResponse,
  ApiError 
};