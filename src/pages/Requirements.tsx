import { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Plus, Activity, Beaker, Calculator, ChevronDown, Trash2 } from 'lucide-react';
import api from '@/lib/api';
import { formatDecimal } from '@/lib/format';
import { useToast } from '@/hooks/use-toast';
import type { Paciente } from '@/types';

const GROUPS = [
  { id: 'verduras', name: 'Verduras', kcal: 0, prot: 0, lip: 0, hco: 0 },
  { id: 'frutas', name: 'Frutas', kcal: 60, prot: 0, lip: 0, hco: 15 },
  { id: 'cerealSinGr', name: 'Cereales s/ Grasa', kcal: 70, prot: 2, lip: 0, hco: 15 },
  { id: 'cerealConGr', name: 'Cereales c/ Grasa', kcal: 115, prot: 2, lip: 5, hco: 15 },
  { id: 'leguminosas', name: 'Leguminosas', kcal: 120, prot: 8, lip: 1, hco: 20 },
  { id: 'aoaMuyBajo', name: 'AOA Muy Bajo', kcal: 40, prot: 7, lip: 1, hco: 0 },
  { id: 'aoaBajo', name: 'AOA Bajo', kcal: 55, prot: 7, lip: 3, hco: 0 },
  { id: 'aoaModerado', name: 'AOA Moderado', kcal: 75, prot: 7, lip: 5, hco: 0 },
  { id: 'aoaAlto', name: 'AOA Alto', kcal: 100, prot: 7, lip: 8, hco: 0 },
  { id: 'lecheDesc', name: 'Leche Descremada', kcal: 95, prot: 9, lip: 2, hco: 12 },
  { id: 'lecheSemi', name: 'Leche Semidescr.', kcal: 110, prot: 9, lip: 4, hco: 12 },
  { id: 'lecheEntera', name: 'Leche Entera', kcal: 150, prot: 9, lip: 8, hco: 12 },
  { id: 'lecheAz', name: 'Leche c/ Azúcar', kcal: 200, prot: 9, lip: 5, hco: 30 },
  { id: 'grasaSinProt', name: 'Grasas s/ Prot.', kcal: 45, prot: 0, lip: 5, hco: 0 },
  { id: 'grasaConProt', name: 'Grasas c/ Prot.', kcal: 70, prot: 3, lip: 5, hco: 3 },
  { id: 'azSinGr', name: 'Azúcares s/ Grasa', kcal: 40, prot: 0, lip: 0, hco: 10 },
  { id: 'azConGr', name: 'Azúcares c/ Grasa', kcal: 85, prot: 0, lip: 5, hco: 10 },
];

const MEALS = ['Snack', 'Desayuno', 'Colación', 'Almuerzo', 'Pre-entreno', 'Cena'];

const Requirements = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [paciente, setPaciente] = useState<Paciente | null>(null);
  
  // Paso 1 State
  const [formula, setFormula] = useState('mifflin');
  const [actividad, setActividad] = useState('1.2');
  const [peso, setPeso] = useState('0');
  const [talla, setTalla] = useState('0');
  const [edad, setEdad] = useState(0);
  const [sexo, setSexo] = useState('M');
  
  // Paso 2 State
  const [macrosPct, setMacrosPct] = useState({ prot: 30, carb: 40, lip: 30 });
  
  // Paso 3 State
  const [equivs, setEquivs] = useState<Record<string, number>>(
    GROUPS.reduce((acc, curr) => ({ ...acc, [curr.id]: 0 }), {})
  );
  
  // Paso 4 State
  const [distribucion, setDistribucion] = useState<Record<string, Record<string, number>>>(
    GROUPS.reduce((acc, g) => ({
      ...acc,
      [g.id]: MEALS.reduce((ma, m) => ({ ...ma, [m]: 0 }), {})
    }), {})
  );

  useEffect(() => {
    api.get(`/api/pacientes/${id}`).then(res => {
      const p = res.data?.data || res.data;
      setPaciente(p);
      setPeso(p.ultimoPeso?.toString() || '0');
      setSexo(p.sexo || 'M');
      if (p.fechaNacimiento) {
        setEdad(Math.floor((Date.now() - new Date(p.fechaNacimiento).getTime()) / 31557600000));
      }
    });
  }, [id]);

  const energeticData = useMemo(() => {
    const w = parseFloat(peso) || 0;
    const h = (paciente?.valoraciones?.[0]?.talla || 1.75) * 100; // cm
    const a = edad || 25;
    
    let tmb = 0;
    if (formula === 'mifflin') {
      tmb = (10 * w) + (6.25 * h) - (5 * a) + (sexo === 'M' ? 5 : -161);
    } else if (formula === 'harris') {
      tmb = sexo === 'M' 
        ? 66.5 + (13.75 * w) + (5.003 * h) - (6.755 * a)
        : 655.1 + (9.563 * w) + (1.850 * h) - (4.676 * a);
    } else {
      // FAO simple range
      tmb = sexo === 'M' ? (15.3 * w) + 679 : (14.7 * w) + 496;
    }
    
    const get = tmb * parseFloat(actividad);
    const gct = get * 1.1; // ETA 10%
    
    return { tmb, get, gct };
  }, [formula, actividad, peso, edad, sexo, paciente]);

  const macroData = useMemo(() => {
    const totalKcal = energeticData.get;
    const pKcal = (totalKcal * macrosPct.prot) / 100;
    const cKcal = (totalKcal * macrosPct.carb) / 100;
    const lKcal = (totalKcal * macrosPct.lip) / 100;
    
    const w = parseFloat(peso) || 1;
    
    return {
      prot: { kcal: pKcal, g: pKcal / 4, gkg: (pKcal / 4) / w },
      carb: { kcal: cKcal, g: cKcal / 4, gkg: (cKcal / 4) / w },
      lip: { kcal: lKcal, g: lKcal / 9, gkg: (lKcal / 9) / w },
    };
  }, [energeticData.get, macrosPct, peso]);

  const equivTotals = useMemo(() => {
    return GROUPS.reduce((acc, g) => {
      const q = equivs[g.id] || 0;
      acc.kcal += q * g.kcal;
      acc.prot += q * g.prot;
      acc.lip += q * g.lip;
      acc.hco += q * g.hco;
      return acc;
    }, { kcal: 0, prot: 0, lip: 0, hco: 0 });
  }, [equivs]);

  const handleSave = async () => {
    try {
      const payload = {
        peso: parseFloat(peso),
        formula,
        actividad,
        tmb: energeticData.tmb,
        get: energeticData.get,
        gct: energeticData.gct,
        macros: macrosPct,
        macroCalculos: macroData,
        equivalentes: equivs,
        distribucionJson: JSON.stringify(distribucion)
      };
      await api.post(`/api/pacientes/${id}/requerimientos`, payload);
      toast({ title: 'Requerimientos Guardados' });
      navigate(`/pacientes/${id}`);
    } catch (err) {
      toast({ title: 'Error al guardar', variant: 'destructive' });
    }
  };

  if (!paciente) return <div className="p-20 text-center animate-pulse font-black uppercase tracking-widest">Iniciando Protocolo de Requerimientos...</div>;

  return (
    <div className="min-h-screen animate-fade-in pb-20 px-6 max-w-[1400px] mx-auto">
      <div className="space-y-8 pt-6">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 pb-6">
           <div className="space-y-2">
             <button onClick={() => navigate(`/pacientes/${id}`)} className="flex items-center gap-2 text-[14px] font-medium text-text-secondary hover:text-text-primary transition-colors w-fit group mb-4">
                <ArrowLeft className="w-[18px] h-[18px] group-hover:-translate-x-1 transition-transform" /> Volver al expediente
             </button>
             <h1 className="text-[26px] font-bold text-text-primary m-0 tracking-tight">Cálculo de Requerimientos</h1>
             <p className="text-text-secondary font-normal text-[14px] m-0">Ajuste técnico y macronutrientes</p>
           </div>
           <button onClick={handleSave} className="flex items-center gap-2 px-[18px] py-[10px] bg-brand-primary text-bg-base font-medium text-[14px] hover:bg-[#e0e0e0] rounded-[8px] transition-colors">
              <Save className="w-[18px] h-[18px]" /> Sincronizar Protocolo
           </button>
        </header>

        <div className="grid lg:grid-cols-2 gap-8">
          <div className="space-y-8">
            <section className="bg-bg-surface p-6 rounded-[12px] border border-border-subtle space-y-6 animate-slide-up">
              <h2 className="text-[16px] font-semibold text-text-primary flex items-center gap-2 m-0 border-b border-border-default pb-4">
                <Activity className="w-[18px] h-[18px] text-text-muted" /> Paso 1: Gasto Energético
              </h2>
              <div className="grid md:grid-cols-2 gap-6 pt-2">
                <div className="space-y-2">
                  <label className="text-[12px] font-medium text-text-secondary">Peso Control (kg)</label>
                  <input type="number" value={peso} onChange={e => setPeso(e.target.value)} className="w-full bg-bg-elevated rounded-[8px] px-4 py-3 text-[14px] font-semibold text-text-primary outline-none border border-border-subtle focus:border-[#444] transition-colors" />
                </div>
                <div className="space-y-2">
                  <label className="text-[12px] font-medium text-text-secondary">Fórmula Predictiva</label>
                  <select value={formula} onChange={e => setFormula(e.target.value)} className="w-full bg-bg-elevated rounded-[8px] px-4 py-3 text-[14px] font-normal text-text-primary outline-none border border-border-subtle focus:border-[#444] transition-colors appearance-none" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'%238a8a8a\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2\' d=\'M19 9l-7 7-7-7\' /%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem center', backgroundSize: '1rem' }}>
                    <option value="mifflin">Mifflin-St Jeor</option>
                    <option value="harris">Harris-Benedict</option>
                    <option value="fao">FAO-OMS</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[12px] font-medium text-text-secondary">Factor de Actividad</label>
                  <select value={actividad} onChange={e => setActividad(e.target.value)} className="w-full bg-bg-elevated rounded-[8px] px-4 py-3 text-[14px] font-normal text-text-primary outline-none border border-border-subtle focus:border-[#444] transition-colors appearance-none" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'%238a8a8a\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2\' d=\'M19 9l-7 7-7-7\' /%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem center', backgroundSize: '1rem' }}>
                    <option value="1.1">Sedentario (1.1)</option>
                    <option value="1.2">Leve (1.2)</option>
                    <option value="1.3">Moderado (1.3)</option>
                    <option value="1.4">Intenso (1.4)</option>
                    <option value="1.5">Elite (1.5)</option>
                  </select>
                </div>
                <div className="bg-bg-elevated border border-border-subtle rounded-[8px] p-4 flex flex-col justify-center">
                  <p className="text-[12px] font-medium text-text-secondary mb-1 m-0">GET Proyectado</p>
                  <p className="text-[24px] font-bold text-text-primary m-0">{Math.round(energeticData.get)} <span className="text-[14px] font-medium text-text-muted">Kcal</span></p>
                </div>
              </div>
            </section>

            <section className="bg-bg-surface p-6 rounded-[12px] border border-border-subtle space-y-6 animate-slide-up" style={{ animationDelay: '0.1s' }}>
              <h2 className="text-[16px] font-semibold text-text-primary flex items-center gap-2 m-0 border-b border-border-default pb-4">
                <Calculator className="w-[18px] h-[18px] text-text-muted" /> Paso 2: Distribución de Macros
              </h2>
              <div className="grid md:grid-cols-3 gap-6 pt-2">
                 {['prot', 'carb', 'lip'].map(m => (
                   <div key={m} className="space-y-2">
                      <label className="text-[12px] font-medium text-text-secondary">{m === 'lip' ? 'Lípidos %' : m === 'carb' ? 'Carbos %' : 'Proteínas %'}</label>
                      <input 
                        type="number" 
                        value={macrosPct[m as keyof typeof macrosPct]} 
                        onChange={e => setMacrosPct({...macrosPct, [m]: parseInt(e.target.value) || 0})}
                        className="w-full bg-bg-elevated rounded-[8px] px-4 py-3 text-[16px] font-semibold text-center text-text-primary outline-none border border-border-subtle focus:border-[#444] transition-colors"
                      />
                   </div>
                 ))}
              </div>
              <div className="grid grid-cols-3 gap-4 border border-border-subtle rounded-[8px] divide-x divide-border-subtle overflow-hidden">
                {Object.entries(macroData).map(([k, v]) => (
                  <div key={k} className="p-4 bg-bg-elevated flex flex-col items-center justify-center space-y-1">
                    <p className="text-[12px] font-medium text-text-muted m-0 uppercase">{k}</p>
                    <p className="text-[18px] font-bold text-text-primary m-0">{Math.round(v.g)}<span className="text-[12px] font-medium text-text-secondary ml-0.5">g</span></p>
                    <p className="text-[11px] font-normal text-text-muted m-0">{formatDecimal(v.gkg)} g/kg</p>
                  </div>
                ))}
              </div>
              <div className={`p-3 rounded-[8px] text-center text-[13px] font-medium border ${macrosPct.prot + macrosPct.carb + macrosPct.lip === 100 ? 'bg-[#1a2e1a] text-accent-green border-accent-green/20' : 'bg-[#2e1a1a] text-accent-red border-accent-red/20'}`}>
                Suma: {macrosPct.prot + macrosPct.carb + macrosPct.lip}% {macrosPct.prot + macrosPct.carb + macrosPct.lip !== 100 && '(Debe ser 100%)'}
              </div>
            </section>
          </div>

          <div className="space-y-8">
             <section className="bg-bg-surface p-6 rounded-[12px] border border-border-subtle space-y-6 animate-slide-up" style={{ animationDelay: '0.2s' }}>
                <h2 className="text-[16px] font-semibold text-text-primary flex items-center gap-2 m-0 border-b border-border-default pb-4">
                   <Beaker className="w-[18px] h-[18px] text-text-muted" /> Paso 3: Tabla de Equivalentes
                </h2>
                <div className="rounded-[8px] border border-border-subtle overflow-hidden relative">
                   <div className="max-h-[500px] overflow-y-auto custom-scrollbar">
                     <table className="w-full text-left">
                        <thead className="sticky top-0 bg-bg-elevated border-b border-border-subtle text-[12px] font-medium text-text-muted uppercase">
                          <tr>
                            <th className="px-4 py-3">Grupo</th>
                            <th className="px-4 py-3 text-center w-24">Eq.</th>
                            <th className="px-4 py-3 text-right">Kcal</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border-default bg-bg-surface">
                          {GROUPS.map(g => (
                            <tr key={g.id} className="hover:bg-bg-elevated transition-colors">
                              <td className="px-4 py-2 text-[13px] font-medium text-text-primary">{g.name}</td>
                              <td className="px-4 py-2">
                                <input 
                                  type="number" 
                                  value={equivs[g.id]} 
                                  onChange={e => setEquivs({...equivs, [g.id]: parseFloat(e.target.value) || 0})}
                                  className="w-full bg-bg-elevated border border-border-default rounded-[4px] px-2 py-1.5 text-center text-[13px] font-semibold text-text-primary outline-none focus:border-border-subtle"
                                />
                              </td>
                              <td className="px-4 py-2 text-right text-[13px] font-normal text-text-secondary">{(equivs[g.id] || 0) * g.kcal}</td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot className="bg-bg-elevated border-t border-border-subtle sticky bottom-0">
                          <tr>
                            <td className="px-4 py-3 text-[13px] font-semibold text-text-primary uppercase tracking-tight">Totales</td>
                            <td className="p-2"></td>
                            <td className="px-4 py-3 text-right text-[14px] font-bold text-brand-primary">{equivTotals.kcal}</td>
                          </tr>
                        </tfoot>
                     </table>
                   </div>
                </div>
                {equivTotals.kcal > 0 && (
                  <div className={`p-4 rounded-[8px] border flex items-center justify-between transition-colors ${Math.abs(equivTotals.kcal - energeticData.get) <= 100 ? 'bg-[#1a2e1a] border-accent-green/20 text-accent-green' : 'bg-[#332517] border-[#d97706]/20 text-[#fbbf24]'}`}>
                    <span className="text-[13px] font-medium">Diferencia Energética</span>
                    <span className="text-[16px] font-bold">{Math.round(equivTotals.kcal - energeticData.get)} kcal</span>
                  </div>
                )}
             </section>
          </div>
        </div>

        <section className="bg-bg-surface p-6 rounded-[12px] border border-border-subtle space-y-6 animate-slide-up" style={{ animationDelay: '0.3s' }}>
           <h2 className="text-[16px] font-semibold text-text-primary flex items-center gap-2 m-0 border-b border-border-default pb-4">
              <span className="font-bold flex items-center gap-2 m-0 text-text-primary"><Activity className="w-[18px] h-[18px] text-text-muted" /> Paso 4: Distribución por Tiempos</span>
           </h2>
           <div className="overflow-x-auto rounded-[8px] border border-border-subtle custom-scrollbar">
              <table className="w-full text-left min-w-[1000px] border-collapse bg-bg-surface">
                 <thead className="bg-bg-elevated border-b border-border-subtle text-[12px] font-medium text-text-muted uppercase">
                   <tr>
                     <th className="px-4 py-3">Grupo</th>
                     {MEALS.map(m => <th key={m} className="px-4 py-3 text-center">{m}</th>)}
                     <th className="px-4 py-3 text-right">Total</th>
                     <th className="px-4 py-3 text-right">Target</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-border-default">
                    {GROUPS.map(g => {
                      const rowTotal = Object.values(distribucion[g.id]).reduce((a, b) => a + b, 0);
                      const target = equivs[g.id] || 0;
                      return (
                        <tr key={g.id} className="hover:bg-bg-elevated transition-colors">
                          <td className="px-4 py-3 text-[13px] font-medium text-text-primary border-r border-border-default">{g.name}</td>
                          {MEALS.map(m => (
                            <td key={m} className="p-1.5 border-r border-border-default/50">
                              <input 
                                type="number" 
                                value={distribucion[g.id][m]} 
                                onChange={e => {
                                   const nd = {...distribucion};
                                   nd[g.id][m] = parseFloat(e.target.value) || 0;
                                   setDistribucion(nd);
                                }}
                                className="w-full h-8 flex items-center text-center text-[13px] font-semibold text-text-primary bg-transparent outline-none focus:bg-bg-base rounded-[4px] hover:bg-bg-base/50 transition-colors"
                              />
                            </td>
                          ))}
                          <td className={`px-4 py-3 text-right text-[13px] font-semibold ${rowTotal !== target && target > 0 ? 'text-accent-red' : 'text-text-primary'}`}>{rowTotal}</td>
                          <td className="px-4 py-3 text-right text-[13px] font-medium text-text-muted">{target}</td>
                        </tr>
                      )
                    })}
                 </tbody>
              </table>
           </div>
        </section>
      </div>
    </div>
  );
};

export default Requirements;
