import { Sunrise, Coffee, Utensils, Apple, Moon, UtensilsCrossed, Droplets } from 'lucide-react';

type LucideIcon = React.ComponentType<{ className?: string; size?: number; strokeWidth?: number }>;

export function mealIcon(name: string): LucideIcon {
  const u = name.toUpperCase();
  if (u.includes('DESAYUNO')) return Sunrise;
  if (u.includes('CENA')) return Moon;
  if (u.includes('COMIDA') || u.includes('ALMUERZO')) return Utensils;
  if (u.includes('COLACIÓN 1') || u.includes('MATUTINA') || u.includes('COLACION 1')) return Coffee;
  if (u.includes('COLACIÓN') || u.includes('COLACION')) return Apple;
  return UtensilsCrossed;
}

export function MacroBar({ pct, color }: { pct: number; color: string }) {
  return (
    <div className="h-[3px] rounded-full bg-white/5 overflow-hidden mt-1.5">
      <div className="h-full rounded-full transition-all duration-700" style={{ width: `${Math.min(Number(pct) || 0, 100)}%`, backgroundColor: color }} />
    </div>
  );
}

export function SectionLabel({ children, right }: { children: React.ReactNode; right?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <p className="text-[10px] text-[#3a3a3a] uppercase tracking-[0.15em] font-bold">{children}</p>
      {right && <span className="text-[10px] text-[#2a2a2a]">{right}</span>}
    </div>
  );
}

// Clasifica un tiempo de comida en una franja horaria aproximada del día,
// para poder elegir cuál mostrar como "lo que toca ahora".
function mealCategoryIndex(nombre: string): number {
  const u = nombre.toUpperCase();
  if (u.includes('DESAYUNO')) return 0;
  if (u.includes('COLACIÓN 1') || u.includes('MATUTINA') || u.includes('COLACION 1')) return 1;
  if (u.includes('COMIDA') || u.includes('ALMUERZO')) return 2;
  if (u.includes('COLACIÓN') || u.includes('COLACION')) return 3;
  if (u.includes('CENA')) return 4;
  return 2;
}

function currentMealCategoryIndex(hour: number): number {
  if (hour < 10) return 0;
  if (hour < 13) return 1;
  if (hour < 17) return 2;
  if (hour < 19) return 3;
  return 4;
}

export function pickCurrentTiempo<T extends { nombre: string }>(tiempos: T[]): T | null {
  if (tiempos.length === 0) return null;
  const target = currentMealCategoryIndex(new Date().getHours());
  const sorted = [...tiempos].sort((a, b) => mealCategoryIndex(a.nombre) - mealCategoryIndex(b.nombre));
  return sorted.find((t) => mealCategoryIndex(t.nombre) >= target) ?? sorted[sorted.length - 1];
}

export function TiempoCard({ t }: { t: any }) {
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
