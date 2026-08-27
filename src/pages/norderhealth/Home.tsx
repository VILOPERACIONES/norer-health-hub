import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Flame, MessageCircle, ChevronRight,
  Dumbbell, TrendingUp, TrendingDown, Minus, Scale,
  Lock, Crown, ClipboardList, Activity, Percent,
  RefreshCw, Zap, CalendarClock,
} from 'lucide-react';
import portalApi from '@/lib/portalApi';
import { usePortalAuthStore } from '@/store/portalAuth';
import { PortalPhotoHistory } from '@/components/PortalPhotoHistory';
import { useUpgradeModal } from '@/hooks/norderhealth/useUpgradeModal';
import { UpgradeButton } from '@/components/norderhealth/UpgradeButton';
import { OnboardingTour, type OnboardingStep } from '@/components/norderhealth/OnboardingTour';
import { SectionLabel, mealIcon, pickCurrentTiempo } from '@/lib/norderhealth/planDisplay';
import { usePortalMe } from '@/hooks/norderhealth/usePortalMe';

// ─── Tipos ────────────────────────────────────────────────────────────────────
type LucideIcon = React.ComponentType<{ className?: string; size?: number; strokeWidth?: number }>;

// ─── Helpers ──────────────────────────────────────────────────────────────────
function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Buenos días';
  if (h < 19) return 'Buenas tardes';
  return 'Buenas noches';
}

function fmt(n: number | null, dec = 1): string {
  if (n == null) return '—';
  return Number(n).toFixed(dec);
}

// ─── Delta inline ─────────────────────────────────────────────────────────────
function Delta({ value, positiveIsGood = true, unit = '' }: { value: number | null; positiveIsGood?: boolean; unit?: string }) {
  if (value == null) return null;
  const isZero = value === 0;
  const isPos = value > 0;
  const good = isZero ? null : (positiveIsGood ? isPos : !isPos);
  const color = good == null ? '#555' : good ? '#22c55e' : '#f87171';
  const Icon = isZero ? Minus : isPos ? TrendingUp : TrendingDown;
  return (
    <span className="flex items-center gap-0.5" style={{ color }}>
      <Icon size={10} strokeWidth={2.5} />
      <span className="text-[10px] font-semibold leading-none">{isPos && !isZero ? '+' : ''}{value}{unit}</span>
    </span>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function Skeleton({ className }: { className?: string }) {
  return <div className={`bg-[#161616] animate-pulse rounded-[12px] ${className ?? ''}`} />;
}

// ─── Cards de stats ───────────────────────────────────────────────────────────
type BodyMode = 'grasa' | 'magra';
const BODY_MODES: { key: BodyMode; label: string; unit: string; posGood: boolean; Icon: LucideIcon }[] = [
  { key: 'grasa', label: '% Grasa', unit: '%', posGood: false, Icon: Percent },
  { key: 'magra', label: 'Masa Magra', unit: 'kg', posGood: true, Icon: Dumbbell },
];

function StatCard({ progreso, locked }: { progreso: any; locked?: boolean }) {
  const [modeIdx, setModeIdx] = useState(0);
  const openUpgradeModal = useUpgradeModal((s) => s.open);
  const mode = BODY_MODES[modeIdx];
  const Icon = mode.Icon;
  const value = mode.key === 'grasa' ? (progreso?.pctGrasa ?? null) : (progreso?.masaMagra ?? null);
  const delta = mode.key === 'grasa' ? (progreso?.delta?.pctGrasa ?? null) : (progreso?.delta?.masaMagra ?? null);
  const statusKey = mode.key === 'grasa' ? 'pctGrasa' : 'masaMagra';
  const noAplica = progreso?.medicionesEstado?.[statusKey] === 'NO_APLICA';

  return (
    <div
      className="relative flex-1 bg-[#111] border border-[#1c1c1c] rounded-[16px] p-4 overflow-hidden cursor-pointer select-none active:scale-[0.97] transition-transform"
      onClick={() => (locked ? openUpgradeModal('premium') : setModeIdx(i => (i + 1) % BODY_MODES.length))}
    >
      <div style={locked ? { filter: 'blur(6px)', userSelect: 'none', pointerEvents: 'none' } : undefined}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1.5">
            <Icon size={11} className="text-[#22c55e]" strokeWidth={2} />
            <p className="text-[9px] text-[#444] font-bold uppercase tracking-widest">{mode.label}</p>
          </div>
          <RefreshCw size={9} className="text-[#222]" />
        </div>
        <p className="text-[30px] font-black text-white leading-none tracking-tight">
          {noAplica ? 'N/A' : fmt(value)}{!noAplica && <span className="text-[11px] font-normal text-[#333] ml-0.5">{mode.unit}</span>}
        </p>
        {delta != null && <div className="mt-2"><Delta value={delta} positiveIsGood={mode.posGood} unit={mode.unit} /></div>}
        <div className="flex gap-1 mt-3">
          {BODY_MODES.map((_, i) => (
            <span key={i} className="h-[2px] rounded-full transition-all duration-300" style={{ width: i === modeIdx ? '12px' : '4px', backgroundColor: i === modeIdx ? '#22c55e' : '#222' }} />
          ))}
        </div>
      </div>
      {locked && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1">
          <Lock size={13} className="text-[#333]" strokeWidth={2} />
          <p className="text-[8px] text-[#333] font-bold uppercase tracking-widest">Premium</p>
        </div>
      )}
    </div>
  );
}

function PesoCard({ value, delta, noAplica }: { value: number | null; delta: number | null; noAplica?: boolean }) {
  return (
    <div className="flex-1 bg-[#111] border border-[#1c1c1c] rounded-[16px] p-4">
      <div className="flex items-center gap-1.5 mb-3">
        <Scale size={11} className="text-[#22c55e]" strokeWidth={2} />
        <p className="text-[9px] text-[#444] font-bold uppercase tracking-widest">Peso</p>
      </div>
      <p className="text-[30px] font-black text-white leading-none tracking-tight">
        {noAplica ? 'N/A' : fmt(value)}{!noAplica && <span className="text-[11px] font-normal text-[#333] ml-0.5">kg</span>}
      </p>
      {delta != null && <div className="mt-2"><Delta value={delta} positiveIsGood={false} unit="kg" /></div>}
    </div>
  );
}

const ONBOARDING_STEPS: OnboardingStep[] = [
  { title: 'Bienvenido a NORDER Health', body: 'Aquí encuentras tu progreso y tu plan de alimentación, y puedes resolver dudas con tu asistente nutricional.' },
  { title: 'Tu plan, cuando lo necesites', body: 'La tarjeta "Plan activo" te muestra un resumen. Tócala para ver el detalle completo de cada tiempo de comida en la pestaña Plan.' },
  { title: 'Resuelve tus dudas al instante', body: 'Usa la pestaña Chat (abajo) para consultar equivalencias, analizar una tabla nutricional o preguntar sobre tu plan con el asistente virtual.' },
];

// ─── Página principal ─────────────────────────────────────────────────────────
export default function NorderHealthHome() {
  const navigate = useNavigate();
  const { paciente: stored, token } = usePortalAuthStore();
  const openUpgradeModal = useUpgradeModal((s) => s.open);

  const { data: me, isLoading: loadingMe } = usePortalMe();

  const { data: planData, isLoading: loadingPlan } = useQuery({
    queryKey: ['portal', 'plan'],
    queryFn: () => portalApi.get('/api/portal/plan').then(r => r.data),
    staleTime: 5 * 60 * 1000,
    enabled: !!token,
    retry: 1,
  });

  const nombre = me?.nombre || stored?.nombre || '';
  const apellido = me?.apellido || stored?.apellido || '';
  const nombreCompleto = [nombre, apellido].filter(Boolean).join(' ') || 'Bienvenido';
  const nivel: string = loadingMe ? (stored?.nivelMembresia || 'ninguna') : (me?.nivelMembresia || 'ninguna');

  const isGratis = !nivel || nivel === 'ninguna';
  const isBasica = nivel === 'basica';
  const isPremium = nivel === 'premium' || nivel === 'norder_health';

  const preguntasRestantes: number = me?.preguntasRestantes ?? 0;
  const limiteGratis: number = me?.limiteGratis ?? 5;
  const pctRestantes = limiteGratis > 0 ? Math.min(1, preguntasRestantes / limiteGratis) : 0;
  const sinPreguntas = isGratis && preguntasRestantes <= 0 && !loadingMe;

  const progreso = me?.progreso ?? null;
  const plan = planData?.plan ?? null;
  const todosLosTiempos = (plan?.menus ?? []).flatMap((m: any) => m.tiempos ?? []);
  const proximoTiempo = pickCurrentTiempo(todosLosTiempos);

  // Nudge proactivo: una única vez por sesión, cuando un paciente gratis
  // ya ha usado varias preguntas — señal de uso real, no un timer al cargar.
  const preguntasHoy = Math.max(0, limiteGratis - preguntasRestantes);
  const { hasNudged, markNudged } = useUpgradeModal();
  useEffect(() => {
    if (!loadingMe && isGratis && preguntasHoy >= 2 && !hasNudged) {
      markNudged();
      openUpgradeModal('basica');
    }
  }, [loadingMe, isGratis, preguntasHoy, hasNudged, markNudged, openUpgradeModal]);

  return (
    <div className="flex flex-col h-full bg-[#0a0a0a]">
      <OnboardingTour storageKey="norder_onboarding_seen" steps={ONBOARDING_STEPS} />

      {/* ── Header ──────────────────────────────────────────────────── */}
      <div className="flex-shrink-0 bg-[#0a0a0a] px-5 pt-6 pb-5 flex items-start justify-between border-b border-[#141414]">
        <div className="flex-1 min-w-0 pr-3">
          <p className="text-[11px] text-[#333] font-medium tracking-wide">{greeting()}</p>
          <h1 className="text-[22px] font-black text-white tracking-tight mt-0.5 leading-tight truncate">
            {loadingMe ? <Skeleton className="h-7 w-44 mt-0.5" /> : nombreCompleto}
          </h1>

          {/* Badge de membresía */}
          <div className="mt-2.5 flex items-center gap-2">
            {isPremium ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#0f2e1a] border border-[#22c55e]/20 text-[9.5px] font-bold text-[#22c55e] uppercase tracking-widest">
                <Crown size={9} strokeWidth={2.5} /> Plan Premium
              </span>
            ) : isBasica ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#0f1e35] border border-[#3b82f6]/20 text-[9.5px] font-bold text-[#60a5fa] uppercase tracking-widest">
                <Zap size={9} strokeWidth={2.5} /> Plan Básico
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#141414] border border-[#222] text-[9.5px] font-semibold text-[#444] uppercase tracking-widest">
                <Activity size={9} strokeWidth={2.5} /> Gratis
              </span>
            )}

            {/* Barra de preguntas gratis */}
            {isGratis && !loadingMe && (
              <div className="flex items-center gap-1.5">
                <div className="w-16 h-[3px] rounded-full bg-[#1e1e1e] overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${pctRestantes * 100}%`, backgroundColor: pctRestantes > 0.4 ? '#22c55e' : pctRestantes > 0.2 ? '#f59e0b' : '#f87171' }}
                  />
                </div>
                <span className="text-[9px] font-semibold" style={{ color: pctRestantes > 0.4 ? '#22c55e' : pctRestantes > 0.2 ? '#f59e0b' : '#f87171' }}>
                  {preguntasRestantes}/{limiteGratis}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Cuerpo scrollable ────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto" style={{ overscrollBehavior: 'contain' }}>
        <div className="px-5 py-6 flex flex-col gap-7">

          {/* ── Progreso ──────────────────────────────────────────────── */}
          <section>
            <SectionLabel>Tu progreso</SectionLabel>
            {loadingMe ? (
              <div className="flex gap-3">
                <Skeleton className="flex-1 h-[100px]" />
                <Skeleton className="flex-1 h-[100px]" />
              </div>
            ) : (
              <div className="flex gap-3">
                <StatCard progreso={progreso} locked={!isPremium} />
                <PesoCard value={progreso?.peso ?? null} delta={progreso?.delta?.peso ?? null} noAplica={progreso?.medicionesEstado?.peso === 'NO_APLICA'} />
              </div>
            )}
          </section>

          {/* ── Plan activo (resumen, tap para ver detalle) ──────────── */}
          <section>
            <SectionLabel>Plan activo</SectionLabel>
            {loadingPlan ? (
              <Skeleton className="h-[88px]" />
            ) : plan ? (
              <button
                onClick={() => navigate('/norder-health/plan')}
                className="w-full bg-[#111] border border-[#1c1c1c] rounded-[18px] p-5 flex items-center justify-between text-left active:scale-[0.98] transition-transform"
              >
                <div className="flex-1 min-w-0 pr-3">
                  <p className="text-[9px] text-[#22c55e] uppercase tracking-widest font-bold mb-1.5">Norder Health</p>
                  <p className="text-[15px] font-bold text-white leading-tight truncate">{plan.nombre || 'Plan Nutricional'}</p>
                  {plan.tipoPlan && <p className="text-[11px] text-[#444] mt-0.5">{plan.tipoPlan}</p>}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <div className="text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <Flame size={13} className="text-[#f59e0b]" strokeWidth={2} />
                      <p className="text-[20px] font-black text-white leading-none">{plan.calorias}</p>
                    </div>
                    <p className="text-[8px] text-[#333] mt-0.5 uppercase tracking-wider">kcal / día</p>
                  </div>
                  <ChevronRight size={16} className="text-[#333]" />
                </div>
              </button>
            ) : (
              <div className="bg-[#111] border border-[#1c1c1c] rounded-[18px] p-5 flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-[#161616] flex items-center justify-center flex-shrink-0">
                  <ClipboardList size={16} className="text-[#2a2a2a]" />
                </div>
                <div>
                  <p className="text-[14px] font-semibold text-white">Sin plan asignado</p>
                  <p className="text-[11px] text-[#444] mt-0.5">Tu nutriólogo aún no ha publicado tu plan</p>
                </div>
              </div>
            )}
          </section>

          {/* ── Qué toca ahora (preview, tap lleva al detalle) ───────── */}
          {isPremium && plan && proximoTiempo && (
            <section>
              <SectionLabel>Ahora toca</SectionLabel>
              <button
                onClick={() => navigate('/norder-health/plan')}
                className="w-full bg-[#111] border border-[#1c1c1c] rounded-[18px] p-4 flex items-center gap-3 text-left active:scale-[0.98] transition-transform"
              >
                <div className="w-10 h-10 rounded-[10px] bg-[#0f2e1a] border border-[#22c55e]/20 flex items-center justify-center flex-shrink-0">
                  {(() => { const Icon = mealIcon(proximoTiempo.nombre); return <Icon size={17} className="text-[#22c55e]" strokeWidth={2} />; })()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-bold text-white capitalize leading-tight truncate">
                    {proximoTiempo.nombre.charAt(0) + proximoTiempo.nombre.slice(1).toLowerCase()}
                  </p>
                  <p className="text-[11px] text-[#555] mt-0.5 truncate">
                    {(proximoTiempo.ingredientes || []).slice(0, 2).map((i: any) => i.descripcion).join(' · ') || 'Ver detalle'}
                  </p>
                </div>
                <ChevronRight size={15} className="text-[#333] flex-shrink-0" />
              </button>
            </section>
          )}

          {/* ── Próxima consulta ──────────────────────────────────────── */}
          {plan?.proximaSesion && (
            <section>
              <SectionLabel>Próxima consulta</SectionLabel>
              <div className="bg-[#111] border border-[#1c1c1c] rounded-[18px] p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-[10px] bg-[#161616] flex items-center justify-center flex-shrink-0">
                  <CalendarClock size={17} className="text-[#60a5fa]" strokeWidth={2} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-bold text-white leading-tight">
                    {new Date(plan.proximaSesion).toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })}
                  </p>
                  <p className="text-[11px] text-[#555] mt-0.5">Con tu nutriólogo</p>
                </div>
              </div>
            </section>
          )}

          <PortalPhotoHistory />

          {/* ── Teaser básico → premium ──────────────────────────────── */}
          {isBasica && (
            <section>
              <div className="bg-[#111] border border-[#22c55e]/15 rounded-[18px] p-5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-9 h-9 rounded-[10px] bg-[#0f2e1a] border border-[#22c55e]/20 flex items-center justify-center flex-shrink-0">
                    <Crown size={15} className="text-[#22c55e]" strokeWidth={2} />
                  </div>
                  <div>
                    <p className="text-[13px] font-bold text-white leading-none">Sube a Premium</p>
                    <p className="text-[11px] text-[#444] mt-0.5">Plan personalizado · Análisis corporal</p>
                  </div>
                </div>
                <ul className="space-y-2 mb-4">
                  {['Plan nutricional personalizado visible aquí', 'El agente responde según tu plan específico', 'Análisis completo de composición corporal'].map((item, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <ChevronRight size={10} className="text-[#22c55e]/40 flex-shrink-0" />
                      <span className="text-[11.5px] text-[#555]">{item}</span>
                    </li>
                  ))}
                </ul>
                <UpgradeButton nivel="premium" label="Subir a Premium" />
              </div>
            </section>
          )}

          {/* ── Teaser gratis → básico ───────────────────────────────── */}
          {isGratis && (
            <section>
              <div className="bg-[#111] border border-[#3b82f6]/15 rounded-[18px] p-5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-9 h-9 rounded-[10px] bg-[#0f1e35] border border-[#3b82f6]/20 flex items-center justify-center flex-shrink-0">
                    <Zap size={15} className="text-[#60a5fa]" strokeWidth={2} />
                  </div>
                  <div>
                    <p className="text-[13px] font-bold text-white leading-none">Chat ilimitado</p>
                    <p className="text-[11px] text-[#444] mt-0.5">Plan Básico · Sin límite diario</p>
                  </div>
                </div>
                <ul className="space-y-2 mb-4">
                  {['Chat ilimitado con el agente nutricional', 'Consultas sobre equivalencias e imágenes', 'Sin restricción diaria'].map((item, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <ChevronRight size={10} className="text-[#60a5fa]/40 flex-shrink-0" />
                      <span className="text-[11.5px] text-[#555]">{item}</span>
                    </li>
                  ))}
                </ul>
                <div className="flex flex-col gap-2">
                  <UpgradeButton nivel="basica" label="Activar Plan Básico" color="blue" />
                  <UpgradeButton nivel="premium" label="Ver Plan Premium" color="ghost" />
                </div>
              </div>
            </section>
          )}

          <div className="h-2" />
        </div>
      </div>

      {/* ── Footer fijo ──────────────────────────────────────────────── */}
      <div className="flex-shrink-0 bg-[#0a0a0a] border-t border-[#141414] px-5 py-4">
        {isPremium ? (
          <button
            onClick={() => navigate('/norder-health/chat')}
            className="w-full bg-[#22c55e] hover:bg-[#16a34a] active:scale-[0.98] text-black rounded-[14px] py-4 flex items-center justify-center gap-2.5 transition-all shadow-lg shadow-[#22c55e]/15"
          >
            <Crown size={16} strokeWidth={2.5} />
            <span className="text-[15px] font-bold">Preguntar al asistente</span>
          </button>
        ) : isBasica ? (
          <button
            onClick={() => navigate('/norder-health/chat')}
            className="w-full bg-[#3b82f6] hover:bg-[#2563eb] active:scale-[0.98] text-white rounded-[14px] py-4 flex items-center justify-center gap-2.5 transition-all shadow-lg shadow-[#3b82f6]/15"
          >
            <Zap size={16} strokeWidth={2.5} />
            <span className="text-[15px] font-bold">Chat Ilimitado</span>
          </button>
        ) : sinPreguntas ? (
          <button
            disabled
            className="w-full bg-[#111] border border-[#1c1c1c] text-[#333] rounded-[14px] py-4 flex items-center justify-center gap-2 cursor-not-allowed"
          >
            <Lock size={15} strokeWidth={2} />
            <span className="text-[14px] font-semibold">Límite diario alcanzado</span>
          </button>
        ) : (
          <button
            onClick={() => navigate('/norder-health/chat')}
            className="w-full bg-[#22c55e] hover:bg-[#16a34a] active:scale-[0.98] text-black rounded-[14px] py-4 flex items-center justify-center gap-2.5 transition-all"
          >
            <MessageCircle size={16} strokeWidth={2.5} />
            <span className="text-[15px] font-bold">Chat · {preguntasRestantes} pregunta{preguntasRestantes !== 1 ? 's' : ''} hoy</span>
          </button>
        )}
      </div>

    </div>
  );
}
