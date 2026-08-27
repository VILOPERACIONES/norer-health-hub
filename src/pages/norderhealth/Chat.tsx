import { useState, useRef, useEffect, useLayoutEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Camera, X, ArrowLeft, Send, Loader2,
  ChevronDown, Sparkles, Lock, RotateCcw, WifiOff,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import portalApi from '@/lib/portalApi';
import { usePortalAuthStore } from '@/store/portalAuth';
import { getTier, TIER_META, type Tier } from '@/lib/norderhealth/theme';
import { useChatSend, useChatHealth, classifyChatError, type ChatSendPayload } from '@/hooks/norderhealth/useChatSend';
import { usePortalMe } from '@/hooks/norderhealth/usePortalMe';

interface ChatMessage {
  id: string;
  content: string;
  sender: 'user' | 'eyder';
  timestamp: Date;
  error?: boolean;
  pending?: boolean;
  imagePreview?: string;
  retryPayload?: ChatSendPayload;
}

const CHIPS: Record<Tier, string[]> = {
  gratis: [
    '¿Cuánto arroz es 1 EQ cereal?',
    'Equivalencia del aguacate',
    '¿Cuánta leche entera es 1 EQ?',
    'Tortilla de maíz en equivalencias',
    '¿Cuántas nueces es 1 EQ grasa?',
  ],
  basico: [
    '¿Cuánto arroz es 1 EQ cereal?',
    'Equivalencia del aguacate',
    '¿Qué es el sistema NORDER?',
    'Analiza esta tabla nutricional',
    '¿Cuánta proteína tiene el pollo?',
  ],
  premium: [
    '¿Puedo adaptar mi desayuno?',
    '¿Esta comida cabe en mi plan?',
    'Analiza esta tabla nutricional',
    '¿Cuánto aguacate tengo asignado?',
    '¿Qué puedo cenar hoy?',
  ],
};

function welcomeMsg(tier: Tier, nombre: string, restantes?: number): string {
  const n = nombre ? nombre.split(' ')[0] : '';
  if (tier === 'gratis')
    return `Hola ${n}, soy tu **asistente nutricional** de NORDER.\n\nCon tu cuenta gratuita puedo ayudarte con:\n• Equivalencias SMAE y NORDER\n• Consultas nutricionales generales\n• Análisis de tablas nutricionales\n\n${restantes !== undefined ? `Tienes **${restantes} pregunta${restantes !== 1 ? 's' : ''}** disponible${restantes !== 1 ? 's' : ''} hoy.` : 'Tienes **5 preguntas** al día.'} ¿En qué te ayudo?`;
  if (tier === 'basico')
    return `Hola ${n}, soy tu **asistente nutricional** de NORDER.\n\nCon tu **Plan Básico** puedo ayudarte con equivalencias SMAE, consultas generales y análisis de tablas nutricionales.\n\n¿En qué te ayudo hoy?`;
  return `Hola ${n}, soy tu **asistente nutricional** de NORDER.\n\nCon tu **Plan Premium** tengo acceso a tu plan personalizado y puedo ayudarte con recomendaciones específicas para tu día. Si necesitas hablar directamente con tu nutriólogo, agenda tu consulta.\n\n¿Qué quieres consultar?`;
}

// ── Utilities ──────────────────────────────────────────────────────────────────

function formatTime(d: Date) {
  return d.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
}

async function compressImage(file: File, maxWidth = 1024, quality = 0.8): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const scale = Math.min(1, maxWidth / img.width);
      const canvas = document.createElement('canvas');
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;
      canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL('image/jpeg', quality).split(',')[1]);
    };
    img.onerror = reject;
    img.src = url;
  });
}

// ── Bubble ─────────────────────────────────────────────────────────────────────

function Bubble({ msg, tier, onRetry }: { msg: ChatMessage; tier: Tier; onRetry?: (payload: ChatSendPayload) => void }) {
  const isUser = msg.sender === 'user';
  const meta = TIER_META[tier];

  return (
    <div className={`flex items-end gap-2.5 mb-2 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      {!isUser && (
        <div
          className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center mb-0.5 shadow-sm"
          style={{ background: `linear-gradient(135deg, ${meta.accent}cc, ${meta.accentDim})` }}
        >
          <span className="text-[10px] font-bold text-white">N</span>
        </div>
      )}
      <div className={`max-w-[80%] flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
        {msg.imagePreview && (
          <img
            src={msg.imagePreview}
            alt="img"
            className={`mb-1.5 rounded-[14px] max-w-[200px] object-cover border border-white/5 ${isUser ? 'rounded-br-[4px]' : 'rounded-bl-[4px]'}`}
          />
        )}
        {(msg.pending || msg.content) && (
          <div className={`px-4 py-2.5 text-[13.5px] leading-relaxed break-words ${
            isUser
              ? `${meta.userBubble} text-white rounded-[18px] rounded-br-[4px]`
              : msg.error
                ? 'bg-[#1a0f0f] text-[#f87171] border border-[#3a1515] rounded-[18px] rounded-bl-[4px]'
                : `bg-[#161616] border border-[#252525] border-l-2 ${meta.eyderBorder} text-[#e2e2e2] rounded-[18px] rounded-bl-[4px]`
          }`}>
            {msg.pending ? (
              <span className="flex gap-1 items-center h-4">
                {[0, 120, 240].map(d => (
                  <span key={d} className="w-1.5 h-1.5 bg-[#555] rounded-full animate-bounce" style={{ animationDelay: `${d}ms` }} />
                ))}
              </span>
            ) : isUser ? (
              <span className="whitespace-pre-wrap">{msg.content}</span>
            ) : (
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  p: ({ children }) => <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>,
                  strong: ({ children }) => <strong className="font-semibold" style={{ color: TIER_META[tier].accent }}>{children}</strong>,
                  em: ({ children }) => <em className="italic text-[#aaa]">{children}</em>,
                  ul: ({ children }) => <ul className="list-disc pl-5 my-2 space-y-2">{children}</ul>,
                  ol: ({ children }) => <ol className="list-decimal pl-5 my-2 space-y-2">{children}</ol>,
                  li: ({ children }) => <li className="leading-relaxed">{children}</li>,
                  code: ({ children, className }) =>
                    className
                      ? <code className="block bg-[#0d0d0d] rounded-lg px-3 py-2 text-[11.5px] my-3 overflow-x-auto border border-[#2a2a2a]">{children}</code>
                      : <code className="bg-[#0d0d0d] rounded px-1.5 py-0.5 text-[11.5px] border border-[#2a2a2a]">{children}</code>,
                  h1: ({ children }) => <h1 className="text-[15px] font-bold mt-3 mb-2">{children}</h1>,
                  h2: ({ children }) => <h2 className="text-[14px] font-bold mt-3 mb-2">{children}</h2>,
                  h3: ({ children }) => <h3 className="text-[13.5px] font-semibold mt-2 mb-1.5">{children}</h3>,
                  hr: () => <hr className="border-[#2a2a2a] my-3" />,
                  blockquote: ({ children }) => (
                    <blockquote className="border-l-2 pl-3 italic text-[#999] my-2" style={{ borderColor: TIER_META[tier].accent }}>
                      {children}
                    </blockquote>
                  ),
                  table: ({ children }) => <table className="text-[12px] border-collapse my-3 w-full">{children}</table>,
                  th: ({ children }) => <th className="border border-[#2a2a2a] px-2 py-1.5 text-left bg-[#1a1a1a] font-semibold">{children}</th>,
                  td: ({ children }) => <td className="border border-[#2a2a2a] px-2 py-1.5">{children}</td>,
                }}
              >
                {msg.content}
              </ReactMarkdown>
            )}
          </div>
        )}
        {msg.error && msg.retryPayload && onRetry && (
          <button
            onClick={() => onRetry(msg.retryPayload!)}
            className="flex items-center gap-1.5 mt-1.5 px-2.5 py-1 rounded-full bg-[#1a0f0f] border border-[#3a1515] text-[#f87171] text-[11px] font-semibold active:scale-95 transition-transform"
          >
            <RotateCcw size={11} strokeWidth={2.5} />
            Reintentar
          </button>
        )}
        <span className="text-[10px] mt-1 px-1 text-[#3a3a3a]">{formatTime(msg.timestamp)}</span>
      </div>
    </div>
  );
}

// ── Main ───────────────────────────────────────────────────────────────────────

export default function NorderHealthChat() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { paciente: authPaciente } = usePortalAuthStore();
  const [sessionMessages, setSessionMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [pendingImage, setPendingImage] = useState<{ base64: string; preview: string } | null>(null);
  const [chipsOpen, setChipsOpen] = useState(false);
  const [isAtBottom, setIsAtBottom] = useState(true);
  // Optimistic counter for gratis tier (updates without waiting for /me refetch)
  const [localRestantes, setLocalRestantes] = useState<number | null>(null);
  const [consecutiveFailures, setConsecutiveFailures] = useState(0);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const topSentinelRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const prevScrollHeightRef = useRef(0);
  const initialScrollDoneRef = useRef(false);

  const { data: me, isLoading: loadingMe } = usePortalMe();

  const chatMutation = useChatSend();
  const chatHealth = useChatHealth(consecutiveFailures >= 1);
  const degraded = consecutiveFailures >= 2 || chatHealth.data?.healthy === false;

  const {
    data: historialPages,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: loadingHistorial,
  } = useInfiniteQuery({
    queryKey: ['portal', 'mensajes'],
    queryFn: ({ pageParam }: { pageParam: string | undefined }) =>
      portalApi.get('/api/portal/mensajes', { params: pageParam ? { cursor: pageParam } : {} }).then(r => r.data),
    getNextPageParam: (firstPage: any) => firstPage.nextCursor ?? undefined,
    initialPageParam: undefined as string | undefined,
    staleTime: Infinity,
  });

  const nivelRaw: string = me?.nivelMembresia || 'ninguna';
  const tier = getTier(nivelRaw);
  const meta = TIER_META[tier];
  const nombre = me?.nombre || authPaciente?.nombre || '';
  const preguntasHoy: number = me?.preguntasHoy ?? 0;
  // Use localRestantes for optimistic updates; fall back to server value
  const preguntasRestantes: number = localRestantes ?? me?.preguntasRestantes ?? 5;
  const limiteGratis: number = me?.limiteGratis ?? 5;
  const sinPreguntas = tier === 'gratis' && preguntasRestantes <= 0;

  // Sync localRestantes from /me on first load
  useEffect(() => {
    if (me?.preguntasRestantes != null && localRestantes === null) {
      setLocalRestantes(me.preguntasRestantes);
    }
  }, [me?.preguntasRestantes]);

  const historicalMessages: ChatMessage[] = historialPages
    ? [...historialPages.pages].reverse().flatMap((page: any) =>
        page.mensajes.map((m: any) => ({
          id: m.id,
          content: m.contenido,
          sender: m.rol as 'user' | 'eyder',
          timestamp: new Date(m.createdAt),
        }))
      )
    : [];

  const hasHistory = historicalMessages.length > 0;

  const displayMessages: ChatMessage[] = [
    ...historicalMessages,
    ...sessionMessages,
  ];

  // Scroll tracking
  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const check = () => {
      const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
      setIsAtBottom(atBottom);
    };
    el.addEventListener('scroll', check, { passive: true });
    return () => el.removeEventListener('scroll', check);
  }, []);

  // Initial scroll to bottom
  useEffect(() => {
    if (!loadingHistorial && !initialScrollDoneRef.current) {
      initialScrollDoneRef.current = true;
      bottomRef.current?.scrollIntoView({ behavior: 'instant' });
    }
  }, [loadingHistorial]);

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    if (sessionMessages.length > 0) scrollToBottom();
  }, [sessionMessages, scrollToBottom]);

  useLayoutEffect(() => {
    if (isFetchingNextPage || !scrollContainerRef.current) return;
    if (prevScrollHeightRef.current > 0) {
      const el = scrollContainerRef.current;
      el.scrollTop = el.scrollHeight - prevScrollHeightRef.current;
      prevScrollHeightRef.current = 0;
    }
  }, [historialPages?.pages.length, isFetchingNextPage]);

  useEffect(() => {
    const sentinel = topSentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage && initialScrollDoneRef.current) {
        if (scrollContainerRef.current) prevScrollHeightRef.current = scrollContainerRef.current.scrollHeight;
        fetchNextPage();
      }
    }, { threshold: 0.1 });
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  useEffect(() => {
    const handle = () => scrollToBottom();
    window.visualViewport?.addEventListener('resize', handle);
    return () => window.visualViewport?.removeEventListener('resize', handle);
  }, [scrollToBottom]);

  const growTextarea = (el: HTMLTextAreaElement) => {
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 100) + 'px';
  };

  const sending = chatMutation.isPending;

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const base64 = await compressImage(file);
      setPendingImage({ base64, preview: `data:image/jpeg;base64,${base64}` });
    } catch {
      toast.error('No se pudo procesar la imagen, intenta con otra.');
    }
    e.target.value = '';
  };

  const sendPayload = (payload: ChatSendPayload) => {
    chatMutation.mutate(payload, {
      onSuccess: (data) => {
        setConsecutiveFailures(0);
        setSessionMessages(prev => prev.filter(m => m.id !== 'pending').concat({
          id: crypto.randomUUID(), content: data.respuesta, sender: 'eyder', timestamp: new Date(),
        }));
        if (data.preguntasRestantes != null) {
          setLocalRestantes(data.preguntasRestantes);
          queryClient.invalidateQueries({ queryKey: ['portal', 'me'] });
        }
      },
      onError: (err) => {
        const { message, terminal, restantesOverride } = classifyChatError(err);
        setConsecutiveFailures(n => n + 1);
        if (restantesOverride != null) setLocalRestantes(restantesOverride);
        if (!terminal) toast.error(message);
        setSessionMessages(prev => prev.filter(m => m.id !== 'pending').concat({
          id: crypto.randomUUID(),
          content: message,
          sender: 'eyder',
          timestamp: new Date(),
          error: true,
          retryPayload: terminal ? undefined : payload,
        }));
      },
      onSettled: () => {
        setTimeout(() => textareaRef.current?.focus(), 100);
      },
    });
  };

  const sendMessage = (overrideText?: string) => {
    const text = (overrideText ?? input).trim();
    if ((!text && !pendingImage) || sending) return;

    setChipsOpen(false);

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      content: text,
      sender: 'user',
      timestamp: new Date(),
      imagePreview: pendingImage?.preview,
    };
    setSessionMessages(prev => [...prev, userMsg, { id: 'pending', content: '', sender: 'eyder', timestamp: new Date(), pending: true }]);
    setInput('');
    setPendingImage(null);
    if (textareaRef.current) textareaRef.current.style.height = 'auto';

    const payload: ChatSendPayload = {};
    if (text) payload.mensaje = text;
    if (userMsg.imagePreview) payload.imagen_base64 = userMsg.imagePreview.split(',')[1];
    sendPayload(payload);
  };

  const retryMessage = (payload: ChatSendPayload) => {
    setSessionMessages(prev => [...prev, { id: 'pending', content: '', sender: 'eyder', timestamp: new Date(), pending: true }]);
    sendPayload(payload);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  return (
    <div className="flex flex-col h-full bg-[#0a0a0a] select-none overflow-hidden">

      {/* ── Header ── */}
      <div className={`flex-shrink-0 bg-[#0d0d0d] border-b ${meta.headerBorder} px-4 pt-6 pb-3`}>
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/norder-health')}
            className="w-8 h-8 flex items-center justify-center text-[#444] hover:text-[#888] transition-colors flex-shrink-0"
          >
            <ArrowLeft size={18} strokeWidth={2.5} />
          </button>

          {/* Avatar */}
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg"
            style={{ background: `linear-gradient(135deg, ${meta.accent}cc, ${meta.accentDim})` }}
          >
            <span className="text-[13px] font-bold text-white">N</span>
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-[15px] font-semibold text-white leading-none">Asistente NORDER</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="w-[5px] h-[5px] rounded-full flex-shrink-0" style={{ background: meta.accent }} />
              <p className="text-[11px] text-[#484848] leading-none">Asistente virtual · IA</p>
            </div>
          </div>

          {/* Tier badge */}
          {loadingMe ? (
            <div className="w-16 h-[22px] rounded-full bg-[#161616] animate-pulse flex-shrink-0" />
          ) : (
            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full border text-[9.5px] font-bold uppercase tracking-widest flex-shrink-0 ${meta.badge}`}>
              <meta.Icon size={8} strokeWidth={2.5} />
              {meta.label}
            </span>
          )}
        </div>
      </div>

      {/* ── Degraded service banner ── */}
      {degraded && (
        <div className="flex-shrink-0 px-4 py-2.5 bg-[#1a0f0f] border-b border-[#3a1515] flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <WifiOff size={13} className="text-[#f87171] flex-shrink-0" strokeWidth={2} />
            <span className="text-[11px] text-[#f87171] truncate">Servicio temporalmente no disponible</span>
          </div>
          <button
            onClick={() => { setConsecutiveFailures(0); chatHealth.refetch(); }}
            className="flex-shrink-0 text-[11px] font-semibold text-[#f87171] underline underline-offset-2"
          >
            Reintentar
          </button>
        </div>
      )}

      {/* ── Gratis daily limit banner ── */}
      {tier === 'gratis' && (
        <div className="flex-shrink-0 px-4 py-2.5 bg-[#0f0900] border-b border-[#2a1500]">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] text-[#888]">
              {preguntasRestantes > 0
                ? `${preguntasHoy}/${limiteGratis} preguntas usadas hoy · quedan ${preguntasRestantes}`
                : '⚠️ Límite diario alcanzado · se renueva mañana'}
            </span>
            <button className="text-[11px] font-semibold" style={{ color: TIER_META.gratis.accent }}>
              Actualizar →
            </button>
          </div>
          <div className="h-1 bg-[#2a1200] rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, (preguntasHoy / limiteGratis) * 100)}%`, background: TIER_META.gratis.accent }}
            />
          </div>
        </div>
      )}

      {/* ── Basico feature strip ── */}
      {tier === 'basico' && (
        <div className="flex-shrink-0 px-4 py-2 bg-[#060d18] border-b border-[#0a1628] flex items-center gap-3 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
          {['Equivalencias SMAE', 'Consultas generales', 'Tablas nutricionales'].map(f => (
            <span key={f} className="flex-shrink-0 flex items-center gap-1 text-[10.5px] text-[#4a7abf]">
              <span className="text-[#60a5fa]">✓</span> {f}
            </span>
          ))}
          <span className="flex-shrink-0 flex items-center gap-1 text-[10.5px] text-[#444]">
            <span>✗</span> Plan personal
          </span>
        </div>
      )}

      {/* ── Messages ── */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto px-4 py-4"
        style={{ overscrollBehavior: 'contain' }}
      >
        <div ref={topSentinelRef} className="h-1" />

        {isFetchingNextPage && (
          <div className="flex justify-center py-3">
            <Loader2 size={14} className="animate-spin text-[#333]" />
          </div>
        )}

        {loadingHistorial ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 size={20} className="animate-spin" style={{ color: meta.accent }} />
          </div>
        ) : (
          <>
            {/* Welcome message when no history */}
            {!hasHistory && sessionMessages.length === 0 && (
              <div className="mb-4">
                <Bubble
                  tier={tier}
                  msg={{
                    id: 'welcome',
                    content: welcomeMsg(tier, nombre, tier === 'gratis' ? preguntasRestantes : undefined),
                    sender: 'eyder',
                    timestamp: new Date(),
                  }}
                />
              </div>
            )}
            {displayMessages.map(msg => <Bubble key={msg.id} msg={msg} tier={tier} onRetry={retryMessage} />)}
          </>
        )}

        <div ref={bottomRef} className="h-2" />
      </div>

      {/* ── Scroll to bottom FAB ── */}
      {!isAtBottom && (
        <div className="absolute bottom-[96px] right-4 z-10">
          <button
            onClick={scrollToBottom}
            className="w-9 h-9 rounded-full bg-[#1a1a1a] border border-[#2a2a2a] flex items-center justify-center shadow-lg hover:bg-[#222] transition-colors"
          >
            <ChevronDown size={16} className="text-[#888]" />
          </button>
        </div>
      )}

      {/* ── Quick action chips ── */}
      {chipsOpen && (
        <div className="flex-shrink-0 px-3 pb-2 animate-in slide-in-from-bottom-2 duration-150">
          <div
            className="flex gap-2 overflow-x-auto pb-0.5"
            style={{ scrollbarWidth: 'none' }}
          >
            {CHIPS[tier].map(chip => (
              <button
                key={chip}
                onClick={() => { sendMessage(chip); setChipsOpen(false); }}
                className="flex-shrink-0 px-3 py-2 rounded-full bg-[#141414] border border-[#2a2a2a] text-[12px] text-[#888] whitespace-nowrap active:scale-95 transition-all hover:text-[#bbb]"
                style={{ borderColor: chipsOpen ? `${meta.accent}25` : undefined }}
              >
                {chip}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Image preview ── */}
      {pendingImage && (
        <div className="flex-shrink-0 px-4 pb-2 flex items-end gap-2">
          <div className="relative">
            <img
              src={pendingImage.preview}
              alt="preview"
              className="h-20 w-20 object-cover rounded-[12px] border border-[#2a2a2a]"
            />
            <button
              onClick={() => setPendingImage(null)}
              className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-[#1a1a1a] border border-[#333] flex items-center justify-center"
            >
              <X size={10} className="text-[#aaa]" strokeWidth={3} />
            </button>
          </div>
          <p className="text-[10px] text-[#444] pb-1">Tabla nutricional lista</p>
        </div>
      )}

      {/* ── Input bar ── */}
      <div className="flex-shrink-0 bg-[#0d0d0d] px-3 pb-8 pt-2.5 border-t border-[#1a1a1a]">
        {sinPreguntas ? (
          <div className="flex flex-col items-center gap-2 py-2">
            <div className="flex items-center gap-2 text-[#f87171]">
              <Lock size={14} strokeWidth={2} />
              <span className="text-[13px] font-semibold">Límite diario alcanzado</span>
            </div>
            <p className="text-[11px] text-[#444] text-center">Regresa mañana o activa un plan sin límite</p>
          </div>
        ) : (
          <div className="flex items-end gap-2">

            {/* Camera */}
            <button
              onClick={() => imageInputRef.current?.click()}
              disabled={sending}
              className="flex-shrink-0 w-10 h-10 rounded-full bg-[#161616] border border-[#252525] flex items-center justify-center text-[#555] hover:text-[#777] transition-colors disabled:opacity-30"
            >
              <Camera size={16} strokeWidth={2} />
            </button>
            <input ref={imageInputRef} type="file" accept="image/*" capture="environment" onChange={handleImageSelect} className="hidden" />

            {/* Chips toggle */}
            <button
              onClick={() => setChipsOpen(v => !v)}
              disabled={sending}
              className="flex-shrink-0 w-10 h-10 rounded-full bg-[#161616] border flex items-center justify-center transition-all disabled:opacity-30"
              style={{
                borderColor: chipsOpen ? `${meta.accent}50` : '#252525',
                color: chipsOpen ? meta.accent : '#555',
              }}
            >
              <Sparkles size={14} strokeWidth={2} />
            </button>

            {/* Text input */}
            <div className="flex-1 bg-[#161616] border border-[#252525] rounded-[22px] px-4 py-2.5 focus-within:border-[#333] transition-colors">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={e => { setInput(e.target.value); growTextarea(e.target); }}
                onKeyDown={handleKeyDown}
                placeholder={pendingImage ? 'Agrega un comentario (opcional)...' : 'Escribe un mensaje...'}
                rows={1}
                disabled={sending}
                className="w-full bg-transparent text-[14px] text-[#e0e0e0] placeholder:text-[#333] focus:outline-none resize-none leading-relaxed disabled:opacity-50"
                style={{ minHeight: '22px', maxHeight: '100px' }}
              />
            </div>

            {/* Send */}
            <button
              onClick={() => sendMessage()}
              disabled={(!input.trim() && !pendingImage) || sending}
              className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-all active:scale-95 disabled:opacity-25 disabled:cursor-not-allowed"
              style={{ background: meta.accent }}
            >
              <Send size={15} strokeWidth={2.5} className="text-white ml-0.5" />
            </button>
          </div>
        )}
      </div>

    </div>
  );
}
