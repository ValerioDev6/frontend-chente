// app/dashboard/seguimiento/page.tsx
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import { 
  FeedbackService, 
  FeedbackRecord, 
  FeedbackUpdateData, 
  FeedbackResponse, 
  ApiError 
} from '@/app/services/feedback';

// Tipos locales
interface FeedbackFilters {
  supervisor?: string;
  dia_actualizacion?: string;
}

// Helper para verificar si es error
const isApiError = (response: any): response is ApiError => {
  return response && response.success === false && 'error' in response;
};

// Componente Loading
const LoadingSpinner = ({ text = "Cargando..." }: { text?: string }) => (
  <div className="p-6 sm:p-8 text-center">
    <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-4 border-slate-300 border-t-blue-600 mx-auto mb-4"></div>
    <p className="text-slate-600 font-medium text-sm sm:text-base">{text}</p>
  </div>
);

// Panel de filtros mejorado para móviles
const FiltrosPanel = ({ 
  filters, 
  onFiltersChange, 
  supervisores, 
  loading, 
  onRefresh,
  totalRecords
}: {
  filters: FeedbackFilters;
  onFiltersChange: (filters: FeedbackFilters) => void;
  supervisores: string[];
  loading: boolean;
  onRefresh: () => void;
  totalRecords: number;
}) => (
  <div className="bg-white/90 backdrop-blur-sm rounded-xl sm:rounded-2xl border border-slate-200/50 p-4 sm:p-6 mb-6 sm:mb-8 shadow-xl">
    {/* Header del panel - mejorado para móviles */}
    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 sm:mb-6 space-y-3 sm:space-y-0">
      <div className="flex items-center space-x-3">
        <div className="p-2 bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg flex-shrink-0">
          <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4"></path>
          </svg>
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-lg sm:text-xl font-bold text-slate-800">Filtros de Seguimiento</h2>
          <p className="text-xs sm:text-sm text-slate-600 truncate">
            {totalRecords > 0 ? `${totalRecords} registros encontrados` : 'No hay registros'}
          </p>
        </div>
      </div>
      
      {/* Botón de actualizar - mejorado */}
      <button
        onClick={onRefresh}
        disabled={loading}
        className="w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white rounded-lg sm:rounded-xl font-semibold disabled:opacity-50 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 text-sm sm:text-base"
      >
        {loading ? (
          <div className="flex items-center justify-center space-x-2">
            <div className="animate-spin rounded-full h-3 w-3 sm:h-4 sm:w-4 border-2 border-white border-t-transparent"></div>
            <span>Cargando...</span>
          </div>
        ) : (
          <div className="flex items-center justify-center space-x-2">
            <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
            </svg>
            <span>Actualizar</span>
          </div>
        )}
      </button>
    </div>
    
    {/* Grid de filtros - completamente responsivo */}
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
      {/* FECHA */}
      <div className="space-y-3">
        <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
          <div className="p-1 bg-blue-100 rounded flex-shrink-0">
            <svg className="w-3 h-3 sm:w-4 sm:h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
            </svg>
          </div>
          <span className="truncate">Fecha de Actualización</span>
          {filters.dia_actualizacion && (
            <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium hidden sm:inline-block">
              {new Date(filters.dia_actualizacion).toLocaleDateString('es-ES')}
            </span>
          )}
        </label>
        <input
          type="date"
          value={filters.dia_actualizacion || ''}
          onChange={(e) => onFiltersChange({ 
            ...filters, 
            dia_actualizacion: e.target.value || undefined 
          })}
          className="w-full px-3 sm:px-4 py-2 sm:py-3 border-2 border-slate-200 rounded-lg sm:rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 bg-white/80 text-sm sm:text-base"
          disabled={loading}
        />
        {filters.dia_actualizacion && (
          <div className="flex justify-between items-center">
            <button
              onClick={() => onFiltersChange({ ...filters, dia_actualizacion: undefined })}
              className="text-xs text-slate-500 hover:text-slate-700 underline"
            >
              Limpiar fecha
            </button>
            {/* Mostrar fecha en móviles */}
            <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium sm:hidden">
              {new Date(filters.dia_actualizacion).toLocaleDateString('es-ES')}
            </span>
          </div>
        )}
      </div>

      {/* SUPERVISOR */}
      <div className="space-y-3">
        <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
          <div className="p-1 bg-purple-100 rounded flex-shrink-0">
            <svg className="w-3 h-3 sm:w-4 sm:h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
            </svg>
          </div>
          <span className="truncate">Supervisor</span>
          <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full font-medium flex-shrink-0">
            {supervisores.length}
          </span>
        </label>
        <select
          value={filters.supervisor || ''}
          onChange={(e) => onFiltersChange({ 
            ...filters, 
            supervisor: e.target.value || undefined 
          })}
          className="w-full px-3 sm:px-4 py-2 sm:py-3 border-2 border-slate-200 rounded-lg sm:rounded-xl focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 transition-all duration-200 bg-white/80 text-sm sm:text-base"
          disabled={loading}
        >
          <option value="">Todos los supervisores</option>
          {supervisores.map((supervisor) => (
            <option key={supervisor} value={supervisor}>{supervisor}</option>
          ))}
        </select>
        {filters.supervisor && (
          <button
            onClick={() => onFiltersChange({ ...filters, supervisor: undefined })}
            className="text-xs text-slate-500 hover:text-slate-700 underline"
          >
            Mostrar todos
          </button>
        )}
      </div>
    </div>

    {/* Info adicional - mejorada para móviles */}
    <div className="mt-4 p-3 bg-slate-50 rounded-lg">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-2 sm:space-y-0 text-sm">
        <span className="text-slate-600 text-xs sm:text-sm">
          {filters.dia_actualizacion || filters.supervisor 
            ? 'Filtros activos' 
            : 'Sin filtros activos - mostrando todos los datos'
          }
        </span>
        {(filters.dia_actualizacion || filters.supervisor) && (
          <button
            onClick={() => onFiltersChange({})}
            className="text-blue-600 hover:text-blue-800 font-medium text-xs sm:text-sm self-start sm:self-auto"
          >
            Limpiar todos
          </button>
        )}
      </div>
    </div>
  </div>
);

// Modal de edición - mejorado para móviles
const EditarFeedbackModal = ({ 
  feedback, 
  onClose, 
  onSave, 
  loading 
}: {
  feedback: FeedbackRecord | null;
  onClose: () => void;
  onSave: (data: FeedbackUpdateData) => void;
  loading: boolean;
}) => {
  const [formData, setFormData] = useState<FeedbackUpdateData>({});
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (feedback) {
      const initialData = {
        cuota_diaria: feedback.cuota_diaria || 0,
        comentarios_supervisor: feedback.comentarios_supervisor || '',
        comentarios_jefe: feedback.comentarios_jefe || ''
      };
      setFormData(initialData);
      setValidationErrors([]);
      setHasChanges(false);
    }
  }, [feedback]);

  // Detectar cambios
  useEffect(() => {
    if (!feedback) return;
    
    const hasChanged = 
      formData.cuota_diaria !== (feedback.cuota_diaria || 0) ||
      formData.comentarios_supervisor !== (feedback.comentarios_supervisor || '') ||
      formData.comentarios_jefe !== (feedback.comentarios_jefe || '');
    
    setHasChanges(hasChanged);
  }, [formData, feedback]);

  const handleSave = () => {
    if (!hasChanges) {
      onClose();
      return;
    }
    
    // Validar antes de guardar
    const validation = FeedbackService.validateUpdateData(formData);
    if (!validation.isValid) {
      setValidationErrors(validation.errors);
      return;
    }
    
    setValidationErrors([]);
    
    // Solo enviar campos que realmente cambiaron
    const changedData: FeedbackUpdateData = {};
    if (formData.cuota_diaria !== (feedback!.cuota_diaria || 0)) {
      changedData.cuota_diaria = formData.cuota_diaria;
    }
    if (formData.comentarios_supervisor !== (feedback!.comentarios_supervisor || '')) {
      changedData.comentarios_supervisor = formData.comentarios_supervisor;
    }
    if (formData.comentarios_jefe !== (feedback!.comentarios_jefe || '')) {
      changedData.comentarios_jefe = formData.comentarios_jefe;
    }
    
    onSave(changedData);
  };

  const calculateNewPercentage = () => {
    if (!feedback || !formData.cuota_diaria || formData.cuota_diaria <= 0) return 0;
    return Math.round(((feedback.qvdd || 0) / formData.cuota_diaria) * 100);
  };

  if (!feedback) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-2 sm:p-4 z-50">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-2xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
        {/* Header del modal - mejorado para móviles */}
        <div className="p-4 sm:p-6 border-b border-slate-200 sticky top-0 bg-white rounded-t-2xl sm:rounded-t-2xl">
          <div className="flex justify-between items-start">
            <div className="flex-1 min-w-0 pr-4">
              <h2 className="text-xl sm:text-2xl font-bold text-slate-800 truncate">Editar Feedback</h2>
              <p className="text-slate-600 mt-1 truncate">{feedback.supervisor}</p>
              {feedback.zonal && (
                <p className="text-sm text-slate-500 truncate">Zonal: {feedback.zonal}</p>
              )}
              <p className="text-xs text-slate-500 mt-1">
                Fecha: {new Date(feedback.dia_actualizacion).toLocaleDateString('es-ES')}
              </p>
            </div>
            <button
              onClick={onClose}
              disabled={loading}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50 flex-shrink-0"
            >
              <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>
          
          {/* Indicador de cambios */}
          {hasChanges && (
            <div className="mt-3 px-3 py-2 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center">
                <svg className="w-4 h-4 text-yellow-600 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
                </svg>
                <span className="text-sm text-yellow-800 font-medium">Tienes cambios sin guardar</span>
              </div>
            </div>
          )}
        </div>

        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
          {/* Errores de validación */}
          {validationErrors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <div className="flex items-start">
                <svg className="w-5 h-5 text-red-400 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
                </svg>
                <div>
                  <h4 className="text-sm font-semibold text-red-800 mb-1">Errores de validación:</h4>
                  <ul className="text-sm text-red-700 list-disc list-inside space-y-1">
                    {validationErrors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Información no editable - mejorada para móviles */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 p-3 sm:p-4 bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl border border-slate-200">
            <div className="text-center">
              <label className="text-xs font-semibold text-slate-600 block mb-1">HC Venta %</label>
              <div className="px-2 sm:px-3 py-1 sm:py-2 bg-blue-100 text-blue-800 rounded-lg font-bold text-sm sm:text-lg">
                {Math.round(feedback.hc_venta_pct || 0)}%
              </div>
            </div>
            <div className="text-center">
              <label className="text-xs font-semibold text-slate-600 block mb-1">QVDD</label>
              <div className="px-2 sm:px-3 py-1 sm:py-2 bg-indigo-100 text-indigo-800 rounded-lg font-bold text-sm sm:text-lg">
                {feedback.qvdd || 0}
              </div>
            </div>
            <div className="text-center">
              <label className="text-xs font-semibold text-slate-600 block mb-1">Vendedores</label>
              <div className="px-2 sm:px-3 py-1 sm:py-2 bg-purple-100 text-purple-800 rounded-lg font-bold text-sm sm:text-lg">
                {feedback.vendedores_con_ventas || 0}
              </div>
            </div>
            <div className="text-center">
              <label className="text-xs font-semibold text-slate-600 block mb-1">Pedidos</label>
              <div className="px-2 sm:px-3 py-1 sm:py-2 bg-emerald-100 text-emerald-800 rounded-lg font-bold text-sm sm:text-lg">
                {feedback.pedidos_distintos || 0}
              </div>
            </div>
          </div>

          {/* Campos editables */}
          <div className="space-y-4 sm:space-y-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Cuota Diaria *
              </label>
              <input
                type="number"
                min="0"
                max="10000"
                step="1"
                value={formData.cuota_diaria || ''}
                onChange={(e) => {
                  const value = e.target.value ? parseInt(e.target.value) : 0;
                  setFormData({ ...formData, cuota_diaria: value });
                }}
                className="w-full px-3 sm:px-4 py-2 sm:py-3 border-2 border-slate-200 rounded-lg sm:rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 text-base sm:text-lg font-semibold"
                disabled={loading}
                placeholder="Ingresa la cuota diaria"
              />
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mt-2 space-y-1 sm:space-y-0">
                <p className="text-xs text-slate-500">
                  {formData.cuota_diaria && formData.cuota_diaria > 0 ? 
                    `Nuevo cumplimiento: ${calculateNewPercentage()}%` :
                    'Ingresa una cuota para calcular el cumplimiento'
                  }
                </p>
                {formData.cuota_diaria !== (feedback.cuota_diaria || 0) && (
                  <span className="text-xs px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full font-medium self-start sm:self-auto">
                    Modificado
                  </span>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Comentarios Evaluación inicial
              </label>
              <textarea
                value={formData.comentarios_supervisor || ''}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  comentarios_supervisor: e.target.value 
                })}
                rows={3}
                className="w-full px-3 sm:px-4 py-2 sm:py-3 border-2 border-slate-200 rounded-lg sm:rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 text-sm sm:text-base"
                placeholder="Ingresa comentarios del supervisor..."
                disabled={loading}
                maxLength={500}
              />
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mt-2 space-y-1 sm:space-y-0">
                <p className="text-xs text-slate-500">
                  {(formData.comentarios_supervisor || '').length}/500 caracteres
                </p>
                {formData.comentarios_supervisor !== (feedback.comentarios_supervisor || '') && (
                  <span className="text-xs px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full font-medium self-start sm:self-auto">
                    Modificado
                  </span>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Retroalimentación Cierre de Ventas
              </label>
              <textarea
                value={formData.comentarios_jefe || ''}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  comentarios_jefe: e.target.value 
                })}
                rows={3}
                className="w-full px-3 sm:px-4 py-2 sm:py-3 border-2 border-slate-200 rounded-lg sm:rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 text-sm sm:text-base"
                placeholder="Ingresa comentarios del supervisor..."
                disabled={loading}
                maxLength={500}
              />
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mt-2 space-y-1 sm:space-y-0">
                <p className="text-xs text-slate-500">
                  {(formData.comentarios_jefe || '').length}/500 caracteres
                </p>
                {formData.comentarios_jefe !== (feedback.comentarios_jefe || '') && (
                  <span className="text-xs px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full font-medium self-start sm:self-auto">
                    Modificado
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer del modal - mejorado para móviles */}
        <div className="p-4 sm:p-6 border-t border-slate-200 flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-4 sticky bottom-0 bg-white">
          <button
            onClick={onClose}
            disabled={loading}
            className="w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-3 text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg sm:rounded-xl transition-colors font-semibold disabled:opacity-50 order-2 sm:order-1"
          >
            {hasChanges ? 'Cancelar' : 'Cerrar'}
          </button>
          <button
            onClick={handleSave}
            disabled={loading || validationErrors.length > 0 || !hasChanges}
            className="w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg sm:rounded-xl font-semibold disabled:opacity-50 transition-all duration-200 shadow-lg order-1 sm:order-2"
          >
            {loading ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                <span>Guardando...</span>
              </div>
            ) : hasChanges ? (
              'Guardar Cambios'
            ) : (
              'Sin Cambios'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

// Componente principal
export default function SeguimientoPage() {
  const { user } = useAuth();
  const [feedbackData, setFeedbackData] = useState<FeedbackRecord[]>([]);
  const [supervisores, setSupervisores] = useState<string[]>([]);
  const [filters, setFilters] = useState<FeedbackFilters>({ 
    dia_actualizacion: FeedbackService.getCurrentDate() 
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [editingFeedback, setEditingFeedback] = useState<FeedbackRecord | null>(null);
  const [savingFeedback, setSavingFeedback] = useState(false);

  // Datos filtrados con mejores controles
  const filteredFeedback = useMemo(() => {
    let filtered = feedbackData;
    
    // Filtro por supervisor
    if (filters.supervisor) {
      filtered = filtered.filter(item => 
        item.supervisor.toLowerCase().includes(filters.supervisor!.toLowerCase())
      );
    }
    
    // Ordenar por supervisor
    return filtered.sort((a, b) => a.supervisor.localeCompare(b.supervisor));
  }, [feedbackData, filters.supervisor]);

  // Estadísticas
  const stats = useMemo(() => {
    const total = filteredFeedback.length;
    const conCuota = filteredFeedback.filter(item => item.cuota_diaria && item.cuota_diaria > 0).length;
    const conComentariosSup = filteredFeedback.filter(item => item.comentarios_supervisor && item.comentarios_supervisor.trim()).length;
    const conComentariosJefe = filteredFeedback.filter(item => item.comentarios_jefe && item.comentarios_jefe.trim()).length;
    const cumplimiento100 = filteredFeedback.filter(item => 
      item.cuota_diaria && item.cuota_diaria > 0 && 
      ((item.qvdd || 0) / item.cuota_diaria) >= 1
    ).length;
    
    return { total, conCuota, conComentariosSup, conComentariosJefe, cumplimiento100 };
  }, [filteredFeedback]);

  // Cargar datos principal
  const loadFeedbackData = async (showLoading = true) => {
    if (loading && showLoading) return;
    
    if (showLoading) setLoading(true);
    setError(null);
    
    try {
      console.log('🔄 Cargando datos con filtros:', filters);
      
      // Siempre cargar con filtros actuales
      const feedbackResponse = await FeedbackService.getFeedbackList({
        dia_actualizacion: filters.dia_actualizacion,
        supervisor: filters.supervisor,
        limit: 1000
      });

      if (!isApiError(feedbackResponse)) {
        console.log('✅ Datos cargados:', {
          total: feedbackResponse.data?.length || 0,
          filters: feedbackResponse.filters
        });
        
        setFeedbackData(feedbackResponse.data || []);
        
        // Extraer supervisores únicos de los datos cargados
        const uniqueSupervisores = Array.from(
          new Set((feedbackResponse.data || []).map(item => item.supervisor))
        ).sort();
        setSupervisores(uniqueSupervisores);
        
      } else {
        console.error('❌ Error en respuesta:', feedbackResponse);
        setError(`Error cargando feedback: ${feedbackResponse.error}`);
        setFeedbackData([]);
        setSupervisores([]);
      }
      
    } catch (err: any) {
      console.error('❌ Error de conexión:', err);
      setError(`Error de conexión: ${err.message}`);
      setFeedbackData([]);
      setSupervisores([]);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  // Guardar cambios con mejor manejo
  const handleSaveFeedback = async (data: FeedbackUpdateData) => {
    if (!editingFeedback) return;
    
    setSavingFeedback(true);
    setError(null);
    
    try {
      console.log('💾 Guardando cambios:', {
        id: editingFeedback.id,
        supervisor: editingFeedback.supervisor,
        changes: data
      });
      
      const response = await FeedbackService.updateFeedbackById(editingFeedback.id, data);
      
      if (!isApiError(response)) {
        console.log('✅ Cambios guardados exitosamente');
        
        // Actualizar datos locales con la respuesta del servidor
        setFeedbackData(prev => prev.map(item => 
          item.id === editingFeedback.id 
            ? { ...item, ...response.data }  // Mezclar datos existentes con actualizados
            : item
        ));
        
        setEditingFeedback(null);
        setSuccess(
          `Feedback actualizado para ${editingFeedback.supervisor}. ` +
          `Cambios: ${FeedbackService.generateUpdateSummary(data)}`
        );
        
        // Limpiar mensaje de éxito después de 5 segundos
        setTimeout(() => setSuccess(null), 5000);
      } else {
        console.error('❌ Error guardando:', response);
        setError(`Error guardando: ${response.error}`);
      }
    } catch (err: any) {
      console.error('❌ Error de conexión al guardar:', err);
      setError(`Error de conexión: ${err.message}`);
    } finally {
      setSavingFeedback(false);
    }
  };

  // Manejo de cambios de filtros
  const handleFiltersChange = (newFilters: FeedbackFilters) => {
    console.log('🔄 Cambiando filtros:', { from: filters, to: newFilters });
    setFilters(newFilters);
  };

  // Efectos
  useEffect(() => {
    console.log('🚀 Carga inicial del componente');
    loadFeedbackData();
  }, []);

  // Recargar cuando cambie la fecha (con debounce)
  useEffect(() => {
    console.log('📅 Filtro de fecha cambió:', filters.dia_actualizacion);
    const timer = setTimeout(() => {
      loadFeedbackData();
    }, 500);
    
    return () => clearTimeout(timer);
  }, [filters.dia_actualizacion]);

  // El filtro de supervisor se aplica solo localmente (no requiere nueva consulta)
  useEffect(() => {
    console.log('👤 Filtro de supervisor cambió:', filters.supervisor);
  }, [filters.supervisor]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-slate-50 to-purple-50 p-3 sm:p-6">
      {/* Header mejorado para móviles */}
      <div className="mb-6 sm:mb-8">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start space-y-4 sm:space-y-0">
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-slate-800 to-purple-600 bg-clip-text text-transparent">
              Seguimiento de Feedback
            </h1>
            <p className="text-slate-600 mt-1 text-sm sm:text-base">
              Gestión de cuotas y comentarios de supervisores
            </p>
            {filters.dia_actualizacion && (
              <p className="text-sm text-slate-500 mt-1">
                Datos del: {FeedbackService.formatDate(filters.dia_actualizacion)}
              </p>
            )}
          </div>
          
          <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
            <div className="text-left sm:text-right">
              <div className="text-sm text-slate-600">
                Bienvenido, <span className="font-semibold">{user?.displayName || user?.username}</span>
              </div>
              <div className="text-xs text-slate-500">
                Última actualización: {new Date().toLocaleTimeString('es-ES')}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mensajes de estado mejorados para móviles */}
      {error && (
        <div className="bg-gradient-to-r from-red-50 to-red-100 border-l-4 border-red-500 p-4 sm:p-6 mb-4 sm:mb-6 rounded-xl shadow-lg">
          <div className="flex items-start">
            <div className="p-2 bg-red-100 rounded-full mr-3 sm:mr-4 flex-shrink-0">
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-base sm:text-lg font-semibold text-red-800 mb-2">Error en el Sistema</h3>
              <p className="text-red-700 text-sm sm:text-base break-words">{error}</p>
              <button 
                onClick={() => loadFeedbackData()}
                className="mt-3 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-semibold transition-colors w-full sm:w-auto"
              >
                Reintentar
              </button>
            </div>
            <button onClick={() => setError(null)} className="p-1 sm:p-2 text-red-400 hover:text-red-600 flex-shrink-0">
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>
        </div>
      )}

      {success && (
        <div className="bg-gradient-to-r from-green-50 to-green-100 border-l-4 border-green-500 p-4 sm:p-6 mb-4 sm:mb-6 rounded-xl shadow-lg">
          <div className="flex items-start">
            <div className="p-2 bg-green-100 rounded-full mr-3 sm:mr-4 flex-shrink-0">
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="5 13l4 4L19 7"></path>
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-base sm:text-lg font-semibold text-green-800 mb-2">¡Operación Exitosa!</h3>
              <p className="text-green-700 text-sm sm:text-base break-words">{success}</p>
            </div>
            <button onClick={() => setSuccess(null)} className="p-1 sm:p-2 text-green-400 hover:text-green-600 flex-shrink-0">
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Filtros */}
      <FiltrosPanel
        filters={filters}
        onFiltersChange={handleFiltersChange}
        supervisores={supervisores}
        loading={loading}
        onRefresh={() => loadFeedbackData()}
        totalRecords={filteredFeedback.length}
      />

      {/* Tabla de Feedback - completamente responsiva */}
      <div className="bg-white/90 backdrop-blur-sm rounded-xl sm:rounded-2xl border border-slate-200/50 shadow-xl overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-purple-50">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-3 sm:space-y-0">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-800 mb-1">Registros de Feedback</h2>
              <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 space-y-1 sm:space-y-0 text-xs sm:text-sm text-slate-600">
                <span>
                  {stats.total} registros
                  {filters.supervisor && (
                    <span className="block sm:inline"> (filtrado por: {filters.supervisor})</span>
                  )}
                </span>
                {stats.total > 0 && (
                  <div className="flex flex-wrap items-center gap-2 sm:gap-4">
                    <span className="hidden sm:inline w-1 h-1 bg-slate-400 rounded-full"></span>
                    <span>{stats.conCuota} con cuota</span>
                    <span className="hidden sm:inline w-1 h-1 bg-slate-400 rounded-full"></span>
                    <span>{stats.cumplimiento100} al 100%+</span>
                  </div>
                )}
              </div>
            </div>
            
            {stats.total > 0 && (
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2 text-xs sm:text-sm">
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 sm:w-3 sm:h-3 bg-green-500 rounded-full"></div>
                    <span className="text-slate-600">Con datos</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 sm:w-3 sm:h-3 bg-gray-300 rounded-full"></div>
                    <span className="text-slate-600">Pendiente</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        
        <div className="overflow-auto max-h-[70vh] sm:max-h-[600px]">
          {loading ? (
            <LoadingSpinner text="Cargando feedback..." />
          ) : filteredFeedback.length > 0 ? (
            <div className="overflow-x-auto">
              {/* Vista móvil - Cards */}
              <div className="block sm:hidden">
                <div className="p-2 space-y-3">
                  {filteredFeedback.map((item, index) => {
                    const cumplimiento = item.cuota_diaria && item.cuota_diaria > 0 
                      ? Math.round(((item.qvdd || 0) / item.cuota_diaria) * 100)
                      : 0;
                    
                    return (
                      <div 
                        key={`${item.id}-${index}`} 
                        className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm"
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-slate-900 truncate">{item.supervisor}</h3>
                            <p className="text-xs text-slate-500">ID: {item.id}</p>
                          </div>
                          <button
                            onClick={() => setEditingFeedback(item)}
                            disabled={loading || savingFeedback}
                            className="px-3 py-1 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-md text-xs font-semibold transition-all duration-200 disabled:opacity-50 flex-shrink-0"
                          >
                            Editar
                          </button>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="text-slate-600">Cuota:</span>
                            <span className={`px-2 py-1 rounded-full font-bold ${
                              item.cuota_diaria && item.cuota_diaria > 0 
                                ? 'bg-emerald-100 text-emerald-800' 
                                : 'bg-gray-100 text-gray-500'
                            }`}>
                              {item.cuota_diaria || 0}
                            </span>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <span className="text-slate-600">Cumpl:</span>
                            <span className={`px-2 py-1 rounded-full font-bold ${
                              cumplimiento >= 100 ? 'bg-green-100 text-green-800' :
                              cumplimiento >= 80 ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {cumplimiento}%
                            </span>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <span className="text-slate-600">C. Sup 0:</span>
                            {item.comentarios_supervisor && item.comentarios_supervisor.trim() ? (
                              <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full font-medium">Sí</span>
                            ) : (
                              <span className="px-2 py-1 bg-gray-100 text-gray-500 rounded-full">No</span>
                            )}
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <span className="text-slate-600">C. Sup 1:</span>
                            {item.comentarios_jefe && item.comentarios_jefe.trim() ? (
                              <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full font-medium">Sí</span>
                            ) : (
                              <span className="px-2 py-1 bg-gray-100 text-gray-500 rounded-full">No</span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Vista desktop - Tabla */}
              <div className="hidden sm:block">
                <table className="w-full text-sm">
                  <thead className="bg-gradient-to-r from-slate-100 to-slate-200 sticky top-0">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">Supervisor</th>
                      <th className="px-3 py-3 text-right text-xs font-bold text-slate-600 uppercase tracking-wider">Cuota</th>
                      <th className="px-3 py-3 text-center text-xs font-bold text-slate-600 uppercase tracking-wider">Cumpl.</th>
                      <th className="px-3 py-3 text-center text-xs font-bold text-slate-600 uppercase tracking-wider">C. Sup. 0</th>
                      <th className="px-3 py-3 text-center text-xs font-bold text-slate-600 uppercase tracking-wider">C. Sup. 1</th>
                      <th className="px-3 py-3 text-center text-xs font-bold text-slate-600 uppercase tracking-wider">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {filteredFeedback.map((item, index) => {
                      const cumplimiento = item.cuota_diaria && item.cuota_diaria > 0 
                        ? Math.round(((item.qvdd || 0) / item.cuota_diaria) * 100)
                        : 0;
                      
                      return (
                        <tr 
                          key={`${item.id}-${index}`} 
                          className="hover:bg-gradient-to-r hover:from-slate-50 hover:to-purple-50 transition-colors duration-200"
                        >
                          <td className="px-4 py-3">
                            <div className="font-bold text-slate-900">{item.supervisor}</div>
                            <div className="text-xs text-slate-500">ID: {item.id}</div>
                          </td>

                          <td className="px-3 py-3 text-right">
                            <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                              item.cuota_diaria && item.cuota_diaria > 0 
                                ? 'bg-emerald-100 text-emerald-800' 
                                : 'bg-gray-100 text-gray-500'
                            }`}>
                              {item.cuota_diaria || 0}
                            </span>
                          </td>

                          <td className="px-3 py-3 text-center">
                            <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                              cumplimiento >= 100 ? 'bg-green-100 text-green-800' :
                              cumplimiento >= 80 ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {cumplimiento}%
                            </span>
                          </td>
   
                          <td className="px-3 py-3 text-center">
                            {item.comentarios_supervisor && item.comentarios_supervisor.trim() ? (
                              <div className="flex items-center justify-center space-x-1" title={item.comentarios_supervisor}>
                                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                                <span className="text-xs text-green-700 font-medium">Sí</span>
                              </div>
                            ) : (
                              <div className="flex items-center justify-center space-x-1">
                                <span className="w-2 h-2 bg-gray-300 rounded-full"></span>
                                <span className="text-xs text-gray-500">No</span>
                              </div>
                            )}
                          </td>
                          <td className="px-3 py-3 text-center">
                            {item.comentarios_jefe && item.comentarios_jefe.trim() ? (
                              <div className="flex items-center justify-center space-x-1" title={item.comentarios_jefe}>
                                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                                <span className="text-xs text-green-700 font-medium">Sí</span>
                              </div>
                            ) : (
                              <div className="flex items-center justify-center space-x-1">
                                <span className="w-2 h-2 bg-gray-300 rounded-full"></span>
                                <span className="text-xs text-gray-500">No</span>
                              </div>
                            )}
                          </td>
                          <td className="px-3 py-3 text-center">
                            <button
                              onClick={() => setEditingFeedback(item)}
                              disabled={loading || savingFeedback}
                              className="px-3 py-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg text-xs font-semibold transition-all duration-200 hover:shadow-lg transform hover:scale-105 disabled:opacity-50 disabled:transform-none"
                            >
                              <div className="flex items-center space-x-1">
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                                </svg>
                                <span>Editar</span>
                              </div>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="p-8 sm:p-12 text-center">
              <div className="p-4 sm:p-6 bg-slate-100 rounded-full w-16 h-16 sm:w-24 sm:h-24 mx-auto mb-4 sm:mb-6 flex items-center justify-center">
                <svg className="w-8 h-8 sm:w-12 sm:h-12 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                </svg>
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-slate-600 mb-2">No hay registros disponibles</h3>
              <p className="text-slate-500 mb-4 sm:mb-6 text-sm sm:text-base">
                {filters.dia_actualizacion 
                  ? `No se encontraron registros para la fecha ${FeedbackService.formatDate(filters.dia_actualizacion)}`
                  : 'No se encontraron registros de feedback'
                }
                {filters.supervisor && (
                  <span className="block mt-1">
                    para el supervisor: <span className="font-medium">{filters.supervisor}</span>
                  </span>
                )}
              </p>
              
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row justify-center space-y-3 sm:space-y-0 sm:space-x-4">
                  <button
                    onClick={() => loadFeedbackData()}
                    disabled={loading}
                    className="px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg sm:rounded-xl font-semibold transition-all duration-200 hover:shadow-lg transform hover:scale-105 disabled:opacity-50 text-sm sm:text-base"
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
                        <span>Recargar</span>
                      </div>
                    )}
                  </button>
                  
                  {(filters.dia_actualizacion || filters.supervisor) && (
                    <button
                      onClick={() => setFilters({})}
                      className="px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-slate-500 to-slate-600 hover:from-slate-600 hover:to-slate-700 text-white rounded-lg sm:rounded-xl font-semibold transition-all duration-200 hover:shadow-lg transform hover:scale-105 text-sm sm:text-base"
                    >
                      <div className="flex items-center justify-center space-x-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                        <span>Limpiar Filtros</span>
                      </div>
                    </button>
                  )}
                </div>

                <div className="text-sm text-slate-400">
                  Intenta cambiar los filtros de fecha o supervisor para ver más datos
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer de la tabla con estadísticas mejoradas para móviles */}
        {stats.total > 0 && (
          <div className="p-4 sm:p-6 border-t border-slate-200 bg-gradient-to-r from-slate-50 to-purple-50">
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4 text-sm">
              <div className="text-center">
                <div className="p-2 sm:p-3 bg-white rounded-lg shadow-sm">
                  <p className="text-slate-600 font-medium mb-1 text-xs sm:text-sm">Total Registros</p>
                  <p className="text-lg sm:text-2xl font-bold text-slate-800">{stats.total}</p>
                </div>
              </div>
              
              <div className="text-center">
                <div className="p-2 sm:p-3 bg-white rounded-lg shadow-sm">
                  <p className="text-slate-600 font-medium mb-1 text-xs sm:text-sm">Con Cuota</p>
                  <p className="text-lg sm:text-2xl font-bold text-emerald-600">{stats.conCuota}</p>
                  <p className="text-xs text-slate-500">
                    {stats.total > 0 ? Math.round((stats.conCuota / stats.total) * 100) : 0}%
                  </p>
                </div>
              </div>
              
              <div className="text-center">
                <div className="p-2 sm:p-3 bg-white rounded-lg shadow-sm">
                  <p className="text-slate-600 font-medium mb-1 text-xs sm:text-sm">Com. Inicial</p>
                  <p className="text-lg sm:text-2xl font-bold text-purple-600">{stats.conComentariosSup}</p>
                  <p className="text-xs text-slate-500">
                    {stats.total > 0 ? Math.round((stats.conComentariosSup / stats.total) * 100) : 0}%
                  </p>
                </div>
              </div>
              
              <div className="text-center">
                <div className="p-2 sm:p-3 bg-white rounded-lg shadow-sm">
                  <p className="text-slate-600 font-medium mb-1 text-xs sm:text-sm">Retroalimentación</p>
                  <p className="text-lg sm:text-2xl font-bold text-orange-600">{stats.conComentariosJefe}</p>
                  <p className="text-xs text-slate-500">
                    {stats.total > 0 ? Math.round((stats.conComentariosJefe / stats.total) * 100) : 0}%
                  </p>
                </div>
              </div>

              <div className="text-center col-span-2 sm:col-span-4 lg:col-span-1">
                <div className="p-2 sm:p-3 bg-white rounded-lg shadow-sm">
                  <p className="text-slate-600 font-medium mb-1 text-xs sm:text-sm">100%+ Cumpl.</p>
                  <p className="text-lg sm:text-2xl font-bold text-green-600">{stats.cumplimiento100}</p>
                  <p className="text-xs text-slate-500">
                    {stats.total > 0 ? Math.round((stats.cumplimiento100 / stats.total) * 100) : 0}%
                  </p>
                </div>
              </div>
            </div>
            
            {/* Información adicional - responsiva */}
            <div className="mt-4 pt-4 border-t border-slate-200">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center text-xs text-slate-600 space-y-2 sm:space-y-0">
                <span>
                  Última actualización: {new Date().toLocaleTimeString('es-ES')}
                </span>
                <span className="text-center sm:text-right">
                  Datos filtrados: {filters.dia_actualizacion ? 'Por fecha' : 'Sin fecha'} 
                  {filters.supervisor && (
                    <span className="block sm:inline"> y supervisor ({filters.supervisor})</span>
                  )}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal de edición */}
      <EditarFeedbackModal
        feedback={editingFeedback}
        onClose={() => setEditingFeedback(null)}
        onSave={handleSaveFeedback}
        loading={savingFeedback}
      />
    </div>
  );
}