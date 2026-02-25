import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, UserPlus, ClipboardList, Filter, ChevronRight, X } from 'lucide-react';
import api from '@/lib/api';
import { formatDate } from '@/lib/format';
import { useToast } from '@/hooks/use-toast';
import type { Plan, Paciente } from '@/types';

const Plans = () => {
  const [planesBase, setPlanesBase] = useState<Plan[]>([]);
  const [todosLosPlanes, setTodosLosPlanes] = useState<Plan[]>([]);
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [assigningPlan, setAssigningPlan] = useState<Plan | null>(null);
  const [selectedPatient, setSelectedPatient] = useState('');
  
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [baseRes, allRes, pacRes] = await Promise.all([
          api.get('/api/planes?tipo=base'),
          api.get('/api/planes?tipo=todos'),
          api.get('/api/pacientes')
        ]);
        setPlanesBase(baseRes.data?.data || baseRes.data || []);
        setTodosLosPlanes(allRes.data?.data || allRes.data || []);
        setPacientes(pacRes.data?.data || pacRes.data || []);
      } catch (err) {
        toast({ title: 'Error', description: 'No se pudieron cargar los planes', variant: 'destructive' });
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [toast]);

  const handleAssign = async () => {
    if (!assigningPlan || !selectedPatient) return;
    try {
      await api.post(`/api/planes/${assigningPlan.id}/asignar`, { pacienteId: selectedPatient });
      toast({ title: 'Plan asignado con éxito' });
      setAssigningPlan(null);
    } catch (err) {
      toast({ title: 'Error al asignar', variant: 'destructive' });
    }
  };

  const filteredPlanes = todosLosPlanes.filter(p => 
    p.nombre?.toLowerCase().includes(search.toLowerCase()) || 
    p.pacienteId?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div className="p-20 text-center animate-pulse font-black uppercase tracking-[0.5em] text-xs">Cargando Biblioteca de Protocolos...</div>;

  return (
    <div className="min-h-screen bg-white text-black p-6 md:p-10 space-y-12">
      <header className="flex justify-between items-end border-b-4 border-black pb-8">
        <div className="space-y-2">
           <h1 className="text-6xl font-black uppercase tracking-tighter">Biblioteca de Planes</h1>
           <p className="text-[10px] font-bold uppercase tracking-[0.4em] opacity-30">Gestión de Macros y Micro-nutrientes Maestro</p>
        </div>
        <button onClick={() => navigate('/pacientes/nuevo-plan-base')} className="px-8 py-3 bg-black text-white font-black text-xs uppercase tracking-widest border-2 border-black hover:bg-white hover:text-black transition-all">
          + NUEVO PLAN BASE
        </button>
      </header>

      <section className="space-y-6">
        <h2 className="text-xl font-black uppercase tracking-tight border-b-2 border-black pb-2">Planes Base / Plantillas</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
           {planesBase.map(p => (
             <PlanCard key={p.id} plan={p} onAssign={() => setAssigningPlan(p)} onOpen={() => navigate(`/planes/${p.id}`)} />
           ))}
           {planesBase.length === 0 && <p className="text-sm font-bold opacity-30 uppercase">No hay planes base registrados</p>}
        </div>
      </section>

      <section className="space-y-6">
        <div className="flex justify-between items-center border-b-2 border-black pb-2">
           <h2 className="text-xl font-black uppercase tracking-tight">Registro General de Planes</h2>
           <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 opacity-30" />
              <input 
                placeholder="BUSCAR PLAN..." 
                className="pl-10 pr-4 py-2 border-2 border-black text-xs font-bold outline-none uppercase"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
           </div>
        </div>
        <div className="w-full border-2 border-black overflow-hidden">
           <table className="w-full text-left">
              <thead className="bg-black text-white text-[10px] font-black uppercase">
                <tr>
                   <th className="p-4">Protocolo</th>
                   <th className="p-4">Tipo</th>
                   <th className="p-4">Calorías</th>
                   <th className="p-4">Fecha</th>
                   <th className="p-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/10">
                {filteredPlanes.map(p => (
                  <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                     <td className="p-4 font-black text-sm uppercase">{p.nombre || 'Plan Maestro'}</td>
                     <td className="p-4 text-xs font-bold uppercase">{p.tipo}</td>
                     <td className="p-4 text-sm font-black">{p.calorias} KCAL</td>
                     <td className="p-4 text-[10px] font-bold opacity-40">{formatDate(p.createdAt)}</td>
                     <td className="p-4 text-right">
                        <button onClick={() => navigate(`/pacientes/${p.pacienteId}/planes/${p.id}`)} className="text-[10px] font-black uppercase tracking-widest hover:underline">Abrir</button>
                     </td>
                  </tr>
                ))}
              </tbody>
           </table>
        </div>
      </section>

      {/* Modal Asignar */}
      {assigningPlan && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-6">
           <div className="bg-white border-4 border-black w-full max-w-md p-8 space-y-6 animate-slide-up">
              <div className="flex justify-between items-center">
                 <h3 className="text-2xl font-black uppercase tracking-tight">Asignar Protocolo</h3>
                 <button onClick={() => setAssigningPlan(null)}><X /></button>
              </div>
              <p className="text-xs font-bold opacity-40 uppercase">Selecciona al paciente para clonar el plan "{assigningPlan.nombre}"</p>
              <div className="space-y-4">
                 <select 
                   className="w-full border-2 border-black p-3 font-black text-sm outline-none bg-white"
                   value={selectedPatient}
                   onChange={e => setSelectedPatient(e.target.value)}
                 >
                    <option value="">SELECCIONAR PACIENTE...</option>
                    {pacientes.map(p => (
                      <option key={p.id} value={p.id}>{p.nombre} {p.apellido}</option>
                    ))}
                 </select>
                 <button 
                   onClick={handleAssign}
                   disabled={!selectedPatient}
                   className="w-full py-4 bg-black text-white font-black uppercase tracking-widest border-2 border-black hover:bg-white hover:text-black transition-all disabled:opacity-20"
                 >
                   CONFIRMAR ASIGNACIÓN
                 </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

const PlanCard = ({ plan, onAssign, onOpen }: { plan: Plan; onAssign: () => void; onOpen: () => void }) => (
  <div className="border-4 border-black p-6 space-y-4 relative group overflow-hidden">
     <div className="absolute top-0 right-0 p-2 opacity-5 translate-x-1 translate-y-[-0.5rem] group-hover:translate-x-0 transition-transform">
        <ClipboardList className="w-16 h-16" />
     </div>
     <h3 className="text-xl font-black uppercase leading-tight">{plan.nombre || 'Protocolo Base'}</h3>
     <div className="flex items-end justify-between border-t border-black/10 pt-4">
        <div>
           <p className="text-[8px] font-bold uppercase opacity-30">Valor Energético</p>
           <p className="text-lg font-black">{plan.calorias} kcal</p>
        </div>
        <div className="flex gap-2">
           <button onClick={onAssign} className="p-2 border border-black hover:bg-black hover:text-white transition-colors"><UserPlus className="w-4 h-4" /></button>
           <button onClick={onOpen} className="p-2 border border-black hover:bg-black hover:text-white transition-colors"><ChevronRight className="w-4 h-4" /></button>
        </div>
     </div>
  </div>
);

export default Plans;
