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
    <div className="min-h-screen bg-white text-black font-sans pb-20 p-6 md:p-10">
      <div className="max-w-none space-y-12">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b-4 border-black pb-8">
           <div className="space-y-4">
             <button onClick={() => navigate(`/pacientes/${id}`)} className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest opacity-40 hover:opacity-100 transition-all">
                <ArrowLeft className="w-4 h-4" /> Regresar al expediente
             </button>
             <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter leading-none">Cálculo de Requerimientos</h1>
           </div>
           <button onClick={handleSave} className="px-10 py-4 bg-black text-white font-black uppercase tracking-widest hover:bg-white hover:text-black border-2 border-black transition-all">Sincronizar Protocolo</button>
        </header>

        <div className="grid lg:grid-cols-2 gap-16">
          <div className="space-y-12">
            <section className="space-y-6">
              <h2 className="text-xs font-black uppercase tracking-widest bg-black text-white px-3 py-1 w-fit">Paso 1: Gasto Energético</h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase opacity-30">Peso Control (kg)</label>
                  <input type="number" value={peso} onChange={e => setPeso(e.target.value)} className="w-full border-2 border-black p-3 text-xl font-black outline-none focus:bg-black focus:text-white transition-all" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase opacity-30">Fórmula Predictiva</label>
                  <select value={formula} onChange={e => setFormula(e.target.value)} className="w-full border-2 border-black p-3 text-lg font-black outline-none bg-white">
                    <option value="mifflin">Mifflin-St Jeor</option>
                    <option value="harris">Harris-Benedict</option>
                    <option value="fao">FAO-OMS</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase opacity-30">Factor de Actividad</label>
                  <select value={actividad} onChange={e => setActividad(e.target.value)} className="w-full border-2 border-black p-3 text-lg font-black outline-none bg-white">
                    <option value="1.1">Sedentario (1.1)</option>
                    <option value="1.2">Leve (1.2)</option>
                    <option value="1.3">Moderado (1.3)</option>
                    <option value="1.4">Intenso (1.4)</option>
                    <option value="1.5">Elite (1.5)</option>
                  </select>
                </div>
                <div className="bg-black text-white p-6 flex flex-col justify-center">
                  <p className="text-[10px] font-bold uppercase opacity-50 mb-2">GET Proyectado</p>
                  <p className="text-4xl font-black">{Math.round(energeticData.get)} KCAL</p>
                </div>
              </div>
            </section>

            <section className="space-y-6">
              <h2 className="text-xs font-black uppercase tracking-widest bg-black text-white px-3 py-1 w-fit">Paso 2: Distribución de Macros</h2>
              <div className="grid md:grid-cols-3 gap-6">
                 {['prot', 'carb', 'lip'].map(m => (
                   <div key={m} className="space-y-2">
                      <label className="text-[10px] font-bold uppercase opacity-30">{m === 'lip' ? 'Lípidos %' : m === 'carb' ? 'Carbos %' : 'Proteínas %'}</label>
                      <input 
                        type="number" 
                        value={macrosPct[m as keyof typeof macrosPct]} 
                        onChange={e => setMacrosPct({...macrosPct, [m]: parseInt(e.target.value) || 0})}
                        className="w-full border-2 border-black p-3 text-xl font-black outline-none"
                      />
                   </div>
                 ))}
              </div>
              <div className="grid grid-cols-3 gap-4 border-2 border-black divide-x-2 divide-black">
                {Object.entries(macroData).map(([k, v]) => (
                  <div key={k} className="p-4 space-y-2">
                    <p className="text-[10px] font-black uppercase opacity-30">{k}</p>
                    <p className="text-lg font-black">{Math.round(v.g)}g</p>
                    <p className="text-[10px] font-bold">{formatDecimal(v.gkg)} g/kg</p>
                  </div>
                ))}
              </div>
              <div className={`p-2 text-center text-[10px] font-bold uppercase tracking-tighter ${macrosPct.prot + macrosPct.carb + macrosPct.lip === 100 ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
                Suma: {macrosPct.prot + macrosPct.carb + macrosPct.lip}% {macrosPct.prot + macrosPct.carb + macrosPct.lip !== 100 && '(Debe ser 100%)'}
              </div>
            </section>
          </div>

          <div className="space-y-12">
             <section className="space-y-6">
                <h2 className="text-xs font-black uppercase tracking-widest bg-black text-white px-3 py-1 w-fit">Paso 3: Tabla de Equivalentes</h2>
                <div className="border-2 border-black max-h-[500px] overflow-auto">
                   <table className="w-full text-left">
                      <thead className="sticky top-0 bg-black text-white text-[10px] font-black uppercase">
                        <tr>
                          <th className="p-3">Grupo</th>
                          <th className="p-3 text-center">Cant.</th>
                          <th className="p-3 text-right">Kcal</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-black/10">
                        {GROUPS.map(g => (
                          <tr key={g.id} className="hover:bg-slate-50 transition-colors">
                            <td className="p-3 text-[11px] font-bold uppercase">{g.name}</td>
                            <td className="p-2">
                              <input 
                                type="number" 
                                value={equivs[g.id]} 
                                onChange={e => setEquivs({...equivs, [g.id]: parseFloat(e.target.value) || 0})}
                                className="w-full border border-black/20 p-1 text-center font-black text-sm outline-none"
                              />
                            </td>
                            <td className="p-3 text-right font-black text-xs">{(equivs[g.id] || 0) * g.kcal}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-slate-100 font-black">
                        <tr>
                          <td className="p-4 text-xs uppercase">Totales</td>
                          <td className="p-2"></td>
                          <td className="p-4 text-right text-lg">{equivTotals.kcal}</td>
                        </tr>
                      </tfoot>
                   </table>
                </div>
                {equivTotals.kcal > 0 && (
                  <div className={`p-4 border-2 border-black flex items-center justify-between ${Math.abs(equivTotals.kcal - energeticData.get) <= 100 ? 'bg-emerald-500 text-white' : 'bg-amber-500 text-black'}`}>
                    <span className="text-[10px] font-black uppercase tracking-widest">Diferencia Energética</span>
                    <span className="text-xl font-black">{Math.round(equivTotals.kcal - energeticData.get)} KCAL</span>
                  </div>
                )}
             </section>
          </div>
        </div>

        <section className="space-y-6">
           <h2 className="text-xs font-black uppercase tracking-widest bg-black text-white px-3 py-1 w-fit">Paso 4: Distribución por Tiempos</h2>
           <div className="overflow-x-auto border-4 border-black">
              <table className="w-full text-left min-w-[1000px]">
                 <thead className="bg-black text-white text-[10px] font-black uppercase">
                   <tr>
                     <th className="p-4">Grupo</th>
                     {MEALS.map(m => <th key={m} className="p-4 text-center">{m}</th>)}
                     <th className="p-4 text-right">Total</th>
                     <th className="p-4 text-right">Target</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-black/10">
                    {GROUPS.map(g => {
                      const rowTotal = Object.values(distribucion[g.id]).reduce((a, b) => a + b, 0);
                      const target = equivs[g.id] || 0;
                      return (
                        <tr key={g.id} className="hover:bg-slate-50">
                          <td className="p-4 text-[10px] font-black uppercase border-r border-black">{g.name}</td>
                          {MEALS.map(m => (
                            <td key={m} className="p-2 border-r border-black/10">
                              <input 
                                type="number" 
                                value={distribucion[g.id][m]} 
                                onChange={e => {
                                   const nd = {...distribucion};
                                   nd[g.id][m] = parseFloat(e.target.value) || 0;
                                   setDistribucion(nd);
                                }}
                                className="w-full p-2 text-center font-black text-sm bg-transparent outline-none focus:bg-slate-200"
                              />
                            </td>
                          ))}
                          <td className={`p-4 text-right font-black ${rowTotal !== target && target > 0 ? 'text-red-500' : ''}`}>{rowTotal}</td>
                          <td className="p-4 text-right font-black opacity-30">{target}</td>
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
