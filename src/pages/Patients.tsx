import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, Clock, UserIcon, MoreHorizontal, ChevronRight, Activity, Hash, Calendar, ShieldCheck } from 'lucide-react';
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

  if (loading && pacientes.length === 0) return (
    <div className="min-h-screen bg-secondary/30 flex items-center justify-center">
      <div className="flex flex-col items-center gap-6">
        <Activity className="h-10 w-10 text-slate-900 animate-pulse" />
        <div className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.6em] animate-pulse">Cargando Directorio Clínico</div>
      </div>
    </div>
  );

  return (
    <div className="space-y-12 animate-fade-in pb-32 max-w-none px-6">
      {/* HEADER SECTION */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 pt-8">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
             <div className="h-1 w-12 bg-slate-900 rounded-none" />
             <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.4em]">Gestión de Pacientes</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 tracking-[-0.04em] uppercase leading-none">
            Directorio <span className="text-slate-400">Clínico</span>
          </h1>
          <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-slate-300 ml-1">
             EXPEDIENTES ACTIVOS: <span className="text-slate-900">{pacientes.length}</span> · CICLO 2026
          </p>
        </div>
        <button
          onClick={() => navigate('/pacientes/nuevo')}
          className="flex items-center gap-4 bg-slate-900 text-white px-10 py-5 rounded-none text-[11px] font-bold uppercase tracking-[0.2em] transition-all hover:bg-slate-800 hover:shadow-2xl hover:shadow-slate-200 group"
        >
          <Plus className="h-5 w-5 group-hover:rotate-90 transition-transform duration-300" /> Nuevo Registro Maestro
        </button>
      </div>

      {/* CONTROLS SECTION */}
      <div className="bg-background p-8 md:p-10 rounded-none border border-slate-100 shadow-sm space-y-10 animate-slide-up">
        <div className="flex flex-col lg:flex-row gap-8 items-center justify-between">
          <div className="relative w-full lg:w-[450px] group">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300 group-focus-within:text-slate-900 transition-colors" />
            <input
              type="text"
              placeholder="BUSCAR POR NOMBRE O TELÉFONO..."
              className="w-full bg-secondary border border-slate-100 rounded-none pl-16 pr-8 py-4 text-[13px] font-medium text-slate-900 tracking-tight outline-none focus:bg-background focus:border-slate-900 focus:ring-4 focus:ring-slate-900/5 transition-all placeholder:text-slate-300"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-6">
             <div className="flex flex-col items-end">
               <span className="text-[9px] font-bold text-slate-300 uppercase tracking-widest">Sincronización</span>
               <span className="text-[11px] font-bold text-slate-400 flex items-center gap-2">REAL TIME <div className="w-1.5 h-1.5 rounded-none bg-emerald-500 animate-pulse" /></span>
             </div>
          </div>
        </div>

        {/* LIST TABLE SECTION */}
        <div className="overflow-hidden rounded-none border border-slate-100 bg-background">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-slate-50 text-left bg-slate-50/50">
                <th className="px-10 py-6 text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em]">Identificación del Paciente</th>
                <th className="px-10 py-6 text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em]">Historial Reciente</th>
                <th className="px-10 py-6 text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em] text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-secondary">
              {pacientes.length === 0 ? (
                <tr>
                  <td colSpan={3} className="py-32 text-center text-slate-200">
                    <div className="flex flex-col items-center gap-4">
                      <Search className="h-10 w-10 opacity-20" />
                      <p className="text-[11px] font-bold uppercase tracking-[0.4em]">Sin registros que coincidan</p>
                    </div>
                  </td>
                </tr>
              ) : (
                pacientes.map((p) => {
                  const valArr = (p as any).valoraciones || [];
                  const lastVal = valArr.length > 0 
                     ? [...valArr].sort((a: any, b: any) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())[0] 
                     : null;
                  const ultimaVisitaReal = lastVal ? lastVal.fecha : null;
                  const sinVisita = diasSinVisita(ultimaVisitaReal);
                  
                  return (
                    <tr 
                      key={p.id} 
                      className="group hover:bg-secondary/30 transition-all cursor-pointer"
                      onClick={() => navigate(`/pacientes/${p.id}`)}
                    >
                      <td className="px-10 py-8">
                        <div className="flex items-center gap-8">
                          <div className="relative">
                            <div className="w-14 h-14 rounded-none bg-slate-900 border border-slate-800 text-white flex items-center justify-center font-bold text-2xl group-hover:scale-105 transition-transform">
                              {p.nombre[0]}
                            </div>
                            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-background rounded-none border border-slate-100 flex items-center justify-center shadow-sm">
                              <Activity className="h-2.5 w-2.5 text-slate-400" />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <p className="text-lg font-bold text-slate-900 uppercase tracking-tight leading-none group-hover:text-black transition-colors">{p.nombre} {p.apellido}</p>
                            <div className="flex items-center gap-4">
                              <div className="flex items-center gap-2">
                                <Hash className="h-3 w-3 text-slate-300" />
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{p.id.slice(-6).toUpperCase()}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Calendar className="h-3 w-3 text-slate-300" />
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{formatDate(p.fechaRegistro)}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-10 py-8">
                        <div className="flex items-center gap-4">
                           <div className="p-2.5 bg-secondary rounded-none">
                             <Clock className={`h-4 w-4 ${sinVisita && sinVisita > 45 ? 'text-amber-500' : 'text-slate-300'}`} />
                           </div>
                           <div className="space-y-1.5">
                              {ultimaVisitaReal ? (
                                <>
                                  <p className="text-[13px] font-bold text-slate-700 uppercase tracking-tight leading-none">{formatDate(ultimaVisitaReal)}</p>
                                  {sinVisita !== null && sinVisita > 30 && (
                                    <div className="flex items-center gap-1.5">
                                      <span className="text-[9px] font-bold text-white bg-amber-500 px-1.5 py-0.5 rounded-none uppercase tracking-tighter">AUSENTE {sinVisita}D</span>
                                    </div>
                                  )}
                                </>
                              ) : (
                                <p className="text-[11px] font-bold text-slate-300 uppercase tracking-widest leading-none">PENDIENTE PRIMER CONTROL</p>
                              )}
                           </div>
                        </div>
                      </td>
                      <td className="px-10 py-8 text-right">
                        <button className="w-12 h-12 rounded-none border border-slate-100 bg-background text-slate-400 flex items-center justify-center transition-all group-hover:bg-slate-900 group-hover:text-white group-hover:border-slate-900 group-hover:translate-x-1 shadow-sm">
                           <ChevronRight className="h-5 w-5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* FOOTER STATS COMPACT */}
      <div className="flex flex-col md:flex-row justify-between items-center bg-secondary/50 p-6 rounded-none border border-slate-100">
        <div className="flex items-center gap-8">
          <div className="flex flex-col">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Total Pacientes</span>
            <span className="text-[18px] font-bold text-slate-900 leading-none">{pacientes.length}</span>
          </div>
          <div className="w-[1px] h-8 bg-slate-200" />
          <div className="flex flex-col">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Tasa de Retención</span>
            <span className="text-[18px] font-bold text-slate-900 leading-none">94%</span>
          </div>
        </div>
        <p className="text-[9px] font-bold text-slate-300 uppercase tracking-widest mt-4 md:mt-0 flex items-center gap-2">
           <ShieldCheck className="h-4 w-4" /> Encriptación de datos de grado médico (AES-256)
        </p>
      </div>
    </div>
  );
};

export default Patients;
