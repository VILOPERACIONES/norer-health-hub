import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, UserPlus, ClipboardList, ChevronRight, X, Trash2, Edit3, Calendar, Flame } from 'lucide-react';
import api from '@/lib/api';
import { formatDate } from '@/lib/format';
import { useToast } from '@/hooks/use-toast';
import type { Plan, Paciente } from '@/types';

const Plans = () => {
  const [planesBase, setPlanesBase] = useState<Plan[]>([]);
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [assigningPlan, setAssigningPlan] = useState<Plan | null>(null);
  const [selectedPatient, setSelectedPatient] = useState('');
  
  const navigate = useNavigate();
  const { toast } = useToast();

  const fetchData = async () => {
    setLoading(true);
    try {
      const [baseRes, pacRes] = await Promise.all([
        api.get('/api/planes?tipo=base'),
        api.get('/api/pacientes')
      ]);
      const data = baseRes.data?.data || baseRes.data || [];
      setPlanesBase(data);
      setPacientes(pacRes.data?.data || pacRes.data || []);
    } catch (err) {
      toast({ title: 'Error', description: 'No se pudieron cargar los planes', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [toast]);

  const handleAssign = async () => {
    if (!assigningPlan || !selectedPatient) return;
    try {
      const { data } = await api.post(`/api/planes/${assigningPlan.id}/asignar`, { pacienteId: selectedPatient });
      const newPlan = data?.data || data;
      toast({ title: 'Plan asignado con éxito. Redirigiendo a personalización...' });
      setAssigningPlan(null);
      if (newPlan?.id) {
        navigate(`/pacientes/${selectedPatient}/planes/${newPlan.id}/editar`);
      }
    } catch (err) {
      toast({ title: 'Error al asignar', variant: 'destructive' });
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!window.confirm('¿ELIMINAR ESTA PLANTILLA PERMANENTEMENTE?')) return;
    try {
      await api.delete(`/api/planes/${id}`);
      toast({ title: 'PLANTILLA ELIMINADA' });
      fetchData();
    } catch (err) {
      toast({ title: 'Error al eliminar', variant: 'destructive' });
    }
  };
  const filteredPlanes = planesBase.filter(p => 
    p.nombre?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return (
    <div className="h-[80vh] flex flex-col items-center justify-center gap-6 animate-pulse text-black">
      <div className="w-12 h-12 border-2 border-black/10 border-t-black rounded-full animate-spin" />
      <p className="text-[10px] font-medium uppercase tracking-[0.3em] opacity-40">Cargando Biblioteca...</p>
    </div>
  );
  return (
    <div className="min-h-screen text-black animate-fade-in pb-12">
      <div className="w-full space-y-12">
        
        {/* Header Minimalista */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 border-b border-black/5 pb-10">
          <div className="space-y-2">
            <h1 className="text-4xl font-light tracking-tight text-slate-900">Biblioteca de <span className="font-semibold">Plantillas</span></h1>
            <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-slate-400">Gestión de protocolos base para el catálogo maestro</p>
          </div>
          <button 
            onClick={() => navigate('/planes/nuevo')} 
            className="px-6 py-4 bg-black text-white text-[11px] font-bold uppercase tracking-widest hover:bg-slate-800 transition-all rounded-none flex items-center gap-2 shadow-2xl active:scale-95"
          >
            <Plus className="h-4 w-4" /> Nuevo Protocolo
          </button>
        </header>

        <section className="space-y-8 animate-slide-up">
          {/* Barra de Búsqueda Minimalista */}
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="relative w-full md:w-96 group">
              <Search className="absolute left-0 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-black transition-colors" />
              <input 
                placeholder="BUSCAR PLANTILLA..." 
                className="w-full pl-8 pr-4 py-3 bg-transparent border-b border-black/10 focus:border-black outline-none text-[10px] font-bold tracking-[0.2em] transition-all uppercase placeholder:text-slate-300"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <div className="text-[9px] font-black text-slate-300 uppercase tracking-[0.3em]">
              Registros / {filteredPlanes.length} Protocolos
            </div>
          </div>

          {/* Tabla de Plantillas Full Width */}
          <div className="bg-white border border-black/5 shadow-none overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="bg-slate-50 border-b border-black/5">
                  <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Plan de alimentación</th>
                  <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Energía</th>
                  <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Enfoque estratégico</th>
                  <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Fecha de Creación</th>
                  <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/[0.03]">
                {filteredPlanes.map(p => (
                  <tr key={p.id} className="hover:bg-slate-50 transition-all group">
                    <td className="px-10 py-8">
                      <div className="flex flex-col">
                        <span className="text-sm font-black text-slate-800 group-hover:text-black transition-colors uppercase tracking-tight">{p.nombre || 'Plan sin nombre'}</span>
                      </div>
                    </td>
                    <td className="px-10 py-8">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-black rounded-full animate-pulse" />
                        <span className="text-base font-black text-slate-900 tracking-tighter">{p.calorias} <span className="text-[10px] font-black text-black uppercase tracking-normal">KCAL</span></span>
                      </div>
                    </td>
                    <td className="px-10 py-8">
                      <span className="px-3 py-1 bg-black text-white text-[9px] font-black uppercase tracking-widest italic">
                        {p.tipo || 'Base'}
                      </span>
                    </td>
                    <td className="px-10 py-8 text-[11px] font-black text-slate-400 uppercase tracking-widest">
                      {formatDate(p.fechaCreacion || p.createdAt)}
                    </td>
                    <td className="px-10 py-8 text-right">
                      <div className="flex justify-end items-center gap-4">
                        <button 
                          onClick={() => setAssigningPlan(p)}
                          className="p-3 text-slate-400 hover:text-emerald-500 hover:bg-emerald-500/5 transition-all outline-none border border-transparent hover:border-emerald-500/10"
                          title="Desplegar a Paciente"
                        >
                          <UserPlus className="w-5 h-5" />
                        </button>
                        <button 
                          onClick={() => navigate(`/planes/${p.id}/editar`)}
                          className="p-3 text-slate-400 hover:text-black hover:bg-black/5 transition-all outline-none border border-transparent hover:border-black/5"
                          title="Editar Protocolo"
                        >
                          <Edit3 className="w-5 h-5" />
                        </button>
                        <button 
                          onClick={(e) => handleDelete(e, p.id)}
                          className="p-3 text-slate-400 hover:text-red-500 hover:bg-red-500/5 transition-all outline-none border border-transparent hover:border-red-500/10"
                          title="Eliminar del Registro"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {/* Modal Asignar Minimalista */}
      {assigningPlan && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-6 animate-fade-in shadow-2xl">
          <div className="bg-white w-full max-w-lg rounded-xl overflow-hidden shadow-2xl animate-slide-up border border-black/5">
            <div className="p-8 border-b border-black/5 flex justify-between items-center bg-slate-50/50">
              <div className="space-y-1">
                <h3 className="text-xl font-bold tracking-tight">Asignar Protocolo</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Configuración de despliegue para paciente</p>
              </div>
              <button 
                onClick={() => setAssigningPlan(null)}
                className="p-2 hover:bg-slate-200 transition-colors rounded-full"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            
            <div className="p-8 space-y-8">
              <div className="p-4 bg-slate-50 rounded-lg border border-black/5 flex items-center gap-4">
                <div className="h-10 w-10 bg-black text-white flex items-center justify-center font-bold rounded-md">P</div>
                <div>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Plantilla Seleccionada</p>
                  <p className="text-sm font-bold text-slate-700 uppercase italic">"{assigningPlan.nombre}"</p>
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Paciente Destino</label>
                <select 
                  className="w-full bg-slate-50 border border-black/10 p-4 font-bold text-sm outline-none focus:border-black focus:ring-1 focus:ring-black rounded-lg transition-all appearance-none cursor-pointer"
                  style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'currentColor\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2\' d=\'M19 9l-7 7-7-7\' /%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem center', backgroundSize: '1rem' }}
                  value={selectedPatient}
                  onChange={e => setSelectedPatient(e.target.value)}
                >
                  <option value="">SELECCIONAR DE EXPEDIENTES...</option>
                  {pacientes.map(p => (
                    <option key={p.id} value={p.id}>{p.nombre} {p.apellido}</option>
                  ))}
                </select>
              </div>

              <button 
                onClick={handleAssign}
                disabled={!selectedPatient}
                className="w-full py-4 bg-black text-white font-bold text-[11px] uppercase tracking-[0.2em] hover:bg-slate-800 transition-all disabled:opacity-30 disabled:cursor-not-allowed rounded-lg shadow-lg flex items-center justify-center gap-2 group"
              >
                <span>Confirmar y Personalizar</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Plans;
