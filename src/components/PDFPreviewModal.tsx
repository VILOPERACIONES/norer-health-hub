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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-[#0f0f0f] border border-[#333] rounded-[16px] w-full max-w-6xl h-[90vh] flex overflow-hidden shadow-2xl">
        
        {/* SIDEBAR CONFIGURACIÓN */}
        <div className="w-[320px] bg-[#141414] border-r border-[#222] flex flex-col h-full">
          <div className="p-5 border-b border-[#222] flex items-center justify-between">
            <div>
              <h2 className="text-[16px] font-bold text-white flex items-center gap-2">
                <Settings2 className="w-5 h-5 text-[#90c2ff]" />
                Personalizar PDF
              </h2>
              <p className="text-[12px] text-text-muted mt-1 leading-tight">Configura las hojas y estética que el paciente recibirá.</p>
            </div>
            <button onClick={onClose} className="p-2 bg-[#222] hover:bg-[#333] rounded-full text-text-muted transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-5 space-y-6 custom-scrollbar">
            
            {/* HOJAS */}
            <div className="space-y-3">
              <h3 className="text-[11px] font-bold text-[#8a8a8a] uppercase tracking-widest">Hojas Visibles</h3>
              
              <div className="space-y-2">
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
                  label="&nbsp;&nbsp;&nbsp;↳ Ocultar Platillos (Solo Equivalencias)" 
                  active={meta.soloEquivalencias === true} 
                  onChange={() => handleToggle('soloEquivalencias')} 
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

            {/* NOTAS DESTACADAS */}
            <div className="space-y-3">
              <h3 className="text-[11px] font-bold text-[#8a8a8a] uppercase tracking-widest">Notas Destacadas (Amarillo)</h3>
              
              <div>
                <label className="text-[12px] text-text-secondary mb-1.5 block">Nota Importante (Ej. Tendinitis)</label>
                <input 
                  type="text" 
                  value={meta.notaAmarilla || ''}
                  onChange={(e) => handleTextChange('notaAmarilla', e.target.value)}
                  className="w-full bg-[#0a0a0a] border border-[#333] rounded-[8px] px-3 py-2 text-[13px] text-white focus:border-[#90c2ff] focus:outline-none transition-colors"
                  placeholder="Ej. tendinitis en muñeca..."
                />
              </div>

              <div>
                <label className="text-[12px] text-text-secondary mb-1.5 block">Texto de Precio / Paquete</label>
                <input 
                  type="text" 
                  value={meta.precioEspecial || ''}
                  onChange={(e) => handleTextChange('precioEspecial', e.target.value)}
                  className="w-full bg-[#0a0a0a] border border-[#333] rounded-[8px] px-3 py-2 text-[13px] text-white focus:border-[#90c2ff] focus:outline-none transition-colors"
                  placeholder="Ej. PRECIO ESPECIAL 2026 = $600"
                />
              </div>
            </div>

          </div>

          <div className="p-4 border-t border-[#222]">
            <button 
              onClick={handleSave}
              disabled={loading}
              className="w-full bg-[#90c2ff] hover:bg-[#a6cdff] text-black font-semibold rounded-[8px] py-2.5 px-4 text-[13px] transition-colors flex items-center justify-center gap-2"
            >
              {loading ? <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" /> : <Check className="w-4 h-4" />}
              Guardar Configuración
            </button>
          </div>
        </div>

        {/* PREVIEW SIMULADO -> AHORA REAL */}
        <div className="flex-1 bg-[#222] p-4 flex flex-col items-center justify-center relative">
          {loadingPdf && (
            <div className="absolute inset-0 z-10 bg-black/50 backdrop-blur-sm flex flex-col items-center justify-center text-white">
              <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin mb-4" />
              <p className="font-medium animate-pulse">Renderizando PDF Oficial...</p>
            </div>
          )}

          {pdfUrl ? (
            <iframe 
              src={`${pdfUrl}#toolbar=0&navpanes=0`} 
              className="w-full h-full rounded shadow-2xl border border-[#444] bg-white"
              title="PDF Preview"
            />
          ) : pdfError ? (
            <div className="flex flex-col items-center gap-3 text-center max-w-md px-6">
              <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center">
                <span className="text-red-400 text-lg">⚠</span>
              </div>
              <p className="text-red-400 font-semibold text-[13px]">Error al generar la vista previa</p>
              <p className="text-[#666] text-[11px] font-mono break-all">{pdfError}</p>
              <button 
                onClick={() => fetchPdf(meta)}
                className="mt-2 px-4 py-2 bg-[#333] hover:bg-[#444] text-white text-[12px] rounded-[6px] transition-colors"
              >
                Reintentar
              </button>
            </div>
          ) : (
            <div className="text-[#666] text-[13px]">Cargando vista previa...</div>
          )}
        </div>

      </div>
    </div>
  );
}

function ToggleItem({ label, active, onChange }: { label: string, active: boolean, onChange: () => void }) {
  return (
    <button 
      onClick={onChange}
      className={`w-full flex items-center justify-between p-3 rounded-[8px] border transition-colors ${
        active 
          ? 'bg-[#1a1a1a] border-[#333] hover:border-[#444]' 
          : 'bg-[#111] border-[#222] opacity-60 hover:opacity-100'
      }`}
    >
      <span className={`text-[13px] font-medium transition-colors ${active ? 'text-[#e0e0e0]' : 'text-[#666] line-through'}`}>
        {label}
      </span>
      <div className={`w-8 h-4 rounded-full p-0.5 transition-colors ${active ? 'bg-[#90c2ff]' : 'bg-[#333]'}`}>
        <div className={`w-3 h-3 rounded-full bg-white transition-transform ${active ? 'translate-x-4' : 'translate-x-0'}`} />
      </div>
    </button>
  );
}
