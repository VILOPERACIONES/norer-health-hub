import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, Save, GripVertical } from 'lucide-react';
import api from '@/lib/api';
import type { Menu, TiempoComida, Ingrediente } from '@/types';
import { formatDecimal } from '@/lib/format';
import { useToast } from '@/hooks/use-toast';

const defaultTiempos = ['Desayuno', 'Colación mañana', 'Almuerzo', 'Pre-entreno', 'Cena'];

const emptyMenu = (name: string): Menu => ({
  nombre: name,
  tiempos: defaultTiempos.map((t) => ({ nombre: t, ingredientes: [], nota: '' })),
});

const emptyIngrediente = (): Ingrediente => ({ descripcion: '', cantidad: 0, unidad: 'gr', equivalentes: '' });

const CreateEditPlan = () => {
  const { id: pacienteId, planId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const isEdit = !!planId;
  const [saving, setSaving] = useState(false);

  const [tipo, setTipo] = useState('Balanceada');
  const [calorias, setCalorias] = useState('1600');
  const [proteinas, setProteinas] = useState('30');
  const [carbohidratos, setCarbohidratos] = useState('45');
  const [grasas, setGrasas] = useState('25');
  const [proximaSesion, setProximaSesion] = useState('');
  const [proximaSesionHora, setProximaSesionHora] = useState('');
  const [notas, setNotas] = useState('');
  const [menus, setMenus] = useState<Menu[]>([emptyMenu('Menú #1'), emptyMenu('Menú #2')]);

  const pesoUltimo = 65.2; // From last assessment
  const cal = parseFloat(calorias) || 0;
  const pPct = parseFloat(proteinas) || 0;
  const cPct = parseFloat(carbohidratos) || 0;
  const gPct = parseFloat(grasas) || 0;
  const macroSum = pPct + cPct + gPct;

  const macroCalc = useMemo(() => ({
    pKcal: cal * pPct / 100, pGr: (cal * pPct / 100) / 4, pGrKg: ((cal * pPct / 100) / 4) / pesoUltimo,
    cKcal: cal * cPct / 100, cGr: (cal * cPct / 100) / 4, cGrKg: ((cal * cPct / 100) / 4) / pesoUltimo,
    gKcal: cal * gPct / 100, gGr: (cal * gPct / 100) / 9, gGrKg: ((cal * gPct / 100) / 9) / pesoUltimo,
  }), [cal, pPct, cPct, gPct]);

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
      toast({ title: 'Error', description: 'Los macronutrientes deben sumar 100%', variant: 'destructive' });
      return;
    }
    setSaving(true);
    const body = {
      tipo, calorias: cal,
      macros: { proteinas: pPct, carbohidratos: cPct, grasas: gPct },
      menus, proximaSesion, proximaSesionHora, notas,
    };
    try {
      if (isEdit) {
        await api.put(`/api/pacientes/${pacienteId}/planes/${planId}`, body);
      } else {
        await api.post(`/api/pacientes/${pacienteId}/planes`, body);
      }
      toast({ title: 'Plan guardado' });
      navigate(`/pacientes/${pacienteId}`);
    } catch (err: any) {
      toast({ title: 'Error', description: err.response?.data?.message || 'Error al guardar', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <button onClick={() => navigate(`/pacientes/${pacienteId}`)} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Volver
      </button>
      <h1 className="text-2xl font-bold text-foreground">{isEdit ? 'Editar plan' : 'Nuevo plan nutricional'}</h1>

      {/* Header */}
      <div className="norer-card">
        <h3 className="font-semibold text-foreground mb-4">Configuración del plan</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs text-muted-foreground mb-1">Tipo de plan</label>
            <select value={tipo} onChange={(e) => setTipo(e.target.value)} className="norer-input w-full">
              <option>Balanceada</option>
              <option>Keto</option>
              <option>Vegetariana</option>
              <option>Personalizada</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-muted-foreground mb-1">Calorías totales</label>
            <input type="number" value={calorias} onChange={(e) => setCalorias(e.target.value)} className="norer-input w-full" />
          </div>
          <div>
            <label className="block text-xs text-muted-foreground mb-1">Próxima sesión</label>
            <input type="date" value={proximaSesion} onChange={(e) => setProximaSesion(e.target.value)} className="norer-input w-full" />
          </div>
          <div>
            <label className="block text-xs text-muted-foreground mb-1">Hora</label>
            <input type="time" value={proximaSesionHora} onChange={(e) => setProximaSesionHora(e.target.value)} className="norer-input w-full" />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 mt-4">
          <div>
            <label className="block text-xs text-muted-foreground mb-1">Proteínas %</label>
            <input type="number" value={proteinas} onChange={(e) => setProteinas(e.target.value)} className="norer-input w-full" />
          </div>
          <div>
            <label className="block text-xs text-muted-foreground mb-1">Carbohidratos %</label>
            <input type="number" value={carbohidratos} onChange={(e) => setCarbohidratos(e.target.value)} className="norer-input w-full" />
          </div>
          <div>
            <label className="block text-xs text-muted-foreground mb-1">Grasas %</label>
            <input type="number" value={grasas} onChange={(e) => setGrasas(e.target.value)} className="norer-input w-full" />
          </div>
        </div>
        {macroSum !== 100 && (
          <p className="text-xs text-destructive mt-2">Los macros suman {macroSum}% — deben sumar 100%</p>
        )}

        {cal > 0 && macroSum === 100 && (
          <div className="mt-4 bg-muted rounded-lg p-4">
            <p className="text-xs font-semibold text-muted-foreground mb-2">Distribución calculada</p>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Proteínas</p>
                <p className="text-foreground font-medium">{formatDecimal(macroCalc.pKcal)} kcal · {formatDecimal(macroCalc.pGr)} gr · {formatDecimal(macroCalc.pGrKg)} gr/kg</p>
              </div>
              <div>
                <p className="text-muted-foreground">Carbohidratos</p>
                <p className="text-foreground font-medium">{formatDecimal(macroCalc.cKcal)} kcal · {formatDecimal(macroCalc.cGr)} gr · {formatDecimal(macroCalc.cGrKg)} gr/kg</p>
              </div>
              <div>
                <p className="text-muted-foreground">Grasas</p>
                <p className="text-foreground font-medium">{formatDecimal(macroCalc.gKcal)} kcal · {formatDecimal(macroCalc.gGr)} gr · {formatDecimal(macroCalc.gGrKg)} gr/kg</p>
              </div>
            </div>
          </div>
        )}

        <div className="mt-4">
          <label className="block text-xs text-muted-foreground mb-1">Notas generales</label>
          <textarea value={notas} onChange={(e) => setNotas(e.target.value)} className="norer-input w-full min-h-[60px] resize-y" />
        </div>
      </div>

      {/* Menus */}
      <div className="grid md:grid-cols-2 gap-4">
        {menus.map((menu, mi) => (
          <div key={mi} className="norer-card">
            <input
              value={menu.nombre}
              onChange={(e) => updateMenu(mi, (m) => ({ ...m, nombre: e.target.value }))}
              className="text-lg font-semibold text-foreground bg-transparent border-none outline-none w-full mb-4"
            />

            <div className="space-y-4">
              {menu.tiempos.map((tiempo, ti) => (
                <div key={ti} className="border border-border rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <input
                      value={tiempo.nombre}
                      onChange={(e) => updateTiempo(mi, ti, (t) => ({ ...t, nombre: e.target.value }))}
                      className="text-sm font-semibold text-primary bg-transparent border-none outline-none uppercase tracking-wide"
                    />
                    <button
                      onClick={() => updateMenu(mi, (m) => ({ ...m, tiempos: m.tiempos.filter((_, i) => i !== ti) }))}
                      className="text-destructive/60 hover:text-destructive p-1"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  {tiempo.ingredientes.map((ing, ii) => (
                    <div key={ii} className="flex gap-2 mb-1.5">
                      <input
                        placeholder="Descripción"
                        value={ing.descripcion}
                        onChange={(e) => updateTiempo(mi, ti, (t) => ({
                          ...t, ingredientes: t.ingredientes.map((x, i) => i === ii ? { ...x, descripcion: e.target.value } : x)
                        }))}
                        className="norer-input flex-1 text-xs py-1.5"
                      />
                      <input
                        type="number"
                        placeholder="Cant"
                        value={ing.cantidad || ''}
                        onChange={(e) => updateTiempo(mi, ti, (t) => ({
                          ...t, ingredientes: t.ingredientes.map((x, i) => i === ii ? { ...x, cantidad: parseFloat(e.target.value) || 0 } : x)
                        }))}
                        className="norer-input w-16 text-xs py-1.5"
                      />
                      <input
                        placeholder="Unid"
                        value={ing.unidad}
                        onChange={(e) => updateTiempo(mi, ti, (t) => ({
                          ...t, ingredientes: t.ingredientes.map((x, i) => i === ii ? { ...x, unidad: e.target.value } : x)
                        }))}
                        className="norer-input w-14 text-xs py-1.5"
                      />
                      <input
                        placeholder="Equiv"
                        value={ing.equivalentes || ''}
                        onChange={(e) => updateTiempo(mi, ti, (t) => ({
                          ...t, ingredientes: t.ingredientes.map((x, i) => i === ii ? { ...x, equivalentes: e.target.value } : x)
                        }))}
                        className="norer-input w-24 text-xs py-1.5"
                      />
                      <button
                        onClick={() => updateTiempo(mi, ti, (t) => ({ ...t, ingredientes: t.ingredientes.filter((_, i) => i !== ii) }))}
                        className="text-destructive/60 hover:text-destructive p-1"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  ))}

                  <button
                    onClick={() => updateTiempo(mi, ti, (t) => ({ ...t, ingredientes: [...t.ingredientes, emptyIngrediente()] }))}
                    className="flex items-center gap-1 text-xs text-primary hover:text-accent font-medium mt-1"
                  >
                    <Plus className="h-3 w-3" /> Ingrediente
                  </button>

                  <div className="mt-2">
                    <input
                      placeholder="Nota de pie..."
                      value={tiempo.nota || ''}
                      onChange={(e) => updateTiempo(mi, ti, (t) => ({ ...t, nota: e.target.value }))}
                      className="norer-input w-full text-xs py-1.5 italic"
                    />
                  </div>
                </div>
              ))}

              <button
                onClick={() => updateMenu(mi, (m) => ({
                  ...m, tiempos: [...m.tiempos, { nombre: 'Nuevo tiempo', ingredientes: [], nota: '' }]
                }))}
                className="flex items-center gap-1 text-xs text-primary hover:text-accent font-medium"
              >
                <Plus className="h-3.5 w-3.5" /> Agregar tiempo
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-accent transition-colors disabled:opacity-50"
        >
          <Save className="h-4 w-4" /> {saving ? 'Guardando...' : 'Guardar plan'}
        </button>
      </div>
    </div>
  );
};

export default CreateEditPlan;
