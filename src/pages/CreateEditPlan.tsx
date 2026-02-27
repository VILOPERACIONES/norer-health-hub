import { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, Save, MoreHorizontal, X, ArrowUp, ArrowDown, ClipboardList } from 'lucide-react';
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

  const mapMenusFromBackend = (backendMenus: any[]) => {
    return backendMenus?.map((m: any) => ({
      nombre: m.nombre,
      tiempos: (m.tiemposComida || m.tiempos || []).map((t: any) => ({
        nombre: t.nombre,
        nota: t.notaPie || t.nota || '',
        ingredientes: (t.ingredientes || []).map((i: any) => ({
          ...i,
          cantidad: parseFloat(i.cantidad) || 0,
          eqCantidad: parseFloat(i.eqCantidad) || 0
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
            setProximaSesion(p.proximaSesion || '');
            setProximaSesionHora(p.proximaSesionHora || '');
            setNotas(p.notasGenerales || p.notas || '');
            
            // USAR MAPEO ROBUSTO
            setMenus(mapMenusFromBackend(p.menus));
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
              setPesoUltimo(v.peso || 0);
              setValData(v);
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
    setProteinas((template.proteinasPct || template.macros?.proteinas || 30).toString());
    setCarbohidratos((template.carbohidratosPct || template.macros?.carbohidratos || 40).toString());
    setGrasas((template.grasasPct || template.macros?.grasas || 30).toString());
    
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
      toast({ title: isBasePlan ? 'PLANTILLA PERSISTIDA' : 'PROTOCOLO CLÍNICO PERSISTIDO' });
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
    <div className="space-y-8 animate-fade-in pb-20 max-w-[1400px]">
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
              {isBasePlan ? 'Definición de protocolo estándar para la biblioteca' : 'Ajuste de requerimientos y personalización de tiempos'}
            </p>
          </div>
        </div>

        {!isBasePlan && !isEdit && (
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
                      <p className="text-[14px] font-medium text-text-primary group-hover:text-brand-primary m-0">{t.nombre || 'Protocolo Sin Nombre'}</p>
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
                  
                  {valData && (
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                      {[
                        { key: 'getSedentario', label: 'SEDENTARIO' },
                        { key: 'getLeve', label: 'LEVE' },
                        { key: 'getModerado', label: 'MODERADO' },
                        { key: 'getIntenso', label: 'INTENSO' }
                      ].map(g => (
                        <button
                          key={g.key}
                          type="button"
                          onClick={() => setCalorias(Math.round(valData[g.key]).toString())}
                          className="bg-bg-elevated hover:bg-brand-primary text-text-secondary hover:text-bg-base px-3 py-2 text-[12px] font-medium rounded-[8px] transition-colors border border-border-subtle"
                        >
                          {g.label} ({Math.round(valData[g.key])})
                        </button>
                      ))}
                    </div>
                  )}
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

                      <div className="space-y-4">
                        {tiempo.ingredientes.map((ing, ii) => (
                          <div key={ii} className="relative space-y-2 pb-4 border-b border-border-default last:border-0 last:pb-0">
                             <div className="flex gap-2">
                                <input
                                  placeholder="Alimento o ingrediente..."
                                  value={ing.descripcion}
                                  onChange={(e) => updateTiempo(mi, ti, (t) => ({
                                    ...t, ingredientes: t.ingredientes.map((x, j) => j === ii ? { ...x, descripcion: e.target.value } : x)
                                  }))}
                                  className="flex-1 bg-bg-base px-3 py-2 rounded-[6px] text-[13px] font-normal text-text-primary outline-none border border-border-subtle focus:border-[#444] transition-colors"
                                />
                                <button onClick={() => updateTiempo(mi, ti, (t) => ({ ...t, ingredientes: t.ingredientes.filter((_, j) => j !== ii) }))} className="text-text-muted hover:text-accent-red px-2 transition-colors"><X className="w-4 h-4" /></button>
                             </div>
                             <div className="grid grid-cols-4 gap-2">
                                <div className="space-y-1">
                                   <input type="number" value={ing.cantidad || ''} onChange={e => updateTiempo(mi, ti, t => ({ ...t, ingredientes: t.ingredientes.map((x, j) => j === ii ? { ...x, cantidad: parseFloat(e.target.value) || 0 } : x) }))} className="w-full bg-bg-base px-2 py-2 rounded-[6px] text-[12px] font-medium text-text-primary text-center outline-none border border-border-subtle focus:border-[#444] transition-colors" placeholder="Cant" />
                                </div>
                                <div className="space-y-1">
                                   <input value={ing.unidad} onChange={e => updateTiempo(mi, ti, t => ({ ...t, ingredientes: t.ingredientes.map((x, j) => j === ii ? { ...x, unidad: e.target.value } : x) }))} className="w-full bg-bg-base px-2 py-2 rounded-[6px] text-[12px] font-medium text-text-primary text-center outline-none border border-border-subtle focus:border-[#444] transition-colors" placeholder="Unid" />
                                </div>
                                <div className="space-y-1">
                                   <input type="number" value={ing.eqCantidad || ''} onChange={e => updateTiempo(mi, ti, t => ({ ...t, ingredientes: t.ingredientes.map((x, j) => j === ii ? { ...x, eqCantidad: parseFloat(e.target.value) || 0 } : x) }))} className="w-full bg-bg-base px-2 py-2 rounded-[6px] text-[12px] font-medium text-text-primary text-center outline-none border border-border-subtle focus:border-[#444] transition-colors" placeholder="Eq" />
                                </div>
                                <div className="space-y-1">
                                   <input value={ing.eqGrupo} onChange={e => updateTiempo(mi, ti, t => ({ ...t, ingredientes: t.ingredientes.map((x, j) => j === ii ? { ...x, eqGrupo: e.target.value } : x) }))} className="w-full bg-bg-base px-2 py-2 rounded-[6px] text-[12px] font-medium text-text-primary text-center outline-none border border-border-subtle focus:border-[#444] transition-colors" placeholder="Grupo" />
                                </div>
                             </div>
                             {ing.eqCantidad ? (
                               <p className="text-[12px] font-medium text-text-muted mt-2 m-0 bg-bg-base px-2 py-1 rounded-[4px] inline-block border border-border-default">
                                 {ing.cantidad} {ing.unidad} {ing.descripcion} → {ing.eqCantidad} Eq {ing.eqGrupo}
                               </p>
                             ) : null}
                          </div>
                        ))}
                        
                        <button
                          onClick={() => updateTiempo(mi, ti, (t) => ({ ...t, ingredientes: [...t.ingredientes, emptyIngrediente()] }))}
                          className="w-full py-2 bg-transparent border border-border-subtle hover:border-border-default text-text-secondary hover:text-text-primary text-[12px] font-medium rounded-[6px] transition-colors"
                        >
                          + Agregar Alimento
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
        <div className="lg:col-span-4 space-y-6">
          <div className="sticky top-24 space-y-6 animate-slide-up" style={{ animationDelay: '0.1s' }}>
            <div className="bg-bg-surface border border-border-subtle p-6 rounded-[12px] relative overflow-hidden">
               <h3 className="text-[14px] font-semibold text-text-primary mb-6 m-0">Computo Metabólico</h3>
               
               <div className="space-y-6 relative">
                  {[
                    { label: 'Proteína', gr: macroCalc.pGr, grKg: macroCalc.pGrKg, color: 'text-text-primary' },
                    { label: 'Hidratos', gr: macroCalc.cGr, grKg: macroCalc.cGrKg, color: 'text-text-primary' },
                    { label: 'Lípidos', gr: macroCalc.gGr, grKg: macroCalc.gGrKg, color: 'text-text-primary' },
                  ].map((m) => (
                    <div key={m.label} className="flex items-center justify-between border-b border-border-default pb-4">
                      <span className="text-[14px] font-medium text-text-secondary">{m.label}</span>
                      <div className="text-right space-y-1">
                        <p className={`text-[18px] font-bold m-0 ${m.color}`}>{formatDecimal(m.gr)}<span className="text-[12px] ml-1 font-medium text-text-muted">Gr</span></p>
                        <p className="text-[12px] font-normal text-text-muted m-0">{formatDecimal(m.grKg)} Gr/Kg</p>
                      </div>
                    </div>
                  ))}

                  <div className="pt-2">
                     <div className="flex flex-col items-center">
                        <span className="text-[12px] font-medium text-text-secondary mb-1 m-0">Carga Energética</span>
                        <p className="text-[28px] font-bold text-text-primary m-0">{cal}<span className="text-[14px] ml-1 font-medium text-text-muted">Kcal</span></p>
                     </div>
                  </div>
               </div>
            </div>

            <div className="bg-bg-surface p-6 rounded-[12px] space-y-6 border border-border-subtle">
              <h3 className="text-[14px] font-semibold text-text-primary m-0">Ajustes Finales</h3>
              <div className="space-y-5">
                {!isBasePlan && (
                  <div className="space-y-2">
                    <label className="text-[12px] font-medium text-text-secondary">Próximo Seguimiento (Opcional)</label>
                    <div className="grid grid-cols-2 gap-3">
                      <input type="date" value={proximaSesion} onChange={(e) => setProximaSesion(e.target.value)} className="bg-bg-elevated rounded-[8px] px-3 py-2 text-[14px] font-normal text-text-primary outline-none border border-border-subtle focus:border-[#444]" />
                      <input type="time" value={proximaSesionHora} onChange={(e) => setProximaSesionHora(e.target.value)} className="bg-bg-elevated rounded-[8px] px-3 py-2 text-[14px] font-normal text-text-primary outline-none border border-border-subtle focus:border-[#444]" />
                    </div>
                  </div>
                )}
                
                <div className="space-y-2">
                  <label className="text-[12px] font-medium text-text-secondary">Anotaciones Generales</label>
                  <textarea 
                    value={notas} 
                    onChange={(e) => setNotas(e.target.value)} 
                    className="w-full bg-bg-elevated rounded-[8px] p-4 text-[14px] font-normal text-text-primary border border-border-subtle focus:border-[#444] outline-none resize-y min-h-[120px] placeholder:text-text-muted"
                    placeholder="Instrucciones, notas para el paciente..."
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={handleSave}
                  disabled={saving || macroSum !== 100}
                  className="w-full py-[12px] bg-brand-primary text-bg-base rounded-[8px] text-[14px] font-medium transition-colors hover:bg-[#e0e0e0] flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {saving ? (
                    <div className="w-[18px] h-[18px] border-2 border-bg-base/20 border-t-bg-base rounded-full animate-spin" />
                  ) : (
                    <>
                      <Save className="h-[18px] w-[18px]" />
                      {isEdit ? 'Guardar Cambios' : 'Crear Protocolo'}
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
