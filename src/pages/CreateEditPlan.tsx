import { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, Save, MoreHorizontal, X, ArrowUp, ArrowDown } from 'lucide-react';
import api from '@/lib/api';
import type { Menu, TiempoComida, Ingrediente } from '@/types';
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
  const [saving, setSaving] = useState(false);
  const [pesoUltimo, setPesoUltimo] = useState(0);

  const [tipo, setTipo] = useState('Balanceada');
  const [calorias, setCalorias] = useState('1800');
  const [proteinas, setProteinas] = useState('30');
  const [carbohidratos, setCarbohidratos] = useState('40');
  const [grasas, setGrasas] = useState('30');
  const [proximaSesion, setProximaSesion] = useState('');
  const [proximaSesionHora, setProximaSesionHora] = useState('');
  const [notas, setNotas] = useState('');
  const [menus, setMenus] = useState<Menu[]>([emptyMenu('Menú Principal')]);

  useEffect(() => {
    if (isEdit) {
      const fetchPlan = async () => {
        try {
          const { data } = await api.get(`/api/pacientes/${pacienteId}/planes/${planId}`);
          const p = data?.data || data;
          if (p) {
            setTipo(p.tipoPlan);
            setCalorias(p.calorias.toString());
            setProteinas(p.proteinasPct.toString());
            setCarbohidratos(p.carbohidratosPct.toString());
            setGrasas(p.grasasPct.toString());
            setProximaSesion(p.proximaSesion || '');
            setProximaSesionHora(p.proximaSesionHora || '');
            setNotas(p.notasGenerales || '');
            setMenus(p.menus);
          }
        } catch (err) {
          console.error('Error cargando plan:', err);
        }
      };
      fetchPlan();
    } else if (valoracionId) {
      const fetchVal = async () => {
        try {
          const { data } = await api.get(`/api/pacientes/${pacienteId}/valoraciones/${valoracionId}`);
          const v = data?.data || data;
          if (v) setPesoUltimo(v.peso || 0);
        } catch (err) {
          console.error('Error cargando valoración:', err);
        }
      };
      fetchVal();
    }
  }, [planId, isEdit, pacienteId, valoracionId]);

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
    const body = {
      tipoPlan: tipo, 
      calorias: cal,
      proteinasPct: pPct, 
      carbohidratosPct: cPct, 
      grasasPct: gPct,
      menus, 
      proximaSesion: proximaSesion ? new Date(`${proximaSesion}T${proximaSesionHora || '00:00'}`) : undefined, 
      notasGenerales: notas,
      valoracionId: valoracionId || undefined,
    };
    try {
      if (isEdit) {
        await api.put(`/api/pacientes/${pacienteId}/planes/${planId}`, body);
      } else {
        await api.post(`/api/pacientes/${pacienteId}/planes`, body);
      }
      toast({ title: 'PROTOCOLO CLÍNICO PERSISTIDO' });
      navigate(`/pacientes/${pacienteId}`);
    } catch (err: any) {
      toast({ title: 'Error de Persistencia', description: 'No se pudo sincronizar el plan maestro.', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in pb-20 max-w-7xl mx-auto">
      <div className="flex flex-col gap-6">
        <button onClick={() => navigate(`/pacientes/${pacienteId}`)} className="flex items-center gap-3 text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground transition-all w-fit group leading-none">
          <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-all" /> VOLVER AL EXPEDIENTE
        </button>
        <div className="animate-slide-up space-y-2">
          <h1 className="text-3xl font-black text-foreground tracking-tighter uppercase leading-none">{isEdit ? 'Actualizar Protocolo' : 'Nuevo Plan Maestro'}</h1>
          <p className="text-muted-foreground font-black text-[10px] uppercase tracking-[0.3em] opacity-40 leading-none">DEFINICIÓN DE REQUERIMIENTOS CLÍNICOS Y DISTRIBUCIÓN DE MACRONUTRIENTES</p>
        </div>
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
              <div className="space-y-2">
                <label className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1 leading-none opacity-40">Energía Total (KCAL)</label>
                <input type="number" value={calorias} onChange={(e) => setCalorias(e.target.value)} className="w-full bg-background rounded-none px-4 py-3 text-2xl font-black text-foreground tracking-tighter outline-none border border-foreground/5 transition-all" />
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
          <div className="space-y-8">
            {menus.map((menu, mi) => (
              <div key={mi} className="bg-secondary/10 rounded-none animate-slide-up border border-border/40 overflow-hidden" style={{ animationDelay: `${mi * 0.1}s` }}>
                <div className="bg-foreground text-background px-6 py-4 flex items-center justify-between">
                  <input
                    value={menu.nombre}
                    onChange={(e) => updateMenu(mi, (m) => ({ ...m, nombre: e.target.value }))}
                    className="text-xl font-black bg-transparent border-none outline-none w-full uppercase tracking-tighter selection:bg-background/20"
                    placeholder="IDENTIFICADOR DEL MENÚ"
                  />
                  <button
                     onClick={() => setMenus(menus.filter((_, i) => i !== mi))}
                     className="p-3 text-background/20 hover:text-background hover:bg-background/10 rounded-none transition-all"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>

                <div className="p-6 space-y-12">
                  <div className="grid md:grid-cols-2 gap-8">
                    {menu.tiempos.map((tiempo, ti) => (
                      <div key={ti} className="relative p-6 border-2 border-black/5 bg-white group hover:border-black/20 transition-all">
                        <div className="flex items-center justify-between mb-6">
                           <div className="flex items-center gap-3">
                              <span className="text-[10px] bg-black text-white w-5 h-5 flex items-center justify-center font-bold">{ti + 1}</span>
                              <input
                                value={tiempo.nombre}
                                onChange={(e) => updateTiempo(mi, ti, (t) => ({ ...t, nombre: e.target.value.toUpperCase() }))}
                                className="text-[14px] font-black text-foreground bg-transparent border-none outline-none uppercase tracking-widest w-fit"
                              />
                           </div>
                           <div className="flex items-center gap-1">
                              <button 
                                onClick={() => {
                                   if (ti === 0) return;
                                   const nt = [...menu.tiempos];
                                   [nt[ti-1], nt[ti]] = [nt[ti], nt[ti-1]];
                                   updateMenu(mi, m => ({ ...m, tiempos: nt }));
                                }}
                                className="p-1 hover:bg-black hover:text-white border border-transparent hover:border-black transition-all"
                              >
                                <ArrowUp className="w-3 h-3" />
                              </button>
                              <button 
                                onClick={() => {
                                   if (ti === menu.tiempos.length - 1) return;
                                   const nt = [...menu.tiempos];
                                   [nt[ti], nt[ti+1]] = [nt[ti+1], nt[ti]];
                                   updateMenu(mi, m => ({ ...m, tiempos: nt }));
                                }}
                                className="p-1 hover:bg-black hover:text-white border border-transparent hover:border-black transition-all"
                              >
                                <ArrowDown className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() => updateMenu(mi, (m) => ({ ...m, tiempos: m.tiempos.filter((_, i) => i !== ti) }))}
                                className="p-1 text-muted-foreground hover:text-destructive transition-all"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                           </div>
                        </div>

                        <div className="space-y-4">
                          {tiempo.ingredientes.map((ing, ii) => (
                            <div key={ii} className="space-y-2 pb-4 border-b border-black/5 last:border-0">
                               <div className="flex gap-2">
                                  <input
                                    placeholder="ALIMENTO..."
                                    value={ing.descripcion}
                                    onChange={(e) => updateTiempo(mi, ti, (t) => ({
                                      ...t, ingredientes: t.ingredientes.map((x, j) => j === ii ? { ...x, descripcion: e.target.value } : x)
                                    }))}
                                    className="flex-1 bg-slate-50 px-3 py-2 text-xs font-bold uppercase outline-none border-b-2 border-transparent focus:border-black transition-all"
                                  />
                                  <button onClick={() => updateTiempo(mi, ti, (t) => ({ ...t, ingredientes: t.ingredientes.filter((_, j) => j !== ii) }))} className="text-red-500 opacity-20 hover:opacity-100"><X className="w-4 h-4" /></button>
                               </div>
                               <div className="grid grid-cols-4 gap-2">
                                  <div className="space-y-1">
                                     <p className="text-[8px] font-bold opacity-30 text-center">Cant.</p>
                                     <input type="number" value={ing.cantidad || ''} onChange={e => updateTiempo(mi, ti, t => ({ ...t, ingredientes: t.ingredientes.map((x, j) => j === ii ? { ...x, cantidad: parseFloat(e.target.value) || 0 } : x) }))} className="w-full bg-slate-50 py-1 text-[10px] font-black text-center outline-none" />
                                  </div>
                                  <div className="space-y-1">
                                     <p className="text-[8px] font-bold opacity-30 text-center">Unid.</p>
                                     <input value={ing.unidad} onChange={e => updateTiempo(mi, ti, t => ({ ...t, ingredientes: t.ingredientes.map((x, j) => j === ii ? { ...x, unidad: e.target.value.toUpperCase() } : x) }))} className="w-full bg-slate-50 py-1 text-[10px] font-black text-center outline-none" />
                                  </div>
                                  <div className="space-y-1">
                                     <p className="text-[8px] font-bold opacity-30 text-center">Eq. Q.</p>
                                     <input type="number" value={ing.eqCantidad || ''} onChange={e => updateTiempo(mi, ti, t => ({ ...t, ingredientes: t.ingredientes.map((x, j) => j === ii ? { ...x, eqCantidad: parseFloat(e.target.value) || 0 } : x) }))} className="w-full bg-slate-50 py-1 text-[10px] font-black text-center outline-none" />
                                  </div>
                                  <div className="space-y-1">
                                     <p className="text-[8px] font-bold opacity-30 text-center">Eq. G.</p>
                                     <input value={ing.eqGrupo} onChange={e => updateTiempo(mi, ti, t => ({ ...t, ingredientes: t.ingredientes.map((x, j) => j === ii ? { ...x, eqGrupo: e.target.value } : x) }))} className="w-full bg-slate-50 py-1 text-[10px] font-black text-center outline-none" />
                                  </div>
                               </div>
                               <input 
                                 placeholder="Nota adicional (opcional)..." 
                                 value={ing.nota} 
                                 onChange={e => updateTiempo(mi, ti, t => ({ ...t, ingredientes: t.ingredientes.map((x, j) => j === ii ? { ...x, nota: e.target.value } : x) }))}
                                 className="w-full text-[9px] font-bold opacity-50 bg-transparent outline-none italic"
                               />
                            </div>
                          ))}
                          
                          <button
                            onClick={() => updateTiempo(mi, ti, (t) => ({ ...t, ingredientes: [...t.ingredientes, emptyIngrediente()] }))}
                            className="w-full py-2 border border-black text-[9px] font-black uppercase tracking-widest hover:bg-black hover:text-white transition-all"
                          >
                            + AGREGAR INSUMO
                          </button>

                          <div className="pt-4 border-t border-black/10 mt-4">
                            <textarea
                               placeholder="NOTAS DE PIE PARA ESTE TIEMPO..."
                               value={tiempo.nota || ''}
                               onChange={(e) => updateTiempo(mi, ti, (t) => ({ ...t, nota: e.target.value }))}
                               className="w-full bg-slate-50 p-3 text-[10px] font-bold resize-none min-h-[60px] outline-none uppercase tracking-tighter"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={() => updateMenu(mi, (m) => ({
                      ...m, tiempos: [...m.tiempos, { nombre: 'NUEVO TIEMPO', ingredientes: [], nota: '' }]
                    }))}
                    className="w-full py-6 border-2 border-dashed border-border/40 rounded-none text-[11px] font-black text-muted-foreground uppercase tracking-[0.3em] hover:border-foreground/30 hover:text-foreground hover:bg-foreground/5 transition-all duration-200"
                  >
                    + INSERTAR BLOQUE HORARIO
                  </button>
                </div>
              </div>
            ))}

            <button
               onClick={() => setMenus([...menus, emptyMenu(`Menú #${menus.length + 1}`)])}
               className="w-full py-8 bg-foreground text-background rounded-none text-[11px] font-black uppercase tracking-[0.3em] transition-all"
            >
              + GENERAR VARIANTE ALTERNATIVA
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
