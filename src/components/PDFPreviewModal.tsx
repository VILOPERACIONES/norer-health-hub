import { useState, useEffect } from 'react';
import { X, FileText, Check, Settings2 } from 'lucide-react';
import api from '@/lib/api';

interface PDFPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  planId?: string;
  planCustomMeta: any;
  onSaveMeta: (meta: any) => void;
  loading?: boolean;
}

export function PDFPreviewModal({ isOpen, onClose, planId, planCustomMeta, onSaveMeta, loading }: PDFPreviewModalProps) {
  const [meta, setMeta] = useState<any>({
    showPageHistorial: true,
    showPageMenus: true,
    showPageIntercambio: true,
    showPageExtras: true,
    notaAmarilla: '',
    precioEspecial: '',
    ...planCustomMeta
  });
  
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [loadingPdf, setLoadingPdf] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);

  // Debounce ref
  const debounceRef = useState<NodeJS.Timeout | null>(null)[0];

  const fetchPdf = async (metaOptions?: any) => {
    if (!planId) return;
    setLoadingPdf(true);
    setPdfError(null);
    try {
      const res = await api.post(`/api/planes/${planId}/pdf/preview`, metaOptions || meta, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      setPdfUrl(url);
    } catch (e: any) {
      console.error('PDF Preview error:', e);
      // Intentar leer el body del error como texto
      let msg = 'Error generando PDF';
      if (e?.response?.data) {
        try {
          const text = await new Response(e.response.data).text();
          msg = text.slice(0, 200);
        } catch {}
      }
      setPdfError(msg);
    } finally {
      setLoadingPdf(false);
    }
  };

  useEffect(() => {
    if (isOpen && planId) {
      // Fetch initial state
      fetchPdf(meta);
    }
  }, [isOpen, planId]);

  // Handle Debounced Refresh when Meta changes
  useEffect(() => {
    if (isOpen && planId) {
      const handler = setTimeout(() => {
        fetchPdf(meta);
      }, 1000);
      return () => clearTimeout(handler);
    }
  }, [meta]);

  if (!isOpen) return null;

  const handleToggle = (key: string) => {
    setMeta({ ...meta, [key]: !meta[key] });
  };

  const handleTextChange = (key: string, value: string) => {
    setMeta({ ...meta, [key]: value });
  };

  const handleSave = async () => {
    await onSaveMeta(meta);
    // Note: The UI preview handles real-time through the debounced effect.
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-fade-in">
      <div className="bg-[#111111] border border-[#2a2a2a] rounded-[24px] w-full max-w-7xl h-[92vh] flex overflow-hidden shadow-[0_0_80px_rgba(0,0,0,0.8)]">
        
        {/* SIDEBAR CONFIGURACIÓN */}
        <div className="w-[360px] bg-[#161616] border-r border-[#2a2a2a] flex flex-col h-full relative z-10">
          <div className="p-6 border-b border-[#2a2a2a] flex items-center justify-between bg-gradient-to-b from-[#1a1a1a] to-transparent">
            <div>
              <h2 className="text-[18px] font-bold text-white flex items-center gap-2.5">
                <div className="p-1.5 bg-[#90c2ff]/10 rounded-lg">
                  <Settings2 className="w-[18px] h-[18px] text-[#90c2ff]" />
                </div>
                Configurar Reporte
              </h2>
              <p className="text-[13px] text-[#8a8a8a] mt-1.5 pl-1">Personaliza el diseño final del paciente.</p>
            </div>
            <button onClick={onClose} className="p-2 bg-[#222] hover:bg-[#333] rounded-full text-text-muted hover:text-white transition-all">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
            
            {/* HOJAS */}
            <div className="space-y-4">
              <h3 className="text-[12px] font-bold text-[#666] uppercase tracking-[0.2em] ml-1">Selección de Hojas</h3>
              
              <div className="space-y-2.5">
                <ToggleItem 
                  label="1. Historial y Antropometría" 
                  active={meta.showPageHistorial !== false} 
                  onChange={() => handleToggle('showPageHistorial')} 
                />
                <ToggleItem 
                  label="2. Menús de Ejemplo" 
                  active={meta.showPageMenus !== false} 
                  onChange={() => handleToggle('showPageMenus')} 
                />
                <ToggleItem 
                  label="Solo equivalencias (Ocultar platillos)" 
                  active={meta.soloEquivalencias === true} 
                  onChange={() => handleToggle('soloEquivalencias')} 
                  isSubItem
                />
                <ToggleItem 
                  label="3. Lista de Intercambio (SMAE)" 
                  active={meta.showPageIntercambio !== false} 
                  onChange={() => handleToggle('showPageIntercambio')} 
                />
                <ToggleItem 
                  label="4. Extras y Recomendaciones" 
                  active={meta.showPageExtras !== false} 
                  onChange={() => handleToggle('showPageExtras')} 
                />
              </div>
            </div>

            <div className="h-px w-full bg-gradient-to-r from-transparent via-[#333] to-transparent opacity-50" />

            {/* NOTAS DESTACADAS */}
            <div className="space-y-4">
              <h3 className="text-[12px] font-bold text-[#666] uppercase tracking-[0.2em] ml-1">Notas Destacadas</h3>
              
              <div className="space-y-5">
                <div className="group">
                  <label className="text-[13px] font-medium text-[#c0c0c0] mb-2 block group-focus-within:text-[#90c2ff] transition-colors">Nota de advertencia (Amarilla)</label>
                  <input 
                    type="text" 
                    value={meta.notaAmarilla || ''}
                    onChange={(e) => handleTextChange('notaAmarilla', e.target.value)}
                    className="w-full bg-[#0a0a0a] border border-[#333] rounded-[10px] px-4 py-3 text-[14px] text-white focus:border-[#90c2ff] focus:ring-1 focus:ring-[#90c2ff]/30 focus:outline-none transition-all"
                    placeholder="Ej. Precaución con lesión de rodilla..."
                  />
                </div>

                <div className="group">
                  <label className="text-[13px] font-medium text-[#c0c0c0] mb-2 block group-focus-within:text-[white] transition-colors">Texto de Precio / Mensaje Final</label>
                  <input 
                    type="text" 
                    value={meta.precioEspecial || ''}
                    onChange={(e) => handleTextChange('precioEspecial', e.target.value)}
                    className="w-full bg-[#0a0a0a] border border-[#333] rounded-[10px] px-4 py-3 text-[14px] text-white focus:border-white focus:ring-1 focus:ring-white/30 focus:outline-none transition-all"
                    placeholder="Ej. PRECIO PROMOCIÓN = $600"
                  />
                </div>
              </div>
            </div>

          </div>

          <div className="p-6 bg-[#161616] border-t border-[#2a2a2a]">
            <button 
              onClick={handleSave}
              disabled={loading}
              className="w-full bg-gradient-to-r from-[#90c2ff] to-[#60a5fa] hover:from-[#a6cdff] hover:to-[#90c2ff] text-black font-semibold rounded-[12px] py-3.5 px-4 text-[14px] transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-[0_0_20px_rgba(144,194,255,0.2)] flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
              ) : (
                <Check className="w-5 h-5" />
              )}
              {loading ? 'Guardando ajustes...' : 'Aceptar y Cerrar'}
            </button>
          </div>
        </div>

        {/* PREVIEW SIMULADO -> AHORA REAL */}
        <div className="flex-1 bg-[#0a0a0a] p-8 flex flex-col items-center justify-center relative overflow-hidden">
          {/* Fondo decorativo */}
          <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-[#90c2ff]/5 blur-[120px] rounded-full pointer-events-none" />
          
          {loadingPdf && (
            <div className="absolute inset-0 z-20 bg-[#0a0a0a]/80 backdrop-blur-sm flex flex-col items-center justify-center text-white p-6 text-center">
              <div className="relative w-12 h-12 mb-6">
                <div className="absolute inset-0 border-4 border-[#333] rounded-full" />
                <div className="absolute inset-0 border-4 border-[#90c2ff] border-t-transparent rounded-full animate-spin" />
              </div>
              <p className="text-[16px] font-medium text-white mb-2">Componiendo PDF</p>
              <p className="text-[13px] text-[#8a8a8a]">Aplicando tu configuración en tiempo real...</p>
            </div>
          )}

          <div className="w-full h-full relative z-10 flex flex-col items-center justify-center">
            {pdfUrl ? (
              <iframe 
                src={`${pdfUrl}#toolbar=0&navpanes=0`} 
                className="w-full h-full max-w-[900px] rounded-[8px] shadow-[0_20px_60px_rgba(0,0,0,0.5)] border border-[#222] bg-white transition-opacity duration-300"
                style={{ opacity: loadingPdf ? 0.4 : 1 }}
                title="PDF Preview"
              />
            ) : pdfError ? (
              <div className="flex flex-col items-center gap-4 text-center max-w-sm px-6 p-8 bg-[#181818] border border-[#2a2a2a] rounded-[16px]">
                <div className="w-14 h-14 rounded-full bg-red-500/10 flex items-center justify-center mb-2">
                  <span className="text-red-400 text-2xl">⚠</span>
                </div>
                <p className="text-white font-semibold text-[16px]">Error de previsualización</p>
                <p className="text-[#8a8a8a] text-[13px] font-mono break-all line-clamp-3">{pdfError}</p>
                <button 
                  onClick={() => fetchPdf(meta)}
                  className="mt-4 px-6 py-2.5 bg-[#2a2a2a] hover:bg-[#333] text-white text-[13px] font-medium rounded-[8px] transition-colors"
                >
                  Intentar nuevamente
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-4 text-[#666]">
                <FileText className="w-10 h-10 opacity-20" />
                <p className="text-[14px] font-medium">Preparando documento...</p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

function ToggleItem({ label, active, onChange, isSubItem = false }: { label: string, active: boolean, onChange: () => void, isSubItem?: boolean }) {
  return (
    <div className={`relative ${isSubItem ? 'mt-1 mb-3' : ''}`}>
      {isSubItem && (
        <div className="absolute left-[20px] top-[-10px] w-px h-[24px] bg-[#333]" />
      )}
      <button 
        onClick={onChange}
        className={`w-full flex items-center justify-between p-3.5 rounded-[12px] border transition-all duration-200 group ${
          isSubItem ? 'ml-[20px] w-[calc(100%-20px)] bg-[#111] border-transparent hover:bg-[#1a1a1a]' : 
          active 
            ? 'bg-[#1a1a1a] border-[#333] shadow-sm hover:border-[#444]' 
            : 'bg-[#111111] border-[#222] hover:bg-[#161616] hover:border-[#333]'
        }`}
      >
        <span className={`text-[13px] font-medium transition-colors flex items-center ${isSubItem ? 'text-[12px]' : ''} ${active ? 'text-[#e0e0e0]' : 'text-[#666] line-through'}`}>
          {isSubItem && <div className="w-3 h-px bg-[#333] mr-2" />}
          {label}
        </span>
        
        {/* iOS-Style Toggle */}
        <div className={`relative w-11 h-6 rounded-full transition-colors duration-300 ease-in-out ${active ? 'bg-[#90c2ff]' : 'bg-[#333]'}`}>
          <div className={`absolute top-[2px] left-[2px] w-[20px] h-[20px] bg-white rounded-full shadow-sm transition-transform duration-300 ease-in-out ${active ? 'translate-x-[20px]' : 'translate-x-0'}`} />
        </div>
      </button>
    </div>
  );
}
