import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, UserPlus, ClipboardList, Activity, CheckCircle2, MessageSquare, TrendingUp, AlertCircle, ArrowRight, ActivityIcon, LayoutDashboard, ShieldCheck } from 'lucide-react';
import api from '@/lib/api';
import type { DashboardMetricas, Alerta } from '@/types';
import { useAuthStore } from '@/store/auth';
import { BarChart, Bar, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

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

      <div className="grid lg:grid-cols-12 gap-10">
        {/* CHART SECTION */}
        <div className="lg:col-span-8 space-y-10">
           <div className="lg:col-span-4 bg-slate-900 p-10 rounded-none border border-slate-800 shadow-2xl relative overflow-hidden flex flex-col justify-between min-h-[600px]">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                <div className="space-y-2">
                  <h2 className="text-[12px] font-bold text-slate-800 uppercase tracking-[0.4em] flex items-center gap-4 whitespace-nowrap">
                    Evolución del Flujo Maestre
                  </h2>
                  <p className="text-[9px] font-bold text-slate-300 uppercase tracking-widest">Análisis predictivo de 6 meses</p>
                </div>
                <div className="flex gap-6">
                   <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-none bg-slate-900" /><span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Pacientes</span></div>
                   <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-none bg-slate-200" /><span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Planes</span></div>
                </div>
              </div>
              <div className="h-[320px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={metricas?.tendenciaMaestre || []} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis 
                      dataKey="mes" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 10, fontWeight: 700, fill: '#cbd5e1' }} 
                      dy={10}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 10, fontWeight: 700, fill: '#cbd5e1' }} 
                    />
                    <Tooltip 
                      cursor={{ fill: '#f8fafc' }}
                      contentStyle={{ borderRadius: '0', border: 'none', background: '#0f172a', color: '#fff', padding: '16px', fontSize: '11px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}
                    />
                    <Bar dataKey="pacientes" fill="#0f172a" radius={0} barSize={24} />
                    <Bar dataKey="planes" fill="#e2e8f0" radius={0} barSize={24} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
           </div>


        </div>

        {/* SIDEBAR MONITOR */}
        <div className="lg:col-span-4 h-full">
           <div className="bg-slate-900 p-10 rounded-none text-white flex flex-col h-full shadow-2xl shadow-slate-200 border border-slate-800">
              <div className="flex items-center justify-between mb-10">
                <div className="space-y-1">
                  <h2 className="text-[12px] font-bold uppercase tracking-[0.4em] flex items-center gap-4 leading-none">
                    <div className="w-1.5 h-1.5 rounded-none bg-emerald-500 animate-pulse" /> Vigilancia Activa
                  </h2>
                  <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest leading-none mt-2">Protocolo de seguridad Eyder</p>
                </div>
              </div>

              <div className="space-y-4 flex-grow overflow-y-auto pr-2 custom-scrollbar">
                {alertas.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 border border-dashed border-slate-800 rounded-none opacity-40 text-center">
                    <CheckCircle2 className="h-10 w-10 mb-4 text-emerald-500" />
                    <p className="text-[11px] font-bold uppercase tracking-[0.4em]">Sin alertas críticas</p>
                  </div>
                ) : (
                  alertas.slice(0, 5).map((a, i) => (
                    <div 
                      key={a.pacienteId || i} 
                      className={`group flex flex-col p-6 rounded-none bg-white/5 border border-white/5 hover:border-white/20 hover:bg-white/10 transition-all cursor-pointer relative overflow-hidden`}
                      onClick={() => navigate(`/pacientes/${a.pacienteId}`)}
                    >
                      <div className="flex items-center justify-between mb-3 relative z-10">
                        <p className="text-[13px] font-bold uppercase tracking-tight truncate text-white">{a.nombre}</p>
                        <span className={`text-[8px] font-bold px-2 py-0.5 rounded-none uppercase tracking-widest ${a.prioridad === 'Alta' ? 'bg-rose-500' : 'bg-slate-700'}`}>
                           {a.prioridad}
                        </span>
                      </div>
                      <div className="flex justify-between items-center relative z-10">
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                           {a.tipoRiesgo || `${a.diasSinVisita}d AUSENCIA`}
                        </p>
                        <ArrowRight className="h-4 w-4 text-slate-600 group-hover:text-white group-hover:translate-x-1 transition-all" />
                      </div>
                    </div>
                  ))
                )}
              </div>
              
              <div className="mt-10 p-8 rounded-none bg-slate-800 border border-slate-700">
                <div className="flex items-center gap-4 mb-4">
                   <AlertCircle className="h-5 w-5 text-rose-500" />
                   <div className="flex flex-col">
                     <p className="text-[9px] font-bold uppercase tracking-[0.3em] text-slate-500 leading-none">Prioridad del Sistema</p>
                     <p className="text-[14px] font-bold text-white mt-1 uppercase tracking-tight">Kpis Críticos</p>
                   </div>
                </div>
                <div className="grid grid-cols-2 gap-8 pt-6 border-t border-slate-700">
                   <div className="space-y-1">
                      <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Riesgo Clin.</p>
                      <p className="text-2xl font-bold text-white leading-none">{metricas?.kpisClave.riesgoClinico || 0}%</p>
                   </div>
                   <div className="space-y-1">
                      <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Abandono</p>
                      <p className="text-2xl font-bold text-rose-500 leading-none">{metricas?.kpisClave.riesgoAbandono}</p>
                   </div>
                </div>
              </div>

              <button 
                onClick={() => navigate('/pacientes')}
                className="w-full mt-8 py-5 bg-background text-slate-900 rounded-none text-[11px] font-bold uppercase tracking-[0.3em] hover:bg-secondary transition-all flex items-center justify-center gap-3"
              >
                Director de Expedientes <ArrowRight className="h-4 w-4" />
              </button>
           </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
