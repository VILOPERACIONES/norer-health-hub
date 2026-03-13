import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Trash2, Edit3 } from 'lucide-react';
import api from '@/lib/api';
import { formatDate } from '@/lib/format';
import { useToast } from '@/hooks/use-toast';
import type { Plan } from '@/types';

const Plans = () => {
  const [planesBase, setPlanesBase] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  const navigate = useNavigate();
  const { toast } = useToast();

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/api/planes?tipo=base');
      setPlanesBase(data?.data || data || []);
    } catch (err) {
      toast({ title: 'Error', description: 'No se pudieron cargar los planes', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [toast]);

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
    <div className="flex flex-col items-center justify-center gap-4 h-[calc(100vh-120px)]">
      <div className="w-8 h-8 border-[3px] border-white/20 border-t-white rounded-full animate-spin" />
      <p className="text-[14px] text-[#8a8a8a]">Cargando plantillas...</p>
    </div>
  );

  return (
    <div className="min-h-screen text-text-primary animate-fade-in pb-12">
      <div className="w-full space-y-8">
        
        {/* Header */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 pt-4">
          <div>
            <h1 className="text-[26px] font-bold text-text-primary m-0">Biblioteca de Menús</h1>
            <p className="text-[14px] font-normal text-text-secondary mt-1">Gestión de menús base</p>
          </div>
          <button 
            onClick={() => navigate('/planes/nuevo')} 
            className="flex items-center gap-2 bg-white text-black rounded-[8px] px-[18px] py-[10px] text-[14px] font-bold transition-all hover:bg-white/90 uppercase"
          >
            <Plus className="h-[18px] w-[18px]" /> Nuevo Menú
          </button>
        </header>

        <section className="bg-bg-surface p-6 rounded-[12px] border border-border-subtle shadow-none space-y-6 animate-slide-up">
          {/* Barra de Búsqueda */}
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="relative w-full md:w-[450px]">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-text-muted" />
              <input 
                placeholder="Buscar menú..." 
                className="w-full bg-bg-elevated border border-border-subtle rounded-[8px] pl-12 pr-4 py-[10px] text-[14px] font-normal text-text-primary outline-none focus:border-[#444] transition-all placeholder:text-text-muted"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <div className="text-[14px] font-medium text-text-secondary">
              {filteredPlanes.length} Menús
            </div>
          </div>

          {/* Tabla de Plantillas Full Width */}
          <div className="overflow-x-auto rounded-[8px] border border-border-subtle bg-bg-surface">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-border-subtle text-left bg-bg-surface">
                  <th className="px-6 py-4 text-[12px] font-medium text-text-muted uppercase">Nombre del Menú</th>
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
                      <p className="text-[14px] text-text-secondary">No se encontraron menús</p>
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
                        <p className="text-[14px] font-normal text-text-secondary m-0">{formatDate(p.fechaCreacion)}</p>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end items-center gap-2">
                          <button 
                            onClick={() => navigate(`/planes/${p.id}/editar`)}
                            className="p-2 text-text-secondary hover:text-text-primary hover:bg-bg-muted rounded-[8px] transition-colors"
                            title="Editar Plan"
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
    </div>
  );
};

export default Plans;
