import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Flame, Lock, ChevronRight, ClipboardList, Sparkles, LogOut } from 'lucide-react';
import portalApi from '@/lib/portalApi';
import { usePortalAuthStore } from '@/store/portalAuth';
import { useUpgradeModal } from '@/hooks/norderhealth/useUpgradeModal';
import { usePortalMe } from '@/hooks/norderhealth/usePortalMe';
import { getTier } from '@/lib/norderhealth/theme';
import { SectionLabel, TiempoCard } from '@/lib/norderhealth/planDisplay';

function Skeleton({ className }: { className?: string }) {
  return <div className={`bg-[#161616] animate-pulse rounded-[12px] ${className ?? ''}`} />;
}

export default function NorderHealthPlanDetail() {
  const navigate = useNavigate();
  const { token, clearPortalAuth } = usePortalAuthStore();
  const [menuActivo, setMenuActivo] = useState(0);
  const openUpgradeModal = useUpgradeModal((s) => s.open);

  const { data: me } = usePortalMe();
  const isPremium = getTier(me?.nivelMembresia) === 'premium';

  const { data: planData, isLoading: loadingPlan } = useQuery({
    queryKey: ['portal', 'plan'],
    queryFn: () => portalApi.get('/api/portal/plan').then((r) => r.data),
    staleTime: 5 * 60 * 1000,
    enabled: !!token,
    retry: 1,
  });

  const plan = planData?.plan ?? null;
  const menus: any[] = plan?.menus ?? [];
  const menuIdx = Math.min(menuActivo, Math.max(0, menus.length - 1));
  const tiemposActivos: any[] = menus[menuIdx]?.tiempos ?? [];
  const multiMenus = menus.length > 1;

  return (
    <div className="flex flex-col h-full overflow-y-auto bg-[#0a0a0a]">
      <div className="px-5 pt-8 pb-6">
        <p className="text-[11px] text-[#333] font-medium tracking-wide uppercase">Mi plan</p>
        <h1 className="text-[22px] font-black text-white tracking-tight mt-1 leading-tight">
          {loadingPlan ? <Skeleton className="h-7 w-44 mt-0.5" /> : (plan?.nombre || 'Plan Nutricional')}
        </h1>
      </div>

      <div className="px-5 flex flex-col gap-6 pb-8">
        {loadingPlan ? (
          <Skeleton className="h-[300px]" />
        ) : !plan ? (
          <div className="bg-[#111] border border-[#1c1c1c] rounded-[18px] p-5 flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-[#161616] flex items-center justify-center flex-shrink-0">
              <ClipboardList size={16} className="text-[#2a2a2a]" />
            </div>
            <div>
              <p className="text-[14px] font-semibold text-white">Sin plan asignado</p>
              <p className="text-[11px] text-[#444] mt-0.5">Tu nutriólogo aún no ha publicado tu plan</p>
            </div>
          </div>
        ) : !isPremium ? (
          <div className="bg-[#111] border border-[#1c1c1c] rounded-[20px] p-6 flex flex-col items-center text-center gap-3">
            <div className="w-11 h-11 rounded-[12px] bg-[#0f2e1a] border border-[#22c55e]/20 flex items-center justify-center">
              <Lock size={18} className="text-[#22c55e]" strokeWidth={2} />
            </div>
            <div>
              <p className="text-[15px] font-bold text-white">Desbloquea tu plan completo</p>
              <p className="text-[12px] text-[#555] mt-1.5 leading-relaxed max-w-[260px]">
                Con Premium ves aquí el detalle de cada tiempo de comida, ingredientes y equivalencias.
              </p>
            </div>
            <button
              onClick={() => openUpgradeModal('premium')}
              className="mt-1 flex items-center gap-2 bg-[#22c55e] text-black font-bold rounded-[12px] px-5 py-2.5 text-[13px] active:scale-[0.97] transition-transform"
            >
              <Sparkles size={14} strokeWidth={2.5} />
              Ver Plan Premium
            </button>
          </div>
        ) : (
          <>
            {/* ── Resumen calorías ──────────────────────────────────────── */}
            <div className="bg-[#111] border border-[#1c1c1c] rounded-[18px] p-5 flex items-center justify-between">
              <div className="flex-1 min-w-0 pr-3">
                <p className="text-[9px] text-[#22c55e] uppercase tracking-widest font-bold mb-1.5">Norder Health</p>
                {plan.tipoPlan && <p className="text-[11px] text-[#444]">{plan.tipoPlan}</p>}
              </div>
              <div className="text-right flex-shrink-0">
                <div className="flex items-center justify-end gap-1.5">
                  <Flame size={14} className="text-[#f59e0b]" strokeWidth={2} />
                  <p className="text-[30px] font-black text-white leading-none">{plan.calorias}</p>
                </div>
                <p className="text-[9px] text-[#333] mt-0.5 uppercase tracking-wider">kcal / día</p>
              </div>
            </div>

            {/* ── Menús ─────────────────────────────────────────────────── */}
            {menus.length > 0 && (
              <div>
                <SectionLabel right={multiMenus ? `${menus.length} opciones` : undefined}>Menús del plan</SectionLabel>

                {multiMenus && (
                  <div className="flex gap-2 overflow-x-auto mb-4 pb-0.5" style={{ scrollbarWidth: 'none' }}>
                    {menus.map((m: any, i: number) => (
                      <button
                        key={i}
                        onClick={() => setMenuActivo(i)}
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

                <div className="grid grid-cols-2 gap-2.5">
                  {tiemposActivos.map((t: any, i: number) => (
                    <TiempoCard key={`${menuIdx}-${i}`} t={t} />
                  ))}
                </div>
              </div>
            )}

            {/* ── Notas del nutriólogo ─────────────────────────────────── */}
            {plan.notasGenerales && (
              <div>
                <SectionLabel>Notas de tu nutriólogo</SectionLabel>
                <div className="bg-[#111] border border-[#1c1c1c] rounded-[14px] px-4 py-4">
                  <p className="text-[13px] text-[#666] leading-relaxed">{plan.notasGenerales}</p>
                </div>
              </div>
            )}
          </>
        )}

        <button
          onClick={() => { clearPortalAuth(); navigate('/norder-health/login', { replace: true }); }}
          className="flex items-center justify-center gap-2 text-[#444] hover:text-[#888] transition-colors py-3 mt-2"
        >
          <LogOut size={13} strokeWidth={2} />
          <span className="text-[12px] font-medium">Cerrar sesión</span>
        </button>
      </div>
    </div>
  );
}
