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
    <div className="h-[80vh] flex flex-col items-center justify-center gap-6 animate-pulse">
      <div className="w-8 h-8 rounded-full border-2 border-border-subtle border-t-text-primary animate-spin" />
      <p className="text-[14px] font-medium text-text-muted">Cargando plantillas...</p>
    </div>
  );

  return (
    <div className="min-h-screen text-text-primary animate-fade-in pb-12 px-6">
      <div className="w-full space-y-8">
        
        {/* Header */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 pt-4">
          <div>
            <h1 className="text-[26px] font-bold text-text-primary m-0">Biblioteca de Plantillas</h1>
            <p className="text-[14px] font-normal text-text-secondary mt-1">Gestión de planes base y protocolos</p>
          </div>
          <button 
            onClick={() => navigate('/planes/nuevo')} 
            className="flex items-center gap-2 bg-transparent border border-border-default text-text-primary rounded-[8px] px-[18px] py-[10px] text-[14px] font-medium transition-colors hover:bg-bg-elevated"
          >
            <Plus className="h-[18px] w-[18px] text-text-secondary" /> Nuevo Protocolo
          </button>
        </header>

        <section className="bg-bg-surface p-6 rounded-[12px] border border-border-subtle shadow-none space-y-6 animate-slide-up">
          {/* Barra de Búsqueda */}
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="relative w-full md:w-[450px]">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-text-muted" />
              <input 
                placeholder="Buscar plantilla..." 
                className="w-full bg-bg-elevated border border-border-subtle rounded-[8px] pl-12 pr-4 py-[10px] text-[14px] font-normal text-text-primary outline-none focus:border-[#444] transition-all placeholder:text-text-muted"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <div className="text-[14px] font-medium text-text-secondary">
              {filteredPlanes.length} Protocolos
            </div>
          </div>

          {/* Tabla de Plantillas Full Width */}
          <div className="overflow-x-auto rounded-[8px] border border-border-subtle bg-bg-surface">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-border-subtle text-left bg-bg-surface">
                  <th className="px-6 py-4 text-[12px] font-medium text-text-muted uppercase">Plan de alimentación</th>
                  <th className="px-6 py-4 text-[12px] font-medium text-text-muted uppercase">Energía</th>
                  <th className="px-6 py-4 text-[12px] font-medium text-text-muted uppercase">Enfoque estratégico</th>
                  <th className="px-6 py-4 text-[12px] font-medium text-text-muted uppercase">Fecha de Creación</th>
                  <th className="px-6 py-4 text-[12px] font-medium text-text-muted uppercase text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {filteredPlanes.length === 0 ? (
                   <tr>
                    <td colSpan={5} className="py-20 text-center">
                      <p className="text-[14px] text-text-secondary">No se encontraron plantillas</p>
                    </td>
                  </tr>
                ) : (
                  filteredPlanes.map(p => (
                    <tr key={p.id} className="hover:bg-bg-elevated transition-colors group">
                      <td className="px-6 py-4">
                        <p className="text-[14px] font-medium text-text-primary m-0">{p.nombre || 'Plan sin nombre'}</p>
                      </td>
                      <td className="px-6 py-4">
                         <p className="text-[14px] font-normal text-text-primary m-0">{p.calorias} <span className="text-text-secondary">KCAL</span></p>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-3 py-1 bg-bg-elevated text-text-primary text-[12px] font-medium rounded-full border border-border-default">
                          {p.tipo || 'Base'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-[14px] font-normal text-text-secondary m-0">{formatDate(p.fechaCreacion || p.createdAt)}</p>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end items-center gap-2">
                          <button 
                            onClick={() => setAssigningPlan(p)}
                            className="p-2 text-text-secondary hover:text-accent-green hover:bg-[#1a2e1a] rounded-[8px] transition-colors"
                            title="Desplegar a Paciente"
                          >
                            <UserPlus className="w-[18px] h-[18px]" />
                          </button>
                          <button 
                            onClick={() => navigate(`/planes/${p.id}/editar`)}
                            className="p-2 text-text-secondary hover:text-text-primary hover:bg-bg-muted rounded-[8px] transition-colors"
                            title="Editar Protocolo"
                          >
                            <Edit3 className="w-[18px] h-[18px]" />
                          </button>
                          <button 
                            onClick={(e) => handleDelete(e, p.id)}
                            className="p-2 text-text-secondary hover:text-accent-red hover:bg-[#2e1a1a] rounded-[8px] transition-colors"
                            title="Eliminar del Registro"
                          >
                            <Trash2 className="w-[18px] h-[18px]" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {/* Modal Asignar */}
      {assigningPlan && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6 animate-fade-in shadow-none">
          <div className="bg-bg-surface w-full max-w-lg rounded-[12px] overflow-hidden animate-slide-up border border-border-subtle">
            <div className="p-6 border-b border-border-subtle flex justify-between items-start">
              <div>
                <h3 className="text-[18px] font-semibold text-text-primary m-0">Asignar Protocolo</h3>
                <p className="text-[14px] font-normal text-text-secondary mt-1">Selecciona al paciente destino</p>
              </div>
              <button 
                onClick={() => setAssigningPlan(null)}
                className="p-2 hover:bg-bg-elevated transition-colors rounded-[8px] text-text-secondary hover:text-text-primary"
              >
                <X className="w-[18px] h-[18px]" />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="p-4 bg-bg-elevated rounded-[8px] border border-border-subtle flex items-center gap-4">
                <div className="h-10 w-10 bg-bg-base border border-border-default text-text-primary flex items-center justify-center font-bold rounded-full">
                  <ClipboardList className="w-5 h-5 text-text-secondary" />
                </div>
                <div>
                  <p className="text-[12px] font-medium text-text-muted m-0">Plantilla Seleccionada</p>
                  <p className="text-[14px] font-semibold text-text-primary m-0">{assigningPlan.nombre}</p>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[12px] font-medium text-text-secondary">Paciente Destino</label>
                <select 
                  className="w-full bg-bg-elevated border border-border-subtle p-3 text-[14px] text-text-primary font-normal outline-none focus:border-[#444] rounded-[8px] transition-all appearance-none cursor-pointer"
                  style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'%238a8a8a\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2\' d=\'M19 9l-7 7-7-7\' /%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem center', backgroundSize: '1rem' }}
                  value={selectedPatient}
                  onChange={e => setSelectedPatient(e.target.value)}
                >
                  <option value="" className="text-text-muted">Seleccionar de expedientes...</option>
                  {pacientes.map(p => (
                    <option key={p.id} value={p.id}>{p.nombre} {p.apellido}</option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end pt-4">
                <button 
                  onClick={handleAssign}
                  disabled={!selectedPatient}
                  className="w-full bg-brand-primary text-bg-base font-medium text-[14px] px-[18px] py-[10px] hover:bg-[#e0e0e0] transition-colors disabled:opacity-50 disabled:cursor-not-allowed rounded-[8px] flex items-center justify-center gap-2"
                >
                  Confirmar asignación
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Plans;
