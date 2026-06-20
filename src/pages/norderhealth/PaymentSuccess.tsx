import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Crown, Zap, Activity, CheckCircle2, MessageCircle, BarChart3, Infinity, ClipboardList } from 'lucide-react';

type Tier = 'premium' | 'basica' | 'gratis';

const TIER_CONFIG = {
  premium: {
    label: 'Plan Premium',
    accent: '#22c55e',
    accentBg: '#0f2e1a',
    accentBorder: '#22c55e25',
    Icon: Crown,
    features: [
      { Icon: MessageCircle, text: 'Chat ilimitado con Eyder' },
      { Icon: ClipboardList, text: 'Respuestas basadas en tu plan personalizado' },
      { Icon: BarChart3, text: 'Análisis completo de composición corporal' },
      { Icon: Infinity, text: 'Sin límite de preguntas diarias' },
    ],
  },
  basica: {
    label: 'Plan Básico',
    accent: '#60a5fa',
    accentBg: '#0f1e35',
    accentBorder: '#60a5fa25',
    Icon: Zap,
    features: [
      { Icon: MessageCircle, text: 'Chat ilimitado con el agente nutricional' },
      { Icon: ClipboardList, text: 'Consultas sobre equivalencias SMAE' },
      { Icon: Infinity, text: 'Sin límite de preguntas diarias' },
    ],
  },
  gratis: {
    label: 'Cuenta Gratis',
    accent: '#f59e0b',
    accentBg: '#1c1000',
    accentBorder: '#f59e0b25',
    Icon: Activity,
    features: [
      { Icon: MessageCircle, text: '5 preguntas al día' },
      { Icon: ClipboardList, text: 'Consultas generales de nutrición' },
    ],
  },
};

export default function PaymentSuccess() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const nivelParam = searchParams.get('nivel') as Tier | null;
  const tier: Tier = (nivelParam === 'premium' || nivelParam === 'basica') ? nivelParam : 'premium';
  const config = TIER_CONFIG[tier];
  const TierIcon = config.Icon;

  // Auto-redirect after 8s
  useEffect(() => {
    const t = setTimeout(() => navigate('/norder-health', { replace: true }), 8000);
    return () => clearTimeout(t);
  }, [navigate]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[100dvh] bg-[#0a0a0a] px-6 py-12 select-none">

      {/* Logo NORDER */}
      <div className="relative mb-8">
        <div className="w-24 h-24 rounded-[26px] bg-[#0d0d0d] border border-[#1a1a1a] flex items-center justify-center shadow-2xl">
          <svg viewBox="0 0 512 512" className="w-16 h-16">
            <defs>
              <linearGradient id="ng" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#22c55e" />
                <stop offset="100%" stopColor="#16a34a" />
              </linearGradient>
            </defs>
            <circle cx="256" cy="220" r="130" fill="url(#ng)" />
            <text x="256" y="272" fontFamily="system-ui,sans-serif" fontSize="140" fontWeight="800" fill="white" textAnchor="middle">N</text>
          </svg>
        </div>
        {/* Check badge */}
        <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-[#22c55e] flex items-center justify-center shadow-lg shadow-[#22c55e]/30">
          <CheckCircle2 size={18} className="text-black" strokeWidth={2.5} />
        </div>
      </div>

      {/* Headline */}
      <p className="text-[11px] text-[#444] font-bold uppercase tracking-widest mb-2">Pago confirmado</p>
      <h1 className="text-[28px] font-black text-white text-center leading-tight tracking-tight mb-1">
        ¡Bienvenido a<br />Norder Health!
      </h1>

      {/* Plan badge */}
      <div
        className="mt-4 mb-8 inline-flex items-center gap-2 px-4 py-2 rounded-full border"
        style={{ background: config.accentBg, borderColor: config.accentBorder }}
      >
        <TierIcon size={13} style={{ color: config.accent }} strokeWidth={2.5} />
        <span className="text-[12px] font-bold uppercase tracking-widest" style={{ color: config.accent }}>
          {config.label}
        </span>
      </div>

      {/* Features */}
      <div className="w-full max-w-sm bg-[#0f0f0f] border border-[#1a1a1a] rounded-[20px] px-5 py-5 mb-8">
        <p className="text-[10px] text-[#3a3a3a] uppercase tracking-widest font-bold mb-4">Lo que tienes disponible</p>
        <div className="flex flex-col gap-3.5">
          {config.features.map(({ Icon, text }) => (
            <div key={text} className="flex items-center gap-3">
              <div
                className="w-8 h-8 rounded-[9px] flex items-center justify-center flex-shrink-0"
                style={{ background: config.accentBg }}
              >
                <Icon size={14} style={{ color: config.accent }} strokeWidth={2} />
              </div>
              <p className="text-[13px] text-[#888] leading-snug">{text}</p>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <button
        onClick={() => navigate('/norder-health', { replace: true })}
        className="w-full max-w-sm py-4 rounded-[16px] font-bold text-[15px] transition-all active:scale-[0.98] shadow-lg"
        style={{
          background: config.accent,
          color: tier === 'basica' ? 'white' : 'black',
          boxShadow: `0 8px 24px ${config.accent}30`,
        }}
      >
        Ir al portal
      </button>

      <p className="text-[11px] text-[#2a2a2a] mt-4">Redirigiendo automáticamente en unos segundos...</p>
    </div>
  );
}
