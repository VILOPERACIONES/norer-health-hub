import { useState, useEffect, useRef, useCallback } from 'react';
import { Search, X, Check, Plus } from 'lucide-react';
import api from '@/lib/api';
import type { Ingrediente, EquivalenciaItem } from '@/types';
import { normalizeGroup, SMAE_GROUP_LABELS } from '@/lib/smaeGroups';

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

const GRUPO_COLORS: Record<string, string> = {
  verduras: '#22c55e', frutas: '#f59e0b',
  cerealSinGr: '#a78bfa', cerealConGr: '#7c3aed',
  leguminosas: '#84cc16',
  aoaMuyBajo: '#38bdf8', aoaBajo: '#0ea5e9', aoaModerado: '#0284c7', aoaAlto: '#0369a1',
  lecheDesc: '#f472b6', lecheSemi: '#e879f9', lecheEntera: '#d946ef', lecheAz: '#c026d3',
  grasaSinProt: '#fb923c', grasaConProt: '#ef4444',
  azSinGr: '#fbbf24', azConGr: '#d97706',
};

interface SmaeAlimento {
  id: string;
  nombre: string;
  grupo: string;
  pesoGramos: number;       // gramos por 1 equivalencia ← ancla de cálculo
  porcionCasera?: string;
  cantidadPorcion?: number;
  unidadPorcion?: string;
  equivalencias?: { grupo: string; cantidad: number | string }[]; // Multi-grupo
}

interface Props {
  ingrediente: Ingrediente;
  index: number;
  onUpdate: (updated: Partial<Ingrediente>) => void;
  onRemove: () => void;
}

// ─── Caché en módulo ─────────────────────────────────────────────────────────
let _smaeCache: SmaeAlimento[] | null = null;
const loadSmae = async (): Promise<SmaeAlimento[]> => {
  if (_smaeCache) return _smaeCache;
  const { data } = await api.get('/api/alimentos-smae');
  _smaeCache = data?.data || data || [];
  return _smaeCache!;
};

// ─── Componente ───────────────────────────────────────────────────────────────
export const SmaeIngredientePicker = ({ ingrediente: ing, index, onUpdate, onRemove }: Props) => {
  const [allAlimentos, setAllAlimentos] = useState<SmaeAlimento[]>([]);
  const [query, setQuery] = useState(ing.descripcion || '');
  const [results, setResults] = useState<SmaeAlimento[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);

  // ─── Estado de cantidades ──────────────────────────────────────────────────
  const [cantidad, setCantidad] = useState<string>(ing.cantidad?.toString() || '');
  const [unidad, setUnidad]     = useState(ing.unidad || 'GR');

  // ─── smaeGrPorEq: gramos por 1 equivalencia (persiste en BD) ──────────────
  // Si el ingrediente ya tiene este valor (reload desde BD), lo usamos directamente.
  // Si no, lo derivamos del catálogo cuando el usuario selecciona.
  const [smaeGrPorEq, setSmaeGrPorEq] = useState<number>(ing.smaeGrPorEq || 0);
  const [smaeGrupoKey, setSmaeGrupoKey] = useState<string>(''); // clave interna del grupo (ej. 'aoaMuyBajo')

  // ─── Multi-equivalencias ───────────────────────────────────────────────────
  const initEquivs = (): EquivalenciaItem[] => {
    if (ing.equivalencias && ing.equivalencias.length > 0) return ing.equivalencias;
    if (ing.eqCantidad !== undefined && ing.eqGrupo) {
      return [{ cantidad: ing.eqCantidad, grupo: ing.eqGrupo }];
    }
    return [{ cantidad: '', grupo: '' }];
  };
  const [equivalencias, setEquivalencias] = useState<EquivalenciaItem[]>(initEquivs);

  // ─── Combobox state for grupo equivalencia inputs ──────────────────────────
  const [focusedEquivIdx, setFocusedEquivIdx] = useState<number | null>(null);
  const [grupoInputValues, setGrupoInputValues] = useState<Record<number, string>>({});
  const equivRefs = useRef<Record<number, HTMLDivElement | null>>({});

  // Close grupo dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (focusedEquivIdx !== null) {
        const ref = equivRefs.current[focusedEquivIdx];
        if (ref && !ref.contains(e.target as Node)) {
          setFocusedEquivIdx(null);
        }
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [focusedEquivIdx]);

  // ─── Quick Modal ───────────────────────────────────────────────────────────
  const [showQuickModal, setShowQuickModal] = useState(false);
  const [quickGrupo, setQuickGrupo] = useState('verduras');
  const [quickGramos, setQuickGramos] = useState('');
  const [quickPorcion, setQuickPorcion] = useState('');
  const [isSavingQuick, setIsSavingQuick] = useState(false);

  const wrapperRef = useRef<HTMLDivElement>(null);
  const hasUserTyped = useRef(false);

  // ─── Carga catálogo una sola vez ───────────────────────────────────────────
  useEffect(() => { loadSmae().then(setAllAlimentos); }, []);

  // ─── Cerrar dropdown al hacer clic afuera ─────────────────────────────────
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // ─── Filtro de búsqueda ────────────────────────────────────────────────────
  useEffect(() => {
    if (!hasUserTyped.current) return;
    if (!query || query.length < 2) { setResults([]); return; }
    const q = query.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const filtered = allAlimentos.filter(a => {
      const name = a.nombre.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      return name.includes(q);
    }).slice(0, 12);
    setResults(filtered);
    setShowDropdown(filtered.length > 0);
  }, [query, allAlimentos]);

  // ─── Función núcleo: calcular eq a partir de gramos ───────────────────────
  // Usa smaeGrPorEq. Sólo actualiza el primer grupo de equivalencias (el del catálogo).
  const grToEq = (gr: number, grxeq: number): number =>
    grxeq > 0 ? parseFloat((gr / grxeq).toFixed(2)) : 0;

  // ─── Función inversa: calcular gramos a partir de eq ─────────────────────
  const eqToGr = (eq: number, grxeq: number): number =>
    grxeq > 0 ? parseFloat((eq * grxeq).toFixed(1)) : 0;

  // ─── Seleccionar alimento del catálogo ────────────────────────────────────
  const handleSelect = (alimento: SmaeAlimento) => {
    setQuery(alimento.nombre);
    setShowDropdown(false);

    const grPorEq = alimento.pesoGramos;          // ancla
    const grupoKey = alimento.grupo;
    const eqLabel = GRUPO_LABELS[grupoKey] || grupoKey;
    const grupoColor = GRUPO_COLORS[grupoKey] || '#8a8a8a';

    // Porción por defecto: porción casera si existe, si no pesoGramos en GR
    const cantFinal = alimento.cantidadPorcion ?? grPorEq;
    const uFinal    = alimento.cantidadPorcion ? (alimento.unidadPorcion || 'PZA') : 'GR';

    // Para calcular eq, convertimos a GR
    const totalGr = alimento.cantidadPorcion ? grPorEq : cantFinal;
    const eqVal = grToEq(totalGr, grPorEq);

    const newEquivs: EquivalenciaItem[] = [{ cantidad: eqVal, grupo: eqLabel }];

    setSmaeGrPorEq(grPorEq);
    setSmaeGrupoKey(grupoKey);
    setCantidad(cantFinal.toString());
    setUnidad(uFinal);
    setEquivalencias(newEquivs);

    // Restaurar equivalencias adicionales del catálogo SMAE si existen
    // (se incorporan como grupos adicionales en el array de equivalencias)
    const eqsExtra = Array.isArray(alimento.equivalencias) ? alimento.equivalencias : [];
    if (eqsExtra.length > 0) {
      const allEquivs = [...newEquivs, ...eqsExtra];
      setEquivalencias(allEquivs);
    }
    onUpdate({
      descripcion: alimento.nombre,
      cantidad: cantFinal,
      unidad: uFinal,
      smaeGrPorEq: grPorEq,
      equivalencias: newEquivs,
      eqCantidad: eqVal,
      eqGrupo: eqLabel,
    });
  };

  // ─── Cambio en GRAMOS → recalcular eq ────────────────────────────────────
  // Sólo funciona cuando smaeGrPorEq > 0 (alimento del catálogo)
  const handleCantidadChange = (val: string) => {
    const num = parseFloat(val);
    setCantidad(val);

    if (smaeGrPorEq > 0 && num > 0) {
      // Convertir a GR si la unidad no es GR (asumimos que se ingresa en GR cuando no hay porción casera)
      const totalGr = unidad === 'GR' ? num : num; // simplicidad: asumir siempre GR en modo ingreso manual
      const eqVal = grToEq(totalGr, smaeGrPorEq);
      const newEquivs = equivalencias.map((e, i) =>
        i === 0 ? { ...e, cantidad: eqVal } : e
      );
      setEquivalencias(newEquivs);
      onUpdate({ cantidad: num, unidad, equivalencias: newEquivs, eqCantidad: eqVal, eqGrupo: newEquivs[0].grupo });
    } else {
      onUpdate({ cantidad: num || 0, unidad });
    }
  };

  // ─── Cambio en EQ (primer grupo) → recalcular gramos ─────────────────────
  const handlePrimerEqChange = (val: string) => {
    const eqNum = parseFloat(val);
    updateEquiv(0, 'cantidad', val);   // actualiza el array de equivalencias

    if (smaeGrPorEq > 0 && eqNum > 0) {
      const newGr = eqToGr(eqNum, smaeGrPorEq);
      setCantidad(newGr.toString());
      setUnidad('GR');
      onUpdate({ cantidad: newGr, unidad: 'GR' });
    }
  };

  // ─── Helpers de multi-equivalencias ───────────────────────────────────────
  const updateEquiv = (idx: number, field: 'cantidad' | 'grupo', val: string, shouldNormalize = false) => {
    const finalVal = field === 'grupo' && shouldNormalize ? normalizeGroup(val) : val;
    const newEquivs = equivalencias.map((e, i) =>
      i === idx ? { ...e, [field]: field === 'cantidad' ? (parseFloat(finalVal as string) || finalVal) : finalVal } : e
    );
    setEquivalencias(newEquivs);
    onUpdate({
      equivalencias: newEquivs,
      eqCantidad: parseFloat(newEquivs[0].cantidad.toString()) || 0,
      eqGrupo: newEquivs[0].grupo,
    });
  };

  /** Select a grupo from the dropdown suggestions */
  const selectGrupoForEquiv = (idx: number, grupo: string) => {
    // Clear the input override
    setGrupoInputValues(prev => { const next = { ...prev }; delete next[idx]; return next; });
    updateEquiv(idx, 'grupo', grupo, true);
    setFocusedEquivIdx(null);
  };

  /** Commit the current grupo input value (normalize on blur) */
  const commitGrupoInput = (idx: number) => {
    const rawVal = grupoInputValues[idx] ?? equivalencias[idx]?.grupo ?? '';
    if (rawVal.trim()) {
      updateEquiv(idx, 'grupo', rawVal, true);
    }
    setGrupoInputValues(prev => { const next = { ...prev }; delete next[idx]; return next; });
    // Delay closing to allow click on dropdown items
    setTimeout(() => setFocusedEquivIdx(null), 150);
  };

  /** Get the display value for grupo input */
  const getGrupoDisplayValue = (idx: number): string => {
    if (grupoInputValues[idx] !== undefined) return grupoInputValues[idx];
    return equivalencias[idx]?.grupo?.toString() ?? '';
  };

  /** Get filtered suggestions for the grupo input */
  const getGrupoSuggestions = (idx: number): string[] => {
    const raw = (grupoInputValues[idx] ?? '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    if (!raw) return SMAE_GROUP_LABELS;
    return SMAE_GROUP_LABELS.filter(label =>
      label.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').includes(raw)
    );
  };

  const addEquiv = () => setEquivalencias(prev => [...prev, { cantidad: '', grupo: '' }]);

  const removeEquiv = (idx: number) => {
    if (equivalencias.length <= 1) return;
    const newEquivs = equivalencias.filter((_, i) => i !== idx);
    setEquivalencias(newEquivs);
    setGrupoInputValues(prev => { const next = { ...prev }; delete next[idx]; return next; });
    onUpdate({ equivalencias: newEquivs, eqCantidad: parseFloat(newEquivs[0].cantidad.toString()) || 0, eqGrupo: newEquivs[0].grupo });
  };

  // ─── Quick Save al catálogo SMAE ──────────────────────────────────────────
  const handleSaveQuickFood = async () => {
    if (!quickGramos || parseFloat(quickGramos) <= 0) return;
    setIsSavingQuick(true);
    try {
      const payload = {
        nombre: query,
        grupo: quickGrupo,
        pesoGramos: parseFloat(quickGramos),
        esPersonalizado: true,
        porcionCasera: quickPorcion || '',
        cantidadPorcion: null,
        unidadPorcion: '',
      };
      const { data } = await api.post('/api/alimentos-smae', payload);
      const newFood = data?.data || data;
      if (_smaeCache) _smaeCache.push(newFood);
      setAllAlimentos(prev => [...prev, newFood]);
      handleSelect(newFood);
      setShowQuickModal(false);
      setQuickGramos(''); setQuickPorcion('');
    } catch (err) {
      console.error('Error al guardar alimento rápido:', err);
    } finally {
      setIsSavingQuick(false);
    }
  };

  // ─── Datos derivados para el badge del grupo ───────────────────────────────
  const grupoColor = smaeGrupoKey ? (GRUPO_COLORS[smaeGrupoKey] || '#8a8a8a') : '#8a8a8a';
  const grupoLabel = smaeGrupoKey ? (GRUPO_LABELS[smaeGrupoKey] || smaeGrupoKey) : null;
  const hasSmae = smaeGrPorEq > 0;

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
                hasUserTyped.current = true;
                setQuery(e.target.value);
                // Si el usuario escribe libremente, pierde el ancla SMAE
                if (smaeGrPorEq > 0) setSmaeGrPorEq(0);
                onUpdate({ descripcion: e.target.value });
              }}
              onFocus={() => hasUserTyped.current && results.length > 0 && setShowDropdown(true)}
              placeholder="Buscar en catálogo SMAE o escribir libre..."
              className="w-full pl-8 pr-28 py-2 bg-bg-base rounded-[6px] text-[13px] text-text-primary outline-none border border-border-subtle focus:border-[#555] transition-colors"
            />
            {grupoLabel && (
              <span
                className="absolute right-2 top-1/2 -translate-y-1/2 px-1.5 py-0.5 rounded text-[10px] font-bold"
                style={{ background: grupoColor + '22', color: grupoColor, border: `1px solid ${grupoColor}44` }}
              >
                {grupoLabel}
              </span>
            )}
          </div>
          <button type="button" onClick={onRemove} className="text-text-muted hover:text-accent-red px-2 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Dropdown */}
        {showDropdown && (
          <div className="absolute z-50 left-0 right-8 mt-1 bg-[#111] border border-[#333] rounded-[8px] shadow-2xl flex flex-col overflow-hidden">
            <div className="max-h-56 overflow-y-auto w-full">
              {results.length > 0 ? results.map((a) => {
                const col = GRUPO_COLORS[a.grupo] || '#8a8a8a';
                const lbl = GRUPO_LABELS[a.grupo] || a.grupo;
                return (
                  <button
                    key={a.id} type="button"
                    onMouseDown={(e) => { e.preventDefault(); handleSelect(a); }}
                    className="w-full text-left px-3 py-2 hover:bg-[#1a1a1a] transition-colors flex items-center justify-between gap-3 border-b border-[#222] last:border-0"
                  >
                    <div>
                      <p className="text-[13px] font-medium text-white m-0">{a.nombre}</p>
                      <p className="text-[11px] text-[#8a8a8a] m-0">
                        {a.pesoGramos}g = 1 eq · {a.cantidadPorcion ? `${a.cantidadPorcion} ${a.unidadPorcion}` : `${a.pesoGramos}g`} por porción
                      </p>
                    </div>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded whitespace-nowrap flex-shrink-0"
                      style={{ background: col + '22', color: col, border: `1px solid ${col}44` }}>
                      {lbl}
                    </span>
                  </button>
                );
              }) : (
                <div className="p-3 text-[12px] text-[#888] text-center w-full">No se encontraron resultados</div>
              )}
            </div>
            {query.trim().length >= 2 && (
              <button type="button"
                onMouseDown={(e) => { e.preventDefault(); setShowQuickModal(true); setShowDropdown(false); }}
                className="w-full text-center px-3 py-2.5 hover:bg-[#1a1a1a] transition-colors border-t border-[#333] text-[#90c2ff] font-medium text-[12px] flex items-center justify-center bg-[#111]">
                ⭐ Guardar "{query}" en Catálogo SMAE
              </button>
            )}
          </div>
        )}

        {/* Quick Modal */}
        {showQuickModal && (
          <div className="bg-[#1a1a1a] border border-[#333] rounded-[8px] p-3 mt-2 space-y-3 animate-slide-up relative z-40 shadow-xl">
            <p className="text-[12px] font-bold text-white mb-2">⭐ Añadir "{query}" al Catálogo SMAE</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] text-text-muted uppercase tracking-wider block mb-1">Grupo SMAE</label>
                <select value={quickGrupo} onChange={(e) => setQuickGrupo(e.target.value)}
                  className="w-full bg-[#111] px-2 py-1.5 rounded-[4px] text-[12px] text-white border border-[#333] outline-none">
                  {Object.entries(GRUPO_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[10px] text-text-muted uppercase tracking-wider block mb-1">Gramos × 1 eq</label>
                <input type="number" value={quickGramos} onChange={(e) => setQuickGramos(e.target.value)}
                  placeholder="Ej. 30"
                  className="w-full bg-[#111] px-2 py-1.5 rounded-[4px] text-[12px] text-white border border-[#333] outline-none placeholder:text-[#555]" />
              </div>
              <div className="col-span-2">
                <label className="text-[10px] text-text-muted uppercase tracking-wider block mb-1">Porción Casera (Opcional)</label>
                <input type="text" value={quickPorcion} onChange={(e) => setQuickPorcion(e.target.value)}
                  placeholder="Ej. 1 taza, 1 pieza, 2 cdas"
                  className="w-full bg-[#111] px-2 py-1.5 rounded-[4px] text-[12px] text-white border border-[#333] outline-none placeholder:text-[#555]" />
              </div>
            </div>
            <div className="flex items-center justify-between pt-1 mt-2">
              <span className="text-[10px] text-[#777] italic">Se guardará permanentemente en el catálogo</span>
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => setShowQuickModal(false)}
                  className="text-[11px] text-[#8a8a8a] hover:text-white px-2 py-1 rounded transition-colors border border-transparent hover:border-[#444]">
                  Cancelar
                </button>
                <button type="button" onClick={handleSaveQuickFood}
                  disabled={isSavingQuick || !quickGramos || parseFloat(quickGramos) <= 0}
                  className="text-[11px] font-bold bg-brand-primary text-bg-base px-3 py-1.5 rounded-[4px] hover:bg-white transition-colors disabled:opacity-50 flex items-center gap-1 shadow-sm">
                  {isSavingQuick ? 'Guardando...' : <><Check className="w-3 h-3" /> Guardar y Usar</>}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ─── Cantidad / Unidad ─── */}
      <div className="grid grid-cols-2 gap-2 mb-2">
        <div>
          <label className="text-[10px] text-text-muted uppercase tracking-wider block mb-1">
            Cantidad{hasSmae ? ' (GR)' : ''}
          </label>
          <input
            type="number"
            value={cantidad}
            onChange={(e) => handleCantidadChange(e.target.value)}
            className={`w-full bg-bg-base px-2 py-2 rounded-[6px] text-[12px] font-medium text-center outline-none border transition-colors ${hasSmae ? 'text-[#90c2ff] border-[#90c2ff]/30 focus:border-[#90c2ff]' : 'text-text-primary border-border-subtle focus:border-[#444]'}`}
            placeholder="0"
          />
        </div>
        <div>
          <label className="text-[10px] text-text-muted uppercase tracking-wider block mb-1">Unidad</label>
          <input
            value={unidad}
            onChange={(e) => { setUnidad(e.target.value); onUpdate({ unidad: e.target.value }); }}
            className="w-full bg-bg-base px-2 py-2 rounded-[6px] text-[12px] font-medium text-text-primary text-center outline-none border border-border-subtle focus:border-[#444]"
            placeholder="GR"
          />
        </div>
      </div>

      {/* ─── EQUIVALENCIAS ─── */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between mb-1">
          <label className="text-[10px] uppercase tracking-wider text-text-muted">
            Equivalencias{hasSmae ? ' (auto ↔ GR)' : ' (manual)'}
          </label>
          <button type="button" onClick={addEquiv}
            className="flex items-center gap-1 text-[10px] text-[#90c2ff] hover:text-white transition-colors px-1.5 py-0.5 rounded hover:bg-[#1a2a3a]">
            <Plus className="w-3 h-3" /> Añadir grupo
          </button>
        </div>

        {equivalencias.map((eq, idx) => {
          const grupoDisplay = getGrupoDisplayValue(idx);
          const isGrupoFocused = focusedEquivIdx === idx;
          const suggestions = isGrupoFocused ? getGrupoSuggestions(idx) : [];

          return (
          <div key={idx} className="flex items-center gap-1.5">
            {idx > 0 && <span className="text-[10px] font-bold text-[#555] w-4 text-center flex-shrink-0">+</span>}
            {idx === 0 && <span className="w-4 flex-shrink-0" />}

            {/* Cantidad eq — si es idx 0 y tiene ancla SMAE, el cambio regenera los gramos */}
            <input
              type="number"
              value={eq.cantidad.toString()}
              onChange={(e) => idx === 0 && hasSmae ? handlePrimerEqChange(e.target.value) : updateEquiv(idx, 'cantidad', e.target.value)}
              className={`w-16 bg-bg-base px-2 py-1.5 rounded-[6px] text-[12px] font-medium text-center outline-none border transition-colors flex-shrink-0 ${
                hasSmae && idx === 0 ? 'text-[#90c2ff] border-[#90c2ff]/30' : 'text-text-primary border-border-subtle focus:border-[#444]'
              }`}
              placeholder="0"
            />
            <span className="text-[10px] text-[#555] flex-shrink-0">eq</span>

            {/* Grupo combobox con sugerencias */}
            <div className="relative flex-1" ref={el => { equivRefs.current[idx] = el; }}>
              <input
                value={grupoDisplay}
                onChange={(e) => {
                  setGrupoInputValues(prev => ({ ...prev, [idx]: e.target.value }));
                  setFocusedEquivIdx(idx);
                }}
                onFocus={() => setFocusedEquivIdx(idx)}
                onBlur={() => commitGrupoInput(idx)}
                className={`w-full bg-bg-base px-2 py-1.5 rounded-[6px] text-[12px] font-medium outline-none border transition-colors ${
                  hasSmae && idx === 0 ? 'text-[#90c2ff] border-[#90c2ff]/30' : 'text-text-primary border-border-subtle focus:border-[#444]'
                }`}
                placeholder="Grupo (ej. AOA Muy Bajo)"
              />
              {isGrupoFocused && suggestions.length > 0 && (
                <div className="absolute z-50 left-0 right-0 bottom-full mb-1 bg-[#111] border border-[#444] rounded-[8px] shadow-[0_4px_16px_rgba(0,0,0,0.5)] max-h-[180px] overflow-y-auto custom-scrollbar">
                  {suggestions.map(label => {
                    const col = GRUPO_COLORS[Object.entries(GRUPO_LABELS).find(([, v]) => v === label)?.[0] || ''] || '#8a8a8a';
                    return (
                      <button
                        key={label}
                        type="button"
                        onMouseDown={(e) => { e.preventDefault(); selectGrupoForEquiv(idx, label); }}
                        className="w-full text-left px-3 py-2 text-[12px] font-medium text-[#ccc] hover:bg-[#1a1a1a] hover:text-white transition-colors flex items-center gap-2 border-b border-[#222] last:border-0"
                      >
                        <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: col }} />
                        {label}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {equivalencias.length > 1 && (
              <button type="button" onClick={() => removeEquiv(idx)}
                className="text-[#555] hover:text-accent-red transition-colors p-1 flex-shrink-0">
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
          );
        })}

        {/* Chip de ancla SMAE — muestra cuántos g = 1 eq */}
        {hasSmae && (
          <p className="text-[10px] text-[#555] italic">
            📐 {smaeGrPorEq}g = 1 eq · cambia GR o EQ y el otro se ajusta automático
          </p>
        )}

        {/* Preview de la fórmula completa */}
        {equivalencias.some(e => e.cantidad && e.grupo) && (
          <p className="text-[11px] text-text-muted bg-bg-base px-2 py-1 rounded-[4px] border border-border-default inline-block m-0 mt-1">
            {cantidad} {unidad} {query} →{' '}
            <span className="font-bold text-[#90c2ff]">
              {equivalencias
                .filter(e => e.cantidad && e.grupo)
                .map(e => `${e.cantidad} Eq ${e.grupo}`)
                .join(' + ')}
            </span>
          </p>
        )}
      </div>
    </div>
  );
};

export default SmaeIngredientePicker;
