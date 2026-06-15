import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Sunrise, Coffee, Utensils, Apple, Moon, UtensilsCrossed,
  Flame, MessageCircle, LogOut, ChevronRight,
  Scale, Dumbbell, TrendingUp, TrendingDown, Minus,
  Lock, Droplets, Crown, ClipboardList, Activity, Percent,
  RefreshCw,
} from 'lucide-react';
import portalApi from '@/lib/portalApi';
import { usePortalAuthStore } from '@/store/portalAuth';

// ─── Tipos ────────────────────────────────────────────────────────────────────
type LucideIcon = React.ComponentType<{
  className?: string;
  size?: number;
  strokeWidth?: number;
}>;

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

// ─── MacroBar ─────────────────────────────────────────────────────────────────
function MacroBar({ pct, color }: { pct: number; color: string }) {
  return (
    <div className="h-[3px] rounded-full bg-white/5 overflow-hidden">
      <div
        className="h-full rounded-full transition-all duration-700"
        style={{ width: `${Math.min(Number(pct) || 0, 100)}%`, backgroundColor: color }}
      />
    </div>
  );
}

// ─── Delta inline ─────────────────────────────────────────────────────────────
function Delta({ value, positiveIsGood = true, unit = '' }: {
  value: number | null;
  positiveIsGood?: boolean;
  unit?: string;
}) {
  if (value == null) return null;
  const isZero = value === 0;
  const isPos = value > 0;
  const good = isZero ? null : (positiveIsGood ? isPos : !isPos);
  const color = good == null ? '#555' : good ? '#22c55e' : '#f87171';
  const Icon = isZero ? Minus : isPos ? TrendingUp : TrendingDown;
  return (
    <span className="flex items-center gap-0.5" style={{ color }}>
      <Icon size={10} strokeWidth={2.5} />
      <span className="text-[10px] font-semibold leading-none">
        {isPos && !isZero ? '+' : ''}{value}{unit}
      </span>
    </span>
  );
}

// Modos del card switcheable (izquierda)
type BodyMode = 'grasa' | 'magra';
const BODY_MODES: { key: BodyMode; label: string; unit: string; posGood: boolean; icon: LucideIcon }[] = [
  { key: 'grasa', label: '% Grasa',    unit: '%',  posGood: false, icon: Percent  },
  { key: 'magra', label: 'Masa Magra', unit: 'kg', posGood: true,  icon: Dumbbell },
];

// ─── Card mitad: peso (estático) ─────────────────────────────────────────────
function PesoCard({ value, delta, locked }: {
  value: number | null;
  delta: number | null;
  locked?: boolean;
}) {
  return (
    <div className="relative flex-1 bg-[#141414] border border-[#1e1e1e] rounded-[18px] p-4 flex flex-col justify-between min-h-[110px] overflow-hidden">
      {locked && (
        <div className="absolute inset-0 bg-[#0d0d0d]/80 backdrop-blur-[2px] rounded-[18px] flex flex-col items-center justify-center gap-1.5 z-10">
          <Lock size={13} className="text-[#444]" />
          <p className="text-[9px] text-[#444] font-bold uppercase tracking-widest text-center px-2 leading-tight">Plan Health</p>
        </div>
      )}
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 rounded-[7px] bg-[#1e1e1e] flex items-center justify-center flex-shrink-0">
          <Scale size={12} className="text-[#22c55e]" strokeWidth={2} />
        </div>
        <p className="text-[9px] text-[#555] font-semibold uppercase tracking-widest leading-none">Peso</p>
      </div>
      <div className="mt-auto">
        <p className="text-[28px] font-black text-white leading-none tracking-tight">
          {fmt(value, 1)}
          <span className="text-[11px] font-normal text-[#444] ml-0.5">kg</span>
        </p>
        {delta != null && (
          <div className="mt-1.5">
            <Delta value={delta} positiveIsGood={false} unit="kg" />
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Card mitad: switcheable (grasa / masa magra / kg grasa) ─────────────────
function SwitchableCard({ progreso, locked }: {
  progreso: any;
  locked?: boolean;
}) {
  const [modeIdx, setModeIdx] = useState(0);
  const mode = BODY_MODES[modeIdx];
  const Icon = mode.icon;

  const getValue = (key: BodyMode): number | null => {
    if (key === 'grasa') return progreso?.pctGrasa  ?? null;
    if (key === 'magra') return progreso?.masaMagra ?? null;
    return null;
  };
  const getDelta = (key: BodyMode): number | null => {
    if (key === 'grasa') return progreso?.delta?.pctGrasa  ?? null;
    if (key === 'magra') return progreso?.delta?.masaMagra ?? null;
    return null;
  };

  const value = getValue(mode.key);
  const delta = getDelta(mode.key);

  const next = () => setModeIdx(i => (i + 1) % BODY_MODES.length);

  return (
    <div
      className="relative flex-1 bg-[#141414] border border-[#1e1e1e] rounded-[18px] p-4 flex flex-col justify-between min-h-[110px] overflow-hidden cursor-pointer select-none active:scale-[0.97] transition-transform"
      onClick={!locked ? next : undefined}
      role="button"
      aria-label={`Ver ${BODY_MODES[(modeIdx + 1) % BODY_MODES.length].label}`}
    >
      {locked && (
        <div className="absolute inset-0 bg-[#0d0d0d]/80 backdrop-blur-[2px] rounded-[18px] flex flex-col items-center justify-center gap-1.5 z-10">
          <Lock size={13} className="text-[#444]" />
          <p className="text-[9px] text-[#444] font-bold uppercase tracking-widest text-center px-2 leading-tight">Plan Health</p>
        </div>
      )}

      {/* Header: icono + label + switch hint */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-[7px] bg-[#1e1e1e] flex items-center justify-center flex-shrink-0">
            <Icon size={12} className="text-[#22c55e]" strokeWidth={2} />
          </div>
          <p className="text-[9px] text-[#555] font-semibold uppercase tracking-widest leading-none">{mode.label}</p>
        </div>
        {!locked && (
          <RefreshCw size={10} className="text-[#2a2a2a]" strokeWidth={2.5} />
        )}
      </div>

      {/* Valor */}
      <div className="mt-auto">
        <p className="text-[28px] font-black text-white leading-none tracking-tight">
          {fmt(value, value != null && mode.unit === '%' ? 1 : 1)}
          <span className="text-[11px] font-normal text-[#444] ml-0.5">{mode.unit}</span>
        </p>
        {delta != null && (
          <div className="mt-1.5">
            <Delta value={delta} positiveIsGood={mode.posGood} unit={mode.unit} />
          </div>
        )}
      </div>

      {/* Dots indicadores */}
      {!locked && (
        <div className="flex gap-1 mt-3">
          {BODY_MODES.map((_, i) => (
            <span
              key={i}
              className="h-[3px] rounded-full transition-all duration-300"
              style={{
                width: i === modeIdx ? '14px' : '4px',
                backgroundColor: i === modeIdx ? '#22c55e' : '#2a2a2a',
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Tiempo de comida card ────────────────────────────────────────────────────
function TiempoCard({ t }: { t: any }) {
  const Icon = mealIcon(t.nombre);
  const ings: any[] = t.ingredientes || [];
  return (
    <div className="bg-[#141414] border border-[#1e1e1e] rounded-[14px] px-4 py-3.5">
      {/* Nombre del tiempo */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-[10px] bg-[#1e1e1e] border border-[#242424] flex items-center justify-center flex-shrink-0">
          <Icon size={14} className="text-[#22c55e]" strokeWidth={2} />
        </div>
        <p className="text-[13px] font-semibold text-white capitalize leading-none">
          {t.nombre.charAt(0) + t.nombre.slice(1).toLowerCase()}
        </p>
      </div>

      {/* Lista de alimentos */}
      {ings.length > 0 && (
        <ul className="mt-3 space-y-1.5 pl-11">
          {ings.map((ing: any, j: number) => (
            <li key={j} className="flex items-start gap-2">
              <span className="w-[5px] h-[5px] rounded-full bg-[#22c55e]/25 flex-shrink-0 mt-[5px]" />
              <span className="text-[12px] text-[#888] leading-snug">
                {ing.descripcion}
                {ing.cantidad != null && (
                  <span className="text-[#555]">
                    {' '}— {ing.cantidad}{ing.unidad ? ` ${ing.unidad}` : ''}
                  </span>
                )}
                {ing.nota && <span className="text-[#444]"> ({ing.nota})</span>}
              </span>
            </li>
          ))}
        </ul>
      )}

      {/* Bebida / nota al pie */}
      {(t.bebida || t.nota) && (
        <div className="mt-2.5 pl-11 flex flex-wrap gap-3">
          {t.bebida && (
            <span className="flex items-center gap-1.5 text-[11px] text-[#444]">
              <Droplets size={11} strokeWidth={2} className="text-[#444]" />
              {t.bebida}
            </span>
          )}
          {t.nota && (
            <span className="text-[10px] text-[#3a3a3a] italic leading-snug">{t.nota}</span>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Skeleton loader ──────────────────────────────────────────────────────────
function Skeleton({ className }: { className?: string }) {
  return <div className={`bg-[#1a1a1a] animate-pulse rounded-[12px] ${className ?? ''}`} />;
}

// ─── Página principal ─────────────────────────────────────────────────────────
export default function NorderHealthHome() {
  const navigate = useNavigate();
  const { paciente: stored, token, clearPortalAuth } = usePortalAuthStore();
  const [menuActivo, setMenuActivo] = useState(0);
  // bodyMode state vive en SwitchableCard (local al componente)

  const { data: me, isLoading: loadingMe } = useQuery({
    queryKey: ['portal', 'me'],
    queryFn: () => portalApi.get('/api/portal/me').then(r => r.data),
    staleTime: 5 * 60 * 1000,
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
  const nivel: string = me?.nivelMembresia || stored?.nivelMembresia || 'ninguna';
  const isPremium = nivel !== 'ninguna';

  const progreso = me?.progreso ?? null;
  const plan = planData?.plan ?? null;
  const menus: any[] = plan?.menus ?? [];
  const menuIdx = Math.min(menuActivo, Math.max(0, menus.length - 1));
  const tiemposActivos: any[] = menus[menuIdx]?.tiempos ?? [];
  const multiMenus = menus.length > 1;

  return (
    /* Layout idéntico a Chat: flex col h-[100dvh] */
    <div className="flex flex-col h-[100dvh] bg-[#0d0d0d]">

      {/* ── Header (fijo arriba, no hace scroll) ──────────────────────── */}
      <div className="flex-shrink-0 bg-[#0d0d0d] border-b border-[#1c1c1c] px-4 pt-12 pb-4 flex items-start justify-between">
        <div>
          <p className="text-[11px] text-[#444] font-medium">{greeting()}</p>
          <h1 className="text-[20px] font-bold text-white tracking-tight mt-0.5 leading-tight">
            {loadingMe ? <Skeleton className="h-6 w-36" /> : nombreCompleto}
          </h1>
          {/* Badge de membresía */}
          <div className="mt-2">
            {isPremium ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#0f2e1a] border border-[#22c55e]/20 text-[9px] font-bold text-[#22c55e] uppercase tracking-widest">
                <Crown size={8} strokeWidth={2.5} /> Health
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#1a1a1a] border border-[#242424] text-[9px] font-semibold text-[#555] uppercase tracking-widest">
                <Activity size={8} strokeWidth={2.5} /> Básico
              </span>
            )}
          </div>
        </div>
        <button
          onClick={() => { clearPortalAuth(); navigate('/norder-health/login', { replace: true }); }}
          className="mt-1 w-9 h-9 rounded-full bg-[#1a1a1a] border border-[#242424] flex items-center justify-center text-[#555] hover:text-[#888] transition-colors flex-shrink-0"
        >
          <LogOut size={14} strokeWidth={2} />
        </button>
      </div>

      {/* ── Cuerpo scrollable ──────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-4 py-5 flex flex-col gap-5" style={{ overscrollBehavior: 'contain' }}>

        {/* ── Stats de progreso: 2 cards al 50% ────────────────────── */}
        <div>
          <p className="text-[10px] text-[#3a3a3a] uppercase tracking-widest font-semibold mb-3">Tu progreso</p>
          {loadingMe ? (
            <div className="flex gap-3">
              <Skeleton className="flex-1 h-[110px] rounded-[18px]" />
              <Skeleton className="flex-1 h-[110px] rounded-[18px]" />
            </div>
          ) : (
            <div className="flex gap-3">
              {/* Izquierda: switcheable entre % Grasa / Masa Magra / KG Grasa */}
              <SwitchableCard progreso={progreso} locked={!isPremium} />
              {/* Derecha: Peso */}
              <PesoCard
                value={progreso?.peso ?? null}
                delta={progreso?.delta?.peso ?? null}
              />
            </div>
          )}
          {!isPremium && !loadingMe && (
            <p className="text-[11px] text-[#333] mt-2.5 leading-relaxed">
              Activa <span className="text-[#22c55e] font-semibold">Plan Health</span> para ver análisis completo de composición corporal.
            </p>
          )}
        </div>

        {/* ── Plan card ─────────────────────────────────────────────── */}
        {loadingPlan ? (
          <Skeleton className="h-[150px] rounded-[20px]" />
        ) : plan ? (
          <div className="bg-[#141414] border border-[#1e1e1e] rounded-[20px] p-5">
            {/* Top row */}
            <div className="flex items-start justify-between mb-5">
              <div className="flex-1 min-w-0 pr-4">
                <p className="text-[10px] text-[#22c55e] uppercase tracking-widest font-bold mb-1">Plan activo</p>
                <p className="text-[16px] font-bold text-white leading-tight truncate">
                  {plan.nombre || 'Plan Nutricional'}
                </p>
                {plan.tipoPlan && (
                  <p className="text-[11px] text-[#555] mt-0.5">{plan.tipoPlan}</p>
                )}
              </div>
              <div className="flex-shrink-0 text-right">
                <div className="flex items-center justify-end gap-1.5 mb-0.5">
                  <Flame size={13} className="text-[#f59e0b]" strokeWidth={2} />
                  <p className="text-[28px] font-black text-white leading-none">{plan.calorias}</p>
                </div>
                <p className="text-[10px] text-[#555]">kcal / día</p>
              </div>
            </div>
            {/* Macros */}
            <div className="grid grid-cols-3 gap-4">
              {([
                { label: 'Proteínas', pct: plan.proteinasPct, gr: plan.proteinasGr, color: '#22c55e' },
                { label: 'Carbos', pct: plan.carbohidratosPct, gr: plan.carbohidratosGr, color: '#60a5fa' },
                { label: 'Grasas', pct: plan.grasasPct, gr: plan.grasasGr, color: '#f59e0b' },
              ] as const).map(m => (
                <div key={m.label}>
                  <div className="flex items-baseline justify-between mb-1.5">
                    <span className="text-[9px] text-[#444] font-semibold uppercase tracking-wider">{m.label}</span>
                    <span className="text-[11px] font-bold" style={{ color: m.color }}>{m.pct}%</span>
                  </div>
                  <MacroBar pct={Number(m.pct) || 0} color={m.color} />
                  {m.gr && <p className="text-[9px] text-[#3a3a3a] mt-1">{parseFloat(String(m.gr)).toFixed(0)}g</p>}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-[#141414] border border-[#1e1e1e] rounded-[20px] p-5 flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-[#1e1e1e] flex items-center justify-center flex-shrink-0">
              <ClipboardList size={17} className="text-[#333]" />
            </div>
            <div>
              <p className="text-[14px] font-semibold text-white">Sin plan asignado</p>
              <p className="text-[12px] text-[#555] mt-0.5">Tu nutriólogo aún no ha publicado tu plan</p>
            </div>
          </div>
        )}

        {/* ── Sección de menús ──────────────────────────────────────── */}
        {!loadingPlan && menus.length > 0 && (
          <div>
            {/* Label sección */}
            <div className="flex items-center justify-between mb-3">
              <p className="text-[10px] text-[#3a3a3a] uppercase tracking-widest font-semibold">
                {multiMenus ? 'Menús del plan' : 'Tiempos de comida'}
              </p>
              {multiMenus && (
                <span className="text-[10px] text-[#3a3a3a]">{menus.length} opciones</span>
              )}
            </div>

            {/* Tabs de menú */}
            {multiMenus && (
              <div className="flex gap-2 overflow-x-auto mb-4 pb-0.5" style={{ scrollbarWidth: 'none' }}>
                {menus.map((m: any, i: number) => (
                  <button
                    key={i}
                    onClick={() => setMenuActivo(i)}
                    className={`flex-shrink-0 px-4 py-2 rounded-full text-[11px] font-bold border transition-all duration-200 ${
                      menuIdx === i
                        ? 'bg-[#22c55e] border-transparent text-black shadow-lg shadow-[#22c55e]/15'
                        : 'bg-[#141414] border-[#1e1e1e] text-[#555] hover:text-[#777]'
                    }`}
                  >
                    {m.nombre || `Menú ${i + 1}`}
                  </button>
                ))}
              </div>
            )}

            {/* Indicador del menú activo */}
            {multiMenus && (
              <div className="flex items-center gap-2 mb-3">
                <span className="w-1.5 h-1.5 rounded-full bg-[#22c55e] flex-shrink-0" />
                <p className="text-[12px] text-white font-semibold">
                  {menus[menuIdx]?.nombre || `Menú ${menuIdx + 1}`}
                </p>
                <ChevronRight size={11} className="text-[#2a2a2a]" />
                <p className="text-[11px] text-[#444]">{tiemposActivos.length} tiempos</p>
              </div>
            )}

            {/* Tarjetas */}
            <div className="flex flex-col gap-2">
              {tiemposActivos.map((t: any, i: number) => (
                <TiempoCard key={`${menuIdx}-${i}`} t={t} />
              ))}
            </div>
          </div>
        )}

        {/* ── Notas del nutriólogo ───────────────────────────────────── */}
        {plan?.notasGenerales && (
          <div className="bg-[#141414] border border-[#1e1e1e] rounded-[16px] px-4 py-4">
            <p className="text-[10px] text-[#444] uppercase tracking-widest font-semibold mb-2.5">Notas de tu nutriólogo</p>
            <p className="text-[13px] text-[#777] leading-relaxed">{plan.notasGenerales}</p>
          </div>
        )}

        {/* ── Teaser upgrade (solo usuarios básicos con plan) ────────── */}
        {!isPremium && plan && (
          <div className="bg-[#141414] border border-[#22c55e]/15 rounded-[20px] p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-[10px] bg-[#0f2e1a] border border-[#22c55e]/20 flex items-center justify-center flex-shrink-0">
                <Crown size={15} className="text-[#22c55e]" strokeWidth={2} />
              </div>
              <div>
                <p className="text-[14px] font-bold text-white leading-none">Desbloquea Plan Health</p>
                <p className="text-[11px] text-[#555] mt-0.5">Chat con IA · Análisis de composición</p>
              </div>
            </div>
            <ul className="space-y-1.5 pl-1 mb-3">
              {[
                'Pregunta sobre tus alimentos en tiempo real',
                'Análisis completo de composición corporal',
                'Historial de evolución física',
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="w-[5px] h-[5px] rounded-full bg-[#22c55e]/30 flex-shrink-0 mt-[5px]" />
                  <span className="text-[12px] text-[#555]">{item}</span>
                </li>
              ))}
            </ul>
            <p className="text-[11px] text-[#3a3a3a]">Habla con tu nutriólogo para activarlo.</p>
          </div>
        )}

        {/* Espacio final para que el último elemento no quede pegado al borde */}
        <div className="h-2" />
      </div>

      {/* ── Footer fijo en el flujo normal (como Chat) ────────────────── */}
      <div className="flex-shrink-0 bg-[#0d0d0d] border-t border-[#1c1c1c] px-4 py-4 pb-8">
        {isPremium ? (
          <button
            onClick={() => navigate('/norder-health/chat')}
            className="w-full bg-[#22c55e] hover:bg-[#16a34a] active:scale-[0.98] text-black font-bold rounded-[14px] py-3.5 text-[14px] flex items-center justify-center gap-2.5 transition-all shadow-lg shadow-[#22c55e]/15"
          >
            <MessageCircle size={16} strokeWidth={2.5} />
            Hablar con tu nutriólogo
          </button>
        ) : (
          <button
            disabled
            className="w-full bg-[#141414] border border-[#1e1e1e] text-[#444] font-semibold rounded-[14px] py-3.5 text-[13px] flex items-center justify-center gap-2.5 cursor-not-allowed"
          >
            <Lock size={14} strokeWidth={2} />
            Chat disponible en Plan Health
          </button>
        )}
      </div>

    </div>
  );
}
