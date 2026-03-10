import { useState, useMemo, useRef, useCallback } from 'react';
import { Plus, X, Check, AlertCircle, RotateCcw, Trash2, GripHorizontal } from 'lucide-react';

// ─── Tipos ────────────────────────────────────────────────────────────────────
export interface BarridoData {
  tiempos: string[];
  porciones: Record<string, number>;
  distribucion: Record<string, Record<string, number>>;
  kcalTotal: number;
  /** Kcal manuales por tiempo — si existe y es > 0, prevalece sobre el cálculo automático */
  kcalManuales?: Record<string, number>;
  /** Energía total manual — si está seteada, reemplaza la suma automática */
  energiaTotalManual?: number | null;
  /** Es válido cuando la distribución coincide con las porciones para TODOS los grupos. */
  isValid?: boolean;
}

interface BarridoEquivalenciasProps {
  value: BarridoData | null;
  onChange: (data: BarridoData) => void;
}

// ─── Constantes ───────────────────────────────────────────────────────────────
const KCAL_POR_EQ: Record<string, number> = {
  verduras: 0,
  frutas: 60,
  cerealSinGr: 70,
  cerealConGr: 115,
  leguminosas: 120,
  aoaMuyBajo: 40,
  aoaBajo: 55,
  aoaModerado: 75,
  aoaAlto: 100,
  lecheDesc: 95,
  lecheSemi: 110,
  lecheEntera: 150,
  lecheAz: 200,
  grasaSinProt: 45,
  grasaConProt: 70,
  azSinGr: 40,
  azConGr: 85,
};

const GRUPOS: { key: string; label: string }[] = [
  { key: 'verduras',     label: 'Verduras' },
  { key: 'frutas',       label: 'Frutas' },
  { key: 'cerealSinGr',  label: 'C y T sin grasa' },
  { key: 'cerealConGr',  label: 'C y T con grasa' },
  { key: 'leguminosas',  label: 'Leguminosas' },
  { key: 'aoaMuyBajo',   label: 'AOA muy bajo' },
  { key: 'aoaBajo',      label: 'AOA bajo' },
  { key: 'aoaModerado',  label: 'AOA moderado' },
  { key: 'aoaAlto',      label: 'AOA alto' },
  { key: 'lecheDesc',    label: 'Leche descremada' },
  { key: 'lecheSemi',    label: 'Leche semidescremada' },
  { key: 'lecheEntera',  label: 'Leche entera' },
  { key: 'lecheAz',      label: 'Leche azucarada' },
  { key: 'grasaSinProt', label: 'A y G sin proteína' },
  { key: 'grasaConProt', label: 'A y G con proteína' },
  { key: 'azSinGr',      label: 'Az sin grasa' },
  { key: 'azConGr',      label: 'Az con grasa' },
];

const DEFAULT_TIEMPOS = ['Desayuno', 'Colación', 'Almuerzo', 'Merienda', 'Cena'];

// ─── Helper: parsear número desde string ──────────────────────────────────────
const parseNum = (v: string) => {
  const n = parseFloat(v.replace(',', '.'));
  return isNaN(n) || n < 0 ? 0 : n;
};

// ─── Estado inicial ───────────────────────────────────────────────────────────
const buildInitial = (value: BarridoData | null): BarridoData => ({
  tiempos: value?.tiempos?.length ? value.tiempos : [...DEFAULT_TIEMPOS],
  porciones: value?.porciones ?? {},
  distribucion: value?.distribucion ?? {},
  kcalTotal: value?.kcalTotal ?? 0,
  kcalManuales: value?.kcalManuales ?? {},
  energiaTotalManual: value?.energiaTotalManual ?? null,
});

// ─── Estilos reutilizables tipo Excel ─────────────────────────────────────────
// Celda input — apariencia de celda Excel: sin bordes redondeados, borde sólido
const cellCls =
  'w-full h-full text-center bg-transparent border-0 outline-none text-[13px] text-[#e0e0e0] font-mono ' +
  'focus:bg-[#1a2640] transition-colors placeholder:text-[#444] ' +
  '[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none';

// ─── Componente ───────────────────────────────────────────────────────────────
const BarridoEquivalencias = ({ value, onChange }: BarridoEquivalenciasProps) => {
  const [state, setState] = useState<BarridoData>(() => buildInitial(value));
  const [editingTiempo, setEditingTiempo] = useState<number | null>(null);
  const [newTiempoName, setNewTiempoName] = useState('');
  const [energiaInputStr, setEnergiaInputStr] = useState('');
  const [draggedColIdx, setDraggedColIdx] = useState<number | null>(null);
  const tableRef = useRef<HTMLTableElement>(null);

  const handleDragStart = (e: React.DragEvent, idx: number) => {
    setDraggedColIdx(idx);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault(); // Necesario para permitir onDrop
  };

  const handleDrop = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    if (draggedColIdx === null || draggedColIdx === idx) return;

    const newTiempos = [...tiempos];
    const [moved] = newTiempos.splice(draggedColIdx, 1);
    newTiempos.splice(idx, 0, moved);

    commit({ ...state, tiempos: newTiempos });
    setDraggedColIdx(null);
  };

  // ─── Navegar celdas con teclado (Tabla Excel) ────────────────────────────────
  const focusCell = useCallback((row: number, col: number) => {
    const el = tableRef.current?.querySelector<HTMLInputElement>(
      `input[data-row="${row}"][data-col="${col}"]`
    );
    if (el) { el.focus(); el.select(); }
  }, []);

  const handleCellKey = useCallback((e: React.KeyboardEvent<HTMLInputElement>, row: number, col: number, totalCols: number) => {
    // col 0 = Porciones, col 1..N = tiempos
    const totalRows = GRUPOS.length;
    let nextRow = row;
    let nextCol = col;
    let handled = false;

    if (e.key === 'ArrowRight' || (e.key === 'Tab' && !e.shiftKey)) {
      if (col < totalCols) { nextCol = col + 1; } else { nextCol = 0; nextRow = (row + 1) % totalRows; }
      handled = true;
    } else if (e.key === 'ArrowLeft' || (e.key === 'Tab' && e.shiftKey)) {
      if (col > 0) { nextCol = col - 1; } else { nextCol = totalCols; nextRow = (row - 1 + totalRows) % totalRows; }
      handled = true;
    } else if (e.key === 'ArrowDown' || e.key === 'Enter') {
      nextRow = (row + 1) % totalRows;
      handled = true;
    } else if (e.key === 'ArrowUp') {
      nextRow = (row - 1 + totalRows) % totalRows;
      handled = true;
    }

    if (handled) {
      e.preventDefault();
      focusCell(nextRow, nextCol);
    }
  }, [focusCell]);

  const { tiempos, porciones, distribucion, kcalManuales = {}, energiaTotalManual } = state;

  // ─── Kcal automática por tiempo ─────────────────────────────────────────────
  const colKcalAuto = (tiempo: string) =>
    GRUPOS.reduce(
      (s, { key }) => s + (distribucion[tiempo]?.[key] ?? 0) * KCAL_POR_EQ[key],
      0
    );

  const colKcalEfectiva = (tiempo: string) => {
    const manual = kcalManuales[tiempo];
    return manual != null && manual > 0 ? manual : colKcalAuto(tiempo);
  };

  const kcalTotalAuto = useMemo(
    () => tiempos.reduce((s, t) => s + colKcalEfectiva(t), 0),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [tiempos, distribucion, kcalManuales]
  );

  // Energía total: manual tiene prioridad sobre auto
  const kcalTotal =
    energiaTotalManual != null && energiaTotalManual > 0
      ? energiaTotalManual
      : kcalTotalAuto;

  const getCell = (tiempo: string, grupo: string) =>
    distribucion[tiempo]?.[grupo] ?? 0;

  const rowTotal = (grupo: string) =>
    tiempos.reduce((s, t) => s + getCell(t, grupo), 0);

  // ─── Commit ──────────────────────────────────────────────────────────────────
  const commit = (next: BarridoData) => {
    const autoTotal = next.tiempos.reduce((s, t) => {
      const manual = next.kcalManuales?.[t];
      const auto = GRUPOS.reduce(
        (gs, { key }) => gs + (next.distribucion[t]?.[key] ?? 0) * KCAL_POR_EQ[key],
        0
      );
      return s + (manual != null && manual > 0 ? manual : auto);
    }, 0);
    const totalFinal =
      next.energiaTotalManual != null && next.energiaTotalManual > 0
        ? next.energiaTotalManual
        : Math.round(autoTotal);
    
    // Validar si la distribución suma exactamente la porción para TODOS los grupos
    const isValid = GRUPOS.every(({ key }) => {
      const porcion = next.porciones[key] || 0;
      const total = next.tiempos.reduce((s, t) => s + (next.distribucion[t]?.[key] || 0), 0);
      return Math.abs(porcion - total) < 0.01; // Usar tolerancia en vez de ===
    });

    const updated = { ...next, kcalTotal: totalFinal, isValid };
    setState(updated);
    setTimeout(() => onChange(updated), 0);
  };

  // ─── Manejadores ─────────────────────────────────────────────────────────────
  const setCell = (tiempo: string, grupo: string, val: number) => {
    commit({
      ...state,
      distribucion: {
        ...distribucion,
        [tiempo]: { ...(distribucion[tiempo] || {}), [grupo]: val },
      },
    });
  };

  const setPorcion = (grupo: string, val: number) => {
    commit({ ...state, porciones: { ...porciones, [grupo]: val } });
  };

  const setKcalManual = (tiempo: string, val: number | null) => {
    const next = { ...(kcalManuales || {}) };
    if (val == null || val === 0) delete next[tiempo];
    else next[tiempo] = val;
    commit({ ...state, kcalManuales: next });
  };

  const setEnergiaTotalManual = (val: number | null) => {
    commit({ ...state, energiaTotalManual: val });
  };

  const addTiempo = () => {
    const name = newTiempoName.trim() || `Tiempo ${tiempos.length + 1}`;
    commit({ ...state, tiempos: [...tiempos, name] });
    setNewTiempoName('');
  };

  const clearTable = () => {
    // Si el usuario quiere limpiar por completo (pregunta de confirmación)
    if (!window.confirm('¿Seguro que deseas limpiar todos los datos de la tabla?')) return;
    commit({
      ...state,
      porciones: {},
      distribucion: {},
      kcalManuales: {},
      energiaTotalManual: null,
    });
  };

  const removeTiempo = (idx: number) => {
    if (tiempos.length <= 1) return;
    const t = tiempos[idx];
    const nextDist = { ...distribucion };
    const nextManuales = { ...kcalManuales };
    delete nextDist[t];
    delete nextManuales[t];
    commit({
      ...state,
      tiempos: tiempos.filter((_, i) => i !== idx),
      distribucion: nextDist,
      kcalManuales: nextManuales,
    });
  };

  const renameTiempo = (idx: number, name: string) => {
    const oldName = tiempos[idx];
    const newTiempos = [...tiempos];
    newTiempos[idx] = name;
    const nextDist = { ...distribucion };
    const nextManuales = { ...kcalManuales };
    if (oldName !== name) {
      nextDist[name] = nextDist[oldName] || {};
      delete nextDist[oldName];
      if (nextManuales[oldName] != null) {
        nextManuales[name] = nextManuales[oldName];
        delete nextManuales[oldName];
      }
    }
    commit({ ...state, tiempos: newTiempos, distribucion: nextDist, kcalManuales: nextManuales });
    setEditingTiempo(null);
  };

  // Evitar scroll que cambie valores
  const noScroll = (e: React.WheelEvent<HTMLInputElement>) => e.currentTarget.blur();

  // ─── Colores de cabecera por grupo ──────────────────────────────────────────
  const groupHeaderColor: Record<string, string> = {
    verduras: '#1a3320',
    frutas: '#2e1a0a',
    cerealSinGr: '#1a1a2e',
    cerealConGr: '#1a1a2e',
    leguminosas: '#2e2010',
    aoaMuyBajo: '#1a2e2e',
    aoaBajo: '#1a2e2e',
    aoaModerado: '#1a2e2e',
    aoaAlto: '#1a2e2e',
    lecheDesc: '#2e1a2e',
    lecheSemi: '#2e1a2e',
    lecheEntera: '#2e1a2e',
    lecheAz: '#2e1a2e',
    grasaSinProt: '#2e2a10',
    grasaConProt: '#2e2a10',
    azSinGr: '#2e1a1a',
    azConGr: '#2e1a1a',
  };

  // ─── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-3">
      {/* ── Barra superior ── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        {/* Energía total — EDITABLE MANUAL */}
        <div className="flex items-center gap-2 px-3 py-2 bg-[#111] border border-[#333] rounded-[8px]">
          <span className="text-[12px] font-medium text-[#8a8a8a]">Energía total:</span>
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            value={energiaInputStr}
            placeholder={String(Math.round(kcalTotalAuto))}
            onChange={(e) => {
              const raw = e.target.value.replace(/[^0-9]/g, '');
              setEnergiaInputStr(raw);
              const n = parseInt(raw, 10);
              setEnergiaTotalManual(raw === '' ? null : isNaN(n) ? null : n);
            }}
            onWheel={noScroll}
            className={`w-20 text-center border-0 border-b outline-none text-[15px] font-bold bg-transparent font-mono ${
              energiaTotalManual != null && energiaTotalManual > 0
                ? 'text-[#90c2ff] border-[#3b5bdb]'
                : 'text-[#f0f0f0] border-[#444]'
            }`}
            title="Editable — sobreescribe el total automático"
          />
          <span className="text-[12px] font-medium text-[#8a8a8a]">kcal</span>
          {energiaTotalManual != null && energiaTotalManual > 0 && (
            <button
              type="button"
              onClick={() => { setEnergiaTotalManual(null); setEnergiaInputStr(''); }}
              title="Restablecer automático"
              className="ml-1 text-[#8a8a8a] hover:text-[#f0f0f0] transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Agregar tiempo */}
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Nombre del tiempo..."
            value={newTiempoName}
            onChange={(e) => setNewTiempoName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addTiempo()}
            className="text-[12px] bg-[#111] border border-[#333] rounded-[6px] px-2 py-1.5 text-[#e0e0e0] outline-none focus:border-[#555] w-40 placeholder:text-[#444]"
          />
          <button
            type="button"
            onClick={addTiempo}
            className="flex items-center gap-1 text-[12px] font-medium text-[#8a8a8a] hover:text-[#f0f0f0] px-3 py-1.5 bg-[#111] border border-[#333] rounded-[6px] transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> Agregar
          </button>
          
          <div className="w-[1px] h-6 bg-[#333] mx-1"></div>
          
          <button
            type="button"
            onClick={clearTable}
            title="Limpiar todos los valores y configuraciones"
            className="flex items-center gap-1 text-[12px] font-medium text-[#ff6b6b]/70 hover:text-[#ff6b6b] px-3 py-1.5 bg-[#2e1a1a]/30 hover:bg-[#2e1a1a]/80 border border-[#ff6b6b]/20 hover:border-[#ff6b6b]/50 rounded-[6px] transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" /> Limpiar
          </button>
        </div>
      </div>

      {/* ── TABLA ESTILO EXCEL ── */}
      <div
        className="overflow-x-auto rounded-[4px]"
        style={{ border: '2px solid #2a2a2a' }}
      >
        <table
          ref={tableRef}
          className="w-full text-left text-[13px]"
          style={{
            minWidth: `${300 + tiempos.length * 90}px`,
            borderCollapse: 'collapse',
          }}
        >
          {/* ── CABECERA ── */}
          <thead>
            <tr style={{ backgroundColor: '#1a1a1a', borderBottom: '2px solid #333' }}>
              <th
                className="sticky left-0 z-20"
                style={{
                  padding: '10px 14px',
                  fontSize: '11px',
                  fontWeight: 700,
                  color: '#8a8a8a',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  backgroundColor: '#1a1a1a',
                  borderRight: '2px solid #333',
                  width: '170px',
                  minWidth: '170px',
                }}
              >
                Grupo Alimenticio
              </th>
              <th
                style={{
                  padding: '10px 8px',
                  fontSize: '11px',
                  fontWeight: 700,
                  color: '#8a8a8a',
                  textTransform: 'uppercase',
                  textAlign: 'center',
                  borderRight: '2px solid #333',
                  backgroundColor: '#1a1a1a',
                  width: '70px',
                }}
              >
                Porciones
              </th>
              {tiempos.map((t, idx) => (
                <th
                  key={t}
                  draggable
                  onDragStart={(e) => handleDragStart(e, idx)}
                  onDragOver={(e) => handleDragOver(e, idx)}
                  onDrop={(e) => handleDrop(e, idx)}
                  className="relative group/th transition-all duration-300"
                  style={{
                    padding: '16px 4px 8px 4px',
                    fontSize: '11px',
                    fontWeight: 700,
                    color: '#c0c0c0',
                    textTransform: 'uppercase',
                    textAlign: 'center',
                    borderRight: idx < tiempos.length - 1 ? '1px solid #2a2a2a' : '2px solid #333',
                    backgroundColor: draggedColIdx === idx ? '#2a3a50' : '#1a2030',
                    width: '90px',
                    cursor: 'grab',
                  }}
                >
                  <div className="absolute top-1 left-1/2 -translate-x-1/2 opacity-0 group-hover/th:opacity-100 transition-opacity cursor-grab hover:cursor-grabbing active:cursor-grabbing">
                    <GripHorizontal className="w-[14px] h-[14px] text-[#666] hover:text-[#999]" />
                  </div>
                  {editingTiempo === idx ? (
                    <input
                      autoFocus
                      defaultValue={t}
                      className="text-[11px] bg-transparent border-b border-[#90c2ff] outline-none w-full text-center text-[#90c2ff]"
                      onBlur={(e) => renameTiempo(idx, e.target.value)}
                      onKeyDown={(e) =>
                        e.key === 'Enter' && renameTiempo(idx, (e.target as HTMLInputElement).value)
                      }
                    />
                  ) : (
                    <div className="flex items-center justify-center gap-1 group/thead">
                      <span
                        className="cursor-pointer hover:text-white transition-colors"
                        onDoubleClick={() => setEditingTiempo(idx)}
                        title="Doble clic para renombrar"
                      >
                        {t}
                      </span>
                      {tiempos.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeTiempo(idx)}
                          className="opacity-0 group-hover/thead:opacity-100 text-[#555] hover:text-[#ff6b6b] transition-all"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  )}
                </th>
              ))}
              <th
                style={{
                  padding: '10px 8px',
                  fontSize: '11px',
                  fontWeight: 700,
                  color: '#8a8a8a',
                  textTransform: 'uppercase',
                  textAlign: 'center',
                  backgroundColor: '#1a1a1a',
                  width: '70px',
                }}
              >
                Total
              </th>
            </tr>
          </thead>

          {/* ── CUERPO ── */}
          <tbody>
            {GRUPOS.map(({ key, label }, rowIdx) => {
              const total = rowTotal(key);
              const porcion = porciones[key] ?? 0;
              const match = porcion > 0 ? total === porcion : null;
              const rowBg = rowIdx % 2 === 0 ? '#0f0f0f' : '#121212';
              const hdrBg = groupHeaderColor[key] || '#1a1a1a';

              return (
                <tr
                  key={key}
                  style={{ backgroundColor: rowBg }}
                  className="group/row"
                >
                  {/* Nombre del grupo */}
                  <td
                    className="sticky left-0 z-10"
                    style={{
                      padding: '0 14px',
                      height: '36px',
                      fontSize: '12px',
                      fontWeight: 600,
                      color: '#d0d0d0',
                      backgroundColor: hdrBg,
                      borderRight: '2px solid #333',
                      borderBottom: '1px solid #222',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {label}
                  </td>

                  {/* Porción objetivo */}
                  <td
                    style={{
                      padding: '2px',
                      borderRight: '2px solid #333',
                      borderBottom: '1px solid #222',
                      textAlign: 'center',
                      backgroundColor: rowBg,
                    }}
                  >
                    <input
                      type="text"
                      inputMode="decimal"
                      value={porcion || ''}
                      onChange={(e) => setPorcion(key, parseNum(e.target.value))}
                      onWheel={noScroll}
                      onKeyDown={(e) => handleCellKey(e, rowIdx, 0, tiempos.length)}
                      data-row={rowIdx}
                      data-col={0}
                      placeholder="0"
                      className={cellCls}
                      style={{ height: '32px', color: '#aaa', fontWeight: 700 }}
                    />
                  </td>

                  {/* Celda por tiempo */}
                  {tiempos.map((t, idx) => {
                    const v = getCell(t, key);
                    return (
                      <td
                        key={t}
                        style={{
                          padding: '2px',
                          borderRight: idx < tiempos.length - 1 ? '1px solid #222' : '2px solid #333',
                          borderBottom: '1px solid #222',
                          textAlign: 'center',
                          backgroundColor: rowBg,
                        }}
                      >
                        <input
                          type="text"
                          inputMode="decimal"
                          value={v || ''}
                          onChange={(e) => setCell(t, key, parseNum(e.target.value))}
                          disabled={porcion <= 0}
                          onWheel={noScroll}
                          onKeyDown={(e) => handleCellKey(e, rowIdx, idx + 1, tiempos.length)}
                          data-row={rowIdx}
                          data-col={idx + 1}
                          placeholder={porcion > 0 ? '·' : ''}
                          className={cellCls}
                          style={{
                            height: '32px',
                            backgroundColor: v > 0 ? '#1a2030' : 'transparent',
                            fontWeight: v > 0 ? 700 : 400,
                            color: v > 0 ? '#c8e0ff' : '#333',
                            opacity: porcion <= 0 ? 0.2 : 1,
                            cursor: porcion <= 0 ? 'not-allowed' : 'text',
                          }}
                        />
                      </td>
                    );
                  })}

                  {/* Total fila */}
                  <td
                    style={{
                      padding: '2px 6px',
                      borderBottom: '1px solid #222',
                      textAlign: 'center',
                      backgroundColor: rowBg,
                    }}
                  >
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '3px',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontSize: '13px',
                        fontWeight: 700,
                        fontFamily: 'monospace',
                        backgroundColor:
                          match === true ? '#1a2e1a' : match === false ? '#2e1a1a' : '#1a1a1a',
                        color:
                          match === true ? '#6ee7b7' : match === false ? '#ff6b6b' : '#8a8a8a',
                        border: `1px solid ${match === true ? '#064e3b' : match === false ? '#7f1d1d' : '#2a2a2a'}`,
                      }}
                    >
                      {match === true && <Check style={{ width: 10, height: 10 }} />}
                      {match === false && <AlertCircle style={{ width: 10, height: 10 }} />}
                      {total || '0'}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>

          {/* ── PIE: Kcal por tiempo ── */}
          <tfoot>
            <tr style={{ backgroundColor: '#141420', borderTop: '2px solid #333' }}>
              <td
                className="sticky left-0 z-10"
                style={{
                  padding: '8px 14px',
                  backgroundColor: '#141420',
                  borderRight: '2px solid #333',
                  borderBottom: 'none',
                }}
              >
                <p style={{ margin: 0, fontSize: '11px', fontWeight: 700, color: '#8a8a8a', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Kcal / tiempo
                </p>
                <p style={{ margin: 0, fontSize: '10px', color: '#555', marginTop: '2px' }}>
                  Auto · editable
                </p>
              </td>
              <td style={{ borderRight: '2px solid #333', textAlign: 'center', color: '#444', fontSize: '13px' }}>—</td>

              {tiempos.map((t, idx) => {
                const auto = colKcalAuto(t);
                const manual = kcalManuales[t];
                const isManual = manual != null && manual > 0;
                const efectiva = isManual ? manual! : auto;
                const pct = kcalTotalAuto > 0 ? ((efectiva / kcalTotalAuto) * 100).toFixed(2) : '0.00';

                return (
                  <td
                    key={t}
                    style={{
                      padding: '6px 4px',
                      textAlign: 'center',
                      borderRight: idx < tiempos.length - 1 ? '1px solid #222' : '2px solid #333',
                      position: 'relative',
                    }}
                  >
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                      <div style={{ position: 'relative' }} className="group/kcal">
                        <input
                          type="text"
                          inputMode="numeric"
                          value={isManual ? String(manual) : ''}
                          onChange={(e) => {
                            const raw = e.target.value.replace(/[^0-9]/g, '');
                            const n = parseInt(raw, 10);
                            setKcalManual(t, raw === '' ? null : isNaN(n) ? null : n);
                          }}
                          onWheel={noScroll}
                          placeholder={String(Math.round(auto))}
                          style={{
                            width: '62px',
                            textAlign: 'center',
                            padding: '4px 2px',
                            fontSize: '13px',
                            fontWeight: 700,
                            fontFamily: 'monospace',
                            outline: 'none',
                            border: `1px solid ${isManual ? '#3b5bdb' : '#2a2a2a'}`,
                            borderRadius: '3px',
                            backgroundColor: isManual ? '#111828' : 'transparent',
                            color: isManual ? '#90c2ff' : '#8a8a8a',
                            appearance: 'textfield',
                          }}
                          className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                        {isManual && (
                          <button
                            type="button"
                            onClick={() => setKcalManual(t, null)}
                            title="Restablecer automático"
                            className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-[#1a0a0a] border border-[#7f1d1d] rounded-full flex items-center justify-center opacity-0 group-hover/kcal:opacity-100 transition-opacity hover:bg-[#ff6b6b]"
                          >
                            <RotateCcw className="w-2 h-2 text-[#ff6b6b] hover:text-white" />
                          </button>
                        )}
                      </div>
                      <span style={{ fontSize: '10px', color: '#555', fontFamily: 'monospace' }}>
                        {pct}%
                        {isManual && (
                          <span style={{ color: '#90c2ff', marginLeft: '2px', fontWeight: 700 }}>M</span>
                        )}
                      </span>
                    </div>
                  </td>
                );
              })}

              {/* Total kcal */}
              <td style={{ padding: '8px 6px', textAlign: 'center' }}>
                <p
                  style={{
                    margin: 0,
                    fontSize: '15px',
                    fontWeight: 700,
                    fontFamily: 'monospace',
                    color: energiaTotalManual != null && energiaTotalManual > 0 ? '#90c2ff' : '#f0f0f0',
                  }}
                >
                  {Math.round(kcalTotal)}
                </p>
                <p style={{ margin: 0, fontSize: '10px', color: '#555' }}>kcal</p>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* ── Leyenda ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '11px', color: '#555' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: '#1a2030', border: '1px solid #2a3a50', display: 'inline-block' }} />
          Celda con valor
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: '#111828', border: '1px solid #3b5bdb', display: 'inline-block' }} />
          <span style={{ color: '#90c2ff' }}>M</span> Kcal manual
        </span>
        <span>Doble clic en cabecera para renombrar tiempo</span>
      </div>
    </div>
  );
};

export default BarridoEquivalencias;
