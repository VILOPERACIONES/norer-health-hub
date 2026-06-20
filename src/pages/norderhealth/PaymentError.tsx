import { useNavigate } from 'react-router-dom';
import { XCircle, RefreshCw, ArrowLeft, CreditCard, ShieldAlert, HeadphonesIcon } from 'lucide-react';

export default function PaymentError() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center min-h-[100dvh] bg-[#0a0a0a] px-6 py-12 select-none">

      {/* Logo NORDER con X */}
      <div className="relative mb-8">
        <div className="w-24 h-24 rounded-[26px] bg-[#0d0d0d] border border-[#1a1a1a] flex items-center justify-center shadow-2xl">
          <svg viewBox="0 0 512 512" className="w-16 h-16" style={{ opacity: 0.4 }}>
            <circle cx="256" cy="220" r="130" fill="#333" />
            <text x="256" y="272" fontFamily="system-ui,sans-serif" fontSize="140" fontWeight="800" fill="white" textAnchor="middle">N</text>
          </svg>
        </div>
        <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-[#f87171] flex items-center justify-center shadow-lg shadow-[#f87171]/20">
          <XCircle size={18} className="text-white" strokeWidth={2.5} />
        </div>
      </div>

      {/* Headline */}
      <p className="text-[11px] text-[#444] font-bold uppercase tracking-widest mb-2">Pago no completado</p>
      <h1 className="text-[26px] font-black text-white text-center leading-tight tracking-tight mb-3">
        No se procesó<br />el pago
      </h1>
      <p className="text-[13px] text-[#555] text-center leading-relaxed mb-8 max-w-xs">
        No se realizó ningún cargo. Puedes intentarlo de nuevo o contactar soporte si el problema persiste.
      </p>

      {/* Possible reasons */}
      <div className="w-full max-w-sm bg-[#0f0f0f] border border-[#1a1a1a] rounded-[20px] px-5 py-5 mb-8">
        <p className="text-[10px] text-[#3a3a3a] uppercase tracking-widest font-bold mb-4">Posibles causas</p>
        <div className="flex flex-col gap-3.5">
          {[
            { Icon: CreditCard, text: 'Fondos insuficientes o tarjeta inválida' },
            { Icon: ShieldAlert, text: 'Pago rechazado por tu banco' },
            { Icon: ArrowLeft, text: 'Cancelaste el proceso de pago' },
          ].map(({ Icon, text }) => (
            <div key={text} className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-[9px] bg-[#1a1010] flex items-center justify-center flex-shrink-0">
                <Icon size={14} className="text-[#f87171]" strokeWidth={2} />
              </div>
              <p className="text-[13px] text-[#666] leading-snug">{text}</p>
            </div>
          ))}
        </div>
      </div>

      {/* CTAs */}
      <div className="w-full max-w-sm flex flex-col gap-3">
        <button
          onClick={() => navigate('/norder-health', { replace: true })}
          className="w-full py-4 rounded-[16px] font-bold text-[15px] bg-white text-black transition-all active:scale-[0.98] flex items-center justify-center gap-2.5"
        >
          <RefreshCw size={16} strokeWidth={2.5} />
          Intentar de nuevo
        </button>
        <button
          onClick={() => navigate('/norder-health', { replace: true })}
          className="w-full py-3.5 rounded-[16px] text-[14px] font-semibold text-[#444] bg-transparent border border-[#1e1e1e] transition-all active:scale-[0.98] flex items-center justify-center gap-2.5 hover:border-[#2a2a2a] hover:text-[#666]"
        >
          <ArrowLeft size={15} strokeWidth={2} />
          Volver al portal
        </button>
      </div>

      <div className="mt-8 flex items-center gap-1.5 text-[11px] text-[#2a2a2a]">
        <HeadphonesIcon size={11} strokeWidth={2} />
        <span>¿Problemas? Contacta a tu nutriólogo</span>
      </div>
    </div>
  );
}
