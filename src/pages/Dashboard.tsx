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
import { getBadgeForValuation } from '@/lib/format';

const Dashboard = () => {
  const [metricas, setMetricas] = useState<DashboardMetricas | null>(null);
  const [alertas, setAlertas] = useState<Alerta[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [topClientes, setTopClientes] = useState<{
    id: string;
    nombre: string;
    valoraciones: number;
  }[]>([]);
  // Datos para la tabla "Últimos Pacientes" — misma lógica que Pending.tsx
  const [ultimosPendientes, setUltimosPendientes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { user } = useAuthStore();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Intentar endpoint dedicado de top-clientes primero
        const [metRes, alertRes, pacRes] = await Promise.all([
          api.get('/api/dashboard/metricas'),
          api.get('/api/dashboard/alertas'),
          api.get('/api/pacientes'),
        ]);

        setMetricas(metRes.data?.data || metRes.data);
        setAlertas(alertRes.data?.data || alertRes.data || []);

        // ── Construir "Últimos Pacientes" con la misma lógica de Pending.tsx ──
        const pacientesData: any[] = pacRes.data?.data || pacRes.data || [];
        const pendItems: any[] = [];
        pacientesData.forEach((pac: any) => {
          const valArr: any[] = pac.valoraciones || [];
          valArr.forEach((val: any) => {
            // Inyectar plan si no viene dentro de la valoración
            if (!val.plan && pac.planes && Array.isArray(pac.planes)) {
              const planAsociado = pac.planes.find((pl: any) => pl.valoracionId === val.id);
              if (planAsociado) {
                val.plan = planAsociado;
                val.planId = planAsociado.id;
                val.estadoEnvio = planAsociado.estadoEnvio;
              }
            }
            const statusInfo = getBadgeForValuation(val);
            if (statusInfo.text !== 'Enviado') {
              pendItems.push({
                pacienteId: pac.id,
                nombre: `${pac.nombre} ${pac.apellido || ''}`.trim(),
                fecha: val.fecha,
                numeroValoracion: val.numeroValoracion,
                val,
                statusInfo,
              });
            }
          });
        });
        // Ordenar por fecha más reciente primero
        pendItems.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
        setUltimosPendientes(pendItems);

        // Top clientes: preferir endpoint dedicado, fallback desde pacientesData
        try {
          const topRes = await api.get('/api/dashboard/top-clientes');
          const topData = topRes.data?.data || topRes.data || [];
          setTopClientes(topData.slice(0, 10));
        } catch {
          const top = pacientesData
            .map((p: any) => ({
              id: p.id,
              nombre: `${p.nombre} ${p.apellido || ''}`.trim(),
              valoraciones:
                p._count?.valoraciones ??
                p.totalValoraciones ??
                p.numeroValoraciones ??
                (Array.isArray(p.valoraciones) ? p.valoraciones.length : 0),
            }))
            .filter((p: any) => p.valoraciones > 0)
            .sort((a: any, b: any) => b.valoraciones - a.valoraciones)
            .slice(0, 10);
          setTopClientes(top);
        }
      } catch (err) {
        console.error('Error cargando dashboard:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const userName = user?.nombre?.split(' ')[0] || 'Especialista';

  // Conteos para KPI "Menús pendientes" — derivados de ultimosPendientes (misma fuente que la tabla)
  const planesSinAsignar = ultimosPendientes.filter((i: any) => i.statusInfo?.text === 'Pendiente de plan').length;
  const planesEnProceso  = ultimosPendientes.filter((i: any) => i.statusInfo?.text === 'Plan en Proceso').length;
  const planesSinEnviar  = ultimosPendientes.filter((i: any) => i.statusInfo?.text === 'Listo para enviar').length;
  const planesPendientes = ultimosPendientes.length;

  // Alias corto para el resumen
  const r = metricas?.resumen as any;

  // ── Cálculo dinámico de porcentajes ──────────────────────────────────────────
  // % nuevos del mes sobre el total histórico
  const pctNuevosMes = r?.pacientesTotales > 0
    ? ((r.pacientesNuevosMes ?? 0) / r.pacientesTotales * 100).toFixed(1)
    : '0.0';

  // % de expedientes abiertos hoy sobre el mes
  const pctNuevosHoy = r?.pacientesNuevosMes > 0
    ? ((r.pacientesNuevosHoy ?? 0) / r.pacientesNuevosMes * 100).toFixed(1)
    : '0.0';

  // % de pacientes con plan pendiente sobre el total
  const pctPendientes = r?.pacientesTotales > 0
    ? (planesPendientes / r.pacientesTotales * 100).toFixed(1)
    : '0.0';

  // % de consultas de hoy sobre el total del mes
  const pctConsultasHoy = r?.consultasMes > 0
    ? ((r.consultasHoy ?? 0) / r.consultasMes * 100).toFixed(1)
    : '0.0';

  const cards = [
    {
      label: 'Total de Pacientes',
      value: r?.pacientesTotales ?? 0,
      icon: BookOpen,
      badge: {
        text: `↗ ${pctNuevosMes}%`,
        color: parseFloat(pctNuevosMes) > 0 ? 'text-emerald-400' : 'text-[#555]',
      },
      sub: r?.pacientesNuevosHoy > 0
        ? `+${r.pacientesNuevosHoy} nuevo${r.pacientesNuevosHoy > 1 ? 's' : ''} hoy`
        : 'Sin altas hoy',
      subColor: r?.pacientesNuevosHoy > 0 ? 'text-emerald-400' : 'text-[#555]',
    },
    {
      label: 'Nuevos hoy',
      value: r?.pacientesNuevosHoy ?? 0,
      icon: UserPlus,
      badge: {
        text: `${pctNuevosHoy}% del mes`,
        color: parseFloat(pctNuevosHoy) > 0 ? 'text-emerald-400' : 'text-[#555]',
      },
      sub: r?.pacientesNuevosMes != null ? `${r.pacientesNuevosMes} este mes` : '—',
      subColor: 'text-[#8a8a8a]',
    },
    {
      label: 'Menús pendientes',
      value: planesPendientes,
      icon: MessageSquare,
      badge: {
        text: `${pctPendientes}%`,
        color: planesPendientes > 0 ? 'text-amber-400' : 'text-[#555]',
      },
      sub: `${planesSinAsignar} sin equiv. · ${planesEnProceso} sin menú · ${planesSinEnviar} por enviar`,
      subColor: planesPendientes > 0 ? 'text-amber-400' : 'text-[#555]',
    },
    {
      label: 'Consultas hoy',
      value: r?.consultasHoy ?? 0,
      icon: ClipboardList,
      badge: {
        text: `${pctConsultasHoy}% del mes`,
        color: parseFloat(pctConsultasHoy) > 0 ? 'text-emerald-400' : 'text-[#555]',
      },
      sub: [
        r?.consultasMes != null ? `${r.consultasMes} este mes` : null,
        r?.consultasAnio != null ? `${r.consultasAnio} este año` : null,
      ].filter(Boolean).join(' · ') || '—',
      subColor: 'text-[#8a8a8a]',
    },
  ];

  if (loading && !metricas) return (
    <div className="flex flex-col items-center justify-center gap-4 h-[calc(100vh-120px)]">
      <div className="w-8 h-8 border-[3px] border-white/20 border-t-white rounded-full animate-spin" />
      <p className="text-[14px] text-[#8a8a8a]">Iniciando Dashboard...</p>
    </div>
  );

  return (
    <div 
      className="flex flex-col gap-6 animate-fade-in max-w-none overflow-hidden h-full" 
      style={{ fontFamily: 'Inter, system-ui, sans-serif', backgroundColor: '#0a0a0a' }}
    >
      {/* HEADER SECTION */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h1 className="text-[28px] font-bold text-[#f0f0f0] m-0 tracking-tight">
            Bienvenido de vuelta, {userName}! 
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
            {/* Título e ícono */}
            <div className="flex items-center justify-between px-1">
              <span className="text-[14px] font-medium text-[#e0e0e0]">{c.label}</span>
              <div className="p-[5px] rounded-[6px] border border-[#333]">
                <c.icon className="h-[14px] w-[14px] text-[#8a8a8a]" strokeWidth={1.5} />
              </div>
            </div>

            {/* Número | separador | % badge — DISEÑO ORIGINAL */}
            <div className="flex items-center justify-between bg-[#181818] border border-[#2a2a2a] rounded-[12px] px-5 py-4">
              <p className="text-[32px] font-normal text-[#f0f0f0] m-0 leading-none tracking-tight tabular-nums">
                {c.value}
              </p>
              <div className="flex items-center gap-4 h-8">
                <div className="w-[1px] h-full bg-[#2a2a2a]" />
                <span className={`text-[13px] font-normal tracking-wide whitespace-nowrap ${c.badge.color}`}>
                  {c.badge.text}
                </span>
              </div>
            </div>

            {/* Subtexto contextual */}
            <p className={`text-[12px] font-medium m-0 px-1 leading-tight ${c.subColor}`}>
              {c.sub}
            </p>
          </div>
        ))}
      </div>

      {/* SECCIÓN PRINCIPAL: Tablas */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch flex-1 min-h-0">
        
        {/* TOP CLIENTES */}
        <div className="lg:col-span-4 bg-[#111111] border border-[#2a2a2a] rounded-[12px] shadow-none flex flex-col h-full overflow-hidden">
          <div className="px-5 py-4 flex justify-between items-center border-b border-[#2a2a2a]">
            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4 text-[#f59e0b]" />
              <h2 className="text-[14px] font-medium text-[#f0f0f0] m-0">Top Clientes</h2>
            </div>
            <span className="text-[11px] font-medium text-[#8a8a8a] uppercase tracking-wider">por visitas</span>
          </div>

          <div className="flex items-center justify-between px-5 py-2.5 border-b border-[#2a2a2a]">
            <span className="text-[11px] font-medium text-[#8a8a8a] uppercase tracking-wider">Paciente</span>
            <span className="text-[11px] font-medium text-[#8a8a8a] uppercase tracking-wider">Consultas</span>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {topClientes.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 opacity-50">
                <p className="text-[13px] text-[#8a8a8a] text-center">Sin datos suficientes</p>
              </div>
            ) : (
              <ul className="flex flex-col m-0 p-0">
                {topClientes.map((cliente, idx) => {
                  // Colores de rank para los 3 primeros
                  const rankColor =
                    idx === 0 ? 'text-[#f59e0b]' :
                    idx === 1 ? 'text-[#9ca3af]' :
                    idx === 2 ? 'text-[#92400e]' :
                    'text-[#444]';


                  return (
                    <li
                      key={cliente.id || idx}
                      onClick={() => cliente.id && navigate(`/pacientes/${cliente.id}`)}
                      className="flex items-center gap-3 px-5 py-[13px] border-b border-[#2a2a2a] last:border-0 hover:bg-[#1a1a1a] transition-colors cursor-pointer group"
                    >
                      {/* Rank */}
                      <span className={`text-[13px] font-bold w-5 shrink-0 ${rankColor}`}>
                        {idx < 3 ? ['①','②','③'][idx] : `${idx + 1}`}
                      </span>

                      {/* Nombre + badge */}
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-medium text-[#f0f0f0] m-0 truncate group-hover:text-white transition-colors">
                          {cliente.nombre}
                        </p>
                      </div>

                      {/* Conteo */}
                      <span className="text-[13px] font-bold text-[#f0f0f0] tabular-nums shrink-0">
                        {String(cliente.valoraciones).padStart(2, '0')}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>

        {/* ULTIMOS PACIENTES (2/3 Width on Large Screens) */}
        <div className="lg:col-span-8 bg-[#111111] border border-[#2a2a2a] rounded-[12px] shadow-none flex flex-col h-full overflow-hidden">
          <div className="px-5 py-4 border-b border-[#2a2a2a]">
            <h2 className="text-[14px] font-medium text-[#f0f0f0] m-0">
              Últimos Pacientes
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
                  <th className="px-3 py-3 text-[12px] font-medium text-[#8a8a8a]">Estatus</th>
                  <th className="px-3 py-3 text-[12px] font-medium text-[#8a8a8a]">Fecha de Consulta</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2a2a2a]">
                {ultimosPendientes.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-12 text-center">
                      <p className="text-[13px] text-[#8a8a8a]">Sin pacientes pendientes. Todo al día ✨</p>
                    </td>
                  </tr>
                ) : (
                  ultimosPendientes.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((item, i) => {
                    const dateStr = item.fecha
                      ? new Date(item.fecha.includes('T') ? item.fecha.split('T')[0] + 'T12:00:00' : item.fecha)
                          .toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
                      : '—';
                    return (
                      <tr
                        key={`${item.pacienteId}-${item.val.id || i}`}
                        className="hover:bg-[#1a1a1a] transition-colors cursor-pointer group whitespace-nowrap"
                        onClick={() => navigate(`/pacientes/${item.pacienteId}`)}
                      >
                        <td className="pl-5 pr-3 py-[14px] text-center w-12">
                          <Square className="w-4 h-4 text-[#444] inline-block opacity-50 group-hover:opacity-100 transition-opacity" />
                        </td>
                        <td className="px-3 py-[14px]">
                          <span className="text-[13px] font-medium text-[#f0f0f0]">{item.nombre}</span>
                        </td>
                        <td className="px-3 py-[14px]">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[12px] font-medium border uppercase tracking-wider ${item.statusInfo.cls}`}>
                            {item.statusInfo.text}
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
                Mostrando {ultimosPendientes.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : '0'} a {Math.min(currentPage * itemsPerPage, ultimosPendientes.length)} Resultados de {ultimosPendientes.length}
             </div>
             
             <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6">
                <div className="flex items-center gap-3">
                   <span className="text-[12px] font-medium text-[#8a8a8a]">Filas por página</span>
                   <select 
                      className="flex items-center justify-between px-3 py-1.5 bg-[#181818] border border-[#2a2a2a] rounded-[6px] gap-2 hover:border-[#444] outline-none text-[12px] font-medium text-[#f0f0f0] cursor-pointer transition-colors"
                      value={itemsPerPage}
                      onChange={(e) => {
                        setItemsPerPage(Number(e.target.value));
                        setCurrentPage(1);
                      }}
                   >
                     <option value={5}>5</option>
                     <option value={10}>10</option>
                     <option value={20}>20</option>
                   </select>
                </div>
                
                <div className="flex items-center gap-1">
                   <button 
                      onClick={() => setCurrentPage(1)}
                      className="p-1 px-[5px] bg-transparent border border-transparent rounded-[6px] text-[#8a8a8a] hover:bg-[#1a1a1a] transition-colors disabled:opacity-50" 
                      disabled={currentPage === 1}
                   >
                      <ChevronsLeft className="w-4 h-4" />
                   </button>
                   <button 
                      onClick={() => setCurrentPage(max => Math.max(1, max - 1))}
                      className="p-1 px-[5px] bg-transparent border border-transparent rounded-[6px] text-[#8a8a8a] hover:bg-[#1a1a1a] transition-colors disabled:opacity-50" 
                      disabled={currentPage === 1}
                   >
                      <ChevronLeft className="w-4 h-4" />
                   </button>
                   <span className="text-[12px] font-medium text-[#f0f0f0] mx-2 select-none">
                      {currentPage} / {Math.max(1, Math.ceil(ultimosPendientes.length / itemsPerPage))}
                   </span>
                   <button 
                      onClick={() => setCurrentPage(min => Math.min(Math.ceil(ultimosPendientes.length / itemsPerPage), min + 1))}
                      className="p-1 px-[5px] bg-transparent border border-transparent rounded-[6px] text-[#8a8a8a] hover:bg-[#1a1a1a] transition-colors" 
                      disabled={currentPage >= Math.ceil(ultimosPendientes.length / itemsPerPage)}
                   >
                      <ChevronRight className="w-4 h-4" />
                   </button>
                   <button 
                      onClick={() => setCurrentPage(Math.max(1, Math.ceil(ultimosPendientes.length / itemsPerPage)))}
                      className="p-1 px-[5px] bg-transparent border border-transparent rounded-[6px] text-[#8a8a8a] hover:bg-[#1a1a1a] transition-colors" 
                      disabled={currentPage >= Math.ceil(ultimosPendientes.length / itemsPerPage)}
                   >
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
