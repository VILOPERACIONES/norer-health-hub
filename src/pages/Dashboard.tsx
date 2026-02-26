import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, UserPlus, ClipboardList, Activity, CheckCircle2, MessageSquare, TrendingUp, AlertCircle, ArrowRight, ActivityIcon, LayoutDashboard, ShieldCheck } from 'lucide-react';
import api from '@/lib/api';
import type { DashboardMetricas, Alerta } from '@/types';
import { useAuthStore } from '@/store/auth';

const Dashboard = () => {
  const [metricas, setMetricas] = useState<DashboardMetricas | null>(null);
  const [alertas, setAlertas] = useState<Alerta[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { user } = useAuthStore();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [metRes, alertRes] = await Promise.all([
          api.get('/api/dashboard/metricas'),
          api.get('/api/dashboard/alertas'),
        ]);
        
        setMetricas(metRes.data?.data || metRes.data);
        setAlertas(alertRes.data?.data || alertRes.data || []);
      } catch (err) {
        console.error('Error cargando dashboard:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const userName = user?.nombre || 'Especialista';

  const cards = [
    { label: 'Pacientes Totales', value: metricas?.resumen.pacientesTotales || 0, icon: Users, trend: '+12% este mes' },
    { label: 'Nuevos Registros', value: metricas?.resumen.pacientesNuevos || 0, icon: UserPlus, trend: 'En crecimiento' },
    { label: 'Planes Creados', value: metricas?.resumen.planesNutricionales || 0, icon: ClipboardList, trend: '98% completados' },
    { label: 'Consultas Realizadas', value: metricas?.resumen.consultasTotales || 0, icon: TrendingUp, trend: 'Eficiencia alta' },
  ];

  if (loading && !metricas) return (
    <div className="min-h-screen bg-secondary/30 flex items-center justify-center">
      <div className="flex flex-col items-center gap-6">
        <Activity className="h-10 w-10 text-slate-900 animate-pulse" />
        <div className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.6em] animate-pulse">Iniciando Centro de Control Clínico</div>
      </div>
    </div>
  );

  return (
    <div className="space-y-12 animate-fade-in pb-32 max-w-none px-6">
      {/* HEADER SECTION */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 pt-8">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
             <div className="h-1 w-12 bg-emerald-500 rounded-none" />
             <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.4em]">Panel de Inteligencia</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 tracking-[-0.04em] uppercase leading-none">
            Control <span className="text-slate-400">Center</span>
          </h1>
          <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-slate-300 ml-1 flex items-center gap-3">
             NODO MAESTRO: <span className="text-slate-900 font-extrabold">{userName}</span> · <LayoutDashboard className="h-3 w-3" /> ECOSISTEMA V2.5
          </p>
        </div>
        <div className="flex gap-4">
          <button
            onClick={() => navigate('/pacientes/nuevo')}
            className="flex items-center gap-4 bg-slate-900 text-white px-10 py-5 rounded-none text-[11px] font-bold uppercase tracking-[0.2em] transition-all hover:bg-slate-800 hover:shadow-2xl hover:shadow-slate-200 group"
          >
            <UserPlus className="h-5 w-5 group-hover:scale-110 transition-transform" /> Reclutamiento Directo
          </button>
        </div>
      </div>

      {/* KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((c) => (
          <div key={c.label} className="bg-background p-8 rounded-none border border-slate-100 shadow-sm hover:border-slate-300 transition-all group flex flex-col justify-between h-48 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
              <c.icon className="h-16 w-16 text-slate-900" />
            </div>
            <div className="space-y-1">
              <span className="text-[9px] font-bold uppercase tracking-[0.25em] text-slate-400">{c.label}</span>
              <p className="text-4xl font-bold text-slate-900 tracking-tighter leading-none">{c.value}</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="p-3 bg-slate-900 text-white rounded-none"></div>
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{c.trend}</span>
            </div>
          </div>
        ))}
      </div>

      {/* SECCIÓN DE PRIORIDADES Y ENTREGAS PENDIENTES */}
      <div className="grid grid-cols-1 gap-10">
        <div className="bg-background border border-slate-100 shadow-sm hover:border-slate-300 transition-all p-10 flex flex-col">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
            <div className="space-y-2">
              <h2 className="text-[12px] font-bold text-slate-800 uppercase tracking-[0.4em] flex items-center gap-4">
                <div className="w-2 h-2 bg-amber-500 rounded-none animate-pulse" />
                Pendientes de Envío
              </h2>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Protocolos de alimentación generados sin entrega finalizada</p>
            </div>
            <div className="flex items-center gap-3 px-4 py-2 bg-slate-50 border border-slate-100">
              <AlertCircle className="h-4 w-4 text-amber-500" />
              <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Vigilancia Activa</span>
            </div>
          </div>

          <div className="overflow-hidden border border-slate-50">
            <div className="max-h-[480px] overflow-y-auto custom-scrollbar">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100">
                    <th className="px-8 py-5 text-[9px] font-black text-slate-400 uppercase tracking-[0.3em]">Paciente</th>
                    <th className="px-8 py-5 text-[9px] font-black text-slate-400 uppercase tracking-[0.3em]">Motivo de Alerta</th>
                    <th className="px-8 py-5 text-[9px] font-black text-slate-400 uppercase tracking-[0.3em]">Fecha de Creación</th>
                    <th className="px-8 py-5 text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] text-right">Prioridad</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {alertas.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-20 text-center">
                        <div className="flex flex-col items-center opacity-30">
                          <ShieldCheck className="h-10 w-10 mb-4 text-emerald-500" />
                          <p className="text-[10px] font-bold uppercase tracking-[0.4em]">Flujo operativo al día</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    alertas.map((a) => (
                      <tr 
                        key={a.pacienteId} 
                        className="hover:bg-slate-50 transition-colors cursor-pointer group"
                        onClick={() => navigate(`/pacientes/${a.pacienteId}#historial`)}
                      >
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-4">
                            <div className="w-8 h-8 bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-400 group-hover:bg-slate-900 group-hover:text-white transition-all uppercase">
                              {a.nombre.charAt(0)}
                            </div>
                            <span className="text-sm font-black text-slate-800 uppercase tracking-tight">{a.nombre}</span>
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-2">
                            {a.tipoRiesgo === 'Sin Plan Asignado' ? (
                              <span className="px-2 py-0.5 bg-rose-50 text-rose-600 text-[9px] font-black uppercase tracking-widest border border-rose-100">
                                {a.tipoRiesgo}
                              </span>
                            ) : a.tipoRiesgo === 'Plan Sin Enviar' ? (
                              <span className="px-2 py-0.5 bg-amber-50 text-amber-600 text-[9px] font-black uppercase tracking-widest border border-amber-100">
                                {a.tipoRiesgo}
                              </span>
                            ) : (
                              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                {a.tipoRiesgo}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-8 py-6 text-xs font-bold text-slate-400 uppercase tracking-widest">
                          {a.fechaPlan ? new Date(a.fechaPlan).toLocaleDateString('es-MX', { day: '2-digit', month: 'short' }).toUpperCase() : '—'}
                        </td>
                        <td className="px-8 py-6 text-right">
                          <span className={`text-[9px] font-black px-4 py-1.5 rounded-none uppercase tracking-widest ${
                            a.prioridad === 'Alta' ? 'bg-rose-500 text-white shadow-lg shadow-rose-100' : 'bg-slate-100 text-slate-400'
                          }`}>
                            {a.prioridad}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-8 flex justify-between items-center border-t border-slate-50 pt-8">
            <p className="text-[9px] font-bold text-slate-300 uppercase tracking-[0.3em]">
              Sincronizado con Central de Operaciones · Vigilancia 24/7
            </p>
            <button 
              onClick={() => navigate('/pacientes')}
              className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 hover:text-slate-900 transition-colors"
            >
              Ver todos los expedientes <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
