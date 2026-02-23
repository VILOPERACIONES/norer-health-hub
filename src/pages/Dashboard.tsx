import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, UserPlus, ClipboardList, CreditCard, AlertTriangle, ArrowRight, CheckCircle2 } from 'lucide-react';
import api from '@/lib/api';
import type { DashboardMetricas, Alerta } from '@/types';
import { useToast } from '@/hooks/use-toast';

const mockMetricas: DashboardMetricas = {
  totalPacientes: 47,
  nuevosEsteMes: 5,
  planesEsteMes: 12,
  membresiasActivas: { total: 18, basica: 11, premium: 7 },
};

const mockAlertas: Alerta[] = [
  { pacienteId: '1', nombre: 'Ana García López', telefono: '555-123-4567', diasSinVisita: 45 },
  { pacienteId: '2', nombre: 'Carlos Ramírez', telefono: '555-987-6543', diasSinVisita: 38 },
];

const Dashboard = () => {
  const [metricas, setMetricas] = useState<DashboardMetricas>(mockMetricas);
  const [alertas, setAlertas] = useState<Alerta[]>(mockAlertas);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [metRes, alertRes] = await Promise.all([
          api.get('/api/dashboard/metricas'),
          api.get('/api/dashboard/alertas'),
        ]);
        setMetricas(metRes.data);
        setAlertas(alertRes.data);
      } catch {
        // Use mock data on failure
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const cards = [
    { label: 'Total pacientes', value: metricas.totalPacientes, icon: Users, color: 'text-primary' },
    { label: 'Nuevos este mes', value: metricas.nuevosEsteMes, icon: UserPlus, color: 'text-blue-600' },
    { label: 'Planes creados', value: metricas.planesEsteMes, icon: ClipboardList, color: 'text-amber-600' },
    {
      label: 'Membresías activas',
      value: metricas.membresiasActivas.total,
      icon: CreditCard,
      color: 'text-violet-600',
      sub: `${metricas.membresiasActivas.basica} Básica · ${metricas.membresiasActivas.premium} Premium`,
    },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">Resumen general de tu práctica</p>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {cards.map((c) => (
          <div key={c.label} className="norer-card flex items-start gap-4">
            <div className={`p-2.5 rounded-lg bg-muted ${c.color}`}>
              <c.icon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{c.label}</p>
              <p className="text-2xl font-bold text-foreground">{c.value}</p>
              {c.sub && <p className="text-xs text-muted-foreground mt-0.5">{c.sub}</p>}
            </div>
          </div>
        ))}
      </div>

      {/* Alerts */}
      <div className="norer-card">
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle className="h-4 w-4 text-amber-500" />
          <h2 className="font-semibold text-foreground">Pacientes sin visita reciente</h2>
        </div>

        {alertas.length === 0 ? (
          <div className="flex items-center gap-2 text-primary py-4">
            <CheckCircle2 className="h-5 w-5" />
            <span className="text-sm font-medium">Todos los pacientes están al día ✓</span>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {alertas.map((a) => (
              <div key={a.pacienteId} className="flex items-center justify-between py-3">
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">{a.nombre}</p>
                  <p className="text-xs text-muted-foreground">{a.telefono}</p>
                </div>
                <span className="text-sm font-medium text-destructive mr-4">
                  {a.diasSinVisita} días
                </span>
                <button
                  onClick={() => navigate(`/pacientes/${a.pacienteId}`)}
                  className="text-xs text-primary hover:text-accent font-medium flex items-center gap-1"
                >
                  Ver paciente <ArrowRight className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick actions */}
      <div className="flex flex-wrap gap-3">
        <button
          onClick={() => navigate('/pacientes/nuevo')}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-accent transition-colors"
        >
          <UserPlus className="h-4 w-4" /> Nuevo paciente
        </button>
        <button
          onClick={() => navigate('/pacientes')}
          className="flex items-center gap-2 bg-card text-foreground border border-border px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-muted transition-colors"
        >
          <Users className="h-4 w-4" /> Ver todos los pacientes
        </button>
      </div>
    </div>
  );
};

export default Dashboard;
