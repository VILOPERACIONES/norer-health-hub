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
            setMenus(p.menus && p.menus.length > 0 ? p.menus : [emptyMenu('Menú 1'), emptyMenu('Menú 2')]);
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
    setTipo(template.tipo || 'Balanceada');
    setCalorias(template.calorias.toString());
    setProteinas((template.macros?.proteinas || 30).toString());
    setCarbohidratos((template.macros?.carbohidratos || 40).toString());
    setGrasas((template.macros?.grasas || 30).toString());
    setMenus(template.menus || [emptyMenu('Menú 1'), emptyMenu('Menú 2')]);
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
      calorias: cal,
      proteinasPct: pPct, 
      carbohidratosPct: cPct, 
      grasasPct: gPct,
      menus, 
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

  return (
    <div className="space-y-8 animate-fade-in pb-20 max-w-none">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div className="space-y-4">
          <button onClick={() => navigate(isBasePlan ? '/planes' : `/pacientes/${pacienteId}`)} className="flex items-center gap-3 text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground transition-all w-fit group leading-none">
            <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-all" /> VOLVER
          </button>
          <div className="animate-slide-up space-y-2">
            <h1 className="text-4xl font-black text-foreground tracking-tighter uppercase leading-none">
              {isBasePlan ? (isEdit ? 'Editar Plantilla' : 'Nueva Plantilla Maestro') : (isEdit ? 'Personalizar Plan' : 'Configurar Plan Maestro')}
            </h1>
            <p className="text-muted-foreground font-black text-[10px] uppercase tracking-[0.3em] opacity-40 leading-none">
              {isBasePlan ? 'DEFINICIÓN DE PROTOCOLO ESTÁNDAR PARA LA BIBLIOTECA' : 'AJUSTE DE REQUERIMIENTOS Y PERSONALIZACIÓN DE TIEMPOS'}
            </p>
          </div>
        </div>

        {!isBasePlan && !isEdit && (
          <div className="relative">
            <button 
              onClick={() => setShowTemplates(!showTemplates)}
              className="px-8 py-4 bg-secondary/50 border-2 border-dashed border-foreground/10 text-[11px] font-black uppercase tracking-widest hover:border-foreground/30 transition-all flex items-center gap-3"
            >
              <ClipboardList className="h-4 w-4" /> USAR PLANTILLA BASE
            </button>
            
            {showTemplates && (
              <div className="absolute top-full right-0 mt-4 w-80 bg-background border-2 border-foreground shadow-2xl z-50 p-4 space-y-4 animate-slide-up">
                <p className="text-[10px] font-black uppercase tracking-widest opacity-40">Seleccionar de Biblioteca</p>
                <div className="max-h-60 overflow-y-auto space-y-2 custom-scrollbar">
                  {availableTemplates.map(t => (
                    <button 
                      key={t.id} 
                      onClick={() => loadTemplate(t)}
                      className="w-full text-left p-4 hover:bg-secondary border border-transparent hover:border-foreground/10 transition-all group"
                    >
                      <p className="text-xs font-black uppercase tracking-tight group-hover:text-black">{t.nombre || 'Protocolo Sin Nombre'}</p>
                      <p className="text-[9px] font-bold opacity-30 uppercase mt-1">{t.calorias} KCAL · {t.tipo}</p>
                    </button>
                  ))}
                  {availableTemplates.length === 0 && <p className="p-4 text-center text-[10px] font-bold opacity-30 uppercase">Sin plantillas disponibles</p>}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="grid lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-8">
          {/* Configuración Metabólica */}
          <div className="bg-secondary/10 p-6 rounded-none animate-slide-up border border-border/20">
            <h3 className="text-[10px] font-black text-foreground uppercase tracking-[0.3em] mb-8 flex items-center gap-4 leading-none opacity-30">
               {`// REQUERIMIENTOS ESCENCIALES`}
            </h3>
            
            <div className="grid sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1 leading-none opacity-40">Identificador del Plan / Objetivo</label>
                <input 
                  value={nombrePlan} 
                  onChange={(e) => setNombrePlan(e.target.value)} 
                  placeholder="EJ: DEFINICIÓN 1800 KCAL / CROSSFIT"
                  className="w-full bg-background rounded-none px-4 py-3 text-base font-black uppercase tracking-tight outline-none border border-foreground/5 focus:border-foreground/20 transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1 leading-none opacity-40">Modelo de Enfoque</label>
                <select value={tipo} onChange={(e) => setTipo(e.target.value)} className="w-full bg-background rounded-none px-4 py-3 text-base font-black uppercase tracking-tight outline-none border border-foreground/5 transition-all">
                  <option>Balanceada</option>
                  <option>Keto / Low Carb</option>
                  <option>Vegetariana / Vegana</option>
                  <option>Hipercalórica / Volumen</option>
                  <option>Hipocalórica / Déficit</option>
                  <option>Personalizada</option>
                </select>
              </div>
            </div>

            <div className="grid sm:grid-cols-1 gap-6 mt-6">
               <div className="space-y-2">
                <label className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1 leading-none opacity-40">Energía Total (KCAL)</label>
                <div className="flex flex-col gap-2">
                  <input type="number" value={calorias} onChange={(e) => setCalorias(e.target.value)} className="w-full bg-background rounded-none px-4 py-3 text-2xl font-black text-foreground tracking-tighter outline-none border border-foreground/5 transition-all" />
                  
                  {valData && (
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-1">
                      {[
                        { key: 'getSedentario', label: 'SED' },
                        { key: 'getLeve', label: 'LEV' },
                        { key: 'getModerado', label: 'MOD' },
                        { key: 'getIntenso', label: 'INT' }
                      ].map(g => (
                        <button
                          key={g.key}
                          type="button"
                          onClick={() => setCalorias(Math.round(valData[g.key]).toString())}
                          className="bg-white/50 hover:bg-black hover:text-white px-2 py-1 text-[8px] font-black uppercase tracking-widest transition-all border border-black/5"
                        >
                          {g.label}: {Math.round(valData[g.key])}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-6 mt-6 pt-6 border-t border-foreground/5">
              <div className="space-y-2">
                <label className="text-[9px] font-black text-muted-foreground/40 uppercase tracking-[0.2em] text-center w-full block leading-none">Proteína %</label>
                <input type="number" value={proteinas} onChange={(e) => setProteinas(e.target.value)} className="w-full bg-background rounded-none px-4 py-3 font-black text-center text-lg text-foreground outline-none border border-foreground/10 focus:border-foreground/30" />
              </div>
              <div className="space-y-2">
                <label className="text-[9px] font-black text-muted-foreground/40 uppercase tracking-[0.2em] text-center w-full block leading-none">Carbos %</label>
                <input type="number" value={carbohidratos} onChange={(e) => setCarbohidratos(e.target.value)} className="w-full bg-background rounded-none px-4 py-3 font-black text-center text-lg text-foreground outline-none border border-foreground/10 focus:border-foreground/30" />
              </div>
              <div className="space-y-2">
                <label className="text-[9px] font-black text-muted-foreground/40 uppercase tracking-[0.2em] text-center w-full block leading-none">Grasas %</label>
                <input type="number" value={grasas} onChange={(e) => setGrasas(e.target.value)} className="w-full bg-background rounded-none px-4 py-3 font-black text-center text-lg text-foreground outline-none border border-foreground/10 focus:border-foreground/30" />
              </div>
            </div>

            {macroSum !== 100 && (
              <div className="mt-6 p-4 bg-foreground text-background rounded-none animate-pulse">
                <p className="text-[11px] font-black uppercase tracking-[0.2em] text-center leading-none">
                   DISTRIBUCIÓN SUMA {macroSum}% (REQUERIDO: 100%)
                </p>
              </div>
            )}
          </div>

          {/* Menús Personalizados */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-2 gap-8 items-start">
            {menus.map((menu, mi) => (
              <div key={mi} className="bg-secondary/10 rounded-none animate-slide-up border border-border/40 overflow-hidden" style={{ animationDelay: `${mi * 0.1}s` }}>
                <div className="bg-foreground text-background px-6 py-4 flex items-center justify-between">
                  <input
                    value={menu.nombre}
                    onChange={(e) => updateMenu(mi, (m) => ({ ...m, nombre: e.target.value.toUpperCase() }))}
                    className="text-lg font-black bg-transparent border-none outline-none w-full uppercase tracking-tighter selection:bg-background/20"
                    placeholder="NOMBRE DEL MENÚ"
                  />
                  <button
                     onClick={() => setMenus(menus.filter((_, i) => i !== mi))}
                     className="p-3 text-background/20 hover:text-background hover:bg-background/10 rounded-none transition-all"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>

                <div className="p-4 space-y-6">
                  {menu.tiempos.map((tiempo, ti) => (
                    <div key={ti} className="relative p-5 border border-black/5 bg-white group hover:border-black/20 transition-all">
                      <div className="flex items-center justify-between mb-4">
                         <input
                           value={tiempo.nombre}
                           onChange={(e) => updateTiempo(mi, ti, (t) => ({ ...t, nombre: e.target.value.toUpperCase() }))}
                           className="text-[12px] font-black text-foreground bg-transparent border-none outline-none uppercase tracking-widest w-fit"
                         />
                         <div className="flex items-center gap-1 opacity-20 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => updateMenu(mi, (m) => ({ ...m, tiempos: m.tiempos.filter((_, i) => i !== ti) }))} className="p-1 text-muted-foreground hover:text-destructive transition-all">
                              <Trash2 className="h-3 w-3" />
                            </button>
                         </div>
                      </div>

                      <div className="space-y-3">
                        {tiempo.ingredientes.map((ing, ii) => (
                          <div key={ii} className="space-y-2 pb-3 border-b border-black/5 last:border-0 text-[11px]">
                             <div className="flex gap-2">
                                <input
                                  placeholder="ALIMENTO..."
                                  value={ing.descripcion}
                                  onChange={(e) => updateTiempo(mi, ti, (t) => ({
                                    ...t, ingredientes: t.ingredientes.map((x, j) => j === ii ? { ...x, descripcion: e.target.value } : x)
                                  }))}
                                  className="flex-1 bg-slate-50 px-2 py-1.5 font-bold uppercase outline-none border-b border-transparent focus:border-black transition-all"
                                />
                                <button onClick={() => updateTiempo(mi, ti, (t) => ({ ...t, ingredientes: t.ingredientes.filter((_, j) => j !== ii) }))} className="text-red-500 opacity-20 hover:opacity-100"><X className="w-3 h-3" /></button>
                             </div>
                             <div className="grid grid-cols-4 gap-1.5">
                                <div className="space-y-1">
                                   <input type="number" value={ing.cantidad || ''} onChange={e => updateTiempo(mi, ti, t => ({ ...t, ingredientes: t.ingredientes.map((x, j) => j === ii ? { ...x, cantidad: parseFloat(e.target.value) || 0 } : x) }))} className="w-full bg-slate-50 py-1 text-[10px] font-black text-center outline-none" placeholder="CANT" />
                                </div>
                                <div className="space-y-1">
                                   <input value={ing.unidad} onChange={e => updateTiempo(mi, ti, t => ({ ...t, ingredientes: t.ingredientes.map((x, j) => j === ii ? { ...x, unidad: e.target.value.toUpperCase() } : x) }))} className="w-full bg-slate-50 py-1 text-[10px] font-black text-center outline-none" placeholder="UNID" />
                                </div>
                                <div className="space-y-1">
                                   <input type="number" value={ing.eqCantidad || ''} onChange={e => updateTiempo(mi, ti, t => ({ ...t, ingredientes: t.ingredientes.map((x, j) => j === ii ? { ...x, eqCantidad: parseFloat(e.target.value) || 0 } : x) }))} className="w-full bg-slate-50 py-1 text-[10px] font-black text-center outline-none" placeholder="EQ" />
                                </div>
                                <div className="space-y-1">
                                   <input value={ing.eqGrupo} onChange={e => updateTiempo(mi, ti, t => ({ ...t, ingredientes: t.ingredientes.map((x, j) => j === ii ? { ...x, eqGrupo: e.target.value } : x) }))} className="w-full bg-slate-50 py-1 text-[10px] font-black text-center outline-none" placeholder="GRUPO" />
                                </div>
                             </div>
                             {ing.eqCantidad ? (
                               <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">
                                 {ing.cantidad}{ing.unidad} {ing.descripcion} — {ing.eqCantidad} EQ {ing.eqGrupo}
                               </p>
                             ) : null}
                          </div>
                        ))}
                        
                        <button
                          onClick={() => updateTiempo(mi, ti, (t) => ({ ...t, ingredientes: [...t.ingredientes, emptyIngrediente()] }))}
                          className="w-full py-1.5 border border-black/10 text-[8px] font-black uppercase tracking-widest hover:bg-black hover:text-white transition-all opacity-40 hover:opacity-100"
                        >
                          + AGREGAR ITEM
                        </button>
                      </div>
                    </div>
                  ))}
                  
                  <button
                    onClick={() => updateMenu(mi, (m) => ({
                      ...m, tiempos: [...m.tiempos, { nombre: 'NUEVO TIEMPO', ingredientes: [], nota: '' }]
                    }))}
                    className="w-full py-4 border-2 border-dashed border-border/40 rounded-none text-[9px] font-black text-muted-foreground uppercase tracking-[0.3em] hover:bg-foreground/5 transition-all"
                  >
                    + AGREGAR COMIDA
                  </button>
                </div>
              </div>
            ))}
            
            <button
               onClick={() => setMenus([...menus, emptyMenu(`Menú ${menus.length + 1}`)])}
               className="h-full min-h-[400px] border-4 border-dashed border-foreground/5 p-10 flex flex-col items-center justify-center gap-4 text-muted-foreground hover:text-foreground hover:bg-foreground/5 hover:border-foreground/20 transition-all group"
            >
              <Plus className="w-12 h-12 group-hover:rotate-90 transition-transform duration-500" />
              <span className="text-[11px] font-black uppercase tracking-[0.4em]">AGREGAR OPCIÓN</span>
            </button>
          </div>
        </div>

        {/* Sidebar Summary & Persistence */}
        <div className="lg:col-span-4 space-y-8">
          <div className="sticky top-20 space-y-8 animate-slide-up" style={{ animationDelay: '0.1s' }}>
            <div className="bg-foreground text-background p-6 rounded-none relative overflow-hidden">
               <div className="absolute top-0 right-0 p-6 opacity-5 translate-x-1/4 -translate-y-1/4 rotate-12">
                  <Save className="w-24 h-24" />
               </div>
               <h3 className="text-[10px] font-black uppercase tracking-[0.3em] mb-8 opacity-20 leading-none">CÓMPUTO METABÓLICO</h3>
               
               <div className="space-y-8 relative">
                  {[
                    { label: 'Proteína', gr: macroCalc.pGr, grKg: macroCalc.pGrKg, color: 'text-emerald-400' },
                    { label: 'Hidratos', gr: macroCalc.cGr, grKg: macroCalc.cGrKg, color: 'text-amber-400' },
                    { label: 'Lípidos', gr: macroCalc.gGr, grKg: macroCalc.gGrKg, color: 'text-rose-400' },
                  ].map((m) => (
                    <div key={m.label} className="flex items-center justify-between border-b border-background/10 pb-4">
                      <span className="text-[11px] font-black uppercase tracking-[0.1em] opacity-30">{m.label}</span>
                      <div className="text-right space-y-1">
                        <p className={`text-2xl font-black tracking-tighter uppercase ${m.color}`}>{formatDecimal(m.gr)}<span className="text-[10px] ml-1 tracking-[0.1em] opacity-40">GR</span></p>
                        <p className="text-[10px] font-black opacity-20 tracking-[0.1em] font-mono">{formatDecimal(m.grKg)} GR/KG</p>
                      </div>
                    </div>
                  ))}

                  <div className="pt-4">
                     <div className="flex flex-col items-center">
                        <span className="text-[11px] font-black uppercase tracking-[0.2em] opacity-40 mb-3 leading-none text-center">CARGA ENERGÉTICA TOTAL</span>
                        <p className="text-3xl font-black tracking-tighter leading-none">{cal}<span className="text-sm ml-2 opacity-40 tracking-[0.1em] uppercase">KCAL</span></p>
                     </div>
                  </div>
               </div>
            </div>

            <div className="bg-secondary/10 p-6 rounded-none space-y-8 border border-border/20">
              <h3 className="text-[10px] font-black text-foreground uppercase tracking-[0.3em] opacity-20 leading-none">ADMINISTRACIÓN DE PROTOCOLO</h3>
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-2 leading-none opacity-40">Próximo Seguimiento</label>
                  <div className="grid grid-cols-2 gap-3">
                    <input type="date" value={proximaSesion} onChange={(e) => setProximaSesion(e.target.value)} className="bg-background rounded-none px-4 py-3 text-[11px] font-black outline-none border border-foreground/5 focus:border-foreground/30 shadow-inner" />
                    <input type="time" value={proximaSesionHora} onChange={(e) => setProximaSesionHora(e.target.value)} className="bg-background rounded-none px-4 py-3 text-[11px] font-black outline-none border border-foreground/5 focus:border-foreground/30 shadow-inner" />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-2 leading-none opacity-40">Anotaciones Estratégicas</label>
                  <textarea 
                    value={notas} 
                    onChange={(e) => setNotas(e.target.value)} 
                    className="w-full bg-background rounded-none p-6 text-[11px] font-black leading-relaxed uppercase tracking-tighter border border-foreground/5 focus:border-foreground/30 outline-none resize-none min-h-[150px] placeholder:opacity-20"
                    placeholder="PUNTOS CLAVE PARA EL PACIENTE Y EL EQUIPO CLÍNICO..."
                  />
                </div>
              </div>

              <div className="pt-6">
                <button
                  onClick={handleSave}
                  disabled={saving || macroSum !== 100}
                  className="w-full py-6 bg-foreground text-background rounded-none text-[11px] font-black uppercase tracking-[0.3em] transition-all duration-200 flex items-center justify-center gap-4 border border-foreground"
                >
                  {saving ? (
                    <div className="w-4 h-4 border-2 border-background/20 border-t-background rounded-none animate-spin" />
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      {isEdit ? 'ACTUALIZAR' : 'PERSISTIR'}
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
