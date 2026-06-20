import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Sunrise, Coffee, Utensils, Apple, Moon, UtensilsCrossed,
  Flame, MessageCircle, LogOut, ChevronRight,
  Scale, Dumbbell, TrendingUp, TrendingDown, Minus,
  Lock, Droplets, Crown, ClipboardList, Activity, Percent,
  RefreshCw, Zap, Star, ChevronDown,
} from 'lucide-react';
import portalApi from '@/lib/portalApi';
import { usePortalAuthStore } from '@/store/portalAuth';

// ─── Tipos ────────────────────────────────────────────────────────────────────
type LucideIcon = React.ComponentType<{ className?: string; size?: number; strokeWidth?: number }>;

// ─── Helpers ──────────────────────────────────────────────────────────────────
function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Buenos días';
  if (h < 19) return 'Buenas tardes';
  return 'Buenas noches';
}

function mealIcon(name: string): LucideIcon {
  const u = name.toUpperCase();
  if (u.includes('DESAYUNO')) return Sunrise;
  if (u.includes('CENA')) return Moon;
  if (u.includes('COMIDA') || u.includes('ALMUERZO')) return Utensils;
  if (u.includes('COLACIÓN 1') || u.includes('MATUTINA') || u.includes('COLACION 1')) return Coffee;
  if (u.includes('COLACIÓN') || u.includes('COLACION')) return Apple;
  return UtensilsCrossed;
}

function fmt(n: number | null, dec = 1): string {
  if (n == null) return '—';
  return Number(n).toFixed(dec);
}

// ─── Sección label ────────────────────────────────────────────────────────────
function SectionLabel({ children, right }: { children: React.ReactNode; right?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <p className="text-[10px] text-[#3a3a3a] uppercase tracking-[0.15em] font-bold">{children}</p>
      {right && <span className="text-[10px] text-[#2a2a2a]">{right}</span>}
    </div>
  );
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

// ─── MacroBar ─────────────────────────────────────────────────────────────────
function MacroBar({ pct, color }: { pct: number; color: string }) {
  return (
    <div className="h-[3px] rounded-full bg-white/5 overflow-hidden mt-1.5">
      <div className="h-full rounded-full transition-all duration-700" style={{ width: `${Math.min(Number(pct) || 0, 100)}%`, backgroundColor: color }} />
    </div>
  );
}

// ─── Cards de stats ───────────────────────────────────────────────────────────
type BodyMode = 'grasa' | 'magra';
const BODY_MODES: { key: BodyMode; label: string; unit: string; posGood: boolean; Icon: LucideIcon }[] = [
  { key: 'grasa', label: '% Grasa', unit: '%', posGood: false, Icon: Percent },
  { key: 'magra', label: 'Masa Magra', unit: 'kg', posGood: true, Icon: Dumbbell },
];

function StatCard({ progreso, locked }: { progreso: any; locked?: boolean }) {
  const [modeIdx, setModeIdx] = useState(0);
  const mode = BODY_MODES[modeIdx];
  const Icon = mode.Icon;
  const value = mode.key === 'grasa' ? (progreso?.pctGrasa ?? null) : (progreso?.masaMagra ?? null);
  const delta = mode.key === 'grasa' ? (progreso?.delta?.pctGrasa ?? null) : (progreso?.delta?.masaMagra ?? null);

  return (
    <div
      className="relative flex-1 bg-[#111] border border-[#1c1c1c] rounded-[16px] p-4 overflow-hidden cursor-pointer select-none active:scale-[0.97] transition-transform"
      onClick={() => !locked && setModeIdx(i => (i + 1) % BODY_MODES.length)}
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
          {fmt(value)}<span className="text-[11px] font-normal text-[#333] ml-0.5">{mode.unit}</span>
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

function PesoCard({ value, delta }: { value: number | null; delta: number | null }) {
  return (
    <div className="flex-1 bg-[#111] border border-[#1c1c1c] rounded-[16px] p-4">
      <div className="flex items-center gap-1.5 mb-3">
        <Scale size={11} className="text-[#22c55e]" strokeWidth={2} />
        <p className="text-[9px] text-[#444] font-bold uppercase tracking-widest">Peso</p>
      </div>
      <p className="text-[30px] font-black text-white leading-none tracking-tight">
        {fmt(value)}<span className="text-[11px] font-normal text-[#333] ml-0.5">kg</span>
      </p>
      {delta != null && <div className="mt-2"><Delta value={delta} positiveIsGood={false} unit="kg" /></div>}
    </div>
  );
}

// ─── Tiempo card (grid 2 cols) ─────────────────────────────────────────────────
function TiempoCard({ t }: { t: any }) {
  const Icon = mealIcon(t.nombre);
  const ings: any[] = t.ingredientes || [];
  return (
    <div className="bg-[#111] border border-[#1c1c1c] rounded-[14px] p-3.5">
      <div className="flex items-center gap-2 mb-2.5">
        <div className="w-7 h-7 rounded-[8px] bg-[#1a1a1a] flex items-center justify-center flex-shrink-0">
          <Icon size={13} className="text-[#22c55e]" strokeWidth={2} />
        </div>
        <p className="text-[12px] font-bold text-white capitalize leading-none truncate">
          {t.nombre.charAt(0) + t.nombre.slice(1).toLowerCase()}
        </p>
      </div>
      {ings.length > 0 && (
        <ul className="space-y-1.5">
          {ings.map((ing: any, j: number) => (
            <li key={j} className="flex items-start gap-1.5">
              <span className="w-1 h-1 rounded-full bg-[#22c55e]/20 flex-shrink-0 mt-1.5" />
              <span className="text-[10.5px] text-[#555] leading-snug">
                {ing.descripcion}
                {ing.cantidad != null && <span className="text-[#3a3a3a]"> · {ing.cantidad}{ing.unidad ? ` ${ing.unidad}` : ''}</span>}
              </span>
            </li>
          ))}
        </ul>
      )}
      {t.bebida && (
        <div className="mt-2 flex items-center gap-1.5">
          <Droplets size={10} className="text-[#333]" strokeWidth={2} />
          <span className="text-[10px] text-[#333]">{t.bebida}</span>
        </div>
      )}
    </div>
  );
}

// ─── Upgrade button ────────────────────────────────────────────────────────────
function UpgradeButton({ nivel, label, color = 'green' }: { nivel: 'basica' | 'premium'; label: string; color?: 'green' | 'blue' | 'ghost' }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUpgrade = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await portalApi.post('/api/portal/checkout', { nivel });
      if (res.data?.url) window.location.href = res.data.url;
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al generar el pago. Intenta de nuevo.');
      setLoading(false);
    }
  };

  const base = 'w-full font-bold rounded-[12px] py-3 text-[13px] flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50';
  const styles = {
    green: `${base} bg-[#22c55e] hover:bg-[#16a34a] text-black`,
    blue: `${base} bg-[#3b82f6] hover:bg-[#2563eb] text-white`,
    ghost: `${base} border border-[#1e1e1e] text-[#444] hover:text-[#666]`,
  };

  return (
    <div>
      <button onClick={handleUpgrade} disabled={loading} className={styles[color]}>
        {loading ? <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
          : color === 'green' ? <Crown size={14} strokeWidth={2.5} />
          : color === 'blue' ? <Zap size={14} strokeWidth={2.5} />
          : <Star size={14} strokeWidth={2.5} />}
        {label}
      </button>
      {error && <p className="text-[10px] text-[#f87171] mt-1.5 text-center">{error}</p>}
    </div>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────
export default function NorderHealthHome() {
  const navigate = useNavigate();
  const { paciente: stored, token, clearPortalAuth } = usePortalAuthStore();
  const [menuActivo, setMenuActivo] = useState(0);

  const { data: me, isLoading: loadingMe } = useQuery({
    queryKey: ['portal', 'me'],
    queryFn: () => portalApi.get('/api/portal/me').then(r => r.data),
    staleTime: 30_000,
    refetchOnWindowFocus: true,
    enabled: !!token,
  });

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
  const menus: any[] = plan?.menus ?? [];
  const menuIdx = Math.min(menuActivo, Math.max(0, menus.length - 1));
  const tiemposActivos: any[] = menus[menuIdx]?.tiempos ?? [];
  const multiMenus = menus.length > 1;

  return (
    <div className="flex flex-col h-[100dvh] bg-[#0a0a0a]">

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

        <button
          onClick={() => { clearPortalAuth(); navigate('/norder-health/login', { replace: true }); }}
          className="w-9 h-9 rounded-full bg-[#141414] border border-[#1e1e1e] flex items-center justify-center text-[#333] hover:text-[#666] transition-colors flex-shrink-0 mt-1"
        >
          <LogOut size={14} strokeWidth={2} />
        </button>
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
                <PesoCard value={progreso?.peso ?? null} delta={progreso?.delta?.peso ?? null} />
              </div>
            )}
          </section>

          {/* ── Plan activo ───────────────────────────────────────────── */}
          <section>
            <SectionLabel>Plan activo</SectionLabel>
            {loadingPlan ? (
              <Skeleton className="h-[140px]" />
            ) : plan ? (
              <div className="bg-[#111] border border-[#1c1c1c] rounded-[18px] p-5">
                <div className="flex items-start justify-between mb-5">
                  <div className="flex-1 min-w-0 pr-3">
                    <p className="text-[9px] text-[#22c55e] uppercase tracking-widest font-bold mb-1.5">Norder Health</p>
                    <p className="text-[15px] font-bold text-white leading-tight truncate">{plan.nombre || 'Plan Nutricional'}</p>
                    {plan.tipoPlan && <p className="text-[11px] text-[#444] mt-0.5">{plan.tipoPlan}</p>}
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="flex items-center justify-end gap-1.5">
                      <Flame size={14} className="text-[#f59e0b]" strokeWidth={2} />
                      <p className="text-[30px] font-black text-white leading-none">{plan.calorias}</p>
                    </div>
                    <p className="text-[9px] text-[#333] mt-0.5 uppercase tracking-wider">kcal / día</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  {([
                    { label: 'Proteínas', pct: plan.proteinasPct, gr: plan.proteinasGr, color: '#22c55e' },
                    { label: 'Carbos', pct: plan.carbohidratosPct, gr: plan.carbohidratosGr, color: '#60a5fa' },
                    { label: 'Grasas', pct: plan.grasasPct, gr: plan.grasasGr, color: '#f59e0b' },
                  ] as const).map(m => (
                    <div key={m.label}>
                      <div className="flex items-baseline justify-between">
                        <span className="text-[9px] text-[#333] font-semibold uppercase tracking-wider">{m.label}</span>
                        <span className="text-[11px] font-bold" style={{ color: m.color }}>{m.pct}%</span>
                      </div>
                      <MacroBar pct={Number(m.pct) || 0} color={m.color} />
                      {m.gr && <p className="text-[9px] text-[#2a2a2a] mt-1">{parseFloat(String(m.gr)).toFixed(0)}g</p>}
                    </div>
                  ))}
                </div>
              </div>
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

          {/* ── Menús ─────────────────────────────────────────────────── */}
          {!loadingPlan && menus.length > 0 && (
            <section>
              <SectionLabel right={multiMenus ? `${menus.length} opciones` : undefined}>
                Menús del plan
              </SectionLabel>

              {/* Tabs de menú */}
              {multiMenus && (
                <div className="flex gap-2 overflow-x-auto mb-4 pb-0.5" style={{ scrollbarWidth: 'none' }}>
                  {menus.map((m: any, i: number) => (
                    <button
                      key={i}
                      onClick={() => isPremium && setMenuActivo(i)}
                      className={`flex-shrink-0 px-4 py-2 rounded-full text-[11px] font-bold border transition-all ${
                        menuIdx === i
                          ? 'bg-[#22c55e] border-transparent text-black'
                          : 'bg-[#111] border-[#1c1c1c] text-[#444] hover:text-[#666]'
                      }`}
                    >
                      {m.nombre || `Menú ${i + 1}`}
                    </button>
                  ))}
                </div>
              )}

              {multiMenus && (
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#22c55e]" />
                  <p className="text-[12px] text-white font-semibold">{menus[menuIdx]?.nombre || `Menú ${menuIdx + 1}`}</p>
                  <ChevronRight size={10} className="text-[#2a2a2a]" />
                  <p className="text-[10px] text-[#333]">{tiemposActivos.length} tiempos</p>
                </div>
              )}

              {/* Grid 2 columnas */}
              <div
                className="grid grid-cols-2 gap-2.5"
                style={!isPremium ? { filter: 'blur(4px)', userSelect: 'none', pointerEvents: 'none' } : undefined}
              >
                {tiemposActivos.map((t: any, i: number) => (
                  <TiempoCard key={`${menuIdx}-${i}`} t={t} />
                ))}
              </div>

              {!isPremium && menus.length > 0 && (
                <div className="mt-3 flex items-center justify-center gap-1.5">
                  <Lock size={10} className="text-[#333]" />
                  <p className="text-[10px] text-[#333]">Activa Premium para ver tu plan completo</p>
                </div>
              )}
            </section>
          )}

          {/* ── Notas del nutriólogo (solo premium) ─────────────────── */}
          {plan?.notasGenerales && isPremium && (
            <section>
              <SectionLabel>Notas de tu nutriólogo</SectionLabel>
              <div className="bg-[#111] border border-[#1c1c1c] rounded-[14px] px-4 py-4">
                <p className="text-[13px] text-[#666] leading-relaxed">{plan.notasGenerales}</p>
              </div>
            </section>
          )}

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
      <div className="flex-shrink-0 bg-[#0a0a0a] border-t border-[#141414] px-5 py-4 pb-8">
        {isPremium ? (
          <button
            onClick={() => navigate('/norder-health/chat')}
            className="w-full bg-[#22c55e] hover:bg-[#16a34a] active:scale-[0.98] text-black rounded-[14px] py-4 flex items-center justify-center gap-2.5 transition-all shadow-lg shadow-[#22c55e]/15"
          >
            <Crown size={16} strokeWidth={2.5} />
            <span className="text-[15px] font-bold">Chat con Eyder</span>
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
