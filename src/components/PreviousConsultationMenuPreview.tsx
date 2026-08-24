import { useEffect, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import { createPortal } from 'react-dom';
import { ExternalLink, FileText, GripHorizontal, Minus, X } from 'lucide-react';
import api from '@/lib/api';
import { NutritionLoader } from '@/components/ui/NutritionLoader';

interface PreviousConsultationMenuPreviewProps {
  isOpen: boolean;
  planId?: string | null;
  consultationDate?: string | null;
  onClose: () => void;
}

const MENU_ONLY_PDF_META = {
  showPageHistorial: false,
  showPageMenus: true,
  showPageIntercambio: false,
  showPageExtras: false,
  showContacto: false,
  showAlimentosEvitar: false,
  showDistribucionPorciones: false,
  soloEquivalencias: false,
};

const formatConsultationDate = (value?: string | null) => {
  if (!value) return 'consulta anterior';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'consulta anterior';
  return new Intl.DateTimeFormat('es-MX', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date);
};

export function PreviousConsultationMenuPreview({
  isOpen,
  planId,
  consultationDate,
  onClose,
}: PreviousConsultationMenuPreviewProps) {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [minimized, setMinimized] = useState(false);
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);
  const panelRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setMinimized(false);
      setPosition(null);
    }
  }, [isOpen]);

  const handleDragStart = (event: ReactPointerEvent<HTMLDivElement>) => {
    if ((event.target as HTMLElement).closest('button, a')) return;
    const panel = panelRef.current;
    if (!panel) return;

    const rect = panel.getBoundingClientRect();
    const offsetX = event.clientX - rect.left;
    const offsetY = event.clientY - rect.top;

    const handleMove = (moveEvent: PointerEvent) => {
      const maxX = Math.max(8, window.innerWidth - rect.width - 8);
      const maxY = Math.max(68, window.innerHeight - (minimized ? 64 : 120));
      setPosition({
        x: Math.min(Math.max(8, moveEvent.clientX - offsetX), maxX),
        y: Math.min(Math.max(68, moveEvent.clientY - offsetY), maxY),
      });
    };

    const handleEnd = () => {
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleEnd);
      window.removeEventListener('pointercancel', handleEnd);
    };

    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', handleEnd);
    window.addEventListener('pointercancel', handleEnd);
  };

  useEffect(() => {
    if (!isOpen || !planId) return;

    let active = true;
    let objectUrl: string | null = null;

    const loadMenus = async () => {
      setLoading(true);
      setError(null);
      setPdfUrl(null);

      try {
        const response = await api.post(
          `/api/planes/${planId}/pdf/preview`,
          MENU_ONLY_PDF_META,
          { responseType: 'blob' },
        );
        objectUrl = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
        if (active) setPdfUrl(objectUrl);
      } catch {
        if (active) setError('No fue posible cargar los menús de la consulta anterior.');
      } finally {
        if (active) setLoading(false);
      }
    };

    void loadMenus();

    return () => {
      active = false;
      if (objectUrl) window.URL.revokeObjectURL(objectUrl);
    };
  }, [isOpen, planId]);

  if (!isOpen || typeof document === 'undefined') return null;

  return createPortal(
    <section
      ref={panelRef}
      className={`fixed right-3 top-[76px] z-[900] flex w-[calc(100vw-24px)] flex-col overflow-hidden rounded-[14px] border border-[#90c2ff]/40 bg-[#0d0d0d] shadow-[0_24px_80px_rgba(0,0,0,0.75)] sm:right-5 sm:top-[88px] sm:w-[48vw] sm:min-w-[420px] sm:max-w-[760px] ${minimized ? 'h-auto resize-none' : 'h-[58vh] min-h-[430px] max-h-[720px] resize'}`}
      aria-label="Vista flotante de los menús de la consulta anterior"
      style={position ? { left: position.x, top: position.y, right: 'auto' } : undefined}
    >
      <div
        className="flex touch-none cursor-move select-none items-start justify-between gap-4 border-b border-[#2a2a2a] bg-[#151515] px-4 py-3"
        onPointerDown={handleDragStart}
        title="Arrastra esta barra para mover la ventana"
      >
        <div className="flex min-w-0 items-start gap-2.5">
          <div className="mt-0.5 rounded-[7px] bg-[#90c2ff]/10 p-1.5 text-[#90c2ff]">
            <FileText className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <h4 className="m-0 text-[13px] font-bold uppercase tracking-wider text-white">
              Menús de la consulta anterior
            </h4>
            <p className="mb-0 mt-1 text-[11px] text-[#8a8a8a]">
              Referencia enviada el {formatConsultationDate(consultationDate)}. Arrastra esta barra para moverla.
            </p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <GripHorizontal className="hidden h-4 w-4 text-[#666] sm:block" aria-hidden="true" />
          <button
            type="button"
            onClick={() => setMinimized((value) => !value)}
            className="rounded-full border border-[#333] bg-[#202020] p-2 text-[#999] transition-colors hover:border-[#555] hover:text-white"
            aria-label={minimized ? 'Restaurar menús de la consulta anterior' : 'Minimizar menús de la consulta anterior'}
            title={minimized ? 'Restaurar' : 'Minimizar'}
          >
            <Minus className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-[#333] bg-[#202020] p-2 text-[#999] transition-colors hover:border-[#555] hover:text-white"
            aria-label="Cerrar menús de la consulta anterior"
            title="Cerrar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {!minimized && <div className="relative min-h-0 flex-1 bg-[#202020]">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#111]">
            <NutritionLoader />
          </div>
        )}
        {error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 px-6 text-center">
            <FileText className="h-8 w-8 text-[#555]" />
            <p className="m-0 text-[12px] text-[#aaa]">{error}</p>
          </div>
        )}
        {pdfUrl && !loading && (
          <>
            <iframe
              src={`${pdfUrl}#toolbar=0&navpanes=0&view=FitH`}
              title="Menús de la consulta anterior"
              className="h-full w-full border-0 bg-white"
            />
            <a
              href={pdfUrl}
              target="_blank"
              rel="noreferrer"
              className="absolute bottom-3 right-3 flex items-center gap-1.5 rounded-[7px] border border-white/20 bg-black/75 px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-white backdrop-blur transition-colors hover:bg-black"
            >
              <ExternalLink className="h-3.5 w-3.5" /> Abrir grande
            </a>
          </>
        )}
      </div>}
    </section>,
    document.body,
  );
}
