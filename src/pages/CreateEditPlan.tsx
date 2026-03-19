import { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Save, Plus, Search, ChevronDown, ChevronUp, Copy, BookOpen, Clock, Activity, AlertCircle, Edit3, Trash2, CheckCircle2, MoreHorizontal, ClipboardList, Settings } from 'lucide-react';
import { SmaeIngredientePicker } from '@/components/SmaeIngredientePicker';
import api from '@/lib/api';
import { Menu, TiempoComida, Ingrediente, Plan, Platillo } from '@/types';
import { formatDecimal } from '@/lib/format';
import { useToast } from '@/hooks/use-toast';
import { useConfirm } from '@/components/ui/ConfirmDialog';
import { Input } from '@/components/ui/input';

const defaultTiempos = ['Desayuno', 'Colación 1', 'Comida', 'Colación 2', 'Cena'];

const emptyMenu = (name: string): Menu => ({
  nombre: name,
  tiempos: defaultTiempos.map((t) => ({ nombre: t.toUpperCase(), ingredientes: [], nota: '' })),
});

const emptyIngrediente = (): Ingrediente => ({ 
  descripcion: '', 
  cantidad: 0, 
  unidad: 'GR', 
  eqCantidad: 0, 
  eqGrupo: '', 
  nota: '' 
});

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
  const [availableTemplates, setAvailableTemplates] = useState<Plan[]>([]);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showBarridoRef, setShowBarridoRef] = useState(!propPacienteId === false); // abierto por default en planes de paciente
  
  const [platilloLibrary, setPlatilloLibrary] = useState<Platillo[]>([]);
  const [showPlatilloSelector, setShowPlatilloSelector] = useState<{ mIdx: number, tIdx: number } | null>(null);
  const [platilloSearch, setPlatilloSearch] = useState('');

  const mapMenusFromBackend = (backendMenus: any[]) => {
    return backendMenus?.map((m: any) => ({
      nombre: m.nombre,
      tiempos: (m.tiemposComida || m.tiempos || []).map((t: any) => ({
        nombre: t.nombre,
        nota: t.notaPie || t.nota || '',
        ingredientes: (t.ingredientes || []).map((i: any) => ({
          ...i,
          cantidad: parseFloat(i.cantidad) || 0,
          eqCantidad: i.eqCantidad != null ? parseFloat(String(i.eqCantidad)) : undefined,
          platillo: i.platillo || ''
        }))
      }))
    })) || [emptyMenu('Menú 1'), emptyMenu('Menú 2')];
  };

  useEffect(() => {
    if (pacienteId) {
      api.get(`/api/pacientes/${pacienteId}`)
         .then(res => {
           const p = res.data?.data || res.data;
           if (p) {
             setPacienteNombre(`${p.nombre} ${p.apellido || ''}`.trim());
           }
         })
         .catch(e => console.error("Error loading patient name", e));
    }
  }, [pacienteId]);

  useEffect(() => {
    // Si estamos editando un plan existente
    if (isEdit) {
      const fetchPlan = async () => {
        try {
          const url = isBasePlan 
            ? `/api/planes/${planId}` 
            : `/api/pacientes/${pacienteId}/planes/${planId}`;
          const { data } = await api.get(url);
          const p = data?.data || data;
          if (p) {
            setNombrePlan(p.nombre || '');
            setTipo(p.tipoPlan || p.tipo || 'Balanceada');
            setCalorias(p.calorias.toString());
            setProteinas((p.proteinasPct || p.macros?.proteinas || 30).toString());
            setCarbohidratos((p.carbohidratosPct || p.macros?.carbohidratos || 40).toString());
            setGrasas((p.grasasPct || p.macros?.grasas || 30).toString());
            
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
            
            // USAR MAPEO ROBUSTO
            setMenus(mapMenusFromBackend(p.menus));

            // Intentar cargar la valoración ligada o la más reciente para mostrar el barrido
            if (!isBasePlan && pacienteId) {
              try {
                // Obtener lista para hallar la ligada o simplemente tomar la última
                const { data: vDataList } = await api.get(`/api/pacientes/${pacienteId}/valoraciones`);
                const valList = vDataList?.data || vDataList;
                if (valList && valList.length > 0) {
                   const matched = p.valoracionId ? valList.find((v: any) => v.id === p.valoracionId) : null;
                   const vToUse = matched || valList[0];
                   
                   // Cargar detalle completo de esa valoración
                   const { data: vDataFull } = await api.get(`/api/pacientes/${pacienteId}/valoraciones/${vToUse.id}`);
                   const v = vDataFull?.data || vDataFull;
                   if (v) {
                     // Fetch barrido separadamente
                     const bRes = await api.get(`/api/pacientes/${pacienteId}/valoraciones/${vToUse.id}/barrido`).catch(() => null);
                     let barrido = bRes?.data;
                     // Descender por los .data hasta el objeto de verdad
                     while (barrido?.data) {
                       barrido = barrido.data;
                     }
                     if (typeof barrido === 'string') {
                       try { barrido = JSON.parse(barrido); } catch (e) {}
                     }
                     if (barrido?.barrido) {
                       barrido = barrido.barrido; 
                     }
                     if (typeof barrido === 'string') {
                       try { barrido = JSON.parse(barrido); } catch (e) {}
                     }
                     
                     setValData({ ...v, barridoEquivalencias: barrido });
                     if (!pesoUltimo) setPesoUltimo(v.pesoCurrent || v.pesoActual || v.peso || 0);
                   }
                }
              } catch (e) {
                console.error('Error cargando valoración ligada al plan:', e);
              }
            }
          }
          // Load templates as well if we are dealing with a patient
          if (!isBasePlan) {
            try {
              const { data: tData } = await api.get('/api/planes?tipo=base');
              setAvailableTemplates(tData?.data || tData || []);
            } catch (e) {
              console.error('Error loading templates', e);
            }
          }
        } catch (err) {
          console.error('Error cargando plan:', err);
        }
      };
      fetchPlan();
    } 
    // Si estamos creando uno nuevo para un paciente, intentar cargar última valoración y plantillas
    else if (pacienteId) {
      const fetchPatientData = async () => {
        try {
          // Cargar valoración si existe ID
          if (valoracionId) {
            const { data: vData } = await api.get(`/api/pacientes/${pacienteId}/valoraciones/${valoracionId}`);
            const v = vData?.data || vData;
            if (v) {
               // Fetch barrido
               const bRes = await api.get(`/api/pacientes/${pacienteId}/valoraciones/${valoracionId}/barrido`).catch(() => null);
               let barrido = bRes?.data;
               while (barrido?.data) {
                 barrido = barrido.data;
               }
               if (typeof barrido === 'string') {
                 try { barrido = JSON.parse(barrido); } catch (e) {}
               }
               if (barrido?.barrido) {
                 barrido = barrido.barrido; 
               }
               if (typeof barrido === 'string') {
                 try { barrido = JSON.parse(barrido); } catch (e) {}
               }
               
               setPesoUltimo(v.peso || 0);
               setValData({ ...v, barridoEquivalencias: barrido });
               if (v.getSedentario) setCalorias(Math.round(v.getSedentario).toString());

               // INICIALIZAR TIEMPOS DEL PLAN DESDE EL BARRIDO
               // Si el barrido tiene tiempos personalizados, los usamos para Menú 1 y Menú 2
               if (barrido?.tiempos?.length > 0 && !isEdit) {
                 const assessmentTiempos = barrido.tiempos.map((t: string) => ({
                   nombre: t.toUpperCase(),
                   ingredientes: [],
                   nota: ''
                 }));
                 setMenus([
                   { nombre: 'Menú 1', tiempos: assessmentTiempos },
                   { nombre: 'Menú 2', tiempos: JSON.parse(JSON.stringify(assessmentTiempos)) }
                 ]);
               }
             }
          }
          // Cargar plantillas disponibles
          const { data: tData } = await api.get('/api/planes?tipo=base');
          setAvailableTemplates(tData?.data || tData || []);
        } catch (err) {
          console.error('Error cargando datos del paciente/plantillas:', err);
        }
      };
      fetchPatientData();
    }
    
    // Cargar biblioteca de platillos
    api.get('/api/platillos').then(res => {
      setPlatilloLibrary(res.data?.data || []);
    }).catch(e => console.error("Error loading platillos library", e));
  }, [planId, isEdit, pacienteId, valoracionId, isBasePlan]);

  const loadTemplate = (template: Plan) => {
    setNombrePlan(template.nombre || '');
    setTipo(template.tipoPlan || template.tipo || 'Balanceada');
    setCalorias((template.calorias || 1800).toString());
    setProteinas((template.proteinasPct || (template as any).macros?.proteinas || 30).toString());
    setCarbohidratos((template.carbohidratosPct || (template as any).macros?.carbohidratos || 40).toString());
    setGrasas((template.grasasPct || (template as any).macros?.grasas || 30).toString());
    
    // IMPORTANTE: Mapear los menús de la plantilla antes de setearlos
    setMenus(mapMenusFromBackend(template.menus));
    
    setShowTemplates(false);
    toast({ title: 'MENÚ BASE CARGADO', description: 'Ahora puedes personalizarlo para este paciente.' });
  };

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
    verduras:     { p: 2, c: 4,  g: 0 },
    frutas:       { p: 0, c: 15, g: 0 },
    cerealSinGr: { p: 2, c: 15, g: 0 },
    cerealConGr: { p: 2, c: 15, g: 5 },
    leguminosas:  { p: 8, c: 20, g: 1 },
    aoaMuyBajo:   { p: 7, c: 0,  g: 1 },
    aoaBajo:      { p: 7, c: 0,  g: 3 },
    aoaModerado:  { p: 7, c: 0,  g: 5 },
    aoaAlto:      { p: 7, c: 0,  g: 8 },
    lecheDesc:    { p: 9, c: 12, g: 2 },
    lecheSemi:    { p: 9, c: 12, g: 4 },
    lecheEntera:  { p: 9, c: 12, g: 8 },
    lecheAz:      { p: 9, c: 30, g: 5 },
    grasaSinProt: { p: 0, c: 0,  g: 5 },
    grasaConProt: { p: 3, c: 3,  g: 5 },
    azSinGr:      { p: 0, c: 10, g: 0 },
    azConGr:      { p: 0, c: 10, g: 5 },
    // Aliases para nombres con espacios/mayúsculas del picker
    'Cereal s/grasa': { p: 2, c: 15, g: 0 }, 'Cereal c/grasa': { p: 2, c: 15, g: 5 },
    'AOA Muy Bajo':   { p: 7, c: 0,  g: 1 }, 'AOA Bajo':      { p: 7, c: 0,  g: 3 },
    'AOA Moderado':   { p: 7, c: 0,  g: 5 }, 'AOA Alto':      { p: 7, c: 0,  g: 8 },
    'Leche Descrem.': { p: 9, c: 12, g: 2 }, 'Leche Semi':    { p: 9, c: 12, g: 4 },
    'Leche Entera':   { p: 9, c: 12, g: 8 }, 'Leche Azucarada':{ p: 9, c: 30, g: 5 },
    'Grasa s/prot':   { p: 0, c: 0,  g: 5 }, 'Grasa c/prot':   { p: 3, c: 3,  g: 5 },
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
    updateMenu(menuIdx, (m) => {
      const tiempos = [...m.tiempos];
      if (tiempoIdx + dir < 0 || tiempoIdx + dir >= tiempos.length) return m;
      const t = tiempos[tiempoIdx];
      tiempos[tiempoIdx] = tiempos[tiempoIdx + dir];
      tiempos[tiempoIdx + dir] = t;
      return { ...m, tiempos };
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

  const handleSave = async () => {
    if (macroSum !== 100) {
      toast({ title: 'ERROR ESTRATÉGICO', description: 'La distribución de macronutrientes debe sumar el 100% de la carga energética.', variant: 'destructive' });
      return;
    }
    setSaving(true);
    const body: any = {
      nombre: nombrePlan,
      tipoPlan: tipo, 
      calorias: parseFloat(calorias),
      proteinasPct: parseFloat(proteinas), 
      carbohidratosPct: parseFloat(carbohidratos), 
      grasasPct: parseFloat(grasas),
      proximaSesion,
      proximaSesionHora,
      menus: menus.map(m => ({
        nombre: m.nombre,
        tiemposComida: m.tiempos.map(t => ({
          nombre: t.nombre,
          notaPie: t.nota,
          ingredientes: t.ingredientes.map(i => ({
            ...i,
            cantidad: i.cantidad.toString(), // El backend parece enviarlas como string en el JSON
            eqCantidad: i.eqCantidad?.toString()
          }))
        }))
      })), 
      notasGenerales: notas,
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
      toast({ title: 'MENÚ PERSISTIDO' });
      
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

  return (
    <>
    <div className="space-y-8 animate-fade-in pb-20 max-w-none w-full mt-2">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 pt-6 -mt-8 mb-4">
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
            {isEdit ? 'Guardar Cambios' : 'Generar Menú'}
          </button>

          {!isBasePlan && (
            /* Usar menú base */
            <div className="relative w-full sm:w-auto">
              <button
                onClick={() => setShowTemplates(!showTemplates)}
                className="w-full sm:w-auto px-[18px] py-[10px] bg-[#111111] border border-[#333] text-white text-[14px] font-medium rounded-[8px] hover:bg-[#181818] transition-colors flex items-center justify-center gap-2"
              >
                <ClipboardList className="h-[18px] w-[18px]" /> Usar menú base
              </button>
              {showTemplates && (
                <div className="absolute top-full right-0 mt-2 w-[350px] bg-[#111111] border border-[#333] rounded-[12px] shadow-2xl z-50 p-4 space-y-4 animate-slide-up">
                  <p className="text-[14px] font-medium text-[#8a8a8a] m-0">Seleccionar menú</p>
                  <div className="max-h-60 overflow-y-auto space-y-2 custom-scrollbar pr-2">
                    {availableTemplates.map(t => (
                      <button
                        key={t.id}
                        onClick={() => loadTemplate(t)}
                        className="w-full text-left p-3 rounded-[8px] hover:bg-[#181818] border border-transparent hover:border-[#333] transition-all group"
                      >
                        <p className="text-[14px] font-medium text-white group-hover:text-brand-primary m-0">{t.nombre || 'Menú Sin Nombre'}</p>
                        <p className="text-[12px] font-normal text-[#8a8a8a] mt-1 m-0">{t.calorias} Kcal · {t.tipo}</p>
                      </button>
                    ))}
                    {availableTemplates.length === 0 && <p className="p-4 text-center text-[14px] font-normal text-[#8a8a8a]">Sin menús disponibles</p>}
                  </div>
                </div>
              )}
            </div>
          )}
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

      <div className="space-y-6">
        {/* DASHBOARD DE REQUERIMIENTOS: Unificado en la parte superior */}
        <div className="bg-[#111111] p-8 rounded-[12px] animate-slide-up border border-[#2a2a2a] shadow-xl">
          <div className="flex flex-col gap-10">
            {/* CABECERA DE REQUERIMIENTOS: Unificada y Simplificada */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center border-b border-[#2a2a2a] pb-8">
              {/* Parte 1: Perfil Energético */}
              <div className="lg:col-span-5 border-r border-[#2a2a2a] pr-10">
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
              </div>
            </div>
          </div>
        </div>

        {/* SECCIÓN DE MENÚS: Ahora a dos columnas completas */}
        <div className="grid md:grid-cols-2 gap-8 items-start">
            {menus.map((menu, mi) => (
              <div key={mi} className="bg-[#111111] rounded-[12px] animate-slide-up border border-[#2a2a2a] overflow-hidden flex flex-col h-full ring-1 ring-border-default hover:ring-border-subtle transition-all" style={{ animationDelay: `${mi * 0.1}s` }}>
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

                      <div className="space-y-6">
                        {Array.from(new Set(tiempo.ingredientes.map(i => i.platillo || ''))).map((pName, pIndex) => (
                           <div key={`${mi}-${ti}-${pIndex}`} className="p-3 bg-[#111111] border border-[#333] rounded-[8px]">
                              <div className="flex items-center gap-2 mb-3 pb-2 border-b border-[#2a2a2a] border-dashed">
                                 <span className="text-[#8a8a8a] text-[11px] font-bold uppercase tracking-wider shrink-0">Platillo:</span>
                                 <input 
                                    className="bg-transparent border-none outline-none font-semibold text-white placeholder:text-[#8a8a8a] text-[13px] w-full min-w-0"
                                    value={pName}
                                    onChange={(e) => {
                                      const newName = e.target.value;
                                      updateTiempo(mi, ti, t => ({
                                         ...t,
                                         ingredientes: t.ingredientes.map(ing => (ing.platillo || '') === pName ? { ...ing, platillo: newName } : ing)
                                      }))
                                    }}
                                    placeholder="Ej: Sándwich de Pollo (Opcional)"
                                 />
                                 
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
                              </div>
                              <div className="space-y-4">
                                {tiempo.ingredientes.map((ing, ii) => (ing.platillo || '') === pName ? (
                                  <SmaeIngredientePicker
                                    key={ii}
                                    ingrediente={ing}
                                    index={ii}
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
                        
                        <button
                          onClick={() => {
                             // Generar nombre de platillo nuevo evitando colisiones
                             let nuevoNombreBase = "Nuevo Platillo";
                             let nuevoNombre = nuevoNombreBase;
                             let cnt = 1;
                             while (tiempo.ingredientes.some(i => i.platillo === nuevoNombre)) {
                                nuevoNombre = `${nuevoNombreBase} ${cnt}`;
                                cnt++;
                             }
                             updateTiempo(mi, ti, (t) => ({ ...t, ingredientes: [...t.ingredientes, { ...emptyIngrediente(), platillo: nuevoNombre }] }))
                          }}
                          className="w-full py-2 bg-transparent border border-dashed border-[#333] text-brand-primary hover:text-brand-primary/80 text-[12px] font-bold rounded-[6px] transition-colors uppercase tracking-wider"
                        >
                          + Crear Nuevo Platillo
                        </button>

                        <div className="relative">
                          <button
                            onClick={() => setShowPlatilloSelector(showPlatilloSelector?.mIdx === mi && showPlatilloSelector?.tIdx === ti ? null : { mIdx: mi, tIdx: ti })}
                            className="w-full py-2 bg-[#1a1a1a] border border-[#333] text-[#90c2ff] hover:text-white text-[12px] font-bold rounded-[6px] transition-colors uppercase tracking-wider mt-2 flex items-center justify-center gap-2"
                          >
                            <BookOpen className="w-3.5 h-3.5" /> Importar de Biblioteca
                          </button>
                          
                          {showPlatilloSelector?.mIdx === mi && showPlatilloSelector?.tIdx === ti && (
                            <div className="absolute z-50 left-0 right-0 mt-2 bg-[#111] border border-[#333] rounded-[12px] shadow-2xl p-4 animate-in fade-in slide-in-from-top-2">
                               <Input 
                                 placeholder="Buscar platillo..." 
                                 className="h-8 text-xs mb-3 bg-bg-base"
                                 autoFocus
                                 value={platilloSearch}
                                 onChange={(e) => setPlatilloSearch(e.target.value)}
                               />
                               <div className="max-h-52 overflow-y-auto space-y-1 custom-scrollbar">
                                  {platilloLibrary
                                    .filter(p => p.nombre.toLowerCase().includes(platilloSearch.toLowerCase()) || p.categoria.toLowerCase().includes(platilloSearch.toLowerCase()))
                                    .map(p => (
                                       <button
                                         key={p.id}
                                         onClick={() => {
                                            const ings = p.ingredientes.map((i, idx) => ({ 
                                              ...i, 
                                              platillo: p.nombre,
                                              orden: (tiempo.ingredientes.length || 0) + idx + 1 
                                            }));
                                            updateTiempo(mi, ti, (t) => ({ ...t, ingredientes: [...t.ingredientes, ...ings] }));
                                            setShowPlatilloSelector(null);
                                            setPlatilloSearch('');
                                         }}
                                         className="w-full text-left px-3 py-2 hover:bg-[#1a1a1a] rounded-lg transition-colors flex items-center justify-between group"
                                       >
                                          <div>
                                            <p className="text-[12px] font-bold text-white group-hover:text-[#90c2ff]">{p.nombre}</p>
                                            <p className="text-[10px] text-[#555]">{p.categoria}</p>
                                          </div>
                                          <Plus className="w-3 h-3 text-[#555] group-hover:text-[#90c2ff]" />
                                       </button>
                                  ))}
                                  {platilloLibrary.length === 0 && <p className="text-center py-4 text-[11px] text-[#555]">No hay platillos en la biblioteca</p>}
                               </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  <div className="flex-1" />
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
            
          <button
            onClick={() => setMenus([...menus, emptyMenu(`Menú ${menus.length + 1}`)])}
            className="h-[100%] min-h-[400px] border-2 border-dashed border-[#333] rounded-[12px] p-10 flex flex-col items-center justify-center gap-4 text-[#8a8a8a] hover:text-white hover:bg-[#181818] hover:border-text-muted transition-all group"
          >
            <Plus className="w-10 h-10 group-hover:scale-110 transition-transform duration-300" />
            <span className="text-[14px] font-medium">Agregar Menú Alternativo</span>
          </button>
      </div>
    </div>
    </div>
    {ConfirmDialogComponent}
    </>
  );
};

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
