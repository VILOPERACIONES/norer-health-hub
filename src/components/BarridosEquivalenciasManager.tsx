import { Plus, Trash2 } from 'lucide-react';
import { useRef } from 'react';
import BarridoEquivalencias, {
  normalizeBarridoData,
  type BarridoData,
} from './BarridoEquivalencias';
import type { Recall24Row } from '@/lib/recall24';

export interface BarridoVariante extends BarridoData {
  id: string;
  nombre: string;
}

export interface BarridoCollection extends BarridoData {
  variantes?: BarridoVariante[];
}

const newVariantId = () =>
  globalThis.crypto?.randomUUID?.() || `barrido-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

export const getBarridoVariantes = (value: BarridoCollection | BarridoData | null | undefined): BarridoVariante[] => {
  if (Array.isArray((value as BarridoCollection | undefined)?.variantes)
      && (value as BarridoCollection).variantes!.length > 0) {
    return (value as BarridoCollection).variantes!.map((variant, index) => ({
      ...normalizeBarridoData(variant),
      id: String(variant.id || (index === 0 ? 'principal' : `barrido-${index + 1}`)),
      nombre: String(variant.nombre || `Barrido ${index + 1}`),
    }));
  }
  return [{
    ...normalizeBarridoData(value),
    id: 'principal',
    nombre: 'Barrido 1',
  }];
};

export const buildBarridoCollection = (variants: BarridoVariante[]): BarridoCollection => {
  const normalized = variants.length > 0 ? variants : getBarridoVariantes(null);
  const principal = normalized[0];
  return {
    ...principal,
    variantes: normalized,
  };
};

interface Props {
  value: BarridoCollection | BarridoData | null;
  onChange: (value: BarridoCollection) => void;
  maxVariants?: number;
  habitos?: Recall24Row[];
  /** Tiempos (por id de barrido, y por nombre como respaldo legacy) ya usados por un Plan del paciente — no se borran al re-sincronizar con Dietética. */
  tiemposEnUso?: { ids: string[]; nombres: string[] } | null;
  /** Se disparan cuando el usuario agrega/renombra/quita un tiempo directamente en algún barrido, para reflejarlo de vuelta en Dietética. */
  onTiempoAdded?: (nombre: string) => void;
  onTiempoRenamed?: (idx: number, nombre: string) => void;
  onTiempoRemoved?: (idx: number) => void;
}

const BarridosEquivalenciasManager = ({ value, onChange, maxVariants = 2, habitos, tiemposEnUso, onTiempoAdded, onTiempoRenamed, onTiempoRemoved }: Props) => {
  const initialVariantsRef = useRef<BarridoVariante[] | null>(null);
  if (!initialVariantsRef.current) initialVariantsRef.current = getBarridoVariantes(value);
  const variants = value ? getBarridoVariantes(value) : initialVariantsRef.current;

  const updateVariant = (index: number, data: BarridoData) => {
    const next = variants.map((variant, currentIndex) =>
      currentIndex === index
        ? { ...data, id: variant.id, nombre: variant.nombre }
        : variant
    );
    onChange(buildBarridoCollection(next));
  };

  const addVariant = () => {
    if (variants.length >= maxVariants) return;
    const base = normalizeBarridoData(variants[0]);
    const blankDistribution = Object.fromEntries(base.tiempos.map(time => [time.id, {}]));
    const next: BarridoVariante = {
      ...base,
      id: newVariantId(),
      nombre: `Barrido ${variants.length + 1}`,
      porciones: {},
      distribucion: blankDistribution,
      kcalTotal: 0,
      kcalManuales: {},
      porcentajesManuales: {},
      energiaTotalManual: null,
      isValid: false,
    };
    onChange(buildBarridoCollection([...variants, next]));
  };

  const removeVariant = (index: number) => {
    if (index === 0 || variants.length === 1) return;
    onChange(buildBarridoCollection(variants.filter((_, currentIndex) => currentIndex !== index)));
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-[10px] border border-[#2a2a2a] bg-[#151515] p-3">
        <div>
          <p className="m-0 text-[12px] font-bold uppercase tracking-wide text-white">
            {variants.length === 1 ? 'Un barrido activo' : `${variants.length} barridos activos`}
          </p>
          <p className="m-0 mt-1 text-[10px] text-[#8a8a8a]">
            El flujo normal usa uno. Activa el segundo solo cuando los menús necesiten distribuciones distintas.
          </p>
        </div>
        {variants.length < maxVariants && (
          <button
            type="button"
            onClick={addVariant}
            className="inline-flex items-center gap-2 rounded-[7px] border border-brand-primary/40 bg-brand-primary/10 px-3 py-2 text-[11px] font-bold uppercase tracking-wide text-brand-primary hover:bg-brand-primary/20"
          >
            <Plus className="h-4 w-4" />
            Agregar segundo barrido
          </button>
        )}
      </div>

      {variants.map((variant, index) => (
        <div key={variant.id} className="overflow-hidden rounded-[12px] border border-[#303030] bg-[#111]">
          <div className="flex items-center justify-between border-b border-[#2a2a2a] bg-[#181818] px-4 py-3">
            <div>
              <p className="m-0 text-[13px] font-bold text-white">{variant.nombre}</p>
              <p className="m-0 text-[10px] text-[#8a8a8a]">
                {Math.round(variant.kcalTotal || 0).toLocaleString()} kcal
              </p>
            </div>
            {index > 0 && (
              <button
                type="button"
                onClick={() => removeVariant(index)}
                className="rounded-[6px] p-2 text-[#8a8a8a] hover:bg-red-500/10 hover:text-red-400"
                title={`Eliminar ${variant.nombre}`}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
          <div className="p-3">
            <BarridoEquivalencias
              value={variant}
              onChange={data => updateVariant(index, data)}
              habitos={habitos}
              tiemposEnUso={tiemposEnUso}
              onTiempoAdded={onTiempoAdded}
              onTiempoRenamed={onTiempoRenamed}
              onTiempoRemoved={onTiempoRemoved}
            />
          </div>
        </div>
      ))}
    </div>
  );
};

export default BarridosEquivalenciasManager;
