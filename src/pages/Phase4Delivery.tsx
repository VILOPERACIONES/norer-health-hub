import React, { useState, useEffect } from 'react';
import { FileText, Send, Check, Download } from 'lucide-react';
import api from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

interface Phase4DeliveryProps {
  pacienteId: string;
  planId: string;
  onFinish: () => void;
}

export function Phase4Delivery({ pacienteId, planId, onFinish }: Phase4DeliveryProps) {
  const { toast } = useToast();
  const [meta, setMeta] = useState<any>({
    showPageHistorial: true,
    showPageMenus: true,
    showPageIntercambio: true,
    showPageExtras: true,
    notaAmarilla: '',
    precioEspecial: '',
    soloEquivalencias: false,
  });

  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [loadingPdf, setLoadingPdf] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadingInitial, setLoadingInitial] = useState(true);

  useEffect(() => {
    const loadMeta = async () => {
      try {
        const res = await api.get(`/api/planes/${planId}`);
        if (res.data?.pdfCustomMeta) {
          setMeta({ ...meta, ...res.data.pdfCustomMeta });
        }
      } catch (e) {
        console.error("Error loading plan meta", e);
      } finally {
        setLoadingInitial(false);
      }
    };
    loadMeta();
  }, [planId]);

  const fetchPdf = async (metaOptions?: any) => {
    setLoadingPdf(true);
    setPdfError(null);
    try {
      const res = await api.post(`/api/planes/${planId}/pdf/preview`, metaOptions || meta, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      setPdfUrl(url);
    } catch (e: any) {
      setPdfError("Error al generar la vista previa");
    } finally {
      setLoadingPdf(false);
    }
  };

  useEffect(() => {
    if (!loadingInitial) {
      const handler = setTimeout(() => {
        fetchPdf(meta);
      }, 800);
      return () => clearTimeout(handler);
    }
  }, [meta, loadingInitial]);

  const handleToggle = (key: string) => {
    setMeta({ ...meta, [key]: !meta[key] });
  };
  const handleTextChange = (key: string, value: string) => {
    setMeta({ ...meta, [key]: value });
  };

  const handleSaveMeta = async () => {
    setSaving(true);
    try {
      await api.put(`/api/planes/${planId}/pdf-meta`, { pdfCustomMeta: meta });
    } catch (e) {
      toast({ title: 'Error al asegurar la configuración', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleDownload = async () => {
    await handleSaveMeta();
    try {
      const res = await api.get(`/api/planes/${planId}/pdf`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.download = `Plan_Alimenticio_${planId}.pdf`;
      link.click();
    } catch (err) {
      toast({ title: 'Error al descargar', variant: 'destructive' });
    }
  };

  const handleSend = async () => {
    await handleSaveMeta();
    setSending(true);
    try {
      await api.post(`/api/planes/${planId}/send`);
      toast({ title: '¡Plan Enviado!', description: 'El PDF fue enviado por WhatsApp correctamente.' });
      onFinish();
    } catch (err: any) {
      toast({ title: 'Error al enviar', variant: 'destructive', description: err.response?.data?.message || 'Revisa tu configuración' });
      setSending(false);
    }
  };

  if (loadingInitial) return <div className="p-8 text-center text-[#8a8a8a]">Cargando configuración...</div>;

  return (
    <div className="flex flex-col lg:flex-row w-full h-[700px] gap-6 animate-slide-up">
      {/* Columna Izquierda: Controles */}
      <div className="w-full lg:w-[380px] shrink-0 flex flex-col gap-6">
        <div>
          <h2 className="text-[20px] font-bold text-white tracking-tight leading-none mb-1">Configurar y Enviar Resultantes</h2>
          <p className="text-[13px] text-[#8a8a8a] m-0">Ajusta lo que quieres enviarle al paciente en tiempo real y finaliza.</p>
        </div>

        <div className="flex-1 space-y-6 overflow-y-auto custom-scrollbar pr-2">
          <div className="space-y-4">
            <h3 className="text-[12px] font-bold text-[#666] uppercase tracking-[0.2em] ml-1">Selección de Hojas</h3>
            <div className="space-y-2.5">
              <ToggleItem label="1. Historial y Antropometría" active={meta.showPageHistorial !== false} onChange={() => handleToggle('showPageHistorial')} />
              <ToggleItem label="2. Menús de Ejemplo" active={meta.showPageMenus !== false} onChange={() => handleToggle('showPageMenus')} />
              <ToggleItem label="Solo equivalencias (Sin platillos)" active={meta.soloEquivalencias === true} onChange={() => handleToggle('soloEquivalencias')} isSubItem />
              <ToggleItem label="3. Lista de Intercambio (SMAE)" active={meta.showPageIntercambio !== false} onChange={() => handleToggle('showPageIntercambio')} />
              <ToggleItem label="4. Extras y Recomendaciones" active={meta.showPageExtras !== false} onChange={() => handleToggle('showPageExtras')} />
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-[12px] font-bold text-[#666] uppercase tracking-[0.2em] ml-1">Notas Destacadas</h3>
            <div className="group">
              <label className="text-[13px] font-medium text-[#c0c0c0] mb-2 block group-focus-within:text-[#90c2ff] transition-colors">Nota de advertencia (Amarilla)</label>
              <input type="text" value={meta.notaAmarilla || ''} onChange={(e) => handleTextChange('notaAmarilla', e.target.value)} className="w-full bg-[#111] border border-[#333] rounded-[10px] px-4 py-3 text-[14px] text-white focus:border-[#90c2ff] focus:ring-1 focus:ring-[#90c2ff]/30 focus:outline-none transition-all" placeholder="Ej. Precaución con rodilla..." />
            </div>
            <div className="group mt-4">
              <label className="text-[13px] font-medium text-[#c0c0c0] mb-2 block group-focus-within:text-[white] transition-colors">Mensaje Final / Precio Promo</label>
              <input type="text" value={meta.precioEspecial || ''} onChange={(e) => handleTextChange('precioEspecial', e.target.value)} className="w-full bg-[#111] border border-[#333] rounded-[10px] px-4 py-3 text-[14px] text-white focus:border-white focus:ring-1 focus:ring-white/30 focus:outline-none transition-all" placeholder="Ej. PRECIO PROMOCION = $600" />
            </div>
          </div>
        </div>

        <div className="space-y-3 pt-4 border-t border-[#1a1a1a]">
          <button onClick={handleDownload} disabled={saving} className="w-full bg-[#111] border border-[#333] hover:bg-[#1a1a1a] text-white font-semibold rounded-[12px] py-3.5 px-4 text-[14px] transition-all flex items-center justify-center gap-2">
            <Download className="w-5 h-5" /> Descargar Oficial PDF
          </button>
          
          <div className="flex gap-3">
             <button onClick={onFinish} className="flex-1 bg-[#1a1a1a] border border-[#333] hover:bg-[#222] text-[#8a8a8a] hover:text-white font-semibold rounded-[12px] py-3.5 px-4 text-[14px] transition-all flex items-center justify-center text-center leading-tight">
               Omitir y<br/>Finalizar Consulta
             </button>
             <button onClick={handleSend} disabled={sending || saving} className="flex-[1.5] bg-gradient-to-r from-[#90c2ff] to-[#60a5fa] hover:from-[#a6cdff] hover:to-[#90c2ff] text-black font-semibold rounded-[12px] py-3.5 px-4 text-[14px] transition-all shadow-[0_0_20px_rgba(144,194,255,0.2)] flex items-center justify-center gap-2">
               {sending ? <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" /> : <Send className="w-5 h-5" />}
               Enviar y Finalizar
             </button>
          </div>
        </div>

      </div>

      {/* Columna Derecha: Preview PDF en Vivo */}
      <div className="flex-1 bg-[#0a0a0a] rounded-[24px] overflow-hidden border border-[#2a2a2a] relative shadow-[inset_0_4px_40px_rgba(0,0,0,0.5)] flex flex-col items-center justify-center min-h-[500px]">
          {loadingPdf && (
            <div className="absolute inset-0 z-20 bg-[#0a0a0a]/80 backdrop-blur-sm flex flex-col items-center justify-center text-white p-6 text-center">
              <div className="relative w-12 h-12 mb-6">
                <div className="absolute inset-0 border-4 border-[#333] rounded-full" />
                <div className="absolute inset-0 border-4 border-[#90c2ff] border-t-transparent rounded-full animate-spin" />
              </div>
              <p className="text-[16px] font-medium text-white mb-2">Componiendo PDF</p>
            </div>
          )}

          {pdfUrl ? (
            <iframe 
              src={`${pdfUrl}#toolbar=0&navpanes=0`} 
              className="w-full h-full bg-white transition-opacity duration-300"
              style={{ opacity: loadingPdf ? 0.4 : 1 }}
              title="PDF Preview"
            />
          ) : pdfError ? (
            <div className="text-center">
              <p className="text-red-400 font-semibold mb-2">⚠ Error en Preview</p>
              <button onClick={() => fetchPdf(meta)} className="text-[13px] bg-[#222] px-4 py-2 rounded-md">Reintentar</button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4 text-[#666]">
              <FileText className="w-10 h-10 opacity-20" />
              <p className="text-[14px] font-medium">Preparando documento...</p>
            </div>
          )}
      </div>
    </div>
  );
}

function ToggleItem({ label, active, onChange, isSubItem = false }: { label: string, active: boolean, onChange: () => void, isSubItem?: boolean }) {
  return (
    <div className={`relative ${isSubItem ? 'mt-1 mb-3' : ''}`}>
      {isSubItem && <div className="absolute left-[20px] top-[-10px] w-px h-[24px] bg-[#333]" />}
      <button 
        onClick={onChange}
        className={`w-full flex items-center justify-between p-3.5 rounded-[12px] border transition-all duration-200 group ${
          isSubItem ? 'ml-[20px] w-[calc(100%-20px)] bg-[#111] border-transparent hover:bg-[#1a1a1a]' : 
          active ? 'bg-[#1a1a1a] border-[#333] shadow-sm' : 'bg-[#0f0f0f] border-[#222] hover:bg-[#161616] hover:border-[#333]'
        }`}
      >
        <span className={`text-[13px] font-medium transition-colors flex items-center ${isSubItem ? 'text-[12px]' : ''} ${active ? 'text-[#e0e0e0]' : 'text-[#666] line-through'}`}>
          {isSubItem && <div className="w-3 h-px bg-[#333] mr-2" />}
          {label}
        </span>
        <div className={`relative w-11 h-6 rounded-full transition-colors duration-300 ease-in-out ${active ? 'bg-[#90c2ff]' : 'bg-[#333]'}`}>
          <div className={`absolute top-[2px] left-[2px] w-[20px] h-[20px] bg-white rounded-full transition-transform duration-300 ${active ? 'translate-x-[20px]' : 'translate-x-0'}`} />
        </div>
      </button>
    </div>
  );
}
