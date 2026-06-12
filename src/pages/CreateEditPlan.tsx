import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Save, Plus, PlusCircle, Search, ChevronDown, ChevronUp, Copy, BookOpen, Clock, Activity, AlertCircle, Edit3, Trash2, CheckCircle2, MoreHorizontal, ClipboardList, Settings, Bookmark, Droplets, Pill, FileText, X } from 'lucide-react';
import { SmaeIngredientePicker } from '@/components/SmaeIngredientePicker';
import api from '@/lib/api';
import { Menu, TiempoComida, Ingrediente, Plan, Platillo } from '@/types';
import { formatDecimal } from '@/lib/format';
import { useToast } from '@/hooks/use-toast';
import { useConfirm } from '@/components/ui/ConfirmDialog';
import { Input } from '@/components/ui/input';
import BarridoEquivalenciasComp, { type BarridoData } from '@/components/BarridoEquivalencias';
import { normalizeGroup, groupToBarridoKey, SMAE_GROUP_LABELS, CANONICAL_TO_BARRIDO_KEY } from '@/lib/smaeGroups';

const defaultTiempos = ['Desayuno', 'Colación', 'Almuerzo', 'Colación', 'Cena'];

const emptyMenu = (name: string): Menu => ({
  nombre: name,
  tiempos: defaultTiempos.map((t) => ({ nombre: t.toUpperCase(), ingredientes: [], nota: '', bebida: '', suplTiempo: '', suplNotas: '', ademas: '' })),
});

const emptyIngrediente = (): Ingrediente => ({
  id: Math.random().toString(36).substr(2, 9),
  descripcion: '',
  cantidad: 0,
  unidad: 'GR',
  eqCantidad: 0,
  eqGrupo: '',
  equivalencias: [],
  nota: ''
});

/** Redondeo inteligente para porciones prácticas:
 *  - Parte decimal >= 0.5 → redondea arriba
 *  - Parte decimal < 0.5  → redondea abajo
 *  Nunca devuelve < 0. Si el valor es 0, devuelve 0.
 */
const smartRound = (val: number): number => {
  if (val <= 0) return 0;
  return Math.round(val); // Math.round ya hace >=0.5 up, <0.5 down
};

export const CreateEditPlanForm = ({
  pacienteId: propPacienteId,
  planId: propPlanId,
  valoracionId: propValoracionId,
  onSaved,
  onCancel,
  initialProximaSesion,
}: {
  pacienteId?: string,
  planId?: string,
  valoracionId?: string,
  onSaved?: (planId: string) => void,
  onCancel?: () => void,
  initialProximaSesion?: string,
}) => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const isEdit = !!propPlanId;
  const isBasePlan = !propPacienteId;

  const pacienteId = propPacienteId;
  const planId = propPlanId;
  const valoracionId = propValoracionId;

  const [saving, setSaving] = useState(false);
  const [loadingInitialData, setLoadingInitialData] = useState(true);
  const [pesoUltimo, setPesoUltimo] = useState(0);
  const [pacienteNombre, setPacienteNombre] = useState<string | null>(null);

  const [nombrePlan, setNombrePlan] = useState('');
  const [tipo, setTipo] = useState('Balanceada');
  const [calorias, setCalorias] = useState('1800');
  const [proteinas, setProteinas] = useState('30');
  const [carbohidratos, setCarbohidratos] = useState('40');
  const [grasas, setGrasas] = useState('30');
  const [proximaSesion, setProximaSesion] = useState(initialProximaSesion
    ? initialProximaSesion.split('T')[0]        // date part
    : '');
  const [proximaSesionHora, setProximaSesionHora] = useState(initialProximaSesion && initialProximaSesion.includes('T')
    ? initialProximaSesion.split('T')[1]?.slice(0, 5)  // HH:MM
    : '');
  const [notas, setNotas] = useState('');
  const [menus, setMenus] = useState<Menu[]>([emptyMenu('Menú 1'), emptyMenu('Menú 2')]);
  const [valData, setValData] = useState<any>(null);
  const [suplementosDetalle, setSuplementosDetalle] = useState<any[]>([]); // 💊 State independiente para persistencia
  const [showBarridoRef, setShowBarridoRef] = useState(false); // cerrado por defecto
  const [pacienteInfo, setPacienteInfo] = useState<any>(null); // antecedentes + datos clínicos del paciente
  // Borradores locales del nombre de platillo mientras se edita — evita que el grupo desaparezca al vaciar el input
  const [platilloDrafts, setPlatilloDrafts] = useState<Record<string, string>>({});

  const [platilloLibrary, setPlatilloLibrary] = useState<Platillo[]>([]);
  const [showPlatilloSelector, setShowPlatilloSelector] = useState<{ mIdx: number, tIdx: number } | null>(null);
  const [platilloSearch, setPlatilloSearch] = useState('');
  const [platilloCatFilter, setPlatilloCatFilter] = useState(null); // filtro activo por categoría

  // ─── Save-as-Platillo modal ────────────────────────────────────────────────
  const [savePlatilloModal, setSavePlatilloModal] = useState<{
    mIdx: number; tIdx: number;
    nombre: string; categoria: string;
  } | null>(null);
  const [savingPlatillo, setSavingPlatillo] = useState(false);

  // ─── Presupuesto de equivalencias ─ siempre abierto por defecto ─────────────────
  // Budget panels are ALWAYS visible for Eyder to track progress in real-time
  const [showBudgetMap, setShowBudgetMap] = useState<Record<string, boolean>>({});

  // ─── Toggle agua natural en comidas principales ──────────────────────────────
  const [aguaNaturalDefault, setAguaNaturalDefault] = useState(true);


  // Defensive sort: backend ya guarda `orden`, pero por si algún endpoint regresa sin ordenar
  const sortByOrden = <T extends { orden?: number }>(arr: T[]): T[] =>
    arr.map((item, idx) => ({ item, idx })).sort((a, b) => (a.item.orden ?? a.idx + 1) - (b.item.orden ?? b.idx + 1)).map(({ item }) => item);

  const mapMenusFromBackend = (backendMenus: any[]) => {
    return (backendMenus ? sortByOrden(backendMenus) : backendMenus)?.map((m: any) => ({
      nombre: m.nombre,
      tiempos: sortByOrden(m.tiemposComida || m.tiempos || []).map((t: any) => {
        // Parse metadata encoded in notaPie (fallback until backend adds columns)
        const rawNote = t.notaPie || t.nota || '';
        let nota = rawNote;
        let metaBebida = '';
        let metaSuplTiempo = '';
        let metaSuplNotas = '';
        let metaAdemas = '';
        const metaMatch = rawNote.match(/\n?<!--META:(.*?)-->/);
        if (metaMatch) {
          try {
            const parsed = JSON.parse(metaMatch[1]);
            metaBebida = parsed.bebida || '';
            metaSuplTiempo = parsed.suplTiempo || '';
            metaSuplNotas = parsed.suplNotas || '';
            metaAdemas = parsed.ademas || '';
          } catch { /* ignore parse errors */ }
          nota = rawNote.replace(/\n?<!--META:.*?-->/, '');
        }
        const rawBebida = t.bebida || metaBebida;
        // B2/B3: Si la colación tiene el agua-por-defecto guardada en BD, limpiarla
        const isThisColacion = /colaci[oó]n/i.test(t.nombre || '');
        const bebidaFinal = (isThisColacion && rawBebida === 'Agua natural 500ml') ? '' : rawBebida;
        return {
          nombre: t.nombre,
          nota,
          bebida: bebidaFinal,
          suplTiempo: t.suplTiempo || metaSuplTiempo,
          suplNotas: t.suplNotas || metaSuplNotas,
          ademas: t.ademas || metaAdemas,
          ingredientes: sortByOrden(t.ingredientes || []).map((i: any) => {
            let eqArray = [];
            if (Array.isArray(i.equivalencias)) {
              eqArray = i.equivalencias;
            } else if (typeof i.equivalencias === 'string' && i.equivalencias.trim() !== '') {
              try { eqArray = JSON.parse(i.equivalencias); } catch (e) { console.warn("Failed to parse equivalencias:", i.equivalencias); }
            }
            return {
              ...i,
              id: i.id || Math.random().toString(36).substr(2, 9),
              cantidad: parseFloat(i.cantidad) || 0,
              eqCantidad: i.eqCantidad != null ? parseFloat(String(i.eqCantidad)) : undefined,
              equivalencias: eqArray,
              platillo: i.platillo || ''
            };
          })
        };
      })
    })) || [emptyMenu('Menú 1'), emptyMenu('Menú 2')];
  };

  useEffect(() => {
    const fetchAllData = async () => {
      setLoadingInitialData(true);
      try {
        let pacientePromise = Promise.resolve(null);
        if (pacienteId) {
          pacientePromise = api.get(`/api/pacientes/${pacienteId}`);
        }

        let planPromise = Promise.resolve(null);
        let valPromise = Promise.resolve(null);
        let barridoPromise = Promise.resolve(null);

        if (isEdit) {
          const url = isBasePlan
            ? `/api/planes/${planId}`
            : `/api/pacientes/${pacienteId}/planes/${planId}`;
          planPromise = api.get(url).catch(() => null);
        }

        // Siempre cargar la valoración si está disponible para tener el conteo de equivalencias activo
        if (pacienteId && valoracionId) {
          valPromise = api.get(`/api/pacientes/${pacienteId}/valoraciones/${valoracionId}`).catch(() => null);
          barridoPromise = api.get(`/api/pacientes/${pacienteId}/valoraciones/${valoracionId}/barrido`).catch(() => null);
        }

        const platillosPromise = api.get('/api/platillos').catch(() => null);

        // Disparamos todas las peticiones en paralelo
        const [pacienteRes, planRes, valRes, barridoRes, platillosRes] = await Promise.all([
          pacientePromise,
          planPromise,
          valPromise,
          barridoPromise,
          platillosPromise
        ]);

        // Procesar paciente
        if (pacienteRes?.data) {
          const p = pacienteRes.data?.data || pacienteRes.data;
          if (p) {
            const fullName = `${p.nombre} ${p.apellido || ''}`.trim();
            setPacienteNombre(fullName);
            setPacienteInfo(p);
            if (!isEdit) {
              const hoy = new Date();
              const dd = String(hoy.getDate()).padStart(2, '0');
              const mm = String(hoy.getMonth() + 1).padStart(2, '0');
              const yyyy = hoy.getFullYear();
              setNombrePlan(`${fullName} ${dd}/${mm}/${yyyy}`);
            }
          }
        }

        // Procesar plan
        if (isEdit && planRes?.data) {
          const p = planRes.data.data || planRes.data;
          if (p) {
            setNombrePlan(p.nombre || '');
            setTipo(p.tipoPlan || p.tipo || 'Balanceada');
            setCalorias(p.calorias.toString());
            setProteinas((Number(p.proteinasPct ?? p.macros?.proteinas ?? 30)).toString());
            setCarbohidratos((Number(p.carbohidratosPct ?? p.macros?.carbohidratos ?? 40)).toString());
            setGrasas((Number(p.grasasPct ?? p.macros?.grasas ?? 30)).toString());

            if (p.proximaSesion) {
              const d = new Date(p.proximaSesion);
              if (!isNaN(d.getTime())) {
                setProximaSesion(d.toISOString().split('T')[0]);
                setProximaSesionHora(d.toTimeString().substring(0, 5));
              }
            } else {
              setProximaSesion('');
              setProximaSesionHora('');
            }
            setNotas(p.notasGenerales || p.notas || '');
            setMenus(mapMenusFromBackend(p.menus));
            setSuplementosDetalle(p.suplementosDetalle || []);
          }
        }

        // Procesar valoración/barrido (tanto para NEW como para EDIT para el panel presupuestal)
        let vData = valRes?.data?.data || valRes?.data;
        let bData = barridoRes?.data;

        // RECUPERACIÓN DE EMERGENCIA: Si estamos editando y no teníamos valoracionId en URL,
        // pero el plan sí lo tiene, cargamos la valoración ahora.
        if (isEdit && !valoracionId && planRes?.data) {
          const p = planRes.data.data || planRes.data;
          const recoveredValId = p?.valoracionId;
          if (recoveredValId) {
            try {
              const [vRes, bRes] = await Promise.all([
                api.get(`/api/pacientes/${pacienteId}/valoraciones/${recoveredValId}`),
                api.get(`/api/pacientes/${pacienteId}/valoraciones/${recoveredValId}/barrido`)
              ]);
              vData = vRes.data?.data || vRes.data;
              bData = bRes.data;
            } catch (e) {
              console.warn("No se pudo recuperar la valoración del plan:", e);
            }
          }
        }

        if (vData) {
          const v = vData;
          let barrido = bData;
          while (barrido?.data) barrido = barrido.data;
          if (typeof barrido === 'string') {
            try { barrido = JSON.parse(barrido); } catch (e) { }
          }
          if (barrido?.barrido) barrido = barrido.barrido;
          if (typeof barrido === 'string') {
            try { barrido = JSON.parse(barrido); } catch (e) { }
          }

          setValData({ ...v, barridoEquivalencias: barrido });
          // Siempre actualizar el último peso para los cálculos de G/kg (incluso en Edit)
          setPesoUltimo(v.peso || 0);

          // Logica especifica para crear uno nuevo (inicializar vacios, auto calcular macro iniciales)
          if (!isEdit) {
            // Merge: preservar suplementos ya en el plan + añadir los de la valoración que no estén duplicados
            setSuplementosDetalle(prev => {
              const valSups: any[] = v.suplementosDetalle || [];
              if (prev.length === 0) return valSups;
              const existingIds = new Set(prev.map((s: any) => s.id));
              const nuevos = valSups.filter((s: any) => !existingIds.has(s.id));
              return [...prev, ...nuevos];
            });
            if (v.getSedentario) setCalorias(Math.round(v.getSedentario).toString());

            if (barrido?.tiempos?.length > 0) {
              const assessmentTiempos = barrido.tiempos.map((t: string) => ({
                nombre: t.toUpperCase(),
                ingredientes: [],
                nota: ''
              }));
              if (assessmentTiempos.length > 0) {
                setMenus([
                  { nombre: 'Menú 1', tiempos: assessmentTiempos },
                  { nombre: 'Menú 2', tiempos: JSON.parse(JSON.stringify(assessmentTiempos)) }
                ]);
              }
            }
          }
        }
        // Procesar platillos
        if (platillosRes?.data) {
          setPlatilloLibrary(platillosRes.data?.data || []);
        }

      } catch (e) {
        console.error("Error al cargar datos iniciales:", e);
      } finally {
        setLoadingInitialData(false);
      }
    };

    fetchAllData();
  }, [planId, isEdit, pacienteId, valoracionId, isBasePlan]);


  const cal = parseFloat(calorias) || 0;
  const pPct = parseFloat(proteinas) || 0;
  const cPct = parseFloat(carbohidratos) || 0;
  const gPct = parseFloat(grasas) || 0;
  const macroSum = pPct + cPct + gPct;

  // Energía del barrido — replica exactamente la lógica de BarridoEquivalencias.kcalTotalAuto:
  // por cada tiempo usa kcalManuales[tiempo] si existe, sino suma porciones × kcal/eq de la distribución
  const kcalBarrido = useMemo(() => {
    // Si la valoración ya fue guardada, el barrido vendrá poblado
    const b = valData?.barrido || valData?.barridoEquivalencias;
    if (!b) return 0;
    return b.kcalTotal || 0;
  }, [valData]);

  useEffect(() => {
    if (!isEdit && kcalBarrido && kcalBarrido > 0) {
      setCalorias(String(kcalBarrido));
    }
  }, [kcalBarrido, isEdit]);

  // Si ya existe una valoración y no es edición, forzamos que use el barrido
  useEffect(() => {
    if (valData?.barrido?.kcalTotal) {
      setCalorias(String(valData.barrido.kcalTotal));
    }
  }, [valData]);

  // Autofill agua natural — SOLO en comidas principales (no colaciones)
  // B2+B3: Las colaciones no requieren bebida por defecto
  const isColacion = (nombre: string) => /colaci[oó]n/i.test(nombre);
  useEffect(() => {
    if (!aguaNaturalDefault) return;
    if (!menus.length) return;
    let touched = false;
    const next = menus.map(menu => ({
      ...menu,
      tiempos: menu.tiempos.map(t => {
        // Saltamos colaciones — no auto-rellenar bebida en ellas
        if (isColacion(t.nombre)) return t;
        if (!t.bebida || t.bebida.trim() === '') {
          touched = true;
          return { ...t, bebida: 'Agua natural 500ml' };
        }
        return t;
      })
    }));
    if (touched) setMenus(next);
  }, [menus, aguaNaturalDefault]);

  // Kcal por equivalente SMAE — acepta tanto el label de UI como la clave interna del backend
  const KCAL_EQ: Record<string, number> = {
    // Labels de UI (SmaeIngredientePicker los guarda así)
    'Verduras': 0, 'Frutas': 60, 'C y T sin grasa': 70, 'C y T con grasa': 115, 'Leguminosas': 120,
    'AOA muy bajo': 40, 'AOA bajo': 55, 'AOA moderado': 75, 'AOA alto': 100,
    'Leche descremada': 95, 'Leche semidescremada': 110, 'Leche entera': 150, 'Leche azucarada': 200,
    'A y G sin proteína': 45, 'A y G con proteína': 70, 'Az sin grasa': 40, 'Az con grasa': 85,
    // Claves internas del backend (planes precargados/editados)
    verduras: 0, frutas: 60, cerealSinGr: 70, cerealConGr: 115, leguminosas: 120,
    aoaMuyBajo: 40, aoaBajo: 55, aoaModerado: 75, aoaAlto: 100,
    lecheDesc: 95, lecheSemi: 110, lecheEntera: 150, lecheAz: 200,
    grasaSinProt: 45, grasaConProt: 70, azSinGr: 40, azConGr: 85,
    // Labels del SmaeIngredientePicker (GRUPO_LABELS - capitalized differently)
    'Cereal s/grasa': 70, 'Cereal c/grasa': 115,
    'AOA Muy Bajo': 40, 'AOA Bajo': 55, 'AOA Moderado': 75, 'AOA Alto': 100,
    'Leche Descrem.': 95, 'Leche Semi': 110, 'Leche Entera': 150, 'Leche Azucarada': 200,
    'Grasa s/prot': 45, 'Grasa c/prot': 70, 'Azúcar s/grasa': 40, 'Azúcar c/grasa': 85,
  };

  // Lookup tolerante a mayúsculas/minúsculas
  const lookupKcalEq = (grupo: string): number => {
    if (!grupo) return 0;
    if (KCAL_EQ[grupo] !== undefined) return KCAL_EQ[grupo];
    const lower = grupo.toLowerCase();
    const found = Object.keys(KCAL_EQ).find(k => k.toLowerCase() === lower);
    return found !== undefined ? KCAL_EQ[found] : 0;
  };

  // ─── LÓGICA DE MACROS DEL BARRIDO ───────────────────────────────────────────
  // Gramos aproximados por cada equivalente SMAE (P, C, G)
  const MACROS_SMAE: Record<string, { p: number; c: number; g: number }> = {
    verduras: { p: 2, c: 4, g: 0 },
    frutas: { p: 0, c: 15, g: 0 },
    cerealSinGr: { p: 2, c: 15, g: 0 },
    cerealConGr: { p: 2, c: 15, g: 5 },
    leguminosas: { p: 8, c: 20, g: 1 },
    aoaMuyBajo: { p: 7, c: 0, g: 1 },
    aoaBajo: { p: 7, c: 0, g: 3 },
    aoaModerado: { p: 7, c: 0, g: 5 },
    aoaAlto: { p: 7, c: 0, g: 8 },
    lecheDesc: { p: 9, c: 12, g: 2 },
    lecheSemi: { p: 9, c: 12, g: 4 },
    lecheEntera: { p: 9, c: 12, g: 8 },
    lecheAz: { p: 9, c: 30, g: 5 },
    grasaSinProt: { p: 0, c: 0, g: 5 },
    grasaConProt: { p: 3, c: 3, g: 5 },
    azSinGr: { p: 0, c: 10, g: 0 },
    azConGr: { p: 0, c: 10, g: 5 },
    // Aliases para nombres con espacios/mayúsculas del picker
    'Cereal s/grasa': { p: 2, c: 15, g: 0 }, 'Cereal c/grasa': { p: 2, c: 15, g: 5 },
    'AOA Muy Bajo': { p: 7, c: 0, g: 1 }, 'AOA Bajo': { p: 7, c: 0, g: 3 },
    'AOA Moderado': { p: 7, c: 0, g: 5 }, 'AOA Alto': { p: 7, c: 0, g: 8 },
    'Leche Descrem.': { p: 9, c: 12, g: 2 }, 'Leche Semi': { p: 9, c: 12, g: 4 },
    'Leche Entera': { p: 9, c: 12, g: 8 }, 'Leche Azucarada': { p: 9, c: 30, g: 5 },
    'Grasa s/prot': { p: 0, c: 0, g: 5 }, 'Grasa c/prot': { p: 3, c: 3, g: 5 },
    'Azúcar s/grasa': { p: 0, c: 10, g: 0 }, 'Azúcar c/grasa': { p: 0, c: 10, g: 5 },
  };

  const macrosBarridoResult = useMemo(() => {
    const b = valData?.barridoEquivalencias;
    if (!b?.porciones) return null;
    let p = 0; let c = 0; let g = 0;
    Object.entries(b.porciones).forEach(([grupo, cant]) => {
      const gNum = Number(cant) || 0;
      const m = MACROS_SMAE[grupo] || { p: 0, c: 0, g: 0 };
      p += gNum * m.p;
      c += gNum * m.c;
      g += gNum * m.g;
    });
    const totalKcal = (p * 4) + (c * 4) + (g * 9);
    if (totalKcal === 0) return null;
    return {
      pPct: Math.round((p * 4 / totalKcal) * 100),
      cPct: Math.round((c * 4 / totalKcal) * 100),
      gPct: Math.round((g * 9 / totalKcal) * 100),
    };
  }, [valData?.barridoEquivalencias?.porciones]);


  const menuKcalAverages = useMemo(() => ({ avg: 0, byMenu: [] }), []);

  const macroCalc = useMemo(() => ({
    pGr: (cal * pPct / 100) / 4, pGrKg: pesoUltimo > 0 ? ((cal * pPct / 100) / 4) / pesoUltimo : 0,
    cGr: (cal * cPct / 100) / 4, cGrKg: pesoUltimo > 0 ? ((cal * cPct / 100) / 4) / pesoUltimo : 0,
    gGr: (cal * gPct / 100) / 9, gGrKg: pesoUltimo > 0 ? ((cal * gPct / 100) / 9) / pesoUltimo : 0,
  }), [cal, pPct, cPct, gPct, pesoUltimo]);

  // Match plan tiempo ↔ columna de barrido por nombre + índice de ocurrencia,
  // para soportar dos tiempos con el mismo nombre (p.ej. dos "Colación"):
  // la 1ª Colación del plan toma la 1ª columna "Colación" del barrido, la 2ª toma la 2ª.
  const findBarridoTiempoKey = (barridoTiempos: string[], planTiempos: { nombre?: string }[], tiempoIdx: number): string | undefined => {
    const norm = (s?: string) => (s || '').toLowerCase().trim();
    const name = norm(planTiempos[tiempoIdx]?.nombre);
    if (!name) return undefined;
    const occurrence = planTiempos.slice(0, tiempoIdx).filter(t => norm(t.nombre) === name).length;
    const candidates = barridoTiempos.filter(t => norm(t) === name);
    if (candidates[occurrence]) return candidates[occurrence];
    // 2da+ ocurrencia (ej. segunda "Colación") puede estar como columna "Colación 2" en el barrido
    if (occurrence > 0) {
      const altName = `${name} ${occurrence + 1}`;
      return barridoTiempos.find(t => norm(t) === altName);
    }
    return undefined;
  };

  const autoScaleIngredients = (nextBarridoData: BarridoData) => {
    if (!nextBarridoData?.distribucion) return;


    const getBarridoKey = (grupo: string) => groupToBarridoKey(normalizeGroup(grupo));


    setMenus(prevMenus => prevMenus.map(menu => ({
      ...menu,
      tiempos: menu.tiempos.map((tiempo, tIdx) => {
        const barridoTiempoKey = findBarridoTiempoKey(nextBarridoData.tiempos, menu.tiempos, tIdx);

        if (!barridoTiempoKey) return tiempo;

        return {
          ...tiempo,
          ingredientes: tiempo.ingredientes.map(ing => {
            if (ing.platillo && ing.eqGrupo) {
              const bKey = getBarridoKey(ing.eqGrupo);
              const assignedEq = nextBarridoData.distribucion[barridoTiempoKey]?.[bKey] || 0;

              if (assignedEq >= 0) {
                // EXCEPCIÓN: Si es verdura y el barrido le asignó 0 (libre), no la desaparecemos a 0. 
                // Mantenemos la porción base que traía el platillo.
                if (assignedEq === 0 && bKey === 'verduras') {
                  return ing;
                }

                const baseEq = Number(ing.eqCantidad) || 1;
                const rawCant = (Number(ing.cantidad) / baseEq) * Number(assignedEq);
                // Redondeo inteligente: no puede decirle al paciente "come 1.33 plátanos"
                const newCant = smartRound(rawCant);
                return { ...ing, cantidad: newCant, eqCantidad: assignedEq };
              }
            }
            return ing;
          })
        };
      })
    })));
  };


  const updateMenu = (menuIdx: number, fn: (m: Menu) => Menu) => {
    setMenus(menus.map((m, i) => i === menuIdx ? fn({ ...m }) : m));
  };

  const updateTiempo = (menuIdx: number, tiempoIdx: number, fn: (t: TiempoComida) => TiempoComida) => {
    updateMenu(menuIdx, (m) => ({
      ...m,
      tiempos: m.tiempos.map((t, i) => i === tiempoIdx ? fn({ ...t }) : t),
    }));
  };

  const moveTiempo = (menuIdx: number, tiempoIdx: number, dir: -1 | 1) => {
    // Los tiempos de comida representan el horario del día — el orden debe ser
    // idéntico en TODOS los menús para que UI y PDF sean consistentes.
    setMenus(prev => {
      // Determinar el nuevo orden usando el menú de referencia (el que el usuario editó)
      const refMenu = prev[menuIdx];
      if (!refMenu) return prev;
      const refTiempos = [...refMenu.tiempos];
      if (tiempoIdx + dir < 0 || tiempoIdx + dir >= refTiempos.length) return prev;

      // Nombres de los tiempos que se van a intercambiar (para mapear a otros menús)
      const nameA = refTiempos[tiempoIdx]?.nombre;
      const nameB = refTiempos[tiempoIdx + dir]?.nombre;

      return prev.map(menu => {
        const tiempos = [...menu.tiempos];
        // Encontrar los índices de nameA y nameB en este menú (por ocurrencia igual)
        const idxA = tiempos.findIndex(t => t.nombre === nameA);
        const idxB = tiempos.findIndex(t => t.nombre === nameB);
        if (idxA === -1 || idxB === -1) {
          // Fallback: swap por índice si los nombres no coinciden
          if (tiempoIdx + dir >= 0 && tiempoIdx + dir < tiempos.length) {
            const temp = tiempos[tiempoIdx];
            tiempos[tiempoIdx] = tiempos[tiempoIdx + dir];
            tiempos[tiempoIdx + dir] = temp;
          }
          return { ...menu, tiempos };
        }
        // Swap por nombre — cada menú mantiene su contenido, solo cambia el orden
        const temp = tiempos[idxA];
        tiempos[idxA] = tiempos[idxB];
        tiempos[idxB] = temp;
        return { ...menu, tiempos };
      });
    });
  };


  const movePlatillo = (menuIdx: number, tiempoIdx: number, platilloName: string, dir: -1 | 1) => {
    updateTiempo(menuIdx, tiempoIdx, (t) => {
      const platillos = Array.from(new Set(t.ingredientes.map(i => i.platillo || '')));
      const pIndex = platillos.indexOf(platilloName);
      if (pIndex + dir < 0 || pIndex + dir >= platillos.length) return t;

      const targetPlatillo = platillos[pIndex + dir];

      platillos[pIndex] = targetPlatillo;
      platillos[pIndex + dir] = platilloName;

      const groups: Record<string, any[]> = {};
      t.ingredientes.forEach(ing => {
        const p = ing.platillo || '';
        if (!groups[p]) groups[p] = [];
        groups[p].push(ing);
      });

      let newIngredientes: any[] = [];
      platillos.forEach(p => {
        if (groups[p]) newIngredientes = newIngredientes.concat(groups[p]);
      });

      return { ...t, ingredientes: newIngredientes };
    });
  };

  // ─── Guardar tiempo como Platillo en la biblioteca ──────────────────────────
  const handleSaveTiempoAsPlatillo = async () => {
    if (!savePlatilloModal) return;
    const { mIdx, tIdx, nombre, categoria } = savePlatilloModal;
    const tiempo = menus[mIdx]?.tiempos[tIdx];
    if (!tiempo || !nombre.trim()) return;

    setSavingPlatillo(true);
    try {
      const ingredientes = tiempo.ingredientes.map(ing => {
        // Filtrar equivalencias vacías que se generan cuando el usuario escribe libre sin
        // seleccionar del catálogo SMAE. Si el array está vacío tras el filtro, reconstruir
        // desde eqGrupo/eqCantidad (legacy) si existen.
        const rawEquivs = (ing.equivalencias || []).filter(
          (e) => e.grupo && String(e.grupo).trim() !== '' && e.cantidad !== '' && e.cantidad != null
        );
        const equivalencias = rawEquivs.length > 0
          ? rawEquivs
          : ing.eqGrupo ? [{ cantidad: ing.eqCantidad, grupo: normalizeGroup(ing.eqGrupo) }] : [];

        return {
          descripcion: ing.descripcion,
          cantidad: ing.cantidad,
          unidad: ing.unidad,
          platillo: ing.platillo || '',
          equivalencias,
          eqCantidad: ing.eqCantidad,
          eqGrupo: ing.eqGrupo ? normalizeGroup(ing.eqGrupo) : '',
          smaeGrPorEq: ing.smaeGrPorEq,
        };
      });

      const { data } = await api.post('/api/platillos', { nombre: nombre.trim(), categoria, ingredientes });
      const saved = data?.data || data;
      setPlatilloLibrary(prev => [...prev, saved]);
      setSavePlatilloModal(null);
      toast({ title: 'Platillo guardado ✅', description: `"${nombre}" está disponible en tu biblioteca.` });
    } catch (err) {
      toast({ title: 'Error', description: 'No se pudo guardar el platillo.', variant: 'destructive' });
    } finally {
      setSavingPlatillo(false);
    }
  };

  // ─── Presupuesto de equivalencias por tiempo (del barrido) ──────────────────
  const getBudgetForTiempo = (tiempo: TiempoComida, planTiempos?: TiempoComida[], tiempoIdx?: number): { label: string; groupKey: string; used: number; budget: number; missing: number; isExtra?: boolean }[] => {
    const barridoData = valData?.barridoEquivalencias;
    if (!barridoData?.tiempos || !barridoData?.distribucion) return [];

    // Con contexto del menú usamos matching por ocurrencia (soporta dos "Colación")
    const barridoTiempoKey = (planTiempos && tiempoIdx !== undefined)
      ? findBarridoTiempoKey(barridoData.tiempos, planTiempos, tiempoIdx)
      : barridoData.tiempos.find(
        (t: string) => t.toLowerCase().trim() === (tiempo.nombre || '').toLowerCase().trim()
      );
    if (!barridoTiempoKey) return [];
    const dist = barridoData.distribucion[barridoTiempoKey] || {};

    const budgetedKeys = new Set(Object.keys(dist).filter(k => Number(dist[k]) > 0));

    const helper = (barridoKey: string) => {
      let used = 0;
      tiempo.ingredientes.forEach(ing => {
        const eqs = ing.equivalencias && ing.equivalencias.length > 0
          ? ing.equivalencias
          : (ing.eqGrupo ? [{ cantidad: ing.eqCantidad, grupo: ing.eqGrupo }] : []);
        eqs.forEach((eq: any) => {
          if (groupToBarridoKey(normalizeGroup(String(eq.grupo))) === barridoKey) {
            used += Number(eq.cantidad) || 0;
          }
        });
      });
      return parseFloat(used.toFixed(2));
    };

    const canonLabel = (barridoKey: string) => {
      const entry = Object.entries(CANONICAL_TO_BARRIDO_KEY).find(([, v]) => v === barridoKey);
      return entry ? entry[0] : barridoKey;
    };

    const budgetedItems = Array.from(budgetedKeys).map(barridoKey => {
      const budget = Number(dist[barridoKey]);
      const used = helper(barridoKey);
      return { label: canonLabel(barridoKey), groupKey: barridoKey, used, budget, missing: parseFloat((budget - used).toFixed(2)) };
    });

    // Grupos extra: en ingredientes pero SIN presupuesto en este tiempo
    const extraTotals: Record<string, number> = {};
    tiempo.ingredientes.forEach(ing => {
      const eqs = ing.equivalencias && ing.equivalencias.length > 0
        ? ing.equivalencias
        : (ing.eqGrupo ? [{ cantidad: ing.eqCantidad, grupo: ing.eqGrupo }] : []);
      eqs.forEach((eq: any) => {
        if (!eq.grupo) return;
        const key = groupToBarridoKey(normalizeGroup(String(eq.grupo)));
        if (!budgetedKeys.has(key) && Number(eq.cantidad) > 0) {
          extraTotals[key] = (extraTotals[key] || 0) + (Number(eq.cantidad) || 0);
        }
      });
    });

    const extraItems = Object.entries(extraTotals).map(([barridoKey, used]) => ({
      label: canonLabel(barridoKey),
      groupKey: barridoKey,
      used: parseFloat(used.toFixed(2)),
      budget: 0,
      missing: parseFloat((-used).toFixed(2)),
      isExtra: true,
    }));

    return [...budgetedItems, ...extraItems];
  };

  const handleSave = async () => {
    if (macroSum !== 100) {
      toast({ title: 'ERROR ESTRATÉGICO', description: 'La distribución de macronutrientes debe sumar el 100% de la carga energética.', variant: 'destructive' });
      return;
    }
    // Mejora: validar nombre de plan si es base
    if (isBasePlan && !nombrePlan.trim()) {
      toast({ title: 'Nombre requerido', description: 'Por favor asigna un nombre al menú antes de guardarlo.', variant: 'destructive' });
      return;
    }
    setSaving(true);
    // Flush de renombres de platillo pendientes (el commit normal es onBlur;
    // si el usuario guarda sin blurear el input, el draft se perdería)
    let menusToSave = menus;
    const draftEntries = Object.entries(platilloDrafts);
    if (draftEntries.length > 0) {
      menusToSave = menus.map(m => ({ ...m, tiempos: m.tiempos.map(t => ({ ...t, ingredientes: [...t.ingredientes] })) }));
      for (const [key, draft] of draftEntries) {
        const finalName = (draft || '').trim();
        if (!finalName) continue;
        const [dMi, dTi, dPIndex] = key.split('-').map(Number);
        const tiempoDraft = menusToSave[dMi]?.tiempos?.[dTi];
        if (!tiempoDraft) continue;
        const names = Array.from(new Set(tiempoDraft.ingredientes.map(i => i.platillo || '')));
        const prevName = names[dPIndex];
        if (prevName === undefined || finalName === prevName) continue;
        tiempoDraft.ingredientes = tiempoDraft.ingredientes.map(ing =>
          (ing.platillo || '') === prevName ? { ...ing, platillo: finalName } : ing
        );
      }
      setMenus(menusToSave);
      setPlatilloDrafts({});
    }
    const body: any = {
      nombre: nombrePlan,
      tipoPlan: tipo,
      calorias: parseFloat(calorias),
      proteinasPct: parseFloat(proteinas),
      carbohidratosPct: parseFloat(carbohidratos),
      grasasPct: parseFloat(grasas),
      proximaSesion,
      proximaSesionHora,
      menus: menusToSave.map((m, mIdx) => ({
        nombre: m.nombre,
        orden: mIdx + 1,
        tiemposComida: m.tiempos.map((t, tIdx) => {
          let injectedNota = t.nota || '';
          if (t.ademas && t.ademas.trim()) {
            injectedNota += `\n<!--META:${JSON.stringify({ ademas: t.ademas.trim() })}-->`;
          }
          return {
            nombre: t.nombre,
            orden: tIdx + 1,
            notaPie: injectedNota,
            bebida: t.bebida || '',
            suplTiempo: t.suplTiempo || '',
            suplNotas: t.suplNotas || '',
            ingredientes: t.ingredientes.map((i, iIdx) => ({
              ...i,
              orden: iIdx + 1,
              cantidad: String(i.cantidad),
              eqCantidad: String(i.eqCantidad || ''),
              smaeGrPorEq: Number(i.smaeGrPorEq) || 0,
              // Serializar explícitamente para no perder el array
              equivalencias: Array.isArray(i.equivalencias) ? i.equivalencias : []
            }))
          };
        })
      })),
      notasGenerales: notas,
      suplementosDetalle,
    };

    if (!isBasePlan) {
      body.valoracionId = valoracionId || undefined;
      body.getSeleccionado = cal;
      body.getSedentario = valData?.getSedentario || 0;
      body.getLeve = valData?.getLeve || 0;
      body.getModerado = valData?.getModerado || 0;
      body.getIntenso = valData?.getIntenso || 0;
    }

    try {
      let serverData;
      if (isEdit) {
        const url = isBasePlan ? `/api/planes/${planId}` : `/api/pacientes/${pacienteId}/planes/${planId}`;
        const { data } = await api.put(url, body);
        serverData = data?.data || data;
      } else {
        const url = isBasePlan ? `/api/planes` : `/api/pacientes/${pacienteId}/planes`;
        const { data } = await api.post(url, body);
        serverData = data?.data || data;
      }
      toast({ title: 'MENÚ GUARDADO' });

      if (onSaved) {
        onSaved(serverData?.id || planId);
      } else {
        const finalPlanId = serverData?.id || planId;
        navigate(isBasePlan ? '/planes' : `/pacientes/${pacienteId}/planes/${finalPlanId}`);
      }
    } catch (err: any) {
      toast({ title: 'Error de Persistencia', description: 'No se pudo sincronizar el menú maestro.', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const { confirm, ConfirmDialogComponent } = useConfirm();

  const handleDelete = async () => {
    const ok = await confirm({
      title: '¿Eliminar Menú?',
      description: 'Esta acción eliminará permanentemente el menú. No se puede deshacer.',
      confirmLabel: 'Sí, Eliminar',
      cancelLabel: 'Cancelar',
      variant: 'danger',
    });
    if (!ok) return;
    try {
      await api.delete(`/api/planes/${planId}`);
      toast({ title: 'MENÚ ELIMINADO' });
      navigate('/planes');
    } catch (err) {
      toast({ title: 'Error al eliminar', variant: 'destructive' });
    }
  };

  if (loadingInitialData) {
    return (
      <div className="space-y-8 animate-fade-in pb-20 max-w-none w-full mt-2">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 pt-6 -mt-8 mb-4">
          <div className="space-y-4 w-full md:w-1/3">
            <div className="h-4 w-24 bg-[#111] animate-pulse rounded" />
            <div className="h-8 w-64 bg-[#111] animate-pulse rounded" />
            <div className="h-4 w-48 bg-[#111] animate-pulse rounded" />
          </div>
          <div className="h-10 w-32 bg-[#111] animate-pulse rounded" />
        </div>
        <div className="bg-[#111] rounded-[12px] h-64 border border-[#2a2a2a] animate-pulse" />
        <div className="grid md:grid-cols-2 gap-8 items-start">
          <div className="bg-[#111] rounded-[12px] h-96 border border-[#2a2a2a] animate-pulse" />
          <div className="bg-[#111] rounded-[12px] h-96 border border-[#2a2a2a] animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="animate-fade-in max-w-none w-full mt-2">
        <div className="sticky top-0 z-30 -mx-4 md:-mx-8 px-4 md:px-8 pt-3 -mt-8 mb-4 pb-3 bg-[#0a0a0a]/95 backdrop-blur-md border-b border-[#1a1a1a] flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div className="space-y-2">
            {(!onSaved || onCancel) && (
              <button onClick={() => onCancel ? onCancel() : navigate(isBasePlan ? '/planes' : `/pacientes/${pacienteId}`)} className="flex items-center gap-2 text-[14px] font-medium text-[#c0c0c0] hover:text-white transition-colors w-fit group mb-4">
                <ArrowLeft className="h-[18px] w-[18px] group-hover:-translate-x-1 transition-transform" /> {onCancel ? 'Salir Sin Guardar' : 'Volver'}
              </button>
            )}
            <div className="animate-slide-up space-y-1">
              <h1 className="text-[26px] font-bold text-white m-0 tracking-tight">
                {pacienteNombre ? pacienteNombre : isBasePlan ? (isEdit ? 'Editar Menú' : 'Nuevo Menú') : (isEdit ? 'Personalizar Menú' : 'Configurar Menú')}
              </h1>
              <p className="text-[#c0c0c0] font-normal text-[14px] m-0 uppercase tracking-widest">
                {pacienteNombre ? (isEdit ? 'Personalizar Menú' : 'Configurar Menú') : isBasePlan ? 'Definición de menú base para la biblioteca' : 'Ajuste de requerimientos y personalización de tiempos'}
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
            {/* Botón Guardar Cambios / Generar Menú arriba - Ahora siempre visible */}
            <button
              onClick={handleSave}
              disabled={saving || macroSum !== 100}
              className="w-full sm:w-auto px-[18px] py-[10px] bg-brand-primary text-bg-base rounded-[8px] text-[14px] font-bold transition-all hover:bg-white flex items-center justify-center gap-2 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <div className="w-[18px] h-[18px] border-2 border-white/20 border-t-white rounded-full animate-spin" />
              ) : (
                <Save className="h-[18px] w-[18px]" />
              )}
              {isEdit ? 'Guardar Cambios' : 'Guardar Menú'}
            </button>

          </div>

          {isBasePlan && isEdit && (
            <button
              onClick={handleDelete}
              className="px-[18px] py-[10px] bg-[#2e1a1a] text-accent-red border border-accent-red/20 text-[14px] font-medium rounded-[8px] hover:bg-[#3d1a1a] transition-colors flex items-center gap-2"
            >
              <Trash2 className="h-[18px] w-[18px]" /> Eliminar menú
            </button>
          )}
        </div>

        <div className="flex gap-5 items-start pb-20 pt-2">
          <div className="flex-1 min-w-0 space-y-6">
            {/* DASHBOARD DE REQUERIMIENTOS: Unificado en la parte superior */}
            <div className="bg-[#111111] p-8 rounded-[12px] animate-slide-up border border-[#2a2a2a] shadow-xl">
              <div className="flex flex-col gap-10">
                {/* CABECERA DE REQUERIMIENTOS: Unificada y Simplificada */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center border-b border-[#2a2a2a] pb-8">
                  {/* Parte 1: Perfil Energético */}
                  <div className="lg:col-span-5 lg:border-r border-[#2a2a2a] lg:pr-10">
                    {isBasePlan ? (
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <label className="text-[10px] font-bold text-[#666] uppercase tracking-widest ml-1">Nombre Menú</label>
                          <input
                            type="text"
                            value={nombrePlan}
                            onChange={(e) => setNombrePlan(e.target.value)}
                            placeholder="Ej: Balanceado 1800"
                            className="w-full bg-transparent text-[16px] font-bold text-white outline-none border-b border-transparent focus:border-brand-primary pb-1 transition-colors"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4 pt-2">
                          <div className="space-y-1">
                            <span className="text-[9px] font-bold text-[#555] uppercase block">Kcal</span>
                            <input
                              type="number"
                              value={calorias}
                              onChange={(e) => setCalorias(e.target.value)}
                              className="w-full bg-transparent text-[28px] font-black text-brand-primary outline-none"
                            />
                          </div>
                          <div className="space-y-1">
                            <span className="text-[9px] font-bold text-[#555] uppercase block">Tipo</span>
                            <select
                              value={tipo}
                              onChange={(e) => setTipo(e.target.value)}
                              className="w-full bg-transparent text-[14px] font-bold text-white outline-none appearance-none cursor-pointer"
                            >
                              <option value="Balanceada">Balanceada</option>
                              <option value="Keto / Low Carb">Keto / Low Carb</option>
                              <option value="Vegetariana">Vegetariana</option>
                              <option value="Hipercalórica">Hipercalórica</option>
                              <option value="Hipocalórica">Hipocalórica</option>
                              <option value="Personalizada">Personalizada</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="flex flex-col items-center lg:items-start group">
                          <span className="text-[10px] font-black text-[#666] uppercase tracking-widest mb-1 group-hover:text-brand-primary transition-colors">Meta Calórica Diaria</span>
                          <div className="flex items-baseline gap-2">
                            <span className="text-[44px] font-black text-white leading-none tracking-tighter">
                              {calorias || '—'}
                            </span>
                            <span className="text-[18px] font-bold text-brand-primary">kcal</span>
                          </div>
                          <div className="mt-3 flex items-center gap-2 bg-[#181818] px-3 py-1.5 rounded-full border border-[#333]">
                            <div className="w-1.5 h-1.5 rounded-full bg-brand-primary shadow-[0_0_8px_rgba(144,194,255,0.5)]" />
                            <span className="text-[10px] text-[#8a8a8a] font-bold uppercase tracking-tight">
                              {valData ? `Objetivo Estratégico Barrido #${valData.numeroValoracion}` : 'Asignación Manual'}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                  </div>

                  {/* Parte 2: Requerimientos Esenciales (Macros y Objetivo) */}
                  <div className="lg:col-span-7">
                    <div className="grid grid-cols-3 gap-6">
                      {[
                        { label: 'Prot %', key: 'pPct', val: proteinas, set: setProteinas, color: '#ef8c8c', bg: 'rgba(239, 140, 140, 0.1)' },
                        { label: 'Carb %', key: 'cPct', val: carbohidratos, set: setCarbohidratos, color: '#90c2ff', bg: 'rgba(144, 194, 255, 0.1)' },
                        { label: 'Gras %', key: 'gPct', val: grasas, set: setGrasas, color: '#f5c842', bg: 'rgba(245, 200, 66, 0.1)' },
                      ].map((m) => (
                        <div key={m.label} className="group flex flex-col items-center">
                          <label
                            className="text-[10px] font-black uppercase tracking-[0.2em] mb-4 transition-colors"
                            style={{ color: m.color }}
                          >
                            {m.label}
                          </label>
                          <div className="relative w-full aspect-square max-w-[80px]">
                            {/* Círculo decorativo de fondo */}
                            <div className="absolute inset-0 rounded-full border-2 border-white/5 bg-[#111111] overflow-hidden">
                              <div className="absolute inset-0 opacity-20 blur-xl" style={{ backgroundColor: m.color }} />
                            </div>

                            <input
                              type="number"
                              value={m.val}
                              onChange={(e) => m.set(e.target.value)}
                              className="absolute inset-0 w-full h-full bg-transparent text-[20px] font-black text-center text-white outline-none z-10 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            />

                            {/* Indicador de progreso circular (visual) */}
                            <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none" viewBox="0 0 100 100">
                              <circle
                                cx="50" cy="50" r="46"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="4"
                                className="text-white/5"
                              />
                              <circle
                                cx="50" cy="50" r="46"
                                fill="none"
                                stroke={m.color}
                                strokeWidth="4"
                                strokeDasharray={289}
                                strokeDashoffset={289 - (289 * (Number(m.val) || 0)) / 100}
                                strokeLinecap="round"
                                className="transition-all duration-1000 ease-out"
                              />
                            </svg>
                          </div>

                          {/* Objetivo del Barrido (Solo porcentaje) */}
                          {macrosBarridoResult && (
                            <div className="mt-3 flex flex-col items-center gap-0.5">
                              <span className="text-[8px] font-bold text-[#444] uppercase tracking-widest">Barrido</span>
                              <span className="text-[14px] font-black text-white/80 leading-none">
                                {macrosBarridoResult[m.key as keyof typeof macrosBarridoResult]}%
                              </span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    {macroSum !== 100 && (
                      <div className="mt-6 flex items-center justify-center gap-2 text-rose-500 bg-rose-500/5 py-2 rounded-lg border border-rose-500/10">
                        <div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Suma {macroSum}% (Ajuste a 100%)</span>
                      </div>
                    )}

                    {/* Toggle agua natural en comidas principales */}
                    <div className="mt-6 flex items-center justify-between px-4 py-3 bg-[#0e1a2a] rounded-[10px] border border-[#1a3050] transition-all">
                      <div className="flex items-center gap-2">
                        <Droplets className="w-4 h-4 text-[#3a9eff]" />
                        <span className="text-[12px] font-bold text-[#c0c0c0] uppercase tracking-wider">Agua natural en todos los tiempos</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const newVal = !aguaNaturalDefault;
                          setAguaNaturalDefault(newVal);
                          if (newVal) {
                            // Auto-fill bebida SOLO en comidas principales (no colaciones)
                            setMenus(prev => prev.map(menu => ({
                              ...menu,
                              tiempos: menu.tiempos.map(t => {
                                if (isColacion(t.nombre)) return t; // B3: colaciones sin bebida
                                if (!t.bebida || t.bebida.trim() === '') {
                                  return { ...t, bebida: 'Agua natural 500ml' };
                                }
                                return t;
                              })
                            })));
                          }
                        }}
                        className={`relative w-11 h-6 rounded-full transition-colors duration-300 ease-in-out ${aguaNaturalDefault ? 'bg-[#3a9eff]' : 'bg-[#333]'}`}
                      >
                        <div className={`absolute top-[2px] left-[2px] w-[20px] h-[20px] bg-white rounded-full transition-transform duration-300 ${aguaNaturalDefault ? 'translate-x-[20px]' : 'translate-x-0'}`} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* TABLA DE EQUIVALENCIAS (BARRIDO) */}
            {!isBasePlan && valData?.barridoEquivalencias && (
              <div className="bg-[#111] rounded-[12px] border border-[#2a2a2a] overflow-hidden">
                <div
                  className="bg-[#181818] px-6 py-4 flex items-center justify-between cursor-pointer hover:bg-[#1d1d1d] transition-all"
                  onClick={() => setShowBarridoRef(!showBarridoRef)}
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-brand-primary/10 rounded-lg">
                      <Activity className="h-4 w-4 text-brand-primary" />
                    </div>
                    <div>
                      <h3 className="text-[14px] font-bold text-white uppercase tracking-wider">Carga Estratégica de Equivalencias (Barrido)</h3>
                      <p className="text-[11px] text-[#8a8a8a]">Sincronización automática con porciones asignadas</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <ChevronDown className={`h-5 w-5 text-[#555] transition-transform duration-300 ${showBarridoRef ? 'rotate-180' : ''}`} />
                  </div>
                </div>

                {showBarridoRef && (
                  <div className="p-6 border-t border-[#2a2a2a] animate-in fade-in slide-in-from-top-2 duration-300">
                    <BarridoEquivalenciasComp
                      value={valData.barridoEquivalencias}
                      onChange={(data) => {
                        setValData({ ...valData, barridoEquivalencias: data });
                        autoScaleIngredients(data);
                      }}
                    />
                  </div>
                )}
              </div>
            )}

            {/* SECCIÓN DE MENÚS */}
            <div className="grid md:grid-cols-2 gap-8 items-start">
              {menus.map((menu, mi) => (
                <div key={mi} className="bg-[#111111] rounded-[12px] animate-slide-up border border-[#2a2a2a] flex flex-col h-full ring-1 ring-border-default hover:ring-border-subtle transition-all" style={{ animationDelay: `${mi * 0.1}s` }}>
                  <div className="bg-[#181818] border-b border-[#2a2a2a] px-6 py-4 flex items-center justify-between">
                    <input
                      value={menu.nombre}
                      onChange={(e) => updateMenu(mi, (m) => ({ ...m, nombre: e.target.value }))}
                      className="text-[16px] font-semibold bg-transparent border-none outline-none w-full text-white selection:bg-brand-primary placeholder:text-[#8a8a8a]"
                      placeholder="Nombre del menú"
                    />

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setMenus(menus.filter((_, i) => i !== mi))}
                        className="p-2 text-[#8a8a8a] hover:text-accent-red hover:bg-[#2e1a1a] rounded-[6px] transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <div className="p-6 space-y-6 flex-1 flex flex-col">
                    {menu.tiempos.map((tiempo, ti) => (
                      <div key={ti} className="p-4 rounded-[8px] border border-[#2a2a2a] bg-[#181818] group relative">
                        <div className="flex items-center justify-between mb-4">
                          <input
                            value={tiempo.nombre}
                            onChange={(e) => updateTiempo(mi, ti, (t) => ({ ...t, nombre: e.target.value }))}
                            className="text-[14px] font-semibold text-white bg-transparent border-none outline-none w-[70%]"
                            placeholder="Nombre del tiempo"
                          />
                          <div className="flex items-center gap-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => moveTiempo(mi, ti, -1)} disabled={ti === 0} className="p-1.5 text-[#8a8a8a] disabled:opacity-20 hover:text-white rounded-[6px] hover:bg-[#333] transition-colors">
                              <ChevronUp className="h-3.5 w-3.5" />
                            </button>
                            <button onClick={() => moveTiempo(mi, ti, 1)} disabled={ti === menu.tiempos.length - 1} className="p-1.5 text-[#8a8a8a] disabled:opacity-20 hover:text-white rounded-[6px] hover:bg-[#333] transition-colors">
                              <ChevronDown className="h-3.5 w-3.5" />
                            </button>
                            <div className="w-[1px] h-4 bg-[#333] hidden sm:block mx-1"></div>
                            <button onClick={() => updateMenu(mi, (m) => ({ ...m, tiempos: m.tiempos.filter((_, i) => i !== ti) }))} className="p-1.5 text-[#8a8a8a] hover:text-accent-red rounded-[6px] hover:bg-[#2e1a1a] transition-colors">
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* ─── Bebida y Suplemento alineados al título del tiempo ─── */}
                        <div className="flex flex-col gap-1 mb-3 px-1">
                          <div className="flex items-center gap-2">
                            <Droplets className="w-3.5 h-3.5 text-[#3a9eff] shrink-0" />
                            <input
                              type="text"
                              placeholder="Bebida (ej: 500ml agua con limón)"
                              value={tiempo.bebida || ''}
                              onFocus={(e) => {
                                if (e.target.value === 'Agua natural 500ml') {
                                  updateTiempo(mi, ti, t => ({ ...t, bebida: '' }));
                                }
                              }}
                              onChange={(e) => updateTiempo(mi, ti, t => ({ ...t, bebida: e.target.value }))}
                              onBlur={(e) => {
                                // B3: solo restaurar agua en comidas principales, no en colaciones
                                if (!e.target.value.trim() && aguaNaturalDefault && !isColacion(tiempo.nombre)) {
                                  updateTiempo(mi, ti, t => ({ ...t, bebida: 'Agua natural 500ml' }));
                                }
                              }}
                              className={`flex-1 bg-transparent text-[13px] font-bold placeholder:text-[#999] placeholder:font-medium outline-none border-b border-transparent focus:border-[#3a9eff]/40 transition-colors py-0.5 ${tiempo.bebida === 'Agua natural 500ml'
                                  ? 'text-[#888]'    // B6: autofill opaco para diferenciarlo del valor personalizado
                                  : 'text-white'     // valor personalizado: blanco
                                }`}
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            <Pill className="w-3.5 h-3.5 text-[#a97fff] shrink-0" />
                            <input
                              type="text"
                              placeholder="Suplemento del tiempo (ej: 1 scoop Whey)"
                              value={tiempo.suplTiempo || ''}
                              onChange={(e) => updateTiempo(mi, ti, t => ({ ...t, suplTiempo: e.target.value }))}
                              className="flex-1 bg-transparent text-[13px] font-bold text-white placeholder:text-[#999] placeholder:font-medium outline-none border-b border-transparent focus:border-[#a97fff]/40 transition-colors py-0.5"
                            />
                          </div>
                        </div>

                        {/* ─── Panel Presupuesto Colapsable ─── */}
                        {(() => {
                          const budgetKey = `${mi}-${ti}`;
                          const budgetItems = getBudgetForTiempo(tiempo, menu.tiempos, ti);
                          if (budgetItems.length === 0) return null;
                          const isOpen = showBudgetMap[budgetKey] !== false; // Abierto por defecto
                          return (
                            <div className="mb-3 rounded-[6px] border border-[#2a2a2a] overflow-hidden">
                              <button
                                onClick={() => setShowBudgetMap(prev => ({ ...prev, [budgetKey]: !prev[budgetKey] }))}
                                className="w-full flex items-center justify-between px-3 py-2 text-[9px] font-black text-[#555] uppercase tracking-widest hover:bg-[#181818] transition-colors"
                              >
                                <span>Presupuesto de Equivalencias</span>
                                <ChevronDown className={`h-3 w-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                              </button>
                              {isOpen && (
                                <div className="px-3 pb-3 space-y-2 bg-[#111]">
                                  {budgetItems.map(({ label, used, budget: bdgt, isExtra }) => {
                                    if (isExtra) {
                                      return (
                                        <div key={`extra-${label}`}>
                                          <div className="flex items-center justify-between mb-0.5">
                                            <span className="text-[11px] font-semibold text-red-400">{label}</span>
                                            <span className="text-[10px] font-bold tabular-nums text-red-400">+{used} eq · No presupuestado</span>
                                          </div>
                                          <div className="w-full h-1.5 bg-[#2e1a1a] rounded-full overflow-hidden">
                                            <div className="h-full rounded-full bg-red-500 transition-all duration-300" style={{ width: '100%' }} />
                                          </div>
                                        </div>
                                      );
                                    }
                                    const pct = Math.min((used / bdgt) * 100, 100);
                                    const over = used > bdgt;
                                    const done = !over && pct >= 85;
                                    const barColor = over ? '#ef4444' : done ? '#22c55e' : '#555';
                                    const textColor = over ? 'text-red-400' : done ? 'text-green-400' : 'text-[#8a8a8a]';
                                    return (
                                      <div key={label}>
                                        <div className="flex items-center justify-between mb-0.5">
                                          <span className="text-[11px] font-semibold text-white">{label}</span>
                                          <span className={`text-[10px] font-bold tabular-nums ${textColor}`}>
                                            {used} / {bdgt} eq {over ? `⚠ +${parseFloat((used - bdgt).toFixed(2))} extra` : done ? '✓' : ''}
                                          </span>
                                        </div>
                                        <div className="w-full h-1.5 bg-[#222] rounded-full overflow-hidden">
                                          <div className="h-full rounded-full transition-all duration-300" style={{ width: `${pct}%`, background: barColor }} />
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          );
                        })()}

                        <div className="space-y-6">
                          {Array.from(new Set(tiempo.ingredientes.map(i => i.platillo || ''))).map((pName, pIndex) => (
                            <div key={`${mi}-${ti}-${pIndex}`} className={pName ? 'p-3 bg-[#111111] border border-[#333] rounded-[8px]' : ''}>
                              {pName ? (<div className="flex items-center gap-2 mb-3 pb-2 border-b border-[#2a2a2a] border-dashed">
                                <span className="text-white text-[11px] font-bold uppercase tracking-wider shrink-0">Platillo:</span>
                                {(() => {
                                  const draftKey = `${mi}-${ti}-${pIndex}`;
                                  const displayValue = platilloDrafts[draftKey] ?? pName;
                                  return (
                                    <input
                                      className="bg-transparent border-none outline-none font-bold text-white placeholder:text-[#999] text-[14px] w-full min-w-0"
                                      value={displayValue}
                                      onChange={(e) => {
                                        setPlatilloDrafts(prev => ({ ...prev, [draftKey]: e.target.value }));
                                      }}
                                      onBlur={(e) => {
                                        const finalName = e.target.value.trim();
                                        setPlatilloDrafts(prev => {
                                          const next = { ...prev };
                                          delete next[draftKey];
                                          return next;
                                        });
                                        // Si quedó vacío, conservar nombre anterior — no permitimos colapsar el grupo
                                        if (!finalName) return;
                                        if (finalName === pName) return;
                                        updateTiempo(mi, ti, t => ({
                                          ...t,
                                          ingredientes: t.ingredientes.map(ing => (ing.platillo || '') === pName ? { ...ing, platillo: finalName } : ing)
                                        }));
                                      }}
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
                                        if (e.key === 'Escape') {
                                          setPlatilloDrafts(prev => {
                                            const next = { ...prev };
                                            delete next[draftKey];
                                            return next;
                                          });
                                          (e.target as HTMLInputElement).blur();
                                        }
                                      }}
                                      placeholder="Ej: Sándwich de Pollo (Opcional)"
                                    />
                                  );
                                })()}

                                <div className="flex items-center gap-1 ml-auto shrink-0">
                                  <button onClick={() => movePlatillo(mi, ti, pName, -1)} disabled={pIndex === 0} className="p-1 text-[#555] disabled:opacity-30 hover:text-white rounded-[4px] hover:bg-[#2a2a2a] transition-colors">
                                    <ChevronUp className="h-3 w-3" />
                                  </button>
                                  <button onClick={() => movePlatillo(mi, ti, pName, 1)} disabled={pIndex === Array.from(new Set(tiempo.ingredientes.map(i => i.platillo || ''))).length - 1} className="p-1 text-[#555] disabled:opacity-30 hover:text-white rounded-[4px] hover:bg-[#2a2a2a] transition-colors">
                                    <ChevronDown className="h-3 w-3" />
                                  </button>
                                  {pName && (
                                    <button
                                      onClick={() => updateTiempo(mi, ti, t => ({ ...t, ingredientes: t.ingredientes.filter(ing => ing.platillo !== pName) }))}
                                      className="text-[10px] uppercase font-bold text-[#8a8a8a] hover:text-accent-red ml-1 px-1.5 py-1 rounded-[4px] hover:bg-[#2e1a1a] whitespace-nowrap transition-colors tracking-wider"
                                    >
                                      Borrar
                                    </button>
                                  )}
                                </div>
                              </div>) : null}
                              <div className="space-y-4">
                                {tiempo.ingredientes.map((ing, ii) => (ing.platillo || '') === pName ? (
                                  <SmaeIngredientePicker
                                    key={ing.id || `ing-${mi}-${ti}-${ii}`}
                                    ingrediente={ing}
                                    index={ii}
                                    gapByGroup={getBudgetForTiempo(tiempo, menu.tiempos, ti).reduce((acc, b) => ({ ...acc, [b.groupKey]: b.missing > 0 ? b.missing : 0 }), {} as Record<string, number>)}
                                    onUpdate={(updates) =>
                                      updateTiempo(mi, ti, (t) => ({
                                        ...t,
                                        ingredientes: t.ingredientes.map((x, j) =>
                                          j === ii ? { ...x, ...updates } : x
                                        ),
                                      }))
                                    }
                                    onRemove={() =>
                                      updateTiempo(mi, ti, (t) => ({
                                        ...t,
                                        ingredientes: t.ingredientes.filter((_, j) => j !== ii),
                                      }))
                                    }
                                  />
                                ) : null)}

                                <button
                                  onClick={() => updateTiempo(mi, ti, (t) => ({ ...t, ingredientes: [...t.ingredientes, { ...emptyIngrediente(), platillo: pName }] }))}
                                  className="w-full py-2 bg-transparent border border-dashed border-[#2a2a2a] hover:border-[#333] text-[#c0c0c0] hover:text-white text-[12px] font-medium rounded-[6px] transition-colors"
                                >
                                  + Agregar Alimento
                                </button>
                              </div>
                            </div>
                          ))}

                          <div className="flex gap-2">
                            <button
                              onClick={() => updateTiempo(mi, ti, (t) => ({ ...t, ingredientes: [...t.ingredientes, { ...emptyIngrediente(), platillo: '' }] }))}
                              className="flex-1 py-2 bg-transparent border border-dashed border-[#2a2a2a] hover:border-[#555] text-[#8a8a8a] hover:text-white text-[12px] font-medium rounded-[6px] transition-colors"
                            >
                              + Agregar Ingrediente
                            </button>
                            <button
                              onClick={() => {
                                let nuevoNombreBase = "Nuevo Platillo";
                                let nuevoNombre = nuevoNombreBase;
                                let cnt = 1;
                                while (tiempo.ingredientes.some(i => i.platillo === nuevoNombre)) {
                                  nuevoNombre = `${nuevoNombreBase} ${cnt}`;
                                  cnt++;
                                }
                                updateTiempo(mi, ti, (t) => ({ ...t, ingredientes: [...t.ingredientes, { ...emptyIngrediente(), platillo: nuevoNombre }] }))
                              }}
                              className="flex-1 py-2 bg-transparent border border-dashed border-[#333] text-brand-primary hover:text-brand-primary/80 text-[12px] font-bold rounded-[6px] transition-colors uppercase tracking-wider"
                            >
                              + Crear Platillo
                            </button>
                          </div>

                          <div className="relative">
                            <div className="flex gap-2 mt-3">
                              <button
                                onClick={() => setShowPlatilloSelector(showPlatilloSelector?.mIdx === mi && showPlatilloSelector?.tIdx === ti ? null : { mIdx: mi, tIdx: ti })}
                                className="flex-1 py-2.5 px-4 bg-[#1a1a1a] border border-[#333] text-[#90c2ff] hover:text-white hover:border-[#90c2ff]/40 hover:bg-[#1d2536] text-[12px] font-bold rounded-[8px] transition-all uppercase tracking-wider flex items-center justify-center gap-2"
                              >
                                <BookOpen className="w-4 h-4" /> Importar Alimentos
                              </button>
                              {tiempo.ingredientes.length > 0 && (
                                <button
                                  onClick={() => setSavePlatilloModal({ mIdx: mi, tIdx: ti, nombre: tiempo.nombre, categoria: 'PERSONALIZADO' })}
                                  className="py-2.5 px-3.5 bg-[#1a1a1a] border border-[#333] text-[#a97fff] hover:text-white hover:border-[#a97fff]/40 hover:bg-[#251d36] text-[12px] font-bold rounded-[8px] transition-all uppercase tracking-wider flex items-center gap-1.5"
                                  title="Guardar tiempo como Platillo"
                                >
                                  <Bookmark className="w-4 h-4" /> Guardar
                                </button>
                              )}
                            </div>

                            {showPlatilloSelector?.mIdx === mi && showPlatilloSelector?.tIdx === ti && (
                              <div className="absolute z-50 left-0 right-0 bottom-full mb-2 bg-[#111] border border-[#444] rounded-[12px] shadow-[0_8px_32px_rgba(0,0,0,0.6)] p-4 animate-in fade-in slide-in-from-bottom-2">
                                {/* Controles de búsqueda y filtros combinados */}
                                <div className="space-y-2 mb-3">
                                  <Input
                                    placeholder="🔍 Buscar por nombre de platillo..."
                                    className="h-9 text-xs bg-[#0a0a0a] border-[#333] focus:border-[#90c2ff] rounded-[8px]"
                                    autoFocus
                                    value={platilloSearch}
                                    onChange={(e) => setPlatilloSearch(e.target.value)}
                                  />
                                  <div className="relative">
                                    <select
                                      value={platilloCatFilter || ''}
                                      onChange={(e) => setPlatilloCatFilter(e.target.value ? e.target.value : null)}
                                      className="w-full h-9 text-xs bg-[#0a0a0a] border border-[#333] text-white rounded-[8px] pl-3 pr-8 outline-none focus:border-[#90c2ff] appearance-none"
                                    >
                                      <option value="">TODOS</option>
                                      {Array.from(new Set(platilloLibrary.map(p => p.categoria))).sort().map(cat => (
                                        <option key={cat} value={cat}>{cat} ({platilloLibrary.filter(p => p.categoria === cat).length})</option>
                                      ))}
                                    </select>
                                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#555] pointer-events-none" />
                                  </div>
                                </div>

                                {/* Lista de platillos renderizada siempre por defecto (TODOS) */}
                                <div className="max-h-[260px] overflow-y-auto space-y-1 custom-scrollbar">
                                  {(() => {
                                    // Mapa label (eqGrupo del platillo) → key (barrido distribucion)
                                    const LABEL_TO_KEY: Record<string, string> = {
                                      'Verduras': 'verduras', 'Verdura': 'verduras',
                                      'Frutas': 'frutas', 'Fruta': 'frutas',
                                      'Cereal s/grasa': 'cerealSinGr', 'C y T sin grasa': 'cerealSinGr',
                                      'Cereal c/grasa': 'cerealConGr', 'C y T con grasa': 'cerealConGr',
                                      'Leguminosas': 'leguminosas',
                                      'AOA Muy Bajo': 'aoaMuyBajo', 'AOA muy bajo': 'aoaMuyBajo',
                                      'AOA Bajo': 'aoaBajo', 'AOA bajo': 'aoaBajo',
                                      'AOA Moderado': 'aoaModerado', 'AOA moderado': 'aoaModerado',
                                      'AOA Alto': 'aoaAlto', 'AOA alto': 'aoaAlto',
                                      'Leche descremada': 'lecheDesc', 'Leche Descrem.': 'lecheDesc',
                                      'Leche semidescremada': 'lecheSemi', 'Leche Semi': 'lecheSemi',
                                      'Leche entera': 'lecheEntera', 'Leche Entera': 'lecheEntera',
                                      'Leche azucarada': 'lecheAz', 'Leche Azucarada': 'lecheAz',
                                      'Grasa s/prot': 'grasaSinProt', 'A y G sin proteína': 'grasaSinProt',
                                      'Grasa c/prot': 'grasaConProt', 'A y G con proteína': 'grasaConProt',
                                      'Az sin grasa': 'azSinGr', 'Azúcar s/grasa': 'azSinGr',
                                      'Az con grasa': 'azConGr', 'Azúcar c/grasa': 'azConGr',
                                    };

                                    const results = platilloLibrary.filter(p => {
                                      if (platilloSearch) {
                                        return p.nombre.toLowerCase().includes(platilloSearch.toLowerCase()) ||
                                          p.categoria.toLowerCase().includes(platilloSearch.toLowerCase());
                                      }
                                      return !platilloCatFilter || p.categoria === platilloCatFilter;
                                    });

                                    if (results.length === 0) return <p className="text-center py-4 text-[10px] text-[#555]">Sin resultados.</p>;

                                    return results.map(p => (
                                      <button
                                        key={p.id}
                                        onClick={() => {
                                          const d = valData?.barridoEquivalencias?.distribucion;
                                          // Encontrar el tiempo del barrido que coincide con este tiempo de comida
                                          const barridoTiempo = valData?.barridoEquivalencias?.tiempos?.find(
                                            (t: string) => t.toLowerCase().trim() === (tiempo.nombre || '').toLowerCase().trim()
                                          );
                                          const distTiempo = d && barridoTiempo ? d[barridoTiempo] : null;

                                          const ings = p.ingredientes.map((i: any, idx: number) => {
                                            let scaledCant = Number(i.cantidad);
                                            let scaledEq = Number(i.eqCantidad);

                                            // Unidades discretas (procesados, empaquetados): NO escalar cantidad
                                            const UNIDADES_DISCRETAS = ['PZ', 'PAQUETE', 'BOTELLA', 'PIEZA', 'LATA', 'BOLSA', 'BARRA', 'SOBRE', 'TARRO', 'FRASCO'];
                                            const esDiscreta = UNIDADES_DISCRETAS.includes((i.unidad || '').toUpperCase().trim());

                                            // Parsear equivalencias si vienen como string
                                            let eqArray = [];
                                            if (Array.isArray(i.equivalencias)) {
                                              eqArray = i.equivalencias;
                                            } else if (typeof i.equivalencias === 'string' && i.equivalencias.trim() !== '') {
                                              try { eqArray = JSON.parse(i.equivalencias); } catch (e) { }
                                            }

                                            // Sanitizar equivalencias heredadas: eliminar entradas fantasma con grupo vacío
                                            const rawEquivs = eqArray.filter(
                                              (e: any) => e.grupo && String(e.grupo).trim() !== '' && e.cantidad !== '' && e.cantidad != null
                                            );

                                            // Si tiene más de una equivalencia o fue ingresado sin gramos, se considera complejo y no se escala
                                            const esComplejo = rawEquivs.length > 1 || (Number(i.cantidad) === 0);

                                            if (!esDiscreta && !esComplejo && i.eqGrupo && distTiempo) {
                                              // Traduce el label del platillo al key del barrido
                                              const barridoKey = LABEL_TO_KEY[i.eqGrupo] || i.eqGrupo;
                                              const assigned = distTiempo[barridoKey];
                                              if (assigned != null && assigned > 0) {
                                                const baseEq = Number(i.eqCantidad) || 1;
                                                // Redondeo inteligente: no puede decirle "come 1.33 plátanos"
                                                scaledCant = smartRound((Number(i.cantidad) / baseEq) * assigned);
                                                scaledEq = assigned;
                                              }
                                            }

                                            // Calcular factor de escala para equivalencias
                                            const origCant = Number(i.cantidad) || 0;
                                            const scaleFactor = (scaledCant !== origCant && origCant > 0) ? (scaledCant / origCant) : 1;

                                            const cleanEquivencias = rawEquivs.length > 0
                                              ? rawEquivs.map((e: any) => ({
                                                grupo: e.grupo,
                                                // Escalar cada grupo proporcionalmente al mismo factor que la cantidad física
                                                cantidad: scaleFactor !== 1 ? smartRound(Number(e.cantidad) * scaleFactor) : Number(e.cantidad),
                                              }))
                                              : i.eqGrupo ? [{ cantidad: scaledEq, grupo: i.eqGrupo }] : [];

                                            return {
                                              ...i,
                                              cantidad: scaledCant,
                                              eqCantidad: scaledEq,
                                              smaeGrPorEq: Number(i.smaeGrPorEq) || 0,
                                              equivalencias: cleanEquivencias,
                                              platillo: p.nombre,
                                              orden: (tiempo.ingredientes.length || 0) + idx + 1
                                            };
                                          });

                                          updateTiempo(mi, ti, (t) => ({ ...t, ingredientes: [...t.ingredientes, ...ings] }));
                                          setShowPlatilloSelector(null);
                                          setPlatilloSearch('');
                                          setPlatilloCatFilter(null);
                                        }}
                                        className="w-full text-left px-3 py-2 hover:bg-[#1a1a1a] rounded-lg transition-colors flex items-center justify-between group"
                                      >
                                        <div>
                                          <p className="text-[12px] font-bold text-white group-hover:text-[#90c2ff]">{p.nombre}</p>
                                          <p className="text-[10px] text-[#555]">{p.categoria}</p>
                                        </div>
                                        <Plus className="w-3 h-3 text-[#555] group-hover:text-[#90c2ff]" />
                                      </button>
                                    ));
                                  })()}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}

                    <div className="flex-1" />

                    {/* Importar tiempos desde el barrido (los que aún no están en este menú) */}
                    {(() => {
                      const barridoTiempos: string[] = valData?.barridoEquivalencias?.tiempos || valData?.barrido?.tiempos || [];
                      if (!barridoTiempos.length) return null;
                      const existing = new Set(menu.tiempos.map(t => (t.nombre || '').trim().toLowerCase()));
                      const faltantes = barridoTiempos.filter(bt => !existing.has((bt || '').trim().toLowerCase()));
                      if (!faltantes.length) return null;
                      return (
                        <div className="mt-4 p-3 rounded-[8px] border border-[#2a2a2a] bg-[#0f1620]">
                          <p className="text-[10px] font-bold text-[#8a8a8a] uppercase tracking-widest m-0 mb-2">
                            Importar de barrido
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {faltantes.map((nombre) => (
                              <button
                                key={nombre}
                                type="button"
                                onClick={() => updateMenu(mi, (m) => ({
                                  ...m,
                                  tiempos: [...m.tiempos, { nombre: nombre.toUpperCase(), ingredientes: [], nota: '', bebida: '', suplTiempo: '', suplNotas: '', ademas: '' }]
                                }))}
                                className="flex items-center gap-1 text-[11px] font-bold text-[#90c2ff] bg-[#1a2640] hover:bg-[#22324f] border border-[#3a5680] px-3 py-1.5 rounded-[6px] uppercase tracking-wider transition-colors"
                                title={`Agregar "${nombre}" desde el barrido`}
                              >
                                <Plus className="w-3 h-3" /> {nombre}
                              </button>
                            ))}
                          </div>
                        </div>
                      );
                    })()}

                    <button
                      onClick={() => updateMenu(mi, (m) => ({
                        ...m, tiempos: [...m.tiempos, { nombre: 'Nuevo Tiempo', ingredientes: [], nota: '' }]
                      }))}
                      className="w-full py-3 mt-4 border border-dashed border-[#333] hover:border-text-secondary rounded-[8px] text-[13px] font-medium text-[#8a8a8a] hover:text-white transition-colors"
                    >
                      + Agregar Tiempo de Comida
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>{/* closes flex-1 main col */}

          {/* ─── Resumen clínico sidebar ─── */}
          {!isBasePlan && pacienteInfo && (
            <aside className="hidden xl:block w-[260px] shrink-0 sticky top-[68px] self-start max-h-[calc(100vh-88px)] overflow-y-auto custom-scrollbar space-y-3">
              <div className="bg-[#111] border border-[#2a2a2a] rounded-[12px] p-4">
                <p className="text-[9px] font-black text-[#555] uppercase tracking-widest mb-1">{pacienteNombre}</p>
                <p className="text-[10px] font-bold text-[#3a3a3a] uppercase tracking-widest">Resumen clínico · Solo lectura</p>
              </div>

              <div className="space-y-2">
                {/* Número de comidas */}
                {valData?.barridoEquivalencias?.tiempos?.length > 0 && (
                  <SidebarSeccion titulo="Número de comidas">
                    <p className="text-[12px] font-bold text-white leading-snug">
                      {valData.barridoEquivalencias.tiempos.length} tiempos: {valData.barridoEquivalencias.tiempos.join(', ')}
                    </p>
                  </SidebarSeccion>
                )}

                {/* Ejercicio */}
                {(pacienteInfo?.ejercicio?.objetivo || pacienteInfo?.ejercicio?.disciplina) && (
                  <SidebarSeccion titulo="Ejercicio">
                    <div className="space-y-0.5">
                      {pacienteInfo.ejercicio?.objetivo && <p className="text-[12px] text-[#e0e0e0]"><span className="text-[#8a8a8a]">Objetivo:</span> {pacienteInfo.ejercicio.objetivo}</p>}
                      {pacienteInfo.ejercicio?.disciplina && <p className="text-[12px] text-[#e0e0e0]"><span className="text-[#8a8a8a]">Disciplina:</span> {pacienteInfo.ejercicio.disciplina}</p>}
                      {pacienteInfo.ejercicio?.frecuencia && <p className="text-[12px] text-[#e0e0e0]"><span className="text-[#8a8a8a]">Frecuencia:</span> {pacienteInfo.ejercicio.frecuencia}</p>}
                      {pacienteInfo.ejercicio?.nivelActividad && <p className="text-[12px] text-[#e0e0e0]"><span className="text-[#8a8a8a]">Nivel:</span> {pacienteInfo.ejercicio.nivelActividad}</p>}
                    </div>
                  </SidebarSeccion>
                )}

                {/* Suplementos activos */}
                {suplementosDetalle.filter((s: any) => s.activo && s.nombre).length > 0 && (
                  <SidebarSeccion titulo="Suplementos activos">
                    <ul className="space-y-1">
                      {suplementosDetalle.filter((s: any) => s.activo && s.nombre).map((s: any, i: number) => (
                        <li key={i} className="text-[12px] text-[#e0e0e0] flex items-start gap-1.5">
                          <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-green-500 shrink-0" />
                          <span><span className="font-semibold text-white">{s.nombre}</span>{s.indicaciones && <span className="text-[#8a8a8a]"> — {s.indicaciones}</span>}</span>
                        </li>
                      ))}
                    </ul>
                  </SidebarSeccion>
                )}

                {/* Notas clínicas */}
                {valData?.comentarios && (
                  <SidebarSeccion titulo="Notas clínicas">
                    <p className="text-[12px] text-[#e0e0e0] whitespace-pre-wrap leading-relaxed">{valData.comentarios}</p>
                  </SidebarSeccion>
                )}

                {/* Alimentos a evitar */}
                {Array.isArray(valData?.evitar) && valData.evitar.filter((e: any) => e?.valor?.trim()).length > 0 && (
                  <SidebarSeccion titulo="Alimentos a evitar">
                    <ul className="space-y-1">
                      {valData.evitar.filter((e: any) => e?.valor?.trim()).map((e: any, i: number) => (
                        <li key={i} className="text-[12px] text-red-300 flex items-start gap-1.5">
                          <span className="mt-0.5 shrink-0 text-red-500">✕</span> {e.valor}
                        </li>
                      ))}
                    </ul>
                  </SidebarSeccion>
                )}

                {/* Patología */}
                {pacienteInfo?.antecedentes?.patologia && (
                  <SidebarSeccion titulo="Patología"><p className="text-[12px] text-[#e0e0e0]">{pacienteInfo.antecedentes.patologia}</p></SidebarSeccion>
                )}

                {/* Fármacos */}
                {((pacienteInfo?.antecedentes?.farmacosDetalle?.length ?? 0) > 0 || pacienteInfo?.antecedentes?.farmacos) && (
                  <SidebarSeccion titulo="Fármacos">
                    {pacienteInfo?.antecedentes?.farmacosDetalle && pacienteInfo.antecedentes.farmacosDetalle.length > 0 ? (
                      <ul className="list-disc list-inside space-y-0.5">
                        {pacienteInfo.antecedentes.farmacosDetalle.map((f, i) => (
                          <li key={i} className="text-[12px] text-[#e0e0e0]">
                            {f.nombre}{f.tiempoTomando ? ` — ${f.tiempoTomando}` : ''}{!f.activo ? ' (ya no)' : ''}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-[12px] text-[#e0e0e0]">{pacienteInfo.antecedentes.farmacos}</p>
                    )}
                  </SidebarSeccion>
                )}

                {/* Alergias */}
                {pacienteInfo?.antecedentes?.alergias && (
                  <SidebarSeccion titulo="Alergias"><p className="text-[12px] text-[#e0e0e0]">{pacienteInfo.antecedentes.alergias}</p></SidebarSeccion>
                )}

                {/* No consume / no le gustan */}
                {pacienteInfo?.antecedentes?.alimentosNoGustan && (
                  <SidebarSeccion titulo="No consume / No le gustan"><p className="text-[12px] text-[#e0e0e0]">{pacienteInfo.antecedentes.alimentosNoGustan}</p></SidebarSeccion>
                )}

                {/* Ciclo menstrual */}
                {pacienteInfo?.antecedentes?.cicloMenstrual && (
                  <SidebarSeccion titulo="Ciclo Menstrual"><p className="text-[12px] text-[#e0e0e0]">{pacienteInfo.antecedentes.cicloMenstrual}</p></SidebarSeccion>
                )}

                {/* Alimentos que sí le gustan */}
                {pacienteInfo?.antecedentes?.alimentosGustan && (
                  <SidebarSeccion titulo="Le gustan / Consume">
                    <p className="text-[12px] text-[#e0e0e0]">{pacienteInfo.antecedentes.alimentosGustan}</p>
                  </SidebarSeccion>
                )}

                {/* Tránsito intestinal */}
                {pacienteInfo?.antecedentes?.estrenimiento && (
                  <SidebarSeccion titulo="Tránsito Intestinal">
                    <p className="text-[12px] text-[#e0e0e0]">{pacienteInfo.antecedentes.estrenimiento}</p>
                  </SidebarSeccion>
                )}

                {/* Agua */}
                {pacienteInfo?.antecedentes?.agua && (
                  <SidebarSeccion titulo="Agua al día">
                    <p className="text-[12px] text-[#e0e0e0]">{pacienteInfo.antecedentes.agua}</p>
                  </SidebarSeccion>
                )}

                {/* Signos y síntomas */}
                {pacienteInfo?.antecedentes?.signosYSintomas && (
                  <SidebarSeccion titulo="Signos y Síntomas">
                    <p className="text-[12px] text-[#e0e0e0]">{pacienteInfo.antecedentes.signosYSintomas}</p>
                  </SidebarSeccion>
                )}

                {/* Hora y duración entrenamiento */}
                {(pacienteInfo?.ejercicio?.horaEntrenamiento || pacienteInfo?.ejercicio?.tiempo) && (
                  <SidebarSeccion titulo="Entrenamiento">
                    <div className="space-y-0.5">
                      {pacienteInfo.ejercicio?.horaEntrenamiento && <p className="text-[12px] text-[#e0e0e0]"><span className="text-[#8a8a8a]">Hora:</span> {pacienteInfo.ejercicio.horaEntrenamiento}</p>}
                      {pacienteInfo.ejercicio?.tiempo && <p className="text-[12px] text-[#e0e0e0]"><span className="text-[#8a8a8a]">Duración:</span> {pacienteInfo.ejercicio.tiempo}</p>}
                    </div>
                  </SidebarSeccion>
                )}

                {/* Historial suplementos */}
                {pacienteInfo?.antecedentes?.historialProductos && (
                  <SidebarSeccion titulo="Historial suplementos">
                    <p className="text-[12px] text-[#8a8a8a] italic">{pacienteInfo.antecedentes.historialProductos}</p>
                  </SidebarSeccion>
                )}

                {/* Notas libres / lineamientos */}
                {valData?.notasLibres && (
                  <SidebarSeccion titulo="Notas Libres / Lineamientos">
                    <p className="text-[12px] text-[#e0e0e0] whitespace-pre-wrap leading-relaxed">{valData.notasLibres}</p>
                  </SidebarSeccion>
                )}

                {/* Recordatorio 24 horas */}
                {pacienteInfo?.habitos && Object.values(pacienteInfo.habitos).some((v: any) => v?.hora || v?.ayer || v?.usualmente) && (
                  <SidebarSeccion titulo="Recordatorio 24 Horas">
                    <div className="space-y-1.5 mt-1">
                      {([
                        { key: 'desayuno', label: 'Desayuno' },
                        { key: 'colacion1', label: 'Colación 1' },
                        { key: 'almuerzo', label: 'Comida' },
                        { key: 'colacion2', label: 'Colación 2' },
                        { key: 'cena', label: 'Cena' },
                      ] as { key: string; label: string }[]).map(({ key, label }) => {
                        const row = pacienteInfo.habitos[key];
                        if (!row?.hora && !row?.ayer && !row?.usualmente) return null;
                        return (
                          <div key={key} className="border-l-2 border-[#2a2a2a] pl-2">
                            <p className="text-[10px] font-bold text-[#8a8a8a] uppercase tracking-wider">{label}{row?.hora ? ` · ${row.hora}` : ''}</p>
                            {row?.usualmente && <p className="text-[12px] text-[#e0e0e0]">{row.usualmente}</p>}
                            {row?.ayer && !row?.usualmente && <p className="text-[12px] text-[#c0c0c0]">{row.ayer}</p>}
                          </div>
                        );
                      })}
                    </div>
                  </SidebarSeccion>
                )}
              </div>
            </aside>
          )}
        </div>{/* closes flex wrapper */}

      </div>
      {/* ─── Save-as-Platillo Modal ─── */}
      {savePlatilloModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-[#111] border border-[#2a2a2a] rounded-[16px] p-6 w-full max-w-sm shadow-2xl">
            <h3 className="text-[16px] font-bold text-white mb-1">Guardar como Platillo</h3>
            <p className="text-[12px] text-[#8a8a8a] mb-4">Los ingredientes de este tiempo se guardarán en tu biblioteca como un platillo reutilizable.</p>
            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-black text-[#555] uppercase tracking-widest block mb-1">Nombre</label>
                <input
                  autoFocus
                  className="w-full bg-[#1a1a1a] border border-[#333] rounded-[8px] px-3 py-2 text-[14px] text-white outline-none focus:border-brand-primary"
                  value={savePlatilloModal.nombre}
                  onChange={e => setSavePlatilloModal(p => p ? { ...p, nombre: e.target.value } : p)}
                  placeholder="Ej: Desayuno proteico"
                />
              </div>
              <div>
                <label className="text-[10px] font-black text-[#555] uppercase tracking-widest block mb-1">Categoría</label>
                <select
                  className="w-full bg-[#1a1a1a] border border-[#333] rounded-[8px] px-3 py-2 text-[14px] text-white outline-none focus:border-brand-primary"
                  value={savePlatilloModal.categoria}
                  onChange={e => setSavePlatilloModal(p => p ? { ...p, categoria: e.target.value } : p)}
                >
                  <option value="DESAYUNO">Desayuno</option>
                  <option value="ALMUERZO">Almuerzo</option>
                  <option value="COLACIÓN">Colación</option>
                  <option value="PRE-ENTRENO">Pre-Entreno</option>
                  <option value="POST-ENTRENO">Post-Entreno</option>
                  <option value="CENA">Cena</option>
                  <option value="PROCESADO">Procesado</option>
                  <option value="PERSONALIZADO">Personalizado</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button
                onClick={() => setSavePlatilloModal(null)}
                className="flex-1 py-2 border border-[#333] rounded-[8px] text-[13px] text-[#8a8a8a] hover:text-white transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveTiempoAsPlatillo}
                disabled={savingPlatillo}
                className="flex-1 py-2 bg-brand-primary text-black rounded-[8px] text-[13px] font-bold hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {savingPlatillo ? 'Guardando...' : 'Guardar Platillo'}
              </button>
            </div>
          </div>
        </div>
      )}

      {ConfirmDialogComponent}

      {/* B7: Barra sticky inferior — visible solo en mobile cuando el header queda fuera del viewport */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0a0a0a]/95 backdrop-blur-md border-t border-[#1a1a1a] px-4 py-3 flex items-center gap-3">
        {macroSum !== 100 && (
          <span className="text-[11px] font-bold text-rose-400 flex items-center gap-1 flex-1 min-w-0 truncate">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400 shrink-0 animate-pulse" />
            Macros: {macroSum}% / 100%
          </span>
        )}
        <button
          onClick={handleSave}
          disabled={saving || macroSum !== 100}
          className="ml-auto flex items-center gap-2 px-5 py-3 bg-brand-primary text-bg-base rounded-[10px] text-[14px] font-bold transition-all hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-black/30"
        >
          {saving
            ? <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            : <Save className="h-4 w-4" />
          }
          {isEdit ? 'Guardar' : 'Guardar Menú'}
        </button>
      </div>

    </>
  );
};

function SidebarSeccion({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div className="border border-[#2a2a2a] rounded-[8px] p-3 bg-[#0f0f0f]">
      <p className="text-[9px] font-black text-[#555] uppercase tracking-widest mb-1.5">{titulo}</p>
      {children}
    </div>
  );
}

export default function CreateEditPlan() {
  const { id, planId } = useParams<{ id: string, planId: string }>();
  const pacienteId = id;
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const valoracionId = searchParams.get('valoracionId') || undefined;

  return (
    <CreateEditPlanForm
      pacienteId={pacienteId}
      planId={planId}
      valoracionId={valoracionId}
    />
  );
}
