import { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Edit, Plus, ChevronDown, X, User, Phone, Mail, Clock, Calendar, Shield, Hash, Activity, Heart, ClipboardList, Trash2, ArrowLeft, Send, FileText } from 'lucide-react';
import api from '@/lib/api';
import type { Paciente, Valoracion, Plan } from '@/types';
import { formatDate, formatDateShort, formatDecimal, getBadgeForValuation } from '@/lib/format';
import { useToast } from '@/hooks/use-toast';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';

// --- Sub-componentes Estilo Moderno & Premium ---

const InfoItem = ({ label, value, icon: Icon }: { label: string, value: string | number, icon: any }) => (
  <div className="flex items-center gap-4 py-3 border-r border-border-subtle last:border-r-0 px-6 first:pl-0 group">
    <div className="flex-shrink-0 p-2 bg-bg-elevated border border-border-subtle rounded-[8px] group-hover:bg-[#222] transition-colors">
      <Icon className="h-4 w-4 text-text-secondary group-hover:text-text-primary transition-colors" />
    </div>
    <div className="flex flex-col">
      <span className="text-[11px] font-medium text-text-muted uppercase tracking-widest leading-none mb-1.5">{label}</span>
      <span className="text-[14px] font-semibold text-text-primary uppercase tracking-tight truncate max-w-[160px]">{value}</span>
    </div>
  </div>
);

const KpiCardCompact = ({ label, value, active, icon: Icon }: { label: string, value: any, active?: boolean, icon?: any }) => (
  <div className={`relative overflow-hidden py-6 px-6 border rounded-[12px] flex flex-col items-start justify-center transition-all duration-300 flex-1 group ${active ? 'bg-bg-elevated border-[#444]' : 'bg-bg-surface border-border-subtle text-text-primary'}`}>
    <div className="flex items-center gap-3 mb-2">
      {Icon && <Icon className={`h-4 w-4 ${active ? 'text-brand-primary' : 'text-text-secondary'}`} />}
      <span className={`text-[12px] font-medium uppercase tracking-widest leading-none ${active ? 'text-brand-primary' : 'text-text-secondary'}`}>{label}</span>
    </div>
    <span className="text-[28px] font-bold tracking-tighter leading-none text-text-primary">{value}</span>
  </div>
);

const ChartBox = ({ title, children }: { title: string, children: React.ReactNode }) => (
  <div className="border border-border-subtle p-6 bg-bg-surface flex flex-col rounded-[12px] min-h-[300px]">
    <h2 className="text-[12px] font-medium uppercase tracking-widest mb-6 text-text-secondary leading-none">
      {title}
    </h2>
    <div className="w-full flex-1 min-h-0">
      {children}
    </div>
  </div>
);

const AccordionRow = ({ val, index, onVerDetalles, onVerPlan, onAsignarPlan, onEditPlan }: { 
  val: Valoracion, 
  index: number, 
  onVerDetalles: (id: string) => void, 
  onVerPlan: (id: string) => void, 
  onAsignarPlan: (id: string) => void,
  onEditPlan: (id: string) => void
}) => {
  const [isOpen, setIsOpen] = useState(index === 0);
  const planId = (val as any).planId;
  const estadoEnvio = (val as any).estadoEnvio || (val as any).plan?.estadoEnvio || 'pendiente';

  return (
    <div className="bg-bg-elevated/30 border border-border-subtle rounded-[12px] overflow-hidden group">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full text-left p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-bg-elevated/50 transition-colors"
      >
        <div className="flex items-center gap-4">
           <div className="w-10 h-10 rounded-full bg-bg-surface border border-border-subtle flex items-center justify-center font-bold text-[14px] text-text-primary">
             #{(val as any).numeroValoracion || '—'}
           </div>
           <div>
             <h3 className="text-[16px] font-bold text-text-primary m-0 tracking-tight">{formatDate(val.fecha)}</h3>
             <p className="text-[12px] font-medium text-text-muted mt-0.5 uppercase tracking-wider">{val.id.slice(-8).toUpperCase()}</p>
           </div>
        </div>

        <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-8">
          <div className="flex gap-6">
            <div className="space-y-1">
               <p className="text-[10px] font-medium text-text-muted uppercase tracking-widest leading-none">Peso</p>
               <p className="text-[14px] font-bold text-text-primary m-0">{formatDecimal(val.pesoActual || val.peso)} <span className="text-[11px] font-normal text-text-secondary">kg</span></p>
            </div>
            <div className="space-y-1">
               <p className="text-[10px] font-medium text-text-muted uppercase tracking-widest leading-none">% Grasa</p>
               <p className="text-[14px] font-bold text-text-primary m-0">{formatDecimal((val as any).pctGrasaCorp || (val as any).pctGrasaCorporal4comp || (val as any).pctGrasa2comp || (val as any).pctGrasa || 0)} <span className="text-[11px] font-normal text-text-secondary">%</span></p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {(() => {
              const bg = getBadgeForValuation(val);
              return (
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium border uppercase tracking-wider ${bg.cls}`}>
                  {bg.text}
                </span>
              );
            })()}
          </div>

          <div className="h-4 w-[1px] bg-border-subtle hidden md:block" />
          <div className={`p-1.5 rounded-full bg-bg-surface border border-border-subtle transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}>
            <ChevronDown className="h-4 w-4 text-text-secondary" />
          </div>
        </div>
      </button>
      
      {isOpen && (
        <div className="p-6 bg-bg-surface text-text-primary animate-slide-down">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-8">
            <MetricItem label="ESTATURA" value={`${(() => {
              const raw = parseFloat(String(val.estatura || val.talla));
              if (!raw) return '—';
              return raw < 10 ? Math.round(raw * 100) : raw;
            })()} cm`} />
            <MetricItem label="IMC" value={String(formatDecimal(val.imc))} />
            <MetricItem label="% GRASA" value={`${(val as any).pctGrasaCorp || (val as any).pctGrasaCorporal4comp || (val as any).pctGrasa2comp || (val as any).pctGrasa || '—'}%`} />
            <MetricItem label="MASA MAGRA" value={`${(val as any).masaMagra || '—'} kg`} />
          </div>
          
          <div className="flex flex-wrap items-center gap-4 pt-6 border-t border-border-subtle">
            <button 
              onClick={() => onVerDetalles(val.id)}
              className="flex items-center gap-2 px-[18px] py-[10px] bg-bg-elevated text-text-primary text-[12px] font-medium border border-border-subtle rounded-[8px] hover:bg-[#222] transition-colors"
            >
              <ClipboardList className="h-[18px] w-[18px]" /> Ver detalles clínicos
            </button>
            {!planId ? (
              <button 
                onClick={() => onAsignarPlan(val.id)}
                className="flex items-center gap-2 px-[18px] py-[10px] bg-[#1a0f00] text-accent-orange text-[12px] font-medium border border-accent-orange/30 rounded-[8px] hover:bg-[#2a1a00] transition-colors"
              >
                <Plus className="h-[18px] w-[18px]" /> Asignar plan
              </button>
            ) : (
              <div className="flex flex-wrap gap-2">
                <button 
                  onClick={() => onVerPlan(planId)}
                  className="flex items-center gap-2 px-[18px] py-[10px] bg-bg-surface text-text-primary border border-border-subtle rounded-[8px] text-[12px] font-medium transition-colors hover:bg-bg-elevated"
                >
                  <FileText className="h-[18px] w-[18px]" /> {estadoEnvio === 'enviado' ? 'Ver plan' : 'Ver y preparar envío'}
                </button>
                {estadoEnvio === 'pendiente' && (
                  <button 
                    onClick={() => onEditPlan(planId)}
                    className="flex items-center gap-2 px-[18px] py-[10px] bg-bg-elevated text-text-secondary border border-border-subtle rounded-[8px] text-[12px] font-medium transition-colors hover:bg-[#222] hover:text-text-primary"
                  >
                    <Edit className="h-[18px] w-[18px]" /> Editar
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const MetricItem = ({ label, value, alert }: { label: string, value: string, alert?: boolean }) => (
  <div className="space-y-1 flex flex-col bg-bg-elevated p-4 rounded-[8px] border border-border-subtle">
    <p className="text-[10px] font-medium text-text-muted uppercase tracking-widest leading-tight">{label}</p>
    <p className={`text-[16px] font-semibold tracking-tight ${alert ? 'text-accent-red font-bold' : 'text-text-primary'}`}>{value}</p>
  </div>
);

const ClinicalSection = ({ title, data, icon: Icon }: { title: string, data: Record<string, any>, icon?: any }) => (
  <div className="space-y-6 bg-bg-elevated p-6 rounded-[12px] border border-border-subtle">
    <div className="flex items-center gap-3 border-b border-border-subtle pb-4">
      {Icon && <Icon className="h-4 w-4 text-text-secondary" />}
      <h4 className="text-[12px] font-medium text-text-primary uppercase tracking-widest">{title}</h4>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Object.entries(data).map(([key, value]) => (
        <div key={key} className="space-y-1 group">
          <p className="text-[10px] font-medium text-text-muted uppercase tracking-widest leading-none">{key.replace(/([A-Z])/g, ' $1').trim()}</p>
          <p className="text-[14px] font-medium text-text-primary tracking-tight">{value || '—'}</p>
        </div>
      ))}
    </div>
  </div>
);

const PatientProfile = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [paciente, setPaciente] = useState<Paciente | null>(null);
  const [valoraciones, setValoraciones] = useState<Valoracion[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFullExpediente, setShowFullExpediente] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [pacRes, valRes] = await Promise.all([
          api.get(`/api/pacientes/${id}`),
          api.get(`/api/pacientes/${id}/valoraciones`)
        ]);
        
        const pData = pacRes.data?.data || pacRes.data;
        setPaciente(pData);

        const vals = valRes.data?.data || valRes.data || [];
        if (Array.isArray(vals)) {
          const processed = vals
            .filter(v => v && v.fecha)
            .map(v => ({
              ...v,
              pesoEvolucion: parseFloat((v.pesoActual || v.peso || 0).toString().replace(',', '.')),
              grasaEvolucion: parseFloat((v.pctGrasa || v.pctGrasa2comp || v.pctGrasaCorporal4comp || v.pctGrasaCorp || 0).toString().replace(',', '.')),
              masaMagraEvolucion: parseFloat((v.masaMagra || v.kgMasaMagra2comp || v.kgMasaMagra4comp || 0).toString().replace(',', '.'))
            }))
            .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
          setValoraciones(processed);
        }
      } catch (err) {
        toast({ title: 'Error', description: 'Error al sincronizar nodo maestro.', variant: 'destructive' });
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id, toast]);

  useEffect(() => {
    if (location.hash === '#historial' && !loading) {
      const el = document.getElementById('historial');
      if (el) {
        setTimeout(() => {
          el.scrollIntoView({ behavior: 'smooth' });
        }, 500);
      }
    }
  }, [location.hash, loading]);

  const handleDelete = async () => {
    if (!window.confirm('¿ESTÁ SEGURO DE PURGAR ESTE PACIENTE? ESTA ACCIÓN ELIMINARÁ TODO EL HISTORIAL CLÍNICO Y VALORACIONES.')) return;
    try {
      await api.delete(`/api/pacientes/${id}`);
      toast({ title: 'EXPEDIENTE ELIMINADO', description: 'El paciente y toda su data han sido borrados del sistema.' });
      navigate('/pacientes');
    } catch (err) {
      toast({ title: 'Error de Purga', description: 'No se pudo eliminar el expediente. Verifique la conexión con el servidor.', variant: 'destructive' });
    }
  };

  if (loading || !paciente) return (
    <div className="flex flex-col items-center justify-center gap-4 h-[calc(100vh-120px)]">
      <div className="w-8 h-8 border-[3px] border-white/20 border-t-white rounded-full animate-spin" />
      <p className="text-[14px] font-medium text-text-muted">Cargando expediente...</p>
    </div>
  );

  const calcAge = (dob?: string) => {
    if (!dob) return '—';
    const cleanDob = dob.includes('T') ? dob.split('T')[0] : dob;
    const diff = Date.now() - new Date(cleanDob).getTime();
    return Math.floor(diff / 31557600000);
  };

  const currentVal = valoraciones[0];
  const historyData = [...valoraciones].reverse();

  return (
    <div className="min-h-screen bg-bg-base text-text-primary font-sans pb-24 animate-fade-in selection:bg-brand-primary selection:text-bg-base">
      {/* HEADER */}
      <header className="w-full border-b border-border-subtle pt-4 pb-6 flex flex-col md:flex-row justify-between items-start gap-4 bg-bg-base">
        <div className="flex items-start gap-4">
          <button 
            onClick={() => navigate('/pacientes')} 
            className="mt-1 p-2 rounded-[8px] border border-border-subtle text-text-secondary hover:text-text-primary hover:bg-bg-elevated transition-colors"
            title="Volver a la Lista"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="flex flex-col">
            <div className="flex items-center gap-3">
              <h1 className="text-[26px] font-bold text-text-primary m-0 tracking-tight">
                {paciente.nombre} {paciente.apellido}
              </h1>
              {currentVal && (
                <span className={`px-2.5 py-1 rounded-full text-[12px] font-medium border ${getBadgeForValuation(currentVal).cls}`}>
                  {getBadgeForValuation(currentVal).text}
                </span>
              )}
            </div>
            <p className="text-[14px] font-medium text-text-secondary mt-1 m-0">
               Expediente Clínico · ID {id?.slice(-8).toUpperCase()}
            </p>
          </div>
        </div>
        <div className="flex gap-3 w-full md:w-auto mt-2 md:mt-0">
          <button
            onClick={() => setShowFullExpediente(!showFullExpediente)}
            className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-[18px] py-[10px] text-[14px] font-medium transition-colors rounded-[8px] border ${showFullExpediente ? 'bg-bg-elevated border-border-subtle text-text-primary' : 'bg-transparent border-border-default text-text-primary hover:bg-bg-elevated'}`}
          >
            {showFullExpediente ? <X className="h-4 w-4" /> : <ClipboardList className="h-4 w-4" />}
            {showFullExpediente ? 'Cerrar Detalles' : 'Ver Detalles del Expediente'}
          </button>
          <button
            onClick={() => navigate(`/pacientes/${id}/editar`)}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-[18px] py-[10px] bg-bg-elevated text-text-primary border border-border-subtle text-[14px] font-medium transition-colors rounded-[8px] hover:bg-[#222]"
          >
            <Edit className="h-4 w-4" /> Editar Perfil
          </button>
          <button
            onClick={handleDelete}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-[14px] py-[10px] bg-[#2e1a1a] text-accent-red border border-accent-red/20 text-[14px] font-medium transition-colors rounded-[8px] hover:bg-[#3d1a1a]"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </header>

      <div className="max-w-full py-6 space-y-10">
        {/* INFO BAR */}
        <section className="flex flex-wrap bg-bg-surface border border-border-subtle rounded-[12px] p-2">
          <InfoItem label="Edad" value={`${calcAge(paciente.fechaNacimiento)} Años`} icon={Clock} />
          <InfoItem label="Sexo" value={paciente.sexo === 'F' ? 'Femenino' : 'Masculino'} icon={User} />
          <InfoItem label="Teléfono" value={paciente.telefono} icon={Phone} />
          <InfoItem label="Email" value={paciente.email || '—'} icon={Mail} />
          <InfoItem label="Suscripción" value={paciente.nivelMembresia || 'Ninguna'} icon={Shield} />
          <InfoItem label="Registro" value={formatDate(paciente.fechaRegistro)} icon={Calendar} />
        </section>

        {showFullExpediente && (
          <div className="animate-slide-down space-y-8 bg-bg-surface p-8 rounded-[12px] border border-border-subtle">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-border-subtle pb-6">
              <div>
                <h3 className="text-[20px] font-bold text-text-primary m-0 tracking-tight">Detalles Completos del Expediente</h3>
                <p className="text-[14px] text-text-secondary m-0">Información clínica y hábitos registrados</p>
              </div>
              <button
                onClick={() => navigate(`/pacientes/${id}/editar`)}
                className="flex items-center gap-2 px-[18px] py-[10px] bg-bg-elevated text-text-primary border border-border-subtle text-[14px] font-medium transition-colors rounded-[8px] hover:bg-[#222]"
              >
                <Edit className="h-4 w-4" /> Editar Expediente Completo
              </button>
            </div>

            <div className="grid lg:grid-cols-2 gap-8">
              <ClinicalSection title="Estilo de Vida y Dinámica" icon={Activity} data={{
                'Objetivo': (paciente.ejercicio || (paciente as any).datosEjercicio)?.objetivo || 'N/A',
                'Gym de Origen': (paciente.ejercicio || (paciente as any).datosEjercicio)?.gymOrigen || 'N/A',
                'Disciplina': (paciente.ejercicio || (paciente as any).datosEjercicio)?.disciplina || 'N/A',
                'Frecuencia': (paciente.ejercicio || (paciente as any).datosEjercicio)?.frecuencia || 'N/A',
                'Duración': (paciente.ejercicio || (paciente as any).datosEjercicio)?.tiempo || 'N/A',
                'Nivel Actividad': (paciente.ejercicio || (paciente as any).datosEjercicio)?.nivelActividad || 'N/A',
                'Distribución Actividad': `${(paciente.ejercicio || (paciente as any).datosEjercicio)?.porcentajeSedentario || 0}% S / ${(paciente.ejercicio || (paciente as any).datosEjercicio)?.porcentajeLeve || 0}% L / ${(paciente.ejercicio || (paciente as any).datosEjercicio)?.porcentajeModerado || 0}% M / ${(paciente.ejercicio || (paciente as any).datosEjercicio)?.porcentajeIntenso || 0}% I`,
              }} />
              
              <ClinicalSection title="Perfil Clínico y Patologías" icon={Heart} data={{
                'Patología': paciente.antecedentes?.patologia || 'N/A',
                'Cirugías / Traumas': paciente.antecedentes?.cirugias || 'N/A',
                'Alergias': paciente.antecedentes?.alergias || 'N/A',
                'Tránsito Intestinal': paciente.antecedentes?.estrenimiento || 'N/A',
                'Agua al día': paciente.antecedentes?.agua || 'N/A',
                'Alcohol': paciente.antecedentes?.consumoAlcohol || 'N/A',
                'Tabaco': paciente.antecedentes?.tabaco || 'N/A',
              }} />

              <ClinicalSection title="Hábitos (Usualmente vs Ayer)" icon={Clock} data={{
                'Desayuno': `${(paciente as any).habitos?.desayuno?.usualmente || (paciente as any).consumoCalorico?.usalmenteDesayuno || 'N/A'} (Ayer: ${(paciente as any).habitos?.desayuno?.ayer || (paciente as any).consumoCalorico?.ayerDesayuno || '—'})`,
                'Colación 1': `${(paciente as any).habitos?.colacion1?.usualmente || (paciente as any).consumoCalorico?.usalmenteColacion1 || 'N/A'} (Ayer: ${(paciente as any).habitos?.colacion1?.ayer || (paciente as any).consumoCalorico?.ayerColacion1 || '—'})`,
                'Almuerzo': `${(paciente as any).habitos?.almuerzo?.usualmente || (paciente as any).consumoCalorico?.usalmenteAlmuerzo || 'N/A'} (Ayer: ${(paciente as any).habitos?.almuerzo?.ayer || (paciente as any).consumoCalorico?.ayerAlmuerzo || '—'})`,
                'Colación 2': `${(paciente as any).habitos?.colacion2?.usualmente || (paciente as any).consumoCalorico?.usalmenteColacion2 || 'N/A'} (Ayer: ${(paciente as any).habitos?.colacion2?.ayer || (paciente as any).consumoCalorico?.ayerColacion2 || '—'})`,
                'Cena': `${(paciente as any).habitos?.cena?.usualmente || (paciente as any).consumoCalorico?.usalmenteCena || 'N/A'} (Ayer: ${(paciente as any).habitos?.cena?.ayer || (paciente as any).consumoCalorico?.ayerCena || '—'})`,
              }} />

              <ClinicalSection title="Suplementación y Notas" icon={Shield} data={{
                'Historial Suplementos': paciente.antecedentes?.historialProductos || 'N/A',
                'Propuesta Nutriólogo': paciente.antecedentes?.recomendacionSuplementos || 'N/A',
                'Preferencias (Gusta)': paciente.antecedentes?.alimentosGustan || 'N/A',
                'Aversiones (No gusta)': paciente.antecedentes?.alimentosNoGustan || 'N/A',
                'Signos y Síntomas': paciente.antecedentes?.signosYSintomas || 'N/A'
              }} />
            </div>
          </div>
        )}

        <div className="flex justify-between items-center pt-4">
           <div>
             <h2 className="text-[18px] font-semibold text-text-primary m-0 mb-1">Indicadores Críticos</h2>
             <p className="text-[14px] text-text-secondary m-0">Métricas principales de progreso físico</p>
           </div>
           <button
             onClick={() => navigate(`/pacientes/${id}/valoracion/nueva`)}
             className="flex items-center gap-2 px-[18px] py-[10px] bg-brand-primary text-bg-base text-[14px] font-medium rounded-[8px] hover:bg-[#e0e0e0] transition-colors"
           >
             <Plus className="h-[18px] w-[18px]" /> Nueva Valoración
           </button>
        </div>

        {/* KPIs */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <KpiCardCompact label="Peso Actual" value={`${currentVal?.pesoActual || currentVal?.peso || '--'} KG`} icon={Activity} />
          <KpiCardCompact label="Masa Magra" value={`${(currentVal as any)?.masaMagra || currentVal?.kgMasaMagra2comp || '--'} KG`} active icon={Shield} />
          <KpiCardCompact label="Porcentaje Grasa" value={`${(currentVal as any)?.pctGrasaCorp || (currentVal as any)?.pctGrasaCorporal4comp || currentVal?.pctGrasa2comp || (currentVal as any)?.pctGrasa || '--'}%`} icon={Heart} />
        </section>

        {/* PROGRESS CHARTS HIGH-CONTRAST */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <ChartBox title="Evolución de Peso (KG)">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={historyData} margin={{ top: 10, right: 10, left: -25, bottom: 20 }}>
                <defs>
                  <linearGradient id="premiumGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f0f0f0" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#f0f0f0" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" vertical={false} />
                <XAxis 
                  dataKey="fecha" 
                  tickFormatter={(val) => formatDateShort(val)}
                  tick={{ fontSize: 10, fontWeight: 500, fill: '#8a8a8a' }}
                  axisLine={false}
                  tickLine={false}
                  dy={10}
                />
                <YAxis 
                  tick={{ fontSize: 10, fontWeight: 500, fill: '#8a8a8a' }}
                  axisLine={false}
                  tickLine={false}
                  domain={['auto', 'auto']}
                />
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: '1px solid #2a2a2a', background: '#111111', color: '#f0f0f0', fontSize: '12px' }}
                  itemStyle={{ color: '#f0f0f0', textTransform: 'uppercase' }}
                  labelStyle={{ display: 'none' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="pesoEvolucion" 
                  name="Peso"
                  stroke="#f0f0f0" 
                  strokeWidth={2} 
                  fillOpacity={1} 
                  fill="url(#premiumGradient)" 
                  dot={{ r: 4, fill: '#111', stroke: '#f0f0f0', strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </ChartBox>

          <ChartBox title="Grasa Corporal (%)">
             <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={historyData} margin={{ top: 10, right: 10, left: -25, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" vertical={false} />
                <XAxis 
                  dataKey="fecha" 
                  tickFormatter={(val) => formatDateShort(val)}
                  tick={{ fontSize: 10, fontWeight: 500, fill: '#8a8a8a' }}
                  axisLine={false}
                  tickLine={false}
                  dy={10}
                />
                <YAxis 
                  tick={{ fontSize: 10, fontWeight: 500, fill: '#8a8a8a' }}
                  axisLine={false}
                  tickLine={false}
                  domain={['auto', 'auto']}
                />
                <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #2a2a2a', background: '#111', color: '#f0f0f0' }} labelStyle={{ display: 'none' }} />
                <Area 
                  type="monotone" 
                  dataKey="grasaEvolucion" 
                  name="Grasa"
                  stroke="#8a8a8a" 
                  strokeWidth={2} 
                  fill="rgba(138, 138, 138, 0.05)"
                  dot={{ r: 3, fill: '#8a8a8a' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </ChartBox>

          <ChartBox title="Masa Magra (KG)">
               <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={historyData} margin={{ top: 10, right: 10, left: -25, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" vertical={false} />
                <XAxis 
                  dataKey="fecha" 
                  tickFormatter={(val) => formatDateShort(val)}
                  tick={{ fontSize: 10, fontWeight: 500, fill: '#8a8a8a' }}
                  axisLine={false}
                  tickLine={false}
                  dy={10}
                />
                <YAxis 
                  tick={{ fontSize: 10, fontWeight: 500, fill: '#8a8a8a' }}
                  axisLine={false}
                  tickLine={false}
                  domain={['auto', 'auto']}
                />
                <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #2a2a2a', background: '#111', color: '#f0f0f0' }} labelStyle={{ display: 'none' }} />
                <Area 
                  type="monotone" 
                  dataKey="masaMagraEvolucion" 
                  name="Masa Magra"
                  stroke="#22c55e" 
                  strokeWidth={2} 
                  fill="rgba(34, 197, 94, 0.05)"
                  dot={{ r: 4, fill: '#111', stroke: '#22c55e', strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </ChartBox>
        </section>

        {/* LOG DE CONSULTAS */}
        <section className="space-y-6 pt-4" id="historial">
          <div className="flex items-center gap-4">
            <h2 className="text-[18px] font-semibold text-text-primary m-0">Historial Clínico</h2>
            <div className="flex-1 h-[1px] bg-border-subtle" />
          </div>
          
          {valoraciones.length > 0 ? (
            <div className="space-y-3">
              {valoraciones.map((v, i) => (
                 <AccordionRow 
                   key={v.id} 
                   val={v} 
                   index={i} 
                   onVerDetalles={(valId) => navigate(`/pacientes/${id}/valoraciones/${valId}`)}
                   onVerPlan={(planId) => navigate(`/pacientes/${id}/planes/${planId}`)}
                   onAsignarPlan={(valId) => navigate(`/pacientes/${id}/planes/nuevo?valoracionId=${valId}`)}
                   onEditPlan={(planId) => navigate(`/pacientes/${id}/planes/${planId}/editar`)}
                 />
              ))}
            </div>
          ) : (
            <div className="py-20 text-center border border-border-default border-dashed rounded-[12px] bg-bg-surface">
              <ClipboardList className="h-8 w-8 text-text-muted mx-auto mb-4" />
              <p className="text-[14px] font-medium text-text-secondary">Aún no hay valoraciones clínicas registradas</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default PatientProfile;
