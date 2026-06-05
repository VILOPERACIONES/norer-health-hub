import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Sunrise, Coffee, Utensils, Apple, Moon, UtensilsCrossed,
  Flame, ClipboardList, MessageCircle, LogOut
} from 'lucide-react';
import portalApi from '@/lib/portalApi';
import { usePortalAuthStore } from '@/store/portalAuth';

type LucideIcon = React.ComponentType<{ className?: string; size?: number; strokeWidth?: number }>;

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Buenos días';
  if (h < 19) return 'Buenas tardes';
  return 'Buenas noches';
}

function MacroBar({ pct, color }: { pct: number; color: string }) {
  return (
    <div className="h-1.5 rounded-full bg-[#1e1e1e] overflow-hidden">
      <div
        className="h-full rounded-full transition-all duration-700"
        style={{ width: `${Math.min(pct, 100)}%`, backgroundColor: color }}
      />
    </div>
  );
}

function mealIcon(nombre: string): LucideIcon {
  const u = nombre.toUpperCase();
  if (u.includes('DESAYUNO')) return Sunrise;
  if (u.includes('CENA')) return Moon;
  if (u.includes('COMIDA') || u.includes('ALMUERZO')) return Utensils;
  if (u.includes('COLACIÓN 1') || u.includes('MATUTINA') || u.includes('COLACION 1')) return Coffee;
  if (u.includes('COLACIÓN') || u.includes('COLACION')) return Apple;
  return UtensilsCrossed;
}

export default function NorderHealthHome() {
  const navigate = useNavigate();
  const { paciente, token, clearPortalAuth } = usePortalAuthStore();

  const { data: me } = useQuery({
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

  const nombre = me?.nombre || paciente?.nombre || '';
  const apellido = me?.apellido || paciente?.apellido || '';
  const nombreCompleto = [nombre, apellido].filter(Boolean).join(' ') || 'Bienvenido';
  const plan = planData?.plan;
  const tiempos = plan?.menus?.[0]?.tiempos || [];

  return (
    <div className="min-h-[100dvh] bg-[#0d0d0d] flex flex-col">

      {/* Header */}
      <div className="px-5 pt-14 pb-2 flex items-start justify-between">
        <div>
          <p className="text-[13px] text-[#555] font-medium">{greeting()}</p>
          <h1 className="text-[24px] font-bold text-white tracking-tight mt-0.5 leading-none">
            {nombreCompleto}
          </h1>
        </div>
        <button
          onClick={() => { clearPortalAuth(); navigate('/norder-health/login', { replace: true }); }}
          className="mt-1 w-8 h-8 rounded-full bg-[#1a1a1a] border border-[#242424] flex items-center justify-center text-[#444] hover:text-[#666] transition-colors"
        >
          <LogOut size={14} strokeWidth={2.5} />
        </button>
      </div>

      <div className="flex-1 px-4 pt-4 pb-8 flex flex-col gap-4 overflow-y-auto">

        {/* Plan card */}
        {loadingPlan ? (
          <div className="bg-[#141414] border border-[#1e1e1e] rounded-[20px] p-5 animate-pulse h-36" />
        ) : plan ? (
          <div className="bg-gradient-to-br from-[#0f2e1a] to-[#0d1a10] border border-[#22c55e]/15 rounded-[20px] p-5">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-[11px] text-[#22c55e]/70 uppercase tracking-wider font-semibold mb-1">Plan activo</p>
                <p className="text-[16px] font-bold text-white leading-tight truncate max-w-[180px]">
                  {plan.nombre || 'Plan Nutricional'}
                </p>
                {plan.tipoPlan && (
                  <p className="text-[12px] text-[#4ade80]/60 mt-0.5">{plan.tipoPlan}</p>
                )}
              </div>
              <div className="text-right flex-shrink-0">
                <div className="flex items-center justify-end gap-1.5">
                  <Flame size={14} className="text-[#f59e0b]" strokeWidth={2} />
                  <p className="text-[28px] font-bold text-white leading-none">{plan.calorias}</p>
                </div>
                <p className="text-[11px] text-[#555] mt-0.5">kcal / día</p>
              </div>
            </div>

            {/* Macros */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Proteínas', pct: plan.proteinasPct, gr: plan.proteinasGr, color: '#22c55e' },
                { label: 'Carbos', pct: plan.carbohidratosPct, gr: plan.carbohidratosGr, color: '#60a5fa' },
                { label: 'Grasas', pct: plan.grasasPct, gr: plan.grasasGr, color: '#f59e0b' },
              ].map(m => (
                <div key={m.label}>
                  <div className="flex items-end justify-between mb-1.5">
                    <span className="text-[10px] text-[#555] font-medium">{m.label}</span>
                    <span className="text-[11px] font-semibold" style={{ color: m.color }}>{m.pct}%</span>
                  </div>
                  <MacroBar pct={m.pct} color={m.color} />
                  {m.gr && (
                    <p className="text-[10px] text-[#444] mt-1">{parseFloat(m.gr).toFixed(0)}g</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-[#141414] border border-[#1e1e1e] rounded-[20px] p-5 flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-[#1e1e1e] flex items-center justify-center flex-shrink-0">
              <ClipboardList size={18} className="text-[#444]" />
            </div>
            <div>
              <p className="text-[14px] font-semibold text-white">Sin plan activo</p>
              <p className="text-[12px] text-[#555] mt-0.5">Tu nutriólogo aún no ha asignado un plan</p>
            </div>
          </div>
        )}

        {/* Tiempos de comida */}
        {tiempos.length > 0 && (
          <div>
            <p className="text-[11px] text-[#444] uppercase tracking-wider font-semibold mb-3 px-1">
              Tiempos de comida
            </p>
            <div className="flex flex-col gap-2">
              {tiempos.map((t: any, i: number) => {
                const Icon = mealIcon(t.nombre);
                return (
                <div
                  key={i}
                  className="bg-[#141414] border border-[#1e1e1e] rounded-[14px] px-4 py-3 flex items-center gap-3"
                >
                  <div className="w-8 h-8 rounded-[10px] bg-[#1a1a1a] border border-[#242424] flex items-center justify-center flex-shrink-0">
                    <Icon size={15} className="text-[#22c55e]" strokeWidth={2} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold text-white capitalize">
                      {t.nombre.charAt(0) + t.nombre.slice(1).toLowerCase()}
                    </p>
                    {t.bebida && (
                      <p className="text-[11px] text-[#444] truncate mt-0.5">{t.bebida}</p>
                    )}
                  </div>
                  {t.nota && (
                    <span className="text-[10px] text-[#444] max-w-[100px] text-right leading-tight flex-shrink-0 truncate">
                      {t.nota}
                    </span>
                  )}
                </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Notas del plan */}
        {plan?.notasGenerales && (
          <div className="bg-[#141414] border border-[#1e1e1e] rounded-[16px] px-4 py-4">
            <p className="text-[11px] text-[#444] uppercase tracking-wider font-semibold mb-2">Notas de tu nutriólogo</p>
            <p className="text-[13px] text-[#888] leading-relaxed">{plan.notasGenerales}</p>
          </div>
        )}

      </div>

      {/* CTA fijo */}
      <div className="flex-shrink-0 px-4 pb-10 pt-3 bg-gradient-to-t from-[#0d0d0d] via-[#0d0d0d] to-transparent">
        <button
          onClick={() => navigate('/norder-health/chat')}
          className="w-full bg-[#22c55e] hover:bg-[#16a34a] active:scale-[0.98] text-white font-semibold rounded-[16px] py-4 text-[15px] flex items-center justify-center gap-2.5 transition-all shadow-lg shadow-[#22c55e]/20"
        >
          <MessageCircle size={18} strokeWidth={2.5} />
          Hablar con Eyder
        </button>
      </div>
    </div>
  );
}
