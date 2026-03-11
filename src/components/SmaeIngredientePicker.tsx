import { useState, useEffect, useRef, useCallback } from 'react';
import { Search, X, Check, ChevronDown } from 'lucide-react';
import api from '@/lib/api';
import type { Ingrediente } from '@/types';

// ─── Label legible por grupo SMAE ─────────────────────────────────────────────
const GRUPO_LABELS: Record<string, string> = {
  verduras: 'Verduras',
  frutas: 'Frutas',
  cerealSinGr: 'Cereal s/grasa',
  cerealConGr: 'Cereal c/grasa',
  leguminosas: 'Leguminosas',
  aoaMuyBajo: 'AOA Muy Bajo',
  aoaBajo: 'AOA Bajo',
  aoaModerado: 'AOA Moderado',
  aoaAlto: 'AOA Alto',
  lecheDesc: 'Leche Descrem.',
  lecheSemi: 'Leche Semi',
  lecheEntera: 'Leche Entera',
  lecheAz: 'Leche Azucarada',
  grasaSinProt: 'Grasa s/prot',
  grasaConProt: 'Grasa c/prot',
  azSinGr: 'Azúcar s/grasa',
  azConGr: 'Azúcar c/grasa',
};

// Color badge por grupo
const GRUPO_COLORS: Record<string, string> = {
  verduras: '#22c55e',
  frutas: '#f59e0b',
  cerealSinGr: '#a78bfa',
  cerealConGr: '#7c3aed',
  leguminosas: '#84cc16',
  aoaMuyBajo: '#38bdf8',
  aoaBajo: '#0ea5e9',
  aoaModerado: '#0284c7',
  aoaAlto: '#0369a1',
  lecheDesc: '#f472b6',
  lecheSemi: '#e879f9',
  lecheEntera: '#d946ef',
  lecheAz: '#c026d3',
  grasaSinProt: '#fb923c',
  grasaConProt: '#ef4444',
  azSinGr: '#fbbf24',
  azConGr: '#d97706',
};

interface SmaeAlimento {
  id: string;
  nombre: string;
  grupo: string;
  pesoGramos: number;
  porcionCasera?: string;
  cantidadPorcion?: number;
  unidadPorcion?: string;
}

interface Props {
  ingrediente: Ingrediente;
  index: number;
  onUpdate: (updated: Partial<Ingrediente>) => void;
  onRemove: () => void;
}

// ─── Caché en módulo para no re-fetch en cada render ─────────────────────────
let _smaeCache: SmaeAlimento[] | null = null;
const loadSmae = async (): Promise<SmaeAlimento[]> => {
  if (_smaeCache) return _smaeCache;
  const { data } = await api.get('/api/alimentos-smae');
  _smaeCache = data?.data || data || [];
  return _smaeCache!;
};

// ─── Componente Principal ─────────────────────────────────────────────────────
export const SmaeIngredientePicker = ({ ingrediente: ing, index, onUpdate, onRemove }: Props) => {
  const [allAlimentos, setAllAlimentos] = useState<SmaeAlimento[]>([]);
  const [query, setQuery] = useState(ing.descripcion || '');
  const [results, setResults] = useState<SmaeAlimento[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedAlimento, setSelectedAlimento] = useState<SmaeAlimento | null>(null);
  const [eqCantidad, setEqCantidad] = useState<string>(ing.eqCantidad?.toString() || '');
  const [eqGrupo, setEqGrupo] = useState(ing.eqGrupo || '');
  const [cantidad, setCantidad] = useState<string>(ing.cantidad?.toString() || '');
  const [unidad, setUnidad] = useState(ing.unidad || 'GR');
  const [showManual, setShowManual] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Cargar catálogo SMAE una sola vez
  useEffect(() => {
    loadSmae().then(setAllAlimentos);
  }, []);

  // Cerrar dropdown al hacer clic afuera
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Filtrar resultados mientras escribe
  useEffect(() => {
    if (!query || query.length < 2) {
      setResults([]);
      return;
    }
    const q = query.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const filtered = allAlimentos.filter(a => {
      const name = a.nombre.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      return name.includes(q);
    }).slice(0, 12);
    setResults(filtered);
    setShowDropdown(filtered.length > 0);
  }, [query, allAlimentos]);

  // Calcular equivalencias automáticamente cuando cambia la cantidad
  const calcEquivalencias = useCallback((alimento: SmaeAlimento, gr: number) => {
    if (!alimento || !gr || alimento.pesoGramos <= 0) return;
    const equivalencias = gr / alimento.pesoGramos;
    const eqLabel = GRUPO_LABELS[alimento.grupo] || alimento.grupo;
    setEqCantidad(parseFloat(equivalencias.toFixed(2)).toString());
    setEqGrupo(eqLabel);
    const updates: Partial<Ingrediente> = {
      eqCantidad: parseFloat(equivalencias.toFixed(2)),
      eqGrupo: eqLabel,
    };
    onUpdate(updates);
  }, [onUpdate]);

  // Seleccionar alimento del dropdown
  const handleSelect = (alimento: SmaeAlimento) => {
    setSelectedAlimento(alimento);
    setQuery(alimento.nombre);
    setShowDropdown(false);

    // Porción predeterminada del alimento
    const porcDefGr = alimento.pesoGramos;
    const porcCasera = alimento.cantidadPorcion;
    const uPorcion = alimento.unidadPorcion || 'GR';

    const cantFinal = porcCasera ?? porcDefGr;
    const uFinal = porcCasera ? uPorcion : 'GR';

    setCantidad(cantFinal.toString());
    setUnidad(uFinal);

    // Calcular equivalencias con 1 porción
    const grParaCalc = porcCasera ? porcDefGr : porcDefGr;
    const eq = grParaCalc / alimento.pesoGramos;
    const eqLabel = GRUPO_LABELS[alimento.grupo] || alimento.grupo;

    setEqCantidad(parseFloat(eq.toFixed(2)).toString());
    setEqGrupo(eqLabel);

    onUpdate({
      descripcion: alimento.nombre,
      cantidad: cantFinal,
      unidad: uFinal,
      eqCantidad: parseFloat(eq.toFixed(2)),
      eqGrupo: eqLabel,
    });
  };

  // Cambio de cantidad manual → recalcular eq si hay alimento seleccionado
  const handleCantidadChange = (val: string) => {
    setCantidad(val);
    const num = parseFloat(val);
    onUpdate({ cantidad: num || 0, unidad });
    if (selectedAlimento && num) {
      // Si unidad es GR, calcular directo; si es porción casera, normalizar
      const grPorUnidad = selectedAlimento.cantidadPorcion
        ? selectedAlimento.pesoGramos / (selectedAlimento.cantidadPorcion || 1)
        : 1;
      const totalGr = unidad === 'GR' ? num : num * grPorUnidad;
      calcEquivalencias(selectedAlimento, totalGr);
    }
  };

  const handleDescripcionManual = (val: string) => {
    setQuery(val);
    setSelectedAlimento(null);
    onUpdate({ descripcion: val });
  };

  const handleEqManualChange = (field: 'eqCantidad' | 'eqGrupo', val: string) => {
    if (field === 'eqCantidad') {
      setEqCantidad(val);
      onUpdate({ eqCantidad: parseFloat(val) || 0 });
    } else {
      setEqGrupo(val);
      onUpdate({ eqGrupo: val });
    }
  };

  const grupoColor = selectedAlimento ? (GRUPO_COLORS[selectedAlimento.grupo] || '#8a8a8a') : '#8a8a8a';
  const grupoLabel = selectedAlimento ? (GRUPO_LABELS[selectedAlimento.grupo] || selectedAlimento.grupo) : null;

  return (
    <div className="relative space-y-2 pb-4 border-b border-border-default last:border-0 last:pb-0">
      {/* ─── Búsqueda de alimento ─── */}
      <div ref={wrapperRef} className="relative">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted pointer-events-none" />
            <input
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                handleDescripcionManual(e.target.value);
              }}
              onFocus={() => results.length > 0 && setShowDropdown(true)}
              placeholder="Buscar alimento SMAE o escribir libre..."
              className="w-full pl-8 pr-28 py-2 bg-bg-base rounded-[6px] text-[13px] text-text-primary outline-none border border-border-subtle focus:border-[#555] transition-colors"
            />
            {selectedAlimento && (
              <span
                className="absolute right-2 top-1/2 -translate-y-1/2 px-1.5 py-0.5 rounded text-[10px] font-bold"
                style={{ background: grupoColor + '22', color: grupoColor, border: `1px solid ${grupoColor}44` }}
              >
                {grupoLabel}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={onRemove}
            className="text-text-muted hover:text-accent-red px-2 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Dropdown resultados */}
        {showDropdown && results.length > 0 && (
          <div className="absolute z-50 left-0 right-8 mt-1 bg-[#111] border border-[#333] rounded-[8px] shadow-2xl max-h-56 overflow-y-auto">
            {results.map((a) => {
              const col = GRUPO_COLORS[a.grupo] || '#8a8a8a';
              const lbl = GRUPO_LABELS[a.grupo] || a.grupo;
              return (
                <button
                  key={a.id}
                  type="button"
                  onMouseDown={(e) => { e.preventDefault(); handleSelect(a); }}
                  className="w-full text-left px-3 py-2 hover:bg-[#1a1a1a] transition-colors flex items-center justify-between gap-3 border-b border-[#222] last:border-0"
                >
                  <div>
                    <p className="text-[13px] font-medium text-white m-0">{a.nombre}</p>
                    <p className="text-[11px] text-[#8a8a8a] m-0">
                      Porción: {a.cantidadPorcion ? `${a.cantidadPorcion} ${a.unidadPorcion}` : `${a.pesoGramos}g`}
                    </p>
                  </div>
                  <span
                    className="text-[10px] font-bold px-1.5 py-0.5 rounded whitespace-nowrap flex-shrink-0"
                    style={{ background: col + '22', color: col, border: `1px solid ${col}44` }}
                  >
                    {lbl}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* ─── Fila de cantidades ─── */}
      <div className="grid grid-cols-4 gap-2">
        <div>
          <label className="text-[10px] text-text-muted uppercase tracking-wider block mb-1">Cantidad</label>
          <input
            type="number"
            value={cantidad}
            onChange={(e) => handleCantidadChange(e.target.value)}
            className="w-full bg-bg-base px-2 py-2 rounded-[6px] text-[12px] font-medium text-text-primary text-center outline-none border border-border-subtle focus:border-[#444]"
            placeholder="0"
          />
        </div>
        <div>
          <label className="text-[10px] text-text-muted uppercase tracking-wider block mb-1">Unidad</label>
          <input
            value={unidad}
            onChange={(e) => {
              setUnidad(e.target.value);
              onUpdate({ unidad: e.target.value });
            }}
            className="w-full bg-bg-base px-2 py-2 rounded-[6px] text-[12px] font-medium text-text-primary text-center outline-none border border-border-subtle focus:border-[#444]"
            placeholder="GR"
          />
        </div>
        <div>
          <label className="text-[10px] text-text-muted uppercase tracking-wider block mb-1">
            Eq.{selectedAlimento ? ' (auto)' : ''}
          </label>
          <input
            type="number"
            value={eqCantidad}
            onChange={(e) => handleEqManualChange('eqCantidad', e.target.value)}
            className={`w-full bg-bg-base px-2 py-2 rounded-[6px] text-[12px] font-medium text-center outline-none border transition-colors ${selectedAlimento ? 'text-[#90c2ff] border-[#90c2ff]/30' : 'text-text-primary border-border-subtle focus:border-[#444]'}`}
            placeholder="0"
          />
        </div>
        <div>
          <label className="text-[10px] text-text-muted uppercase tracking-wider block mb-1">Grupo</label>
          <input
            value={eqGrupo}
            onChange={(e) => handleEqManualChange('eqGrupo', e.target.value)}
            className={`w-full bg-bg-base px-2 py-2 rounded-[6px] text-[12px] font-medium text-center outline-none border transition-colors ${selectedAlimento ? 'text-[#90c2ff] border-[#90c2ff]/30' : 'text-text-primary border-border-subtle focus:border-[#444]'}`}
            placeholder="Grupo"
          />
        </div>
      </div>

      {/* Preview line */}
      {(eqCantidad && parseFloat(eqCantidad) > 0 && eqGrupo) && (
        <p className="text-[11px] text-text-muted bg-bg-base px-2 py-1 rounded-[4px] border border-border-default inline-block m-0">
          {cantidad} {unidad} {query} → <span className="font-bold text-[#90c2ff]">{eqCantidad} Eq {eqGrupo}</span>
        </p>
      )}
    </div>
  );
};

export default SmaeIngredientePicker;
