import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Camera, X, ArrowLeft, Send, Loader2 } from 'lucide-react';
import portalApi from '@/lib/portalApi';
import { usePortalAuthStore } from '@/store/portalAuth';

interface ChatMessage {
  id: string;
  content: string;
  sender: 'user' | 'eyder';
  timestamp: Date;
  error?: boolean;
  pending?: boolean;
  imagePreview?: string;
}

const WELCOME: ChatMessage = {
  id: 'welcome',
  content: '¡Hola! Soy Eyder, tu nutriólogo digital 👋\n\n¿En qué te puedo ayudar?\n\n1️⃣  Equivalencias de un alimento\n2️⃣  Ideas para adaptar un platillo\n3️⃣  Dudas sobre tu plan\n\nPuedes escribirme o enviar la foto de una tabla nutricional 📷',
  sender: 'eyder',
  timestamp: new Date(),
};

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
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      const base64 = canvas.toDataURL('image/jpeg', quality);
      resolve(base64.split(',')[1]); // solo el base64, sin el prefijo
    };
    img.onerror = reject;
    img.src = url;
  });
}

function Bubble({ msg }: { msg: ChatMessage }) {
  const isUser = msg.sender === 'user';
  return (
    <div className={`flex items-end gap-2 mb-1 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      {!isUser && (
        <div className="flex-shrink-0 w-7 h-7 rounded-full bg-gradient-to-br from-[#22c55e] to-[#16a34a] flex items-center justify-center mb-1">
          <span className="text-[10px] font-bold text-white">E</span>
        </div>
      )}
      <div className={`max-w-[78%] flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
        {msg.imagePreview && (
          <img
            src={msg.imagePreview}
            alt="Imagen enviada"
            className={`mb-1 rounded-[14px] max-w-[220px] object-cover ${isUser ? 'rounded-br-[4px]' : 'rounded-bl-[4px]'}`}
          />
        )}
        {(msg.pending || msg.content) && (
          <div className={`px-4 py-2.5 text-[13.5px] leading-relaxed whitespace-pre-wrap break-words ${
            isUser
              ? 'bg-[#22c55e] text-white rounded-[18px] rounded-br-[4px]'
              : msg.error
              ? 'bg-[#1a0f0f] text-[#f87171] border border-[#3a1515] rounded-[18px] rounded-bl-[4px]'
              : 'bg-[#1a1a1a] text-[#e8e8e8] rounded-[18px] rounded-bl-[4px]'
          }`}>
            {msg.pending ? (
              <span className="flex gap-1 items-center h-4">
                <span className="w-1.5 h-1.5 bg-[#555] rounded-full animate-bounce [animation-delay:0ms]" />
                <span className="w-1.5 h-1.5 bg-[#555] rounded-full animate-bounce [animation-delay:120ms]" />
                <span className="w-1.5 h-1.5 bg-[#555] rounded-full animate-bounce [animation-delay:240ms]" />
              </span>
            ) : msg.content}
          </div>
        )}
        <span className={`text-[10px] mt-1 px-1 ${isUser ? 'text-[#3a3a3a]' : 'text-[#444]'}`}>
          {formatTime(msg.timestamp)}
        </span>
      </div>
    </div>
  );
}

export default function NorderHealthChat() {
  const navigate = useNavigate();
  const { paciente } = usePortalAuthStore();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [historialCargado, setHistorialCargado] = useState(false);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [pendingImage, setPendingImage] = useState<{ base64: string; preview: string } | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const { data: me } = useQuery({
    queryKey: ['portal', 'me'],
    queryFn: () => portalApi.get('/api/portal/me').then(r => r.data),
    staleTime: 5 * 60 * 1000,
  });

  const { data: historialData, isLoading: loadingHistorial } = useQuery({
    queryKey: ['portal', 'mensajes'],
    queryFn: () => portalApi.get('/api/portal/mensajes').then(r => r.data),
    staleTime: Infinity,
  });

  useEffect(() => {
    if (historialCargado) return;
    if (loadingHistorial) return;
    const remotos: ChatMessage[] = (historialData?.mensajes ?? []).map((m: any) => ({
      id: m.id,
      content: m.contenido,
      sender: m.rol as 'user' | 'eyder',
      timestamp: new Date(m.createdAt),
      imagePreview: m.tieneImagen ? undefined : undefined,
    }));
    setMessages(remotos.length > 0 ? remotos : [WELCOME]);
    setHistorialCargado(true);
  }, [historialData, loadingHistorial, historialCargado]);

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => { scrollToBottom(); }, [messages, scrollToBottom]);

  useEffect(() => {
    const handleResize = () => scrollToBottom();
    window.visualViewport?.addEventListener('resize', handleResize);
    return () => window.visualViewport?.removeEventListener('resize', handleResize);
  }, [scrollToBottom]);

  const growTextarea = (el: HTMLTextAreaElement) => {
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 100) + 'px';
  };

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const base64 = await compressImage(file);
      const preview = `data:image/jpeg;base64,${base64}`;
      setPendingImage({ base64, preview });
    } catch {
      // silently ignore compression errors
    }
    e.target.value = '';
  };

  const sendMessage = async () => {
    const text = input.trim();
    if ((!text && !pendingImage) || sending) return;

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      content: text,
      sender: 'user',
      timestamp: new Date(),
      imagePreview: pendingImage?.preview,
    };
    const pendingMsg: ChatMessage = {
      id: 'pending',
      content: '',
      sender: 'eyder',
      timestamp: new Date(),
      pending: true,
    };

    setMessages(prev => [...prev, userMsg, pendingMsg]);
    setInput('');
    setPendingImage(null);
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
    setSending(true);

    try {
      const body: Record<string, string> = {};
      if (text) body.mensaje = text;
      if (userMsg.imagePreview) body.imagen_base64 = pendingImage?.base64 ?? '';

      // re-attach base64 from the captured ref before clearing
      const imageToSend = userMsg.imagePreview
        ? userMsg.imagePreview.split(',')[1]
        : undefined;

      const finalBody: Record<string, string> = {};
      if (text) finalBody.mensaje = text;
      if (imageToSend) finalBody.imagen_base64 = imageToSend;

      const res = await portalApi.post('/api/portal/chat', finalBody);
      setMessages(prev => prev
        .filter(m => m.id !== 'pending')
        .concat({
          id: crypto.randomUUID(),
          content: res.data.respuesta,
          sender: 'eyder',
          timestamp: new Date(),
        })
      );
    } catch (err: any) {
      const errMsg = err.response?.status === 429
        ? 'Demasiados mensajes. Espera un momento.'
        : err.response?.data?.error || 'No pude conectarme. Intenta de nuevo.';
      setMessages(prev => prev
        .filter(m => m.id !== 'pending')
        .concat({
          id: crypto.randomUUID(),
          content: errMsg,
          sender: 'eyder',
          timestamp: new Date(),
          error: true,
        })
      );
    } finally {
      setSending(false);
      setTimeout(() => textareaRef.current?.focus(), 100);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const nombre = me?.nombre || paciente?.nombre || '';

  return (
    <div className="flex flex-col h-[100dvh] bg-[#0d0d0d] select-none">

      {/* Header */}
      <div className="flex-shrink-0 bg-[#0d0d0d] border-b border-[#1c1c1c] px-4 pt-12 pb-3 flex items-center gap-3">
        <button
          onClick={() => navigate('/norder-health')}
          className="w-8 h-8 flex items-center justify-center text-[#555] hover:text-[#888] transition-colors flex-shrink-0"
        >
          <ArrowLeft size={18} strokeWidth={2.5} />
        </button>
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#22c55e] to-[#16a34a] flex items-center justify-center flex-shrink-0">
          <span className="text-[13px] font-bold text-white">E</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[15px] font-semibold text-white leading-none">Eyder</p>
          <p className="text-[11px] text-[#22c55e] mt-0.5 leading-none">Nutriólogo Digital · En línea</p>
        </div>
        {nombre && (
          <div className="w-8 h-8 rounded-full bg-[#1a1a1a] border border-[#2a2a2a] flex items-center justify-center flex-shrink-0">
            <span className="text-[12px] font-semibold text-[#888]">{nombre.charAt(0).toUpperCase()}</span>
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4" style={{ overscrollBehavior: 'contain' }}>
        {!historialCargado ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 size={20} className="text-[#333] animate-spin" />
          </div>
        ) : (
          messages.map(msg => <Bubble key={msg.id} msg={msg} />)
        )}
        <div ref={bottomRef} className="h-2" />
      </div>

      {/* Image preview chip */}
      {pendingImage && (
        <div className="flex-shrink-0 px-4 pb-2">
          <div className="relative inline-block">
            <img
              src={pendingImage.preview}
              alt="Previsualización"
              className="h-20 w-20 object-cover rounded-[12px] border border-[#2a2a2a]"
            />
            <button
              onClick={() => setPendingImage(null)}
              className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-[#1a1a1a] border border-[#333] flex items-center justify-center"
            >
              <X size={10} className="text-[#888]" strokeWidth={3} />
            </button>
          </div>
          <p className="text-[10px] text-[#444] mt-1.5">Tabla nutricional lista para enviar</p>
        </div>
      )}

      {/* Input */}
      <div className="flex-shrink-0 bg-[#0d0d0d] px-3 pb-8 pt-3 border-t border-[#1c1c1c]">
        <div className="flex items-end gap-2">

          {/* Camera button */}
          <button
            onClick={() => imageInputRef.current?.click()}
            disabled={sending}
            className="flex-shrink-0 w-10 h-10 rounded-full bg-[#1a1a1a] border border-[#2a2a2a] flex items-center justify-center text-[#555] hover:text-[#888] hover:border-[#333] transition-colors disabled:opacity-30"
          >
            <Camera size={16} strokeWidth={2} />
          </button>
          <input
            ref={imageInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleImageSelect}
            className="hidden"
          />

          {/* Text input */}
          <div className="flex-1 bg-[#1a1a1a] border border-[#2a2a2a] rounded-[22px] px-4 py-2.5 focus-within:border-[#333] transition-colors">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={e => { setInput(e.target.value); growTextarea(e.target); }}
              onKeyDown={handleKeyDown}
              placeholder={pendingImage ? 'Agrega un comentario (opcional)...' : 'Escribe un mensaje...'}
              rows={1}
              disabled={sending}
              className="w-full bg-transparent text-[14px] text-[#e8e8e8] placeholder:text-[#3a3a3a] focus:outline-none resize-none leading-relaxed disabled:opacity-50"
              style={{ minHeight: '22px', maxHeight: '100px' }}
            />
          </div>

          {/* Send button */}
          <button
            onClick={sendMessage}
            disabled={(!input.trim() && !pendingImage) || sending}
            className="flex-shrink-0 w-10 h-10 rounded-full bg-[#22c55e] flex items-center justify-center transition-all active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[#16a34a]"
          >
            <Send size={15} strokeWidth={2.5} className="text-white ml-0.5" />
          </button>
        </div>
      </div>

    </div>
  );
}
