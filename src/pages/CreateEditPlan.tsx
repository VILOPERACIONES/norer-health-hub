import { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Save, Plus, Search, ChevronDown, ChevronUp, Copy, BookOpen, Clock, Activity, AlertCircle, Edit3, Trash2, CheckCircle2, MoreHorizontal, ClipboardList, Settings } from 'lucide-react';
import { SmaeIngredientePicker } from '@/components/SmaeIngredientePicker';
import BarridoEquivalenciasComp from '@/components/BarridoEquivalencias';
import api from '@/lib/api';
import { Menu, TiempoComida, Ingrediente, Plan } from '@/types';
import { formatDecimal } from '@/lib/format';
import { useToast } from '@/hooks/use-toast';

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

const CreateEditPlan = () => {
  const { id: pacienteId, planId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const valoracionId = searchParams.get('valoracionId');
  
  const isEdit = !!planId;
  const isBasePlan = !pacienteId; // Si no hay pacienteId, es una plantilla base
  const [saving, setSaving] = useState(false);
  const [pesoUltimo, setPesoUltimo] = useState(0);

  const [nombrePlan, setNombrePlan] = useState('');
  const [tipo, setTipo] = useState('Balanceada');
  const [calorias, setCalorias] = useState('1800');
  const [proteinas, setProteinas] = useState('30');
  const [carbohidratos, setCarbohidratos] = useState('40');
  const [grasas, setGrasas] = useState('30');
  const [proximaSesion, setProximaSesion] = useState('');
  const [proximaSesionHora, setProximaSesionHora] = useState('');
  const [notas, setNotas] = useState('');
  const [menus, setMenus] = useState<Menu[]>([emptyMenu('Menú 1'), emptyMenu('Menú 2')]);
  const [valData, setValData] = useState<any>(null);
  const [availableTemplates, setAvailableTemplates] = useState<Plan[]>([]);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showBarridoRef, setShowBarridoRef] = useState(false);

  const mapMenusFromBackend = (backendMenus: any[]) => {
    return backendMenus?.map((m: any) => ({
      nombre: m.nombre,
      tiempos: (m.tiemposComida || m.tiempos || []).map((t: any) => ({
        nombre: t.nombre,
        nota: t.notaPie || t.nota || '',
        ingredientes: (t.ingredientes || []).map((i: any) => ({
          ...i,
          cantidad: parseFloat(i.cantidad) || 0,
          eqCantidad: parseFloat(i.eqCantidad) || 0,
          platillo: i.platillo || ''
        }))
      }))
    })) || [emptyMenu('Menú 1'), emptyMenu('Menú 2')];
  };

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
    toast({ title: 'PLAN BASE CARGADO', description: 'Ahora puedes personalizarlo para este paciente.' });
  };

  const cal = parseFloat(calorias) || 0;
  const pPct = parseFloat(proteinas) || 0;
  const cPct = parseFloat(carbohidratos) || 0;
  const gPct = parseFloat(grasas) || 0;
  const macroSum = pPct + cPct + gPct;

  // Energía del barrido de la valoración (referencia objetiva)
  const kcalBarrido = useMemo(() => {
    let bd = valData?.barridoEquivalencias;
    if (typeof bd === 'string') { try { bd = JSON.parse(bd); } catch {} }
    if (bd?.barrido) bd = bd.barrido;
    if (typeof bd === 'string') { try { bd = JSON.parse(bd); } catch {} }
    return bd?.kcalTotal ? Math.round(Number(bd.kcalTotal)) : null;
  }, [valData]);

  // Cuando carga el barrido y el usuario está CREANDO (no editando), pre-llenar la energía
  useEffect(() => {
    if (!isEdit && kcalBarrido && kcalBarrido > 0) {
      setCalorias(String(kcalBarrido));
    }
  }, [kcalBarrido, isEdit]);

  // Kcal por equivalente SMAE (para estimación de menú)
  const KCAL_EQ: Record<string, number> = {
    verduras: 0, frutas: 60, cerealSinGr: 70, cerealConGr: 115, leguminosas: 120,
    aoaMuyBajo: 40, aoaBajo: 55, aoaModerado: 75, aoaAlto: 100,
    lecheDesc: 95, lecheSemi: 110, lecheEntera: 150, lecheAz: 200,
    grasaSinProt: 45, grasaConProt: 70, azSinGr: 40, azConGr: 85,
  };

  // Estimación de kcal del menú basado en equivalentes SMAE de los ingredientes
  const kcalMenuEstimado = useMemo(() => {
    let total = 0;
    menus.forEach(m => {
      m.tiempos.forEach(t => {
        t.ingredientes.forEach(ing => {
          const eq = Number(ing.eqCantidad) || 0;
          const grupo = ing.eqGrupo || '';
          const kcalPorEq = KCAL_EQ[grupo] ?? 0;
          total += eq * kcalPorEq;
        });
      });
    });
    return Math.round(total);
  }, [menus]);

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
      if (isEdit) {
        const url = isBasePlan ? `/api/planes/${planId}` : `/api/pacientes/${pacienteId}/planes/${planId}`;
        await api.put(url, body);
      } else {
        const url = isBasePlan ? `/api/planes` : `/api/pacientes/${pacienteId}/planes`;
        await api.post(url, body);
      }
      toast({ title: isBasePlan ? 'PLANTILLA PERSISTIDA' : 'PLAN ALIMENTICIO PERSISTIDO' });
      navigate(isBasePlan ? '/planes' : `/pacientes/${pacienteId}`);
    } catch (err: any) {
      toast({ title: 'Error de Persistencia', description: 'No se pudo sincronizar el plan maestro.', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('¿ELIMINAR ESTA PLANTILLA PERMANENTEMENTE?')) return;
    try {
      await api.delete(`/api/planes/${planId}`);
      toast({ title: 'PLANTILLA ELIMINADA' });
      navigate('/planes');
    } catch (err) {
      toast({ title: 'Error al eliminar', variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-8 animate-fade-in pb-20 max-w-none w-full px-2 sm:px-4 lg:px-6 mt-2">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 pt-6">
        <div className="space-y-2">
          <button onClick={() => navigate(isBasePlan ? '/planes' : `/pacientes/${pacienteId}`)} className="flex items-center gap-2 text-[14px] font-medium text-text-secondary hover:text-text-primary transition-colors w-fit group mb-4">
            <ArrowLeft className="h-[18px] w-[18px] group-hover:-translate-x-1 transition-transform" /> Volver
          </button>
          <div className="animate-slide-up space-y-1">
            <h1 className="text-[26px] font-bold text-text-primary m-0 tracking-tight">
              {isBasePlan ? (isEdit ? 'Editar Plantilla' : 'Nueva Plantilla Base') : (isEdit ? 'Personalizar Plan' : 'Configurar Plan Nutricional')}
            </h1>
            <p className="text-text-secondary font-normal text-[14px] m-0">
              {isBasePlan ? 'Definición de plan base para la biblioteca' : 'Ajuste de requerimientos y personalización de tiempos'}
            </p>
          </div>
        </div>

        {!isBasePlan && (
          <div className="relative">
            <button 
              onClick={() => setShowTemplates(!showTemplates)}
              className="px-[18px] py-[10px] bg-bg-surface border border-border-default text-text-primary text-[14px] font-medium rounded-[8px] hover:bg-bg-elevated transition-colors flex items-center gap-2"
            >
              <ClipboardList className="h-[18px] w-[18px]" /> Usar plantilla base
            </button>
            {showTemplates && (
              <div className="absolute top-full right-0 mt-2 w-[350px] bg-bg-surface border border-border-default rounded-[12px] shadow-2xl z-50 p-4 space-y-4 animate-slide-up">
                <p className="text-[14px] font-medium text-text-muted m-0">Seleccionar plantilla</p>
                <div className="max-h-60 overflow-y-auto space-y-2 custom-scrollbar pr-2">
                  {availableTemplates.map(t => (
                    <button 
                      key={t.id} 
                      onClick={() => loadTemplate(t)}
                      className="w-full text-left p-3 rounded-[8px] hover:bg-bg-elevated border border-transparent hover:border-border-default transition-all group"
                    >
                      <p className="text-[14px] font-medium text-text-primary group-hover:text-brand-primary m-0">{t.nombre || 'Plan Alimenticio Sin Nombre'}</p>
                      <p className="text-[12px] font-normal text-text-muted mt-1 m-0">{t.calorias} Kcal · {t.tipo}</p>
                    </button>
                  ))}
                  {availableTemplates.length === 0 && <p className="p-4 text-center text-[14px] font-normal text-text-muted">Sin plantillas disponibles</p>}
                </div>
              </div>
            )}
          </div>
        )}

        {isBasePlan && isEdit && (
          <button 
            onClick={handleDelete}
            className="px-[18px] py-[10px] bg-[#2e1a1a] text-accent-red border border-accent-red/20 text-[14px] font-medium rounded-[8px] hover:bg-[#3d1a1a] transition-colors flex items-center gap-2"
          >
            <Trash2 className="h-[18px] w-[18px]" /> Eliminar plantilla
          </button>
        )}
      </div>

      <div className="grid lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 space-y-6">
        
          {/* Configuración Metabólica */}
          <div className="bg-bg-surface p-6 rounded-[12px] animate-slide-up border border-border-subtle">
            <h3 className="text-[16px] font-semibold text-text-primary mb-6 flex items-center gap-2 m-0">
               Requerimientos Esenciales
            </h3>
            
            <div className="grid sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[12px] font-medium text-text-secondary">Identificador / Objetivo</label>
                <input 
                  value={nombrePlan} 
                  onChange={(e) => setNombrePlan(e.target.value)} 
                  placeholder="Ej: Balanceado 1800 kcal"
                  className="w-full bg-bg-elevated rounded-[8px] px-4 py-3 text-[14px] font-normal text-text-primary outline-none border border-border-subtle focus:border-[#444] transition-colors"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[12px] font-medium text-text-secondary">Enfoque Nutricional</label>
                <select 
                  value={tipo} 
                  onChange={(e) => setTipo(e.target.value)} 
                  className="w-full bg-bg-elevated rounded-[8px] px-4 py-3 text-[14px] font-normal text-text-primary outline-none border border-border-subtle focus:border-[#444] transition-colors appearance-none"
                  style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'%238a8a8a\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2\' d=\'M19 9l-7 7-7-7\' /%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem center', backgroundSize: '1rem' }}
                >
                  <option value="Balanceada">Balanceada</option>
                  <option value="Keto / Low Carb">Keto / Low Carb</option>
                  <option value="Vegetariana / Vegana">Vegetariana / Vegana</option>
                  <option value="Hipercalórica / Volumen">Hipercalórica / Volumen</option>
                  <option value="Hipocalórica / Déficit">Hipocalórica / Déficit</option>
                  <option value="Personalizada">Personalizada</option>
                </select>
              </div>
            </div>

            <div className="grid sm:grid-cols-1 gap-6 mt-6">
               <div className="space-y-2">
                <label className="text-[12px] font-medium text-text-secondary">Energía Total (Kcal)</label>
                <div className="flex flex-col gap-3">
                  <input type="number" value={calorias} onChange={(e) => setCalorias(e.target.value)} className="w-full bg-bg-elevated rounded-[8px] px-4 py-3 text-[18px] font-semibold text-text-primary outline-none border border-border-subtle focus:border-[#444] transition-colors" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-6 mt-8 pt-6 border-t border-border-subtle">
              <div className="space-y-2">
                <label className="text-[12px] font-medium text-text-secondary text-center w-full block">Proteína %</label>
                <input type="number" value={proteinas} onChange={(e) => setProteinas(e.target.value)} className="w-full bg-bg-elevated rounded-[8px] px-4 py-3 font-semibold text-center text-[16px] text-text-primary outline-none border border-border-subtle focus:border-[#444]" />
              </div>
              <div className="space-y-2">
                <label className="text-[12px] font-medium text-text-secondary text-center w-full block">Carbohidratos %</label>
                <input type="number" value={carbohidratos} onChange={(e) => setCarbohidratos(e.target.value)} className="w-full bg-bg-elevated rounded-[8px] px-4 py-3 font-semibold text-center text-[16px] text-text-primary outline-none border border-border-subtle focus:border-[#444]" />
              </div>
              <div className="space-y-2">
                <label className="text-[12px] font-medium text-text-secondary text-center w-full block">Grasas %</label>
                <input type="number" value={grasas} onChange={(e) => setGrasas(e.target.value)} className="w-full bg-bg-elevated rounded-[8px] px-4 py-3 font-semibold text-center text-[16px] text-text-primary outline-none border border-border-subtle focus:border-[#444]" />
              </div>
            </div>

            {macroSum !== 100 && (
              <div className="mt-6 p-4 bg-[#2e1a1a] border border-accent-red/20 text-accent-red rounded-[8px]">
                <p className="text-[14px] font-medium text-center m-0">
                   La distribución suma {macroSum}% (Requiere 100%)
                </p>
              </div>
            )}
          </div>

          {/* Menús Personalizados */}
          <div className="grid lg:grid-cols-2 gap-6 items-start">
            {menus.map((menu, mi) => (
              <div key={mi} className="bg-bg-surface rounded-[12px] animate-slide-up border border-border-subtle overflow-hidden flex flex-col h-full ring-1 ring-border-default hover:ring-border-subtle transition-all" style={{ animationDelay: `${mi * 0.1}s` }}>
                <div className="bg-bg-elevated border-b border-border-subtle px-6 py-4 flex items-center justify-between">
                  <input
                    value={menu.nombre}
                    onChange={(e) => updateMenu(mi, (m) => ({ ...m, nombre: e.target.value }))}
                    className="text-[16px] font-semibold bg-transparent border-none outline-none w-full text-text-primary selection:bg-brand-primary placeholder:text-text-muted"
                    placeholder="Nombre del menú"
                  />
                  <button
                     onClick={() => setMenus(menus.filter((_, i) => i !== mi))}
                     className="p-2 text-text-muted hover:text-accent-red hover:bg-[#2e1a1a] rounded-[6px] transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                <div className="p-6 space-y-6 flex-1 flex flex-col">
                  {menu.tiempos.map((tiempo, ti) => (
                    <div key={ti} className="p-4 rounded-[8px] border border-border-subtle bg-bg-elevated group relative">
                      <div className="flex items-center justify-between mb-4">
                         <input
                           value={tiempo.nombre}
                           onChange={(e) => updateTiempo(mi, ti, (t) => ({ ...t, nombre: e.target.value }))}
                           className="text-[14px] font-semibold text-text-primary bg-transparent border-none outline-none w-[70%]"
                           placeholder="Nombre del tiempo"
                         />
                         <button onClick={() => updateMenu(mi, (m) => ({ ...m, tiempos: m.tiempos.filter((_, i) => i !== ti) }))} className="p-1.5 text-text-muted hover:text-accent-red rounded-[6px] opacity-0 group-hover:opacity-100 transition-opacity hover:bg-[#2e1a1a]">
                           <Trash2 className="h-3.5 w-3.5" />
                         </button>
                      </div>

                      <div className="space-y-6">
                        {Array.from(new Set(tiempo.ingredientes.map(i => i.platillo || ''))).map((pName, pIndex) => (
                           <div key={`${mi}-${ti}-${pIndex}`} className="p-3 bg-bg-surface border border-border-default rounded-[8px]">
                              <div className="flex items-center gap-2 mb-3 pb-2 border-b border-border-subtle border-dashed">
                                 <span className="text-text-muted text-[11px] font-bold uppercase tracking-wider">Platillo:</span>
                                 <input 
                                    className="bg-transparent border-none outline-none font-semibold text-text-primary placeholder:text-text-muted text-[13px] w-full"
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
                                 {pName && (
                                   <button 
                                      onClick={() => updateTiempo(mi, ti, t => ({ ...t, ingredientes: t.ingredientes.filter(ing => ing.platillo !== pName) }))}
                                      className="text-[10px] text-text-muted hover:text-accent-red ml-auto whitespace-nowrap"
                                   >
                                     Borrar platillo
                                   </button>
                                 )}
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
                                  className="w-full py-2 bg-transparent border border-dashed border-border-subtle hover:border-border-default text-text-secondary hover:text-text-primary text-[12px] font-medium rounded-[6px] transition-colors"
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
                          className="w-full py-2 bg-transparent border border-dashed border-border-default text-brand-primary hover:text-brand-primary/80 text-[12px] font-bold rounded-[6px] transition-colors uppercase tracking-wider"
                        >
                          + Crear Nuevo Platillo
                        </button>
                      </div>
                    </div>
                  ))}
                  
                  <div className="flex-1" />
                  <button
                    onClick={() => updateMenu(mi, (m) => ({
                      ...m, tiempos: [...m.tiempos, { nombre: 'Nuevo Tiempo', ingredientes: [], nota: '' }]
                    }))}
                    className="w-full py-3 mt-4 border border-dashed border-border-default hover:border-text-secondary rounded-[8px] text-[13px] font-medium text-text-muted hover:text-text-primary transition-colors"
                  >
                    + Agregar Tiempo de Comida
                  </button>
                </div>
              </div>
            ))}
            
            <button
               onClick={() => setMenus([...menus, emptyMenu(`Menú ${menus.length + 1}`)])}
               className="h-[100%] min-h-[400px] border-2 border-dashed border-border-default rounded-[12px] p-10 flex flex-col items-center justify-center gap-4 text-text-muted hover:text-text-primary hover:bg-bg-elevated hover:border-text-muted transition-all group"
            >
              <Plus className="w-10 h-10 group-hover:scale-110 transition-transform duration-300" />
              <span className="text-[14px] font-medium">Agregar Menú Alternativo</span>
            </button>
          </div>
        </div>

        {/* Sidebar Summary & Persistence */}
        <div className="lg:col-span-4 lg:relative">
          <div className="lg:sticky lg:top-24 space-y-6 lg:max-h-[calc(100vh-120px)] lg:overflow-y-auto lg:pb-12 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-border-default hover:[&::-webkit-scrollbar-thumb]:bg-[#444] [&::-webkit-scrollbar-thumb]:rounded-full pr-1" style={{ animationDelay: '0.1s' }}>
            {isBasePlan ? (
              <div className="bg-bg-surface border border-border-subtle p-6 rounded-[12px] relative overflow-hidden shadow-sm">
                 <h3 className="text-[14px] font-semibold text-text-primary mb-6 m-0 relative z-10">Balance Energético (Plantilla)</h3>
                 
                 <div className="space-y-6 relative z-10">
                    <div className="bg-bg-elevated border border-border-subtle rounded-[8px] p-5 flex flex-col items-center justify-center">
                       <span className="text-[11px] font-bold text-text-secondary uppercase tracking-wider mb-1">Carga Total Definida</span>
                       <p className="text-[36px] font-black text-text-primary m-0 leading-none">{cal}<span className="text-[14px] ml-1 font-medium text-text-muted">Kcal</span></p>
                    </div>

                    <div className="space-y-4">
                      <p className="text-[11px] font-bold text-text-muted uppercase tracking-widest m-0 pb-1 border-b border-border-subtle">Distribución de Macros</p>
                      {[
                        { label: 'Proteína', gr: macroCalc.pGr, grKg: macroCalc.pGrKg, color: '#ef8c8c' },
                        { label: 'Hidratos', gr: macroCalc.cGr, grKg: macroCalc.cGrKg, color: '#90c2ff' },
                        { label: 'Lípidos', gr: macroCalc.gGr, grKg: macroCalc.gGrKg, color: '#f5c842' },
                      ].map((m) => (
                        <div key={m.label} className="flex items-center justify-between">
                          <span className="text-[13px] font-semibold text-text-primary">{m.label}</span>
                          <div className="text-right flex items-end gap-2">
                            <span className="text-[11px] font-medium text-text-muted">{formatDecimal(m.grKg)} g/kg</span>
                            <span className="text-[14px] font-bold" style={{ color: m.color }}>{formatDecimal(m.gr)} g</span>
                          </div>
                        </div>
                      ))}
                    </div>
                 </div>
              </div>
            ) : (
              <div className="space-y-6">
                
                {/* ── Resumen de Energía Consolidado ── */}
                <div className="bg-bg-surface border border-border-subtle rounded-[12px] p-5 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-[14px] font-semibold text-text-primary m-0">Balance Energético</h3>
                    {kcalMenuEstimado > 0 && (
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        Math.abs(kcalMenuEstimado - cal) < 50
                          ? 'bg-green-500/10 text-green-500 border border-green-500/20'
                          : 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20'
                      }`}>
                        ~{kcalMenuEstimado} kcal menús
                      </span>
                    )}
                  </div>
                  
                  <div className="flex flex-col items-center justify-center py-6 bg-bg-elevated rounded-[8px] border border-border-subtle mb-4">
                    <span className="text-[11px] font-bold text-text-secondary uppercase tracking-widest mb-1 shadow-sm">Carga del Plan</span>
                    <p className="text-[36px] font-black text-brand-primary leading-none m-0">{cal}<span className="text-[14px] ml-1 font-medium text-text-muted">kcal</span></p>
                  </div>

                  {kcalBarrido && kcalBarrido > 0 && (
                    <div className="flex items-center justify-between p-3.5 bg-[#0a1628] rounded-[8px] border border-[#1e3a5f]">
                      <div>
                        <p className="text-[11px] font-bold text-[#5a8abf] m-0 uppercase tracking-widest leading-none mb-1.5">Ref. Barrido</p>
                        <p className="text-[10px] text-[#4a6a8f] m-0 font-medium">Id: Val-{valData?.numeroValoracion}</p>
                      </div>
                      <div className="text-right flex flex-col items-end">
                        <span className="text-[16px] font-bold text-[#90c2ff] m-0 leading-none">{kcalBarrido} <span className="text-[10px]">kcal</span></span>
                        {cal !== kcalBarrido && cal > 0 && (
                          <span className={`text-[10px] font-bold mt-1 ${
                            cal > kcalBarrido ? 'text-orange-400' : 'text-green-400'
                          }`}>
                            {cal > kcalBarrido ? '+' : ''}{cal - kcalBarrido} <span className="font-normal opacity-80">vs ref</span>
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* ── Distribución Macronutrimental ── */}
                <div className="bg-bg-surface border border-border-subtle p-5 rounded-[12px] shadow-sm">
                  <h3 className="text-[14px] font-semibold text-text-primary mb-5 m-0">Distribución de Macros</h3>
                  <div className="space-y-4">
                    {[
                      { label: 'Proteína', pct: pPct, gr: macroCalc.pGr, grKg: macroCalc.pGrKg, color: '#ef8c8c', bar: 'bg-[#ef8c8c]', note: pPct >= 35 ? 'Hiperproteico' : pPct <= 15 ? 'Hipoproteico' : null },
                      { label: 'Carbohidratos', pct: cPct, gr: macroCalc.cGr, grKg: macroCalc.cGrKg, color: '#90c2ff', bar: 'bg-[#90c2ff]', note: cPct <= 10 ? 'Cetogénico' : cPct <= 25 ? 'Low-Carb' : null },
                      { label: 'Grasas', pct: gPct, gr: macroCalc.gGr, grKg: macroCalc.gGrKg, color: '#f5c842', bar: 'bg-[#f5c842]', note: null },
                    ].map(m => (
                      <div key={m.label}>
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-2">
                            <span className="text-[13px] font-bold" style={{ color: m.color }}>{m.label}</span>
                            {m.note && <span className="text-[9px] px-1.5 py-0.5 rounded-[4px] bg-bg-elevated border border-border-subtle text-text-secondary font-semibold uppercase tracking-wider">{m.note}</span>}
                          </div>
                          <span className="text-[13px] font-bold text-text-primary bg-bg-elevated px-1.5 py-0.5 rounded-[4px]">{m.pct}%</span>
                        </div>
                        <div className="w-full h-2 bg-bg-elevated border border-border-subtle rounded-full overflow-hidden">
                          <div className={`h-full ${m.bar} rounded-full transition-all duration-500`} style={{ width: `${Math.min(m.pct, 100)}%` }} />
                        </div>
                        <div className="flex justify-between mt-1">
                          <span className="text-[11px] text-text-muted font-mono bg-bg-elevated px-1.5 rounded-[4px]">{formatDecimal(m.gr)} g/día</span>
                          {pesoUltimo > 0 && <span className="text-[11px] text-text-muted font-mono bg-bg-elevated px-1.5 rounded-[4px]">{formatDecimal(m.grKg)} g/kg</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                  {macroSum !== 100 && (
                    <div className="mt-4 p-2 bg-accent-red/10 border border-accent-red/20 rounded-[6px] text-center">
                      <p className="text-[11px] font-bold text-accent-red m-0">Revisión requerida: Suma {macroSum}% ≠ 100%</p>
                    </div>
                  )}
                </div>

                {/* ── Barrido estratégico (colapsable) ── */}
                <div className="bg-bg-surface border border-border-subtle rounded-[12px] overflow-hidden shadow-sm">
                  <button 
                    onClick={() => setShowBarridoRef(!showBarridoRef)}
                    className="w-full flex flex-col items-start p-4 hover:bg-bg-elevated transition-colors text-left"
                  >
                    <div className="w-full flex items-center justify-between mb-1.5">
                      <h3 className="text-[14px] font-semibold text-text-primary m-0 flex items-center gap-2">
                        <ClipboardList className="w-[18px] h-[18px] text-text-secondary" /> 
                        Barrido Estratégico
                      </h3>
                      {showBarridoRef ? <ChevronUp className="w-[18px] h-[18px] text-text-muted" /> : <ChevronDown className="w-[18px] h-[18px] text-text-muted" />}
                    </div>
                    <p className="text-[12px] text-text-muted m-0">
                      {valData?.numeroValoracion ? `Revisar desglose de la consulta base` : 'Herramienta de apoyo (Scratchpad)'}
                    </p>
                  </button>
                  {showBarridoRef && (
                    <div className="p-4 border-t border-border-subtle bg-bg-elevated">
                      {(() => {
                         let bd = valData?.barridoEquivalencias;
                         if (typeof bd === 'string') {
                           try { bd = JSON.parse(bd); } catch (e) {}
                         }
                         
                         if (!bd || !bd.tiempos || bd.tiempos.length === 0) return <p className="text-[12px] text-text-muted m-0 p-4 text-center border border-dashed border-border-default rounded-[8px]">Sin datos de barrido previos registrados.</p>;
                         
                         const gruposMap: any = { verduras: 'Verduras', frutas: 'Frutas', cerealSinGr: 'C y T s/grasa', cerealConGr: 'C y T c/grasa', leguminosas: 'Leguminosas', aoaMuyBajo: 'AOA muy bajo', aoaBajo: 'AOA bajo', aoaModerado: 'AOA moderado', aoaAlto: 'AOA alto', lecheDesc: 'Leche desc.', lecheSemi: 'Leche semi.', lecheEntera: 'Leche entera', lecheAz: 'Leche azuc.', grasaSinProt: 'A y G s/prot', grasaConProt: 'A y G c/prot', azSinGr: 'Az s/grasa', azConGr: 'Az c/grasa' };

                         const renderedTiempos = bd.tiempos.map((t: string) => {
                            const tiempoDist = (bd.distribucion || {})[t] || {};
                            const distributionItems = Object.entries(tiempoDist).filter(([, cant]) => Number(cant) > 0);
                            if (distributionItems.length === 0) return null;
                            const kcalTiempo = distributionItems.reduce((s, [g, cant]) => s + Number(cant) * (KCAL_EQ[g] ?? 0), 0);
                            
                            return (
                              <div key={t} className="bg-bg-surface p-3.5 rounded-[8px] border border-border-subtle mb-3 last:mb-0 shadow-sm">
                                <div className="flex items-center justify-between mb-3 border-b border-border-default pb-2">
                                  <h4 className="text-[12px] font-bold text-text-primary uppercase tracking-wider m-0">{t}</h4>
                                  <span className="text-[11px] font-mono text-text-secondary bg-bg-elevated px-2 py-0.5 rounded-[4px]">{Math.round(kcalTiempo)} kcal</span>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                  {distributionItems.map(([g, cant]) => (
                                    <span key={g} className="px-2 py-1 bg-bg-elevated border border-border-subtle rounded-[6px] text-[11px] font-medium text-text-secondary">
                                      {gruposMap[g] || g}: <span className="font-bold text-text-primary">{parseFloat(Number(cant).toFixed(1))} eq</span>
                                    </span>
                                  ))}
                                </div>
                              </div>
                            );
                         }).filter(Boolean);

                         if (renderedTiempos.length === 0) {
                           return <p className="text-[12px] text-text-muted m-0 p-4 text-center border border-dashed border-border-default rounded-[8px]">El barrido estratégico parece no tener porciones asignadas.</p>;
                         }

                         return (
                           <div className="pt-1 pb-1">
                             {renderedTiempos}
                           </div>
                         )
                      })()}
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="bg-bg-surface p-5 rounded-[12px] space-y-6 border border-border-subtle shadow-sm">
              <h3 className="text-[14px] font-semibold text-text-primary m-0 flex items-center gap-2">
                 <Settings className="w-[18px] h-[18px] text-text-secondary" /> Ajustes Finales
              </h3>
              <div className="space-y-5">
                {!isBasePlan && (
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold text-text-secondary uppercase tracking-widest pl-1">Próximo Seguimiento (Opcional)</label>
                    <div className="grid grid-cols-2 gap-3">
                      <input type="date" value={proximaSesion} onChange={(e) => setProximaSesion(e.target.value)} className="bg-bg-elevated rounded-[8px] px-3 py-2 text-[14px] font-medium text-text-primary outline-none border border-border-subtle focus:border-border-default transition-colors w-full" />
                      <input type="time" value={proximaSesionHora} onChange={(e) => setProximaSesionHora(e.target.value)} className="bg-bg-elevated rounded-[8px] px-3 py-2 text-[14px] font-medium text-text-primary outline-none border border-border-subtle focus:border-border-default transition-colors w-full" />
                    </div>
                  </div>
                )}
                
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-text-secondary uppercase tracking-widest pl-1">Anotaciones Generales</label>
                  <textarea 
                    value={notas} 
                    onChange={(e) => setNotas(e.target.value)} 
                    className="w-full bg-bg-elevated rounded-[8px] p-3 text-[13px] font-normal text-text-primary border border-border-subtle focus:border-border-default transition-colors outline-none resize-y min-h-[100px] placeholder:text-text-muted"
                    placeholder="Instrucciones, notas para el paciente, recomendaciones extras..."
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={handleSave}
                  disabled={saving || macroSum !== 100}
                  className="w-full py-3 bg-brand-primary text-bg-base rounded-[8px] text-[14px] font-bold transition-all hover:bg-white flex items-center justify-center gap-2 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? (
                    <div className="w-[18px] h-[18px] border-2 border-bg-base/20 border-t-bg-base rounded-full animate-spin" />
                  ) : (
                    <>
                      <Save className="h-[18px] w-[18px]" />
                      {isEdit ? 'Guardar Cambios' : 'Generar Plan Alimenticio'}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateEditPlan;
