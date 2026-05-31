import { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import { Plus, X, Check, AlertCircle, RotateCcw, Trash2, GripHorizontal } from 'lucide-react';
import { useConfirm } from '@/components/ui/ConfirmDialog';

// ─── Tipos ────────────────────────────────────────────────────────────────────
export interface BarridoData {
  tiempos: string[];
  porciones: Record<string, number | string>;
  distribucion: Record<string, Record<string, number | string>>;
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
  { key: 'verduras', label: 'Verduras' },
  { key: 'frutas', label: 'Frutas' },
  { key: 'cerealSinGr', label: 'C y T sin grasa' },
  { key: 'cerealConGr', label: 'C y T con grasa' },
  { key: 'leguminosas', label: 'Leguminosas' },
  { key: 'aoaMuyBajo', label: 'AOA muy bajo' },
  { key: 'aoaBajo', label: 'AOA bajo' },
  { key: 'aoaModerado', label: 'AOA moderado' },
  { key: 'aoaAlto', label: 'AOA alto' },
  { key: 'lecheDesc', label: 'Leche descremada' },
  { key: 'lecheSemi', label: 'Leche semidescremada' },
  { key: 'lecheEntera', label: 'Leche entera' },
  { key: 'lecheAz', label: 'Leche azucarada' },
  { key: 'grasaSinProt', label: 'A y G sin proteína' },
  { key: 'grasaConProt', label: 'A y G con proteína' },
  { key: 'azSinGr', label: 'Az sin grasa' },
  { key: 'azConGr', label: 'Az con grasa' },
];

const DEFAULT_TIEMPOS = ['Desayuno', 'Colación', 'Almuerzo', 'Merienda', 'Cena'];

// ─── Helpers: parsear número y limpiar input decimal ──────────────────────────
const toNum = (v: any): number => {
  if (typeof v === 'number') return v;
  if (!v) return 0;
  const n = parseFloat(String(v).replace(',', '.'));
  return isNaN(n) || n < 0 ? 0 : n;
};

const cleanInputStr = (val: string): string => {
  let cleaned = val.replace(',', '.');
  const dots = (cleaned.match(/\./g) || []).length;
  if (dots > 1) {
    const parts = cleaned.split('.');
    cleaned = parts[0] + '.' + parts.slice(1).join('');
  }
  return cleaned.replace(/[^0-9.]/g, '');
};

// ─── Estado inicial ───────────────────────────────────────────────────────────
const buildInitial = (value: BarridoData | null): BarridoData => ({
  tiempos: value?.tiempos?.length ? value.tiempos : [...DEFAULT_TIEMPOS],
  porciones: value?.porciones ?? {},
  distribucion: value?.distribucion ?? {},
  kcalTotal: value?.kcalTotal ?? 0,
  kcalManuales: {}, // Siempre limpiar — el feature fue eliminado de la UI
  energiaTotalManual: value?.energiaTotalManual ?? null,
});

// ─── Estilos reutilizables tipo Excel ─────────────────────────────────────────
const cellCls =
  'w-full h-full text-center bg-transparent border-0 outline-none text-[13px] text-[#e0e0e0] font-mono ' +
  'focus:bg-[#1a2640] transition-colors placeholder:text-[#444] ' +
  '[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none';

// ─── Componente ───────────────────────────────────────────────────────────────
const BarridoEquivalencias = ({ value, onChange }: BarridoEquivalenciasProps) => {
  const [state, setState] = useState<BarridoData>(() => buildInitial(value));
  const [newTiempoName, setNewTiempoName] = useState('');
  const [energiaInputStr, setEnergiaInputStr] = useState(value?.kcalTotal ? String(value.kcalTotal) : '');
  const [draggedColIdx, setDraggedColIdx] = useState<number | null>(null);
  const tableRef = useRef<HTMLTableElement>(null);
  const { confirm, ConfirmDialogComponent } = useConfirm();

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>, startRowIdx: number, startColIdx: number) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData('text');
    if (!pastedText) return;

    const lines = pastedText.split(/\r?\n/);
    let lastNonEmpty = lines.length - 1;
    while (lastNonEmpty > 0 && lines[lastNonEmpty].trim() === '') {
      lastNonEmpty--;
    }
    const rows = lines.slice(0, lastNonEmpty + 1).map(line => line.split('\t'));

    if (rows.length === 0) return;

    const nextPorciones = { ...state.porciones };
    const nextDistribucion = JSON.parse(JSON.stringify(state.distribucion));

    for (let r = 0; r < rows.length; r++) {
      const targetRowIdx = startRowIdx + r;
      if (targetRowIdx >= GRUPOS.length) break;

      const groupKey = GRUPOS[targetRowIdx].key;
      const rowData = rows[r];

      for (let c = 0; c < rowData.length; c++) {
        const targetColIdx = startColIdx + c;
        const rawValue = rowData[c].trim();
        const cleanedValue = cleanInputStr(rawValue);

        if (targetColIdx === 0) {
          nextPorciones[groupKey] = cleanedValue;
        } else {
          const tiempoIdx = targetColIdx - 1;
          if (tiempoIdx >= tiempos.length) break;
          const tiempo = tiempos[tiempoIdx];
          if (!nextDistribucion[tiempo]) {
            nextDistribucion[tiempo] = {};
          }
          nextDistribucion[tiempo][groupKey] = cleanedValue;
        }
      }
    }

    commit({
      ...state,
      porciones: nextPorciones,
      distribucion: nextDistribucion,
    });
  };

  const handlePastePercentages = (e: React.ClipboardEvent<HTMLInputElement>, startColIdx: number) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData('text');
    if (!pastedText) return;

    const lines = pastedText.split(/\r?\n/);
    if (lines.length === 0) return;

    const cols = lines[0].split('\t').map(c => c.trim());
    const nextManual = { ...((distribucion as any)._porcentajesManuales || {}) };

    for (let c = 0; c < cols.length; c++) {
      const targetColIdx = startColIdx + c;
      if (targetColIdx >= tiempos.length) break;
      const tiempo = tiempos[targetColIdx];
      const rawVal = cols[c].replace('%', '').trim();
      const cleaned = cleanInputStr(rawVal);
      if (cleaned === '') {
        delete nextManual[tiempo];
      } else {
        nextManual[tiempo] = cleaned;
      }
    }

    commit({
      ...state,
      distribucion: {
        ...distribucion,
        _porcentajesManuales: nextManual
      }
    });
  };

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

  // Sincronizar el input de texto manual si el valor cambia desde el padre (ej. carga asíncrona)
  useEffect(() => {
    if (value?.kcalTotal && !energiaInputStr) {
      setEnergiaInputStr(String(value.kcalTotal));
    }
  }, [value?.kcalTotal]);

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

  // ─── Kcal automática por tiempo (desde distribución) ───────────────────────
  const colKcalAuto = (tiempo: string) =>
    GRUPOS.reduce(
      (s, { key }) => s + toNum(distribucion[tiempo]?.[key]) * KCAL_POR_EQ[key],
      0
    );

  const colKcalEfectiva = (tiempo: string) => {
    const manual = kcalManuales[tiempo];
    return manual != null && manual > 0 ? manual : colKcalAuto(tiempo);
  };

  // kcalFromPorciones: energía desde la columna Porciones — fuente primaria, tiempo real
  const kcalFromPorciones = useMemo(
    () => GRUPOS.reduce((s, { key }) => s + toNum(porciones[key]) * KCAL_POR_EQ[key], 0),
    [porciones]
  );

  // kcalFromDistribucion: fallback si porciones están vacías
  const kcalFromDistribucion = useMemo(
    () => tiempos.reduce((s, t) => s + colKcalAuto(t), 0),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [tiempos, distribucion]
  );

  // kcalTotalAuto: porciones tienen prioridad, distribución como fallback
  const kcalTotalAuto = kcalFromPorciones > 0 ? kcalFromPorciones : kcalFromDistribucion;

  // Sincronizar energiaInputStr con kcalFromPorciones en tiempo real (si no hay override manual)
  useEffect(() => {
    if (energiaTotalManual == null || energiaTotalManual === 0) {
      setEnergiaInputStr(kcalFromPorciones > 0 ? String(Math.round(kcalFromPorciones)) : '');
    }
  }, [kcalFromPorciones]);

  // Energía total: manual tiene prioridad sobre auto
  const kcalTotal =
    energiaTotalManual != null && energiaTotalManual > 0
      ? energiaTotalManual
      : kcalTotalAuto;


  const getCell = (tiempo: string, grupo: string) =>
    distribucion[tiempo]?.[grupo] ?? 0;

  const rowTotal = (grupo: string) =>
    tiempos.reduce((s, t) => s + toNum(getCell(t, grupo)), 0);

  // ─── Commit ──────────────────────────────────────────────────────────────────
  const commit = (next: BarridoData) => {
    const cleanManuales = {};

    // Energía desde porciones (fuente primaria, tiempo real)
    const porcionesTotal = GRUPOS.reduce(
      (s, { key }) => s + toNum(next.porciones[key]) * KCAL_POR_EQ[key],
      0
    );

    // Fallback: energía desde distribución si porciones están vacías
    const distTotal = next.tiempos.reduce((s, t) => {
      return s + GRUPOS.reduce(
        (gs, { key }) => gs + toNum(next.distribucion[t]?.[key]) * KCAL_POR_EQ[key],
        0
      );
    }, 0);

    const autoTotal = porcionesTotal > 0 ? porcionesTotal : distTotal;

    const totalFinal =
      next.energiaTotalManual != null && next.energiaTotalManual > 0
        ? next.energiaTotalManual
        : Math.round(autoTotal);

    // Validar si la distribución suma exactamente la porción para TODOS los grupos
    const isValid = GRUPOS.every(({ key }) => {
      const porcion = toNum(next.porciones[key]);
      const total = next.tiempos.reduce((s, t) => s + toNum(next.distribucion[t]?.[key]), 0);
      return Math.abs(porcion - total) < 0.01;
    });

    const updated = { ...next, kcalManuales: cleanManuales, kcalTotal: totalFinal, isValid };
    setState(updated);
    setTimeout(() => onChange(updated), 0);
  };

  // ─── Manejadores ─────────────────────────────────────────────────────────────
  const setCell = (tiempo: string, grupo: string, val: string) => {
    commit({
      ...state,
      distribucion: {
        ...distribucion,
        [tiempo]: { ...(distribucion[tiempo] || {}), [grupo]: val },
      },
    });
  };

  const setPorcion = (grupo: string, val: string) => {
    commit({ ...state, porciones: { ...porciones, [grupo]: val } });
  };

  const setManualPercentage = (tiempo: string, pctStr: string) => {
    const nextManual = { ...((distribucion as any)._porcentajesManuales || {}) };
    if (pctStr === '') {
      delete nextManual[tiempo];
    } else {
      nextManual[tiempo] = pctStr;
    }
    commit({
      ...state,
      distribucion: {
        ...distribucion,
        _porcentajesManuales: nextManual
      }
    });
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

  const clearTable = async () => {
    const ok = await confirm({
      title: '¿Limpiar Tabla?',
      description: 'Se eliminarán todos los datos de porciones y distribución de la tabla.',
      confirmLabel: 'Sí, Limpiar',
      cancelLabel: 'Cancelar',
      variant: 'warning',
    });
    if (!ok) return;
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
    if (oldName === name) return;

    let newName = name;
    if (tiempos.includes(newName) && tiempos.indexOf(newName) !== idx) {
      newName = newName + '*';
    }

    const newTiempos = [...tiempos];
    newTiempos[idx] = newName;
    const nextDist = { ...distribucion };
    const nextManuales = { ...kcalManuales };

    nextDist[newName] = nextDist[oldName] || {};
    delete nextDist[oldName];
    if (nextManuales[oldName] != null) {
      nextManuales[newName] = nextManuales[oldName];
      delete nextManuales[oldName];
    }
    commit({ ...state, tiempos: newTiempos, distribucion: nextDist, kcalManuales: nextManuales });
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
    <>
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
              className={`w-20 text-center border-0 border-b outline-none text-[15px] font-bold bg-transparent font-mono ${energiaTotalManual != null && energiaTotalManual > 0
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
                  style={{
                    padding: '10px 14px',
                    fontSize: '11px',
                    fontWeight: 700,
                    color: '#8a8a8a',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    backgroundColor: '#1a1a1a',
                    borderRight: '2px solid #333',
                  }}
                  className="w-[120px] sm:w-[170px] min-w-[120px] sm:min-w-[170px] uppercase font-bold text-[11px] tracking-wider sticky left-0 z-20"
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
                    key={idx}
                    draggable
                    onDragStart={(e) => handleDragStart(e, idx)}
                    onDragOver={(e) => handleDragOver(e, idx)}
                    onDrop={(e) => handleDrop(e, idx)}
                    className="relative group/th transition-all duration-300"
                    style={{
                      padding: '8px 2px 4px 2px',
                      fontSize: '10px',
                      fontWeight: 700,
                      color: '#c0c0c0',
                      textTransform: 'uppercase',
                      textAlign: 'center',
                      borderRight: idx < tiempos.length - 1 ? '1px solid #2a2a2a' : '2px solid #333',
                      backgroundColor: draggedColIdx === idx ? '#2a3a50' : '#1a2030',
                      width: '90px',
                      cursor: 'default',
                    }}
                  >
                    <div className="absolute top-1 left-1/2 -translate-x-1/2 opacity-0 group-hover/th:opacity-100 transition-opacity cursor-grab hover:cursor-grabbing active:cursor-grabbing">
                      <GripHorizontal className="w-[14px] h-[14px] text-[#666] hover:text-[#999]" />
                    </div>
                    <div className="flex items-center justify-center gap-1 group/thead px-1 relative mt-[14px]">
                      <input
                        type="text"
                        value={t}
                        onChange={(e) => renameTiempo(idx, e.target.value)}
                        className="text-[11px] font-bold bg-transparent border-0 border-b border-transparent hover:border-[#444] focus:border-[#90c2ff] outline-none w-full text-center text-[#c0c0c0] focus:text-[#90c2ff] uppercase transition-colors tracking-wider placeholder:text-[#444] m-0 p-0"
                        title="Editable"
                      />
                      {tiempos.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeTiempo(idx)}
                          className="absolute right-0 top-1/2 -translate-y-1/2 opacity-0 group-hover/thead:opacity-100 text-[#555] hover:text-[#ff6b6b] transition-all bg-[#1a2030] px-1"
                          title="Eliminar tiempo"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
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
                const porcionNum = toNum(porciones[key]);
                const porcion = porciones[key] ?? 0;
                const match = porcionNum > 0 ? Math.abs(total - porcionNum) < 0.01 : null;
                const hdrBg = groupHeaderColor[key] || '#1a1a1a';

                return (
                  <tr
                    key={key}
                    className="group/row"
                  >
                    {/* Nombre del grupo */}
                    <td
                      className="sticky left-0 z-10 w-[120px] sm:w-[170px] min-w-[120px] sm:min-w-[170px] text-[10px] sm:text-[11px] px-2 h-8"
                      style={{
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
                        backgroundColor: hdrBg,
                      }}
                    >
                      <input
                        type="text"
                        inputMode="decimal"
                        value={porcion === 0 || porcion === '0' ? '' : (porcion ?? '')}
                        onChange={(e) => setPorcion(key, cleanInputStr(e.target.value))}
                        onPaste={(e) => handlePaste(e, rowIdx, 0)}
                        onWheel={noScroll}
                        onKeyDown={(e) => handleCellKey(e, rowIdx, 0, tiempos.length)}
                        data-row={rowIdx}
                        data-col={0}
                        placeholder="0"
                        className={cellCls}
                        style={{ height: '24px', color: '#aaa', fontWeight: 700, fontSize: '11px' }}
                      />
                    </td>

                    {/* Celda por tiempo */}
                    {tiempos.map((t, idx) => {
                      const v = getCell(t, key);
                      return (
                        <td
                          key={idx}
                          style={{
                            padding: '2px',
                            borderRight: idx < tiempos.length - 1 ? '1px solid #222' : '2px solid #333',
                            borderBottom: '1px solid #222',
                            textAlign: 'center',
                            backgroundColor: hdrBg,
                          }}
                        >
                          <input
                            type="text"
                            inputMode="decimal"
                            value={v === 0 || v === '0' ? '' : (v ?? '')}
                            onChange={(e) => setCell(t, key, cleanInputStr(e.target.value))}
                            onPaste={(e) => handlePaste(e, rowIdx, idx + 1)}
                            onWheel={noScroll}
                            onKeyDown={(e) => handleCellKey(e, rowIdx, idx + 1, tiempos.length)}
                            data-row={rowIdx}
                            data-col={idx + 1}
                            placeholder={'·'}
                            className={cellCls}
                            style={{
                              height: '24px',
                              backgroundColor: toNum(v) > 0 ? 'rgba(255,255,255,0.08)' : 'transparent',
                              fontWeight: toNum(v) > 0 ? 700 : 400,
                              fontSize: '11px',
                              color: toNum(v) > 0 ? '#ffffff' : '#555',
                              outline: 'none',
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
                        backgroundColor: hdrBg,
                      }}
                    >
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '3px',
                          padding: '1px 6px',
                          borderRadius: '4px',
                          fontSize: '11px',
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
                </td>
                <td style={{ borderRight: '2px solid #333', textAlign: 'center', color: '#444', fontSize: '13px' }}>—</td>

                {tiempos.map((t, idx) => {
                  const kcalTiempo = colKcalAuto(t);
                  const denominador = energiaTotalManual && energiaTotalManual > 0 ? energiaTotalManual : kcalTotalAuto;
                  const pct = denominador > 0 ? (kcalTiempo / denominador) * 100 : 0;

                  const manualPct = (distribucion as any)._porcentajesManuales?.[t] ?? '';
                  const displayCalculated = pct > 0 ? `${pct.toFixed(1)}%` : '0%';

                  return (
                    <td
                      key={t}
                      style={{
                        padding: '2px',
                        textAlign: 'center',
                        borderRight: idx < tiempos.length - 1 ? '1px solid #222' : '2px solid #333',
                      }}
                    >
                      <div className="flex items-center justify-center relative w-full h-full">
                        <input
                          type="text"
                          inputMode="decimal"
                          value={manualPct}
                          placeholder={displayCalculated}
                          onChange={(e) => setManualPercentage(t, cleanInputStr(e.target.value))}
                          onPaste={(e) => handlePastePercentages(e, idx)}
                          onWheel={noScroll}
                          className={cellCls}
                          style={{
                            height: '28px',
                            fontWeight: 700,
                            fontSize: '12px',
                            color: manualPct ? '#90c2ff' : '#a0a0a0',
                            backgroundColor: manualPct ? '#0f1e30' : 'transparent',
                            borderBottom: manualPct ? '1px solid #3b5bdb' : 'none',
                          }}
                          title={manualPct ? "Porcentaje objetivo manual (sobrescribe calculado)" : "Cálculo automático"}
                        />
                      </div>
                    </td>
                  );
                })}


                {/* Celda vacía en columna TOTAL */}
                <td style={{ padding: '8px 6px', textAlign: 'center' }} />
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
          <span>Puedes pegar desde Excel seleccionando cualquier celda de la tabla y pulsando Ctrl+V</span>
        </div>
      </div>
      {ConfirmDialogComponent}
    </>
  );
};

export default BarridoEquivalencias;
