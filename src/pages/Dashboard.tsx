import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, UserPlus, ClipboardList, CreditCard, AlertTriangle, ArrowRight, CheckCircle2, Calendar, MessageSquare, Activity } from 'lucide-react';
import api from '@/lib/api';
import type { DashboardMetricas, Alerta, Paciente } from '@/types';
import { useAuthStore } from '@/store/auth';
import { BarChart, Bar, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, Cell } from 'recharts';

import { Skeleton } from '@/components/ui/skeleton';

const Dashboard = () => {
  const [metricas, setMetricas] = useState<DashboardMetricas | null>(null);
  const [alertas, setAlertas] = useState<Alerta[]>([]);
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuthStore();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [metRes, alertRes, pacRes] = await Promise.all([
          api.get('/api/dashboard/metricas'),
          api.get('/api/dashboard/alertas'),
          api.get('/api/pacientes'),
        ]);
        
        setMetricas(metRes.data?.data || metRes.data);
        setAlertas(alertRes.data?.data || alertRes.data || []);
        setPacientes(pacRes.data?.data || pacRes.data || []);
        
      } catch (err) {
        console.error('Error cargando dashboard:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const userName = user?.nombre || 'Especialista';

  const chartData = useMemo(() => {
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const currentYear = new Date().getFullYear();
    const data = months.map(m => ({ name: m, pacientes: 0 }));

    pacientes.forEach(p => {
      const date = p.createdAt ? new Date(p.createdAt) : null;
      if (date && date.getFullYear() === currentYear) {
        const monthIdx = date.getMonth();
        data[monthIdx].pacientes += 1;
      }
    });

    return data.slice(0, new Date().getMonth() + 1);
  }, [pacientes]);

  const cards = [
    { label: 'Pacientes Totales', value: metricas?.totalPacientes || 0, icon: Users },
    { label: 'Nuevos (Mes)', value: metricas?.nuevosEsteMes || 0, icon: UserPlus },
    { label: 'Protocolos Activos', value: metricas?.planesEsteMes || 0, icon: ClipboardList },
    { label: 'Eficiencia Comercial', value: `${metricas?.membresiasActivas?.total || 0}%`, icon: CreditCard },
  ];

  const shortcuts = [
    { label: 'Citas Cal.com', url: 'https://app.cal.com/event-types', icon: Calendar },
    { label: 'Chatwoot Nut.', url: 'https://norder-ai-agent-chatwootnut.rbvpuf.easypanel.host/app/accounts/1/dashboard', icon: MessageSquare },
  ];

  if (loading && !metricas) return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
       <Skeleton className="h-20 w-full rounded-none" />
       <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <Skeleton key={i} className="h-40 w-full rounded-none" />)}
       </div>
       <div className="grid lg:grid-cols-3 gap-8">
          <Skeleton className="lg:col-span-2 h-[400px] rounded-none" />
          <Skeleton className="h-[400px] rounded-none" />
       </div>
    </div>
  );

  return (
    <div className="space-y-8 animate-fade-in pb-20 max-w-7xl mx-auto">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-b border-border/40 pb-6">
        <div className="space-y-2">
          <h1 className="text-4xl font-black text-foreground tracking-tighter uppercase leading-none whitespace-nowrap">Control Center</h1>
          <p className="text-[12px] font-black uppercase tracking-[0.3em] text-muted-foreground opacity-40 leading-none">
             Bienvenido, <span className="text-foreground/70">{userName}</span>
          </p>
        </div>
        <div className="flex gap-4">
           <button
            onClick={() => navigate('/pacientes/nuevo')}
            className="flex items-center gap-3 bg-foreground text-background px-8 py-3 rounded-none text-[12px] font-black uppercase tracking-[0.2em] hover:opacity-90 active:scale-[0.98] transition-all border border-foreground"
          >
            <UserPlus className="h-5 w-5" /> ALTA DIRECTA
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {loading ? (
          [1,2,3,4].map(i => <Skeleton key={i} className="h-40 w-full rounded-none" />)
        ) : (
          cards.map((c) => (
            <div key={c.label} className="bg-background border border-border/80 p-6 rounded-none shadow-sm hover:border-foreground/40 transition-all group flex flex-col justify-between h-40 ring-1 ring-foreground/5">
              <div className="flex justify-between items-start mb-4">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground opacity-40 group-hover:opacity-100 transition-opacity whitespace-nowrap">{c.label}</span>
                <c.icon className="h-4 w-4 text-muted-foreground/30 group-hover:text-foreground transition-colors" />
              </div>
              <p className="text-3xl font-black text-foreground tracking-tighter leading-none">{c.value}</p>
            </div>
          ))
        )}
      </div>

      <div className="grid lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-8">
           <div className="bg-background border border-border/80 p-8 rounded-none shadow-sm ring-1 ring-foreground/5">
              <div className="flex items-center justify-between mb-8 px-2">
                <h2 className="text-[12px] font-black text-foreground uppercase tracking-[0.4em] flex items-center gap-4 leading-none">
                  <div className="w-2 h-2 rounded-full bg-foreground" /> Tendencia de Captación Maestra
                </h2>
                <span className="text-[11px] font-black text-muted-foreground uppercase opacity-20 tracking-[0.2em] leading-none">Periodo: {new Date().getFullYear()}</span>
              </div>
              <div className="h-[300px] w-full mt-4 bg-secondary/5 rounded-none p-4 ring-1 ring-foreground/5">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" opacity={0.03} />
                    <XAxis 
                      dataKey="name" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 10, fontWeight: 900, fill: 'currentColor', opacity: 0.2 }} 
                      dy={10}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 10, fontWeight: 900, fill: 'currentColor', opacity: 0.2 }} 
                    />
                    <Tooltip 
                      cursor={{ fill: 'rgba(0,0,0,0.01)' }}
                      contentStyle={{ borderRadius: '0', border: 'none', background: 'black', color: 'white', padding: '16px', fontSize: '12px', fontWeight: '900', textTransform: 'uppercase' }}
                      itemStyle={{ color: 'white', letterSpacing: '0.1em' }}
                    />
                    <Bar dataKey="pacientes" fill="black" radius={0} barSize={24}>
                       {chartData.map((_, index) => (
                         <Cell key={`cell-${index}`} fill={index === chartData.length - 1 ? 'black' : 'rgba(0,0,0,0.05)'} />
                       ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
           </div>

           <div className="grid sm:grid-cols-2 gap-4">
              {shortcuts.map((s) => (
                <a 
                 key={s.label}
                 href={s.url}
                 target="_blank"
                 rel="noopener noreferrer"
                 className="flex items-center p-4 rounded-none bg-background border border-border/80 hover:border-foreground/30 transition-all group gap-4 shadow-sm ring-1 ring-foreground/5"
                >
                  <div className="w-12 h-12 rounded-none bg-secondary/30 flex items-center justify-center group-hover:bg-foreground group-hover:text-background transition-all">
                    <s.icon className="w-5 h-5" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-[12px] font-black uppercase tracking-[0.2em] leading-none">{s.label}</p>
                    <p className="text-[11px] font-black text-muted-foreground uppercase opacity-30 tracking-widest leading-none">Herramienta Externa</p>
                  </div>
                </a>
              ))}
           </div>
        </div>

        <div className="lg:col-span-4 h-full">
           <div className="bg-background border border-border/80 p-8 rounded-none shadow-sm h-full flex flex-col ring-1 ring-foreground/5">
              <h2 className="text-[12px] font-black text-foreground uppercase tracking-[0.4em] flex items-center gap-4 mb-8 leading-none">
                 <AlertTriangle className="h-5 w-5 opacity-20" /> ALERTAS CLÍNICAS
              </h2>

              <div className="space-y-3 flex-grow">
                {alertas.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 border border-dashed border-border/10 rounded-none opacity-20">
                    <CheckCircle2 className="h-8 w-8 mb-4" />
                    <p className="text-[11px] font-black uppercase tracking-[0.3em] text-center">PROTOCOLOS INTEGRALES</p>
                  </div>
                ) : (
                  alertas.slice(0, 5).map((a, i) => {
                    const idParaNavegar = a.pacienteId || (a as any).id;
                    return (
                      <div 
                        key={idParaNavegar || i} 
                        className="group flex flex-col p-4 rounded-none border border-border/40 hover:border-foreground/30 transition-all cursor-pointer bg-secondary/10 hover:bg-secondary/20"
                        onClick={() => {
                          if (idParaNavegar) navigate(`/pacientes/${idParaNavegar}`);
                        }}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-base font-black uppercase tracking-tighter truncate leading-none">{a.nombre}</p>
                          <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-all -translate-x-1 group-hover:translate-x-0" />
                        </div>
                        <p className="text-[11px] font-black text-destructive uppercase tracking-widest leading-none">
                           {a.diasSinVisita} DÍAS DE AUSENCIA
                        </p>
                      </div>
                    );
                  })
                )}
              </div>
              
              <div className="mt-8 p-4 rounded-none bg-secondary/20 border border-foreground/5 shadow-inner">
                <p className="text-[11px] font-black uppercase tracking-[0.3em] mb-2 opacity-30 leading-none">{`// INSIGHT ALGORÍTMICO`}</p>
                <p className="text-[12px] font-black leading-relaxed uppercase tracking-tight text-foreground/50">
                   Priorizar protocolos de adherencia sistemática para pacientes con inactividad crítica.
                </p>
              </div>

              <button 
                onClick={() => navigate('/pacientes')}
                className="w-full mt-6 py-4 border border-border/80 rounded-none text-[12px] font-black text-muted-foreground hover:text-foreground hover:border-foreground/50 uppercase tracking-[0.3em] transition-all shadow-sm"
              >
                Directorio Maestro
              </button>
           </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
