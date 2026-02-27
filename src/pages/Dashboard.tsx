import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, UserPlus, ClipboardList, Activity, Plus,
  MessageSquare, BookOpen, Trophy, MoreHorizontal,
  Clock, Check, Square, ChevronDown, ChevronsLeft,
  ChevronLeft, ChevronRight, ChevronsRight, ArrowUpRight, ArrowDownRight
} from 'lucide-react';
import api from '@/lib/api';
import type { DashboardMetricas, Alerta } from '@/types';
import { useAuthStore } from '@/store/auth';

const Dashboard = () => {
  const [metricas, setMetricas] = useState<DashboardMetricas | null>(null);
  const [alertas, setAlertas] = useState<Alerta[]>([]);
  const [topClientes, setTopClientes] = useState<{nombre: string, valoraciones: number}[]>([]);
  const [loading, setLoading] = useState(true);
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
        const alertasData = alertRes.data?.data || alertRes.data || [];
        setAlertas(alertasData);
        
        const pacientesData = pacRes.data?.data || pacRes.data || [];
        // Calculate Top Clients from patients data based on number of valoraciones
        const top = pacientesData
          .map((p: any) => ({
            nombre: `${p.nombre} ${p.apellido || ''}`.trim(),
            valoraciones: p.valoraciones?.length || 0
          }))
          .filter((p: any) => p.valoraciones > 0)
          .sort((a: any, b: any) => b.valoraciones - a.valoraciones)
          .slice(0, 10);
          
        setTopClientes(top);
      } catch (err) {
        console.error('Error cargando dashboard:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const userName = user?.nombre?.split(' ')[0] || 'Especialista';

  // Planes Pendientes: coincide exactamente con la tabla "Pendientes de Envío" (alertas)
  const planesPendientes = alertas.length;

  const cards = [
    { 
       label: 'Total de Pacientes', 
       value: metricas?.resumen.pacientesTotales || 0, 
       icon: BookOpen, 
       badge: { text: '↗ 12%', color: 'text-emerald-500', bg: 'bg-[#1a2e1a]' } 
    },
    { 
       label: 'Pacientes nuevos este mes', 
       value: metricas?.resumen.pacientesNuevos || 0, 
       icon: Users, 
       badge: { text: '↘ 23%', color: 'text-pink-500', bg: 'bg-[#2d1622]' } 
    },
    { 
       label: 'Planes Pendientes', 
       value: planesPendientes, 
       icon: MessageSquare, 
       badge: { text: '6 Active', color: 'text-[#8a8a8a]', bg: 'bg-transparent border border-[#2a2a2a]' } 
    },
    { 
       label: 'Consultas de hoy', 
       value: metricas?.resumen.consultasTotales || 0, 
       icon: ClipboardList, 
       badge: { text: '↗ 12%', color: 'text-emerald-500', bg: 'bg-[#1a2e1a]' } 
    }
  ];

  if (loading && !metricas) return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
      <div className="flex flex-col items-center gap-6">
        <Activity className="h-10 w-10 text-[#f0f0f0] animate-pulse" />
        <div className="text-[11px] font-bold text-[#8a8a8a] uppercase tracking-[0.6em] animate-pulse">Iniciando Dashboard</div>
      </div>
    </div>
  );

  return (
    <div 
      className="flex flex-col gap-8 animate-fade-in max-w-none px-6 md:px-10 overflow-hidden -mt-6 -mb-12 -mx-6 md:-mx-8 h-[calc(100vh-60px)] lg:h-[100vh]" 
      style={{ fontFamily: 'Inter, system-ui, sans-serif', backgroundColor: '#0a0a0a', paddingBottom: '24px', paddingTop: '32px' }}
    >
      {/* HEADER SECTION */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h1 className="text-[28px] font-bold text-[#f0f0f0] m-0 tracking-tight">
            Bienvenido de vuelta, {userName}! 👋
          </h1>
          <p className="text-[14px] font-normal text-[#8a8a8a] mt-1">
            Work Hard. Play Hard.
          </p>
        </div>
        <div className="flex gap-4">
          <button
            onClick={() => navigate('/pacientes/nuevo')}
            className="flex items-center gap-2 bg-[#f0f0f0] text-[#0a0a0a] rounded-[8px] px-[16px] py-[10px] text-[13px] font-semibold transition-colors hover:bg-white border border-transparent shadow-sm"
          >
            <Plus className="h-[16px] w-[16px]" /> Registrar nuevo paciente
          </button>
        </div>
      </div>

      {/* KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((c, i) => (
          <div key={i} className="bg-[#111111] border border-[#2a2a2a] rounded-[16px] p-5 flex flex-col gap-4">
            <div className="flex items-center justify-between px-1">
               <span className="text-[14px] font-medium text-[#e0e0e0]">{c.label}</span>
               <div className="p-[5px] rounded-[6px] border border-[#333]">
                 <c.icon className="h-[14px] w-[14px] text-[#8a8a8a]" strokeWidth={1.5} />
               </div>
            </div>
            
            <div className="flex items-center justify-between bg-[#181818] border border-[#2a2a2a] rounded-[12px] px-5 py-4">
               <p className="text-[32px] font-normal text-[#f0f0f0] m-0 leading-none tracking-tight">{c.value}</p>
               
               <div className="flex items-center gap-4 h-8">
                 <div className="w-[1px] h-full bg-[#2a2a2a]" />
                 <span className={`text-[14px] font-normal tracking-wide ${c.badge.color}`}>{c.badge.text}</span>
               </div>
            </div>
          </div>
        ))}
      </div>

      {/* SECCIÓN PRINCIPAL: Tablas */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch flex-1 min-h-0">
        
        {/* TOP CLIENTES (1/3 Width on Large Screens) */}
        <div className="lg:col-span-4 bg-[#111111] border border-[#2a2a2a] rounded-[12px] shadow-none flex flex-col h-full overflow-hidden">
          <div className="px-5 py-4 flex justify-between items-center border-b border-[#2a2a2a]">
            <h2 className="text-[14px] font-medium text-[#f0f0f0] m-0">
              Top Clientes
            </h2>
            <div className="flex items-center gap-3">
              <Trophy className="w-4 h-4 text-[#8a8a8a]" />
              <MoreHorizontal className="w-4 h-4 text-[#8a8a8a]" />
            </div>
          </div>
          
          <div className="flex items-center justify-between px-5 py-3 border-b border-[#2a2a2a]">
             <span className="text-[12px] font-medium text-[#8a8a8a]">Nombre de Paciente</span>
             <span className="text-[12px] font-medium text-[#8a8a8a]">Visitas</span>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {topClientes.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 opacity-50">
                 <p className="text-[13px] text-[#8a8a8a] text-center">Sin datos suficientes</p>
              </div>
            ) : (
              <ul className="flex flex-col m-0 p-0">
                {topClientes.map((cliente, idx) => (
                  <li key={idx} className="flex items-center justify-between px-5 py-[14px] border-b border-[#2a2a2a] last:border-0 hover:bg-[#1a1a1a] transition-colors">
                    <span className="text-[13px] font-medium text-[#f0f0f0]">{cliente.nombre}</span>
                    <span className="text-[13px] font-normal text-[#8a8a8a] pr-2">{String(cliente.valoraciones).padStart(2, '0')}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* ULTIMOS PACIENTES (2/3 Width on Large Screens) */}
        <div className="lg:col-span-8 bg-[#111111] border border-[#2a2a2a] rounded-[12px] shadow-none flex flex-col h-full overflow-hidden">
          <div className="px-5 py-4 border-b border-[#2a2a2a]">
            <h2 className="text-[14px] font-medium text-[#f0f0f0] m-0">
              Ultimos Pacientes
            </h2>
          </div>

          <div className="flex-1 overflow-x-auto w-full">
            <table className="w-full text-left border-collapse min-w-[500px]">
              <thead>
                <tr className="border-b border-[#2a2a2a] whitespace-nowrap">
                  <th className="pl-5 pr-3 py-3 w-12 text-center" style={{ width: '48px' }}>
                    <Square className="w-4 h-4 text-[#444] inline-block" />
                  </th>
                  <th className="px-3 py-3 text-[12px] font-medium text-[#8a8a8a]">Nombre de Paciente</th>
                  <th className="px-3 py-3 text-[12px] font-medium text-[#8a8a8a]">Status</th>
                  <th className="px-3 py-3 text-[12px] font-medium text-[#8a8a8a]">Fecha de Consulta</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2a2a2a]">
                {alertas.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-12 text-center">
                      <p className="text-[13px] text-[#8a8a8a]">Sin pacientes recientes o alertas.</p>
                    </td>
                  </tr>
                ) : (
                  alertas.map((a, i) => {
                    let statusColor = "text-emerald-500";
                    let StatusIcon = Check;
                    let statusText = "Enviado";

                    if (a.tipoRiesgo === 'Sin Plan Asignado') {
                      statusColor = "text-rose-500"; 
                      StatusIcon = Clock;
                      statusText = "Plan Sin Asignar";
                    } else if (a.tipoRiesgo === 'Plan Sin Enviar') {
                      statusColor = "text-[#f59e0b]";
                      StatusIcon = Clock;
                      statusText = "Sin Enviar";
                    }

                    const dateStr = a.fechaPlan ? new Date(a.fechaPlan).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
                    
                    return (
                      <tr 
                        key={a.pacienteId || i} 
                        className="hover:bg-[#1a1a1a] transition-colors cursor-pointer group whitespace-nowrap"
                        onClick={() => navigate(`/pacientes/${a.pacienteId}#historial`)}
                      >
                        <td className="pl-5 pr-3 py-[14px] text-center w-12">
                          <Square className="w-4 h-4 text-[#444] inline-block opacity-50 group-hover:opacity-100 transition-opacity" />
                        </td>
                        <td className="px-3 py-[14px]">
                          <span className="text-[13px] font-medium text-[#f0f0f0]">{a.nombre}</span>
                        </td>
                        <td className="px-3 py-[14px]">
                             <span className={`inline-flex items-center gap-1.5 text-[12px] font-medium ${statusColor}`}>
                               <StatusIcon className={`w-3.5 h-3.5 ${statusColor}`} /> {statusText}
                             </span>
                        </td>
                        <td className="px-3 py-[14px] text-[13px] font-normal text-[#8a8a8a]">
                          {dateStr}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="px-5 py-3 border-t border-[#2a2a2a] flex flex-col md:flex-row gap-4 items-center justify-between bg-[#111111]">
             <div className="text-[12px] font-medium text-[#8a8a8a]">
                Mostrando {alertas.length > 0 ? '1' : '0'} a {Math.min(10, alertas.length)} Resultados de {alertas.length}
             </div>
             
             <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6">
                <div className="flex items-center gap-3">
                   <span className="text-[12px] font-medium text-[#8a8a8a]">Filas por página</span>
                   <div className="flex items-center justify-between px-3 py-1.5 bg-[#181818] border border-[#2a2a2a] rounded-[6px] gap-2 hover:border-[#444] cursor-pointer transition-colors">
                      <span className="text-[12px] font-medium text-[#f0f0f0] select-none">10</span>
                      <ChevronDown className="w-3.5 h-3.5 text-[#8a8a8a]" />
                   </div>
                </div>
                
                <div className="flex items-center gap-1">
                   <button className="p-1 px-[5px] bg-transparent border border-transparent rounded-[6px] text-[#8a8a8a] hover:bg-[#1a1a1a] transition-colors disabled:opacity-50" disabled>
                      <ChevronsLeft className="w-4 h-4" />
                   </button>
                   <button className="p-1 px-[5px] bg-transparent border border-transparent rounded-[6px] text-[#8a8a8a] hover:bg-[#1a1a1a] transition-colors disabled:opacity-50" disabled>
                      <ChevronLeft className="w-4 h-4" />
                   </button>
                   <span className="text-[12px] font-medium text-[#f0f0f0] mx-2 select-none">
                      1 / {Math.max(1, Math.ceil(alertas.length / 10))}
                   </span>
                   <button className="p-1 px-[5px] bg-transparent border border-transparent rounded-[6px] text-[#8a8a8a] hover:bg-[#1a1a1a] transition-colors" disabled={alertas.length <= 10}>
                      <ChevronRight className="w-4 h-4" />
                   </button>
                   <button className="p-1 px-[5px] bg-transparent border border-transparent rounded-[6px] text-[#8a8a8a] hover:bg-[#1a1a1a] transition-colors" disabled={alertas.length <= 10}>
                      <ChevronsRight className="w-4 h-4" />
                   </button>
                </div>
             </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Dashboard;
