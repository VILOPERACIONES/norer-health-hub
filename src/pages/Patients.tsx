import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, Filter, ChevronRight, UserPlus, ShieldCheck, Clock } from 'lucide-react';
import api from '@/lib/api';
import type { Paciente } from '@/types';
import { formatDate } from '@/lib/format';

const Patients = () => {
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPacientes = async () => {
      setLoading(true);
      try {
        const { data } = await api.get(`/api/pacientes${search ? `?buscar=${search}` : ''}`);
        const p = data?.data || data;
        if (Array.isArray(p)) setPacientes(p);
      } catch (err) {
        console.error('Error cargando pacientes:', err);
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(() => {
      fetchPacientes();
    }, 500);

    return () => clearTimeout(timer);
  }, [search]);

  const diasSinVisita = (fecha?: string) => {
    if (!fecha) return null;
    const cleanStr = fecha.includes('T') ? fecha.split('T')[0] + 'T12:00:00' : fecha;
    const diff = Math.floor((Date.now() - new Date(cleanStr).getTime()) / 86400000);
    return diff;
  };

  if (loading && pacientes.length === 0) return <div className="p-8 text-center text-[11px] font-black uppercase tracking-[0.4em] animate-pulse h-[60vh] flex items-center justify-center">Sincronizando Directorio de Pacientes...</div>;

  return (
    <div className="space-y-8 animate-fade-in pb-20 max-w-7xl mx-auto">
      {/* Header Estructural */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-b border-border/40 pb-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-black text-foreground tracking-tighter uppercase leading-none">Directorio Clínico</h1>
          <p className="text-[11px] font-black uppercase tracking-[0.3em] text-muted-foreground opacity-40 leading-none">
             EXPEDIENTES ACTIVOS: <span className="text-foreground/60">{pacientes.length}</span> · CICLO OPERATIVO {new Date().getFullYear()}
          </p>
        </div>
        <button
          onClick={() => navigate('/pacientes/nuevo')}
          className="flex items-center gap-3 bg-foreground text-background px-6 py-3 rounded-none text-[12px] font-black uppercase tracking-[0.1em] hover:opacity-90 transition-all shadow-sm"
        >
          <UserPlus className="h-4 w-4" /> NUEVO REGISTRO MAESTRO
        </button>
      </div>

      {/* Controles y Tabla */}
      <div className="bg-background border border-border/80 rounded-none overflow-hidden shadow-sm animate-slide-up">
        {/* Filtros */}
        <div className="flex flex-col lg:flex-row gap-6 items-center justify-between p-4 border-b border-border/40 bg-secondary/5">
          <div className="relative w-full lg:w-[400px]">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground opacity-30" />
            <input
              type="text"
              placeholder="BUSCAR EXPEDIENTE..."
              className="w-full bg-background border border-border/80 rounded-none pl-10 pr-4 py-2 text-[12px] font-black uppercase tracking-wider focus:border-foreground/40 transition-all outline-none placeholder:text-muted-foreground/20 shadow-sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Tabla Structured */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-border/40 text-left bg-secondary/10">
                <th className="px-6 py-4 text-[11px] font-black text-foreground uppercase tracking-[0.3em] leading-none opacity-40">Paciente</th>
                <th className="px-6 py-4 text-[11px] font-black text-foreground uppercase tracking-[0.3em] leading-none opacity-40">Última Revisión</th>
                <th className="px-6 py-4 text-right w-16"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/20">
              {pacientes.length === 0 ? (
                <tr>
                  <td colSpan={3} className="py-20 text-center text-muted-foreground text-[12px] font-black uppercase tracking-[0.3em] opacity-20">
                    No se localizaron registros
                  </td>
                </tr>
              ) : (
                pacientes.map((p, i) => {
                  const valArr = (p as any).valoraciones || [];
                  const lastVal = valArr.length > 0 
                     ? [...valArr].sort((a: any, b: any) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())[0] 
                     : null;
                  const ultimaVisitaReal = lastVal ? lastVal.fecha : null;
                  const patientId = p.id;
                  const sinVisita = diasSinVisita(ultimaVisitaReal);
                  return (
                    <tr 
                      key={patientId} 
                      className="group hover:bg-secondary/10 transition-all cursor-pointer"
                      onClick={() => navigate(`/pacientes/${patientId}`)}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-6">
                          <div className="w-10 h-10 rounded-none bg-foreground text-background flex items-center justify-center font-black text-xl">
                            {p.nombre[0]}
                          </div>
                          <div className="space-y-1">
                            <p className="text-base font-black text-foreground uppercase tracking-tighter leading-none">{p.nombre} {p.apellido}</p>
                            <p className="text-[11px] font-black text-muted-foreground tracking-[0.05em] leading-none opacity-40 uppercase font-mono">{p.telefono || 'SIN TELÉFONO'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                           <Clock className="h-4 w-4 text-muted-foreground opacity-20" />
                           <div className="space-y-1">
                              {ultimaVisitaReal ? (
                                <>
                                  <p className="text-[12px] font-black text-foreground uppercase tracking-tight leading-none">{formatDate(ultimaVisitaReal)}</p>
                                  {sinVisita !== null && sinVisita > 30 && (
                                    <p className="text-[10px] font-black text-destructive uppercase tracking-widest leading-none font-mono opacity-60">AUSENTE: {sinVisita}D</p>
                                  )}
                                </>
                              ) : (
                                <p className="text-[12px] font-black text-muted-foreground uppercase opacity-20 tracking-widest leading-none">SIN REGISTRO</p>
                              )}
                           </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="w-10 h-10 rounded-none border border-border/80 text-foreground group-hover:bg-foreground group-hover:text-background transition-all inline-flex items-center justify-center shadow-sm">
                           <ChevronRight className="h-4 w-4" />
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Patients;
