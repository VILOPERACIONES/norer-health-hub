import { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Edit, Plus, ChevronDown, X, User, Phone, Mail, Clock, Calendar, Shield, Hash, Activity, Heart, Ruler, ClipboardList, Trash2, ArrowLeft } from 'lucide-react';
import api from '@/lib/api';
import type { Paciente, Valoracion, Plan } from '@/types';
import { formatDate, formatDateShort, formatDecimal } from '@/lib/format';
import { useToast } from '@/hooks/use-toast';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';

// --- Sub-componentes Estilo Moderno & Premium ---

const InfoItem = ({ label, value, icon: Icon }: { label: string, value: string | number, icon: any }) => (
  <div className="flex items-center gap-4 py-3 border-r border-slate-100 last:border-r-0 px-6 first:pl-0 group">
    <div className="flex-shrink-0 p-2 bg-slate-50 rounded-none group-hover:bg-slate-100 transition-colors">
      <Icon className="h-4 w-4 text-slate-400 group-hover:text-slate-600 transition-colors" />
    </div>
    <div className="flex flex-col">
      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1.5">{label}</span>
      <span className="text-[12px] font-semibold text-slate-900 uppercase tracking-tight truncate max-w-[160px]">{value}</span>
    </div>
  </div>
);

const KpiCardCompact = ({ label, value, active, icon: Icon }: { label: string, value: any, active?: boolean, icon?: any }) => (
  <div className={`relative overflow-hidden py-8 px-6 border border-slate-200 flex flex-col items-center justify-center text-center transition-all duration-300 flex-1 group ${active ? 'bg-slate-900 text-white border-slate-900' : 'bg-background text-slate-900 hover:border-slate-400'}`}>
    {active && <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 -mr-12 -mt-12 rounded-none blur-2xl" />}
    <span className={`text-[9px] font-bold uppercase tracking-[0.25em] mb-3 leading-none transition-opacity ${active ? 'text-slate-400' : 'text-slate-400 group-hover:text-slate-500'}`}>{label}</span>
    <div className="flex items-center gap-3">
      {Icon && <Icon className={`h-5 w-5 ${active ? 'text-slate-400' : 'text-slate-300'}`} />}
      <span className="text-3xl font-bold tracking-tighter leading-none">{value}</span>
    </div>
  </div>
);

const ChartBox = ({ title, children }: { title: string, children: React.ReactNode }) => (
  <div className="border border-slate-200 p-8 bg-background flex flex-col hover:border-slate-300 transition-all rounded-none shadow-sm hover:shadow-md min-h-[300px]">
    <h2 className="text-[10px] font-bold uppercase tracking-[0.25em] mb-8 text-center text-slate-400 leading-none">
      {title}
    </h2>
    <div className="w-full flex-1 min-h-0">
      {children}
    </div>
  </div>
);

const AccordionRow = ({ val, index, onVerDetalles, onVerPlan, onAsignarPlan }: { 
  val: Valoracion, 
  index: number, 
  onVerDetalles: (id: string) => void, 
  onVerPlan: (id: string) => void,
  onAsignarPlan: (valId: string) => void
}) => {
  const [isOpen, setIsOpen] = useState(index === 0);
  const planId = val.plan?.id || (val as any).planId;

  return (
    <div className="border border-slate-200 bg-white mb-3 rounded-none overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between p-5 transition-all group ${isOpen ? 'bg-secondary border-b border-border/40' : 'hover:bg-secondary/50'}`}
      >
        <div className="flex items-center gap-8">
          <span className="font-bold text-[11px] text-slate-400 w-10">#{val.medicionNumero || index + 1}</span>
          <div className="flex flex-col items-start gap-1">
            <span className="font-bold uppercase tracking-widest text-[11px] text-slate-900">{formatDate(val.fecha)}</span>
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">{val.hora || '--:--'} HRS</span>
          </div>
        </div>
        <div className="flex items-center gap-10">
           {!planId && (
             <div className="flex items-center gap-2 px-3 py-1 bg-amber-50 border border-amber-200">
               <div className="w-1.5 h-1.5 bg-amber-500 rounded-none animate-pulse" />
               <span className="text-[9px] font-black text-amber-700 uppercase tracking-widest">Plan Pendiente</span>
             </div>
           )}
           <div className="hidden md:flex items-center gap-6">
             <div className="flex flex-col items-end">
               <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">PESO</span>
               <span className="text-[12px] font-bold text-slate-900">{val.pesoActual || val.peso || '--'} KG</span>
             </div>
             <div className="flex flex-col items-end">
               <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">IMC</span>
               <span className="text-[12px] font-bold text-slate-900">{val.imc || '--'}</span>
             </div>
             <div className="flex flex-col items-end">
               <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">GRASA</span>
               <span className="text-[12px] font-bold text-slate-900">{val.pctGrasaCorp || val.pctGrasa2comp || (val as any).pctGrasaCorporal4comp || '--'}%</span>
             </div>
           </div>
           <div className={`p-2 rounded-none transition-colors ${isOpen ? 'bg-slate-200' : 'group-hover:bg-slate-200'}`}>
             {isOpen ? <X className="h-4 w-4 text-slate-600" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
           </div>
         </div>
      </button>
      
      {isOpen && (
        <div className="p-8 bg-background text-slate-900 animate-slide-down">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8 mb-10">
            <MetricItem label="ESTATURA" value={`${val.estatura || val.talla || '—'} M`} />
            <MetricItem label="GLUCOSA" value={`${(val as any).glucosa || (val as any).bioquimicoGlucosa || '—'} MG/DL`} />
            <MetricItem label="PRESIÓN ART." value={(val as any).presionArterial || '—'} />
            <MetricItem label="SUMA PLIEGUES" value={`${(val as any).sumaPliegues || '—'} MM`} />
            <MetricItem label="DÉFICIT MÚSCULO" value={`${(val as any).deficitMusculo || '0'} KG`} alert={(val as any).deficitMusculo > 0} />
            <MetricItem label="SUP. CORPORAL" value={`${(val as any).superficieCorp || (val as any).superficieCorporal || '—'} M²`} />
          </div>
          
          <div className="flex flex-wrap gap-4 pt-8 border-t border-slate-100">
            <button 
              onClick={() => onVerDetalles(val.id)}
              className="flex items-center gap-2 px-6 py-2.5 border border-slate-200 text-[10px] font-bold uppercase tracking-[0.15em] rounded-none hover:bg-slate-900 hover:text-white transition-all shadow-sm"
            >
              <ClipboardList className="h-4 w-4" /> VER DETALLES
            </button>
            {planId ? (
              <button 
                onClick={() => onVerPlan(planId)}
                className="flex items-center gap-2 px-6 py-2.5 bg-slate-900 text-white text-[10px] font-bold uppercase tracking-[0.15em] rounded-none hover:bg-slate-800 transition-all border border-slate-900 shadow-md shadow-slate-200"
              >
                <Activity className="h-4 w-4" /> VER PLAN ACTIVO
              </button>
            ) : (
              <button 
                onClick={() => onAsignarPlan(val.id)}
                className="flex items-center gap-2 px-6 py-3 bg-amber-500 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-none hover:bg-amber-600 transition-all border border-amber-500 shadow-xl shadow-amber-100 animate-pulse"
              >
                <Plus className="h-4 w-4" /> ASIGNAR PLAN PENDIENTE
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const MetricItem = ({ label, value, alert }: { label: string, value: string, alert?: boolean }) => (
  <div className="space-y-1.5 flex flex-col">
    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-tight">{label}</p>
    <p className={`text-[15px] font-bold tracking-tight ${alert ? 'text-amber-600 font-extrabold' : 'text-slate-900'}`}>{value}</p>
  </div>
);

const ClinicalSection = ({ title, data, icon: Icon }: { title: string, data: Record<string, any>, icon?: any }) => (
  <div className="space-y-6 bg-background p-8 rounded-none border border-slate-100 shadow-sm transition-all hover:shadow-md hover:border-slate-200">
    <div className="flex items-center gap-3 border-b border-slate-50 pb-4">
      {Icon && <Icon className="h-4 w-4 text-slate-300" />}
      <h4 className="text-[11px] font-bold text-slate-800 uppercase tracking-[0.2em]">{title}</h4>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {Object.entries(data).map(([key, value]) => (
        <div key={key} className="space-y-2 group">
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none group-hover:text-slate-500 transition-colors">{key.replace(/([A-Z])/g, ' $1').trim()}</p>
          <p className="text-[13px] font-medium text-slate-700 uppercase tracking-tight">{value || '—'}</p>
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
              grasaEvolucion: parseFloat(v.pctGrasa2comp || v.pctGrasaCorporal4comp || 0),
              masaMagraEvolucion: parseFloat(v.kgMasaMagra2comp || v.masaMagra || v.kgMasaMagra4comp || 0)
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
    <div className="min-h-screen bg-secondary/30 flex items-center justify-center">
      <div className="flex flex-col items-center gap-6">
        <Activity className="h-10 w-10 text-slate-900 animate-pulse" />
        <div className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.6em] animate-pulse">Sincronizando Nodo Maestro</div>
      </div>
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
    <div className="min-h-screen bg-background text-slate-900 font-sans pb-24 animate-fade-in selection:bg-slate-900 selection:text-white">
      {/* HEADER PREMIUM */}
      <header className="w-full border-b border-slate-100 px-10 pt-4 pb-8 flex flex-col md:flex-row justify-between items-center gap-8 bg-background">
        <div className="flex items-start gap-8">
          <button 
            onClick={() => navigate('/pacientes')} 
            className="mt-1 w-12 h-12 flex items-center justify-center border border-slate-100 text-slate-300 hover:text-slate-900 hover:border-slate-300 hover:bg-slate-50 transition-all group"
            title="Volver a la Lista"
          >
            <ArrowLeft className="h-5 w-5 group-hover:-translate-x-1 transition-transform" />
          </button>
          <div className="flex flex-col">
            <div className="flex items-center gap-4 mb-2">
              <span className="px-3 py-1 bg-slate-100 text-slate-600 text-[9px] font-bold rounded-none tracking-widest uppercase">Paciente</span>
              <div className="flex py-1 px-3 border border-slate-200 rounded-none gap-2 items-center">
                <Hash className="h-3 w-3 text-slate-300" />
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{id?.slice(-8).toUpperCase()}</span>
              </div>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-slate-900 tracking-[-0.04em] uppercase leading-none">
              {paciente.nombre} <span className="text-slate-400">{paciente.apellido}</span>
            </h1>
            <p className="text-[10px] font-bold text-slate-300 uppercase tracking-[0.35em] mt-3 ml-1 flex items-center gap-2">
               EXPEDIENTE CLÍNICO  · <Activity className="h-3 w-3" /> NORDER HEALTH CRM
            </p>
          </div>
        </div>
        <div className="flex gap-4 w-full md:w-auto">
          <button
            onClick={() => setShowFullExpediente(!showFullExpediente)}
            className={`flex-1 md:flex-none flex items-center justify-center gap-3 px-8 py-3.5 text-[10px] font-bold uppercase tracking-[0.15em] transition-all rounded-none border border-slate-200 ${showFullExpediente ? 'bg-slate-900 text-white border-slate-900 shadow-xl shadow-slate-200' : 'bg-background text-slate-700 hover:bg-secondary'}`}
          >
            {showFullExpediente ? <X className="h-4 w-4" /> : <ClipboardList className="h-4 w-4" />}
            {showFullExpediente ? 'Cerrar Detalles' : 'Ver Expediente Completo'}
          </button>
          <button
            onClick={() => navigate(`/pacientes/${id}/editar`)}
            className="flex-1 md:flex-none flex items-center justify-center gap-3 px-8 py-3.5 bg-white text-slate-700 border border-slate-200 text-[10px] font-bold uppercase tracking-[0.15em] transition-all rounded-none hover:bg-slate-50"
          >
            <Edit className="h-4 w-4" /> Editar Perfil
          </button>
          <button
            onClick={handleDelete}
            className="flex-1 md:flex-none flex items-center justify-center gap-3 px-5 py-3.5 bg-rose-50 text-rose-600 border border-rose-100 text-[10px] font-bold uppercase tracking-[0.15em] transition-all rounded-none hover:bg-rose-600 hover:text-white hover:border-rose-600"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </header>

      <div className="max-w-full px-10 py-10 space-y-16">
        {/* INFO BAR COMPACTA & ELEGANTE */}
        <section className="flex flex-wrap border-y border-slate-100 py-2">
          <InfoItem label="EDAD" value={`${calcAge(paciente.fechaNacimiento)} AÑOS`} icon={Clock} />
          <InfoItem label="SEXO" value={paciente.sexo === 'F' ? 'FEMENINO' : 'MASCULINO'} icon={User} />
          <InfoItem label="TELÉFONO" value={paciente.telefono} icon={Phone} />
          <InfoItem label="EMAIL" value={paciente.email || '—'} icon={Mail} />
          <InfoItem label="MEMBRESÍA" value={paciente.nivelMembresia || 'NINGUNA'} icon={Shield} />
          <InfoItem label="REGISTRO" value={formatDate(paciente.fechaRegistro)} icon={Calendar} />
        </section>

        {showFullExpediente && (
          <div className="animate-slide-down space-y-12 bg-secondary/50 p-12 rounded-none border border-slate-100">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold uppercase tracking-tighter text-slate-800">Detalles del Expediente</h3>
              <div className="flex items-center gap-2">
                 <div className="w-2 h-2 rounded-none bg-slate-300 animate-pulse" />
                 <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Sincronizado</span>
              </div>
            </div>
            
            <div className="grid lg:grid-cols-2 gap-8">
              <ClinicalSection title="Estilo de Vida y Deporte" icon={Activity} data={{
                'Objetivo': (paciente.ejercicio || (paciente as any).datosEjercicio)?.objetivo || 'N/A',
                'Gym de Origen': (paciente.ejercicio || (paciente as any).datosEjercicio)?.gymOrigen || 'N/A',
                'Disciplina': (paciente.ejercicio || (paciente as any).datosEjercicio)?.disciplina || 'N/A',
                'Frecuencia': (paciente.ejercicio || (paciente as any).datosEjercicio)?.frecuencia || 'N/A',
                'Duración': (paciente.ejercicio || (paciente as any).datosEjercicio)?.tiempo || 'N/A',
                'Nivel Actividad': (paciente.ejercicio || (paciente as any).datosEjercicio)?.nivelActividad || 'N/A',
                'SEDENTARIO %': (paciente.ejercicio || (paciente as any).datosEjercicio)?.porcentajeSedentario || '0',
                'LEVE %': (paciente.ejercicio || (paciente as any).datosEjercicio)?.porcentajeLeve || '0',
                'MODERADO %': (paciente.ejercicio || (paciente as any).datosEjercicio)?.porcentajeModerado || '0',
                'INTENSO %': (paciente.ejercicio || (paciente as any).datosEjercicio)?.porcentajeIntenso || '0'
              }} />
              <ClinicalSection title="Historial Clínico" icon={Heart} data={{
                'Patología': paciente.antecedentes?.patologia || 'N/A',
                'Cirugías': paciente.antecedentes?.cirugias || 'N/A',
                'Alergias': paciente.antecedentes?.alergias || 'N/A',
                'Estreñimiento': paciente.antecedentes?.estrenimiento || 'N/A',
                'Ciclo Menstrual': paciente.antecedentes?.cicloMenstrual || 'N/A',
                'Signos y Síntomas': paciente.antecedentes?.signosYSintomas || 'N/A'
              }} />
            </div>
            
            <div className="grid lg:grid-cols-2 gap-8">
              <ClinicalSection title="Hábitos y Consumo" icon={User} data={{
                'Consumo Alcohol': paciente.antecedentes?.consumoAlcohol || 'N/A',
                'Tabaco': paciente.antecedentes?.tabaco || 'N/A',
                'Consumo Agua': paciente.antecedentes?.agua || 'N/A'
              }} />
              <ClinicalSection title="Suplementación" icon={Shield} data={{
                'Historial Productos': paciente.antecedentes?.historialProductos || 'N/A',
                'Recomendación': paciente.antecedentes?.recomendacionSuplementos || 'N/A',
                'Alimentos Gustan': paciente.antecedentes?.alimentosGustan || 'N/A',
                'Alimentos No Gustan': paciente.antecedentes?.alimentosNoGustan || 'N/A'
              }} />
            </div>
            
            {(paciente.habitos || (paciente as any).consumoCalorico) && (
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <div className="p-1.5 bg-slate-900 rounded-none"><Activity className="h-3 w-3 text-white" /></div>
                  <h4 className="text-[11px] font-bold text-slate-800 uppercase tracking-[0.2em]">Recordatorio 24 Horas</h4>
                </div>
                <div className="overflow-hidden rounded-none border border-slate-100 bg-background shadow-sm">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-secondary border-b border-slate-100">
                        <th className="py-5 px-8 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tiempo</th>
                        <th className="py-5 px-8 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Hora</th>
                        <th className="py-5 px-8 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Ayer (Consumo Real)</th>
                        <th className="py-5 px-8 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Usualmente</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {[
                        { 
                          label: 'DESAYUNO', 
                          h: (paciente.habitos || (paciente as any).consumoCalorico).horaDesayuno, 
                          a: (paciente.habitos || (paciente as any).consumoCalorico).ayerDesayuno, 
                          u: (paciente.habitos || (paciente as any).consumoCalorico).usalmenteDesayuno 
                        },
                        { 
                          label: 'COLACIÓN 1', 
                          h: (paciente.habitos || (paciente as any).consumoCalorico).horaColacion1, 
                          a: (paciente.habitos || (paciente as any).consumoCalorico).ayerColacion1, 
                          u: (paciente.habitos || (paciente as any).consumoCalorico).usalmenteColacion1 
                        },
                        { 
                          label: 'ALMUERZO', 
                          h: (paciente.habitos || (paciente as any).consumoCalorico).horaAlmuerzo, 
                          a: (paciente.habitos || (paciente as any).consumoCalorico).ayerAlmuerzo, 
                          u: (paciente.habitos || (paciente as any).consumoCalorico).usalmenteAlmuerzo 
                        },
                        { 
                          label: 'COLACIÓN 2', 
                          h: (paciente.habitos || (paciente as any).consumoCalorico).horaColacion2, 
                          a: (paciente.habitos || (paciente as any).consumoCalorico).ayerColacion2, 
                          u: (paciente.habitos || (paciente as any).consumoCalorico).usalmenteColacion2 
                        },
                        { 
                          label: 'CENA', 
                          h: (paciente.habitos || (paciente as any).consumoCalorico).horaCena, 
                          a: (paciente.habitos || (paciente as any).consumoCalorico).ayerCena, 
                          u: (paciente.habitos || (paciente as any).consumoCalorico).usalmenteCena 
                        },
                      ].map((row) => (
                        <tr key={row.label} className="hover:bg-secondary/50 transition-colors">
                          <td className="py-5 px-8 text-[11px] font-bold text-slate-800 uppercase tracking-widest">{row.label}</td>
                          <td className="py-5 px-8 text-[12px] font-bold text-slate-900">{row.h || '—:—'}</td>
                          <td className="py-5 px-8 text-[12px] font-medium text-slate-500 uppercase tracking-tight">{row.a || 'N/A'}</td>
                          <td className="py-5 px-8 text-[12px] font-medium text-slate-500 uppercase tracking-tight text-right">{row.u || 'N/A'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div className="pt-10 flex flex-col md:flex-row justify-between items-center gap-6">
              <div className="flex items-center gap-3">
                <div className="w-1.5 h-1.5 bg-slate-300 rounded-none" />
                <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Protocolo de seguridad: Cambios solo vía Editor</p>
              </div>
              <button
                onClick={() => navigate(`/pacientes/${id}/editar`)}
                className="w-full md:w-auto px-10 py-4 bg-slate-900 text-white text-[10px] font-bold uppercase tracking-[0.2em] rounded-none hover:bg-slate-800 transition-all shadow-lg shadow-slate-200"
              >
                Editar datos generales
              </button>
            </div>
          </div>
        )}

        <div className="flex justify-between items-center">
           <div className="space-y-1">
             <h2 className="text-[12px] font-bold text-slate-400 uppercase tracking-[0.3em] leading-none">Indicadores Críticos</h2>
             <div className="h-1 w-12 bg-slate-900 rounded-none" />
           </div>
           <button
             onClick={() => navigate(`/pacientes/${id}/valoracion/nueva`)}
             className="flex items-center gap-3 px-10 py-4 bg-secondary border border-slate-200 text-slate-700 text-[10px] font-bold uppercase tracking-widest rounded-none hover:bg-slate-900 hover:text-white hover:border-slate-900 transition-all group"
           >
             <Plus className="h-5 w-5 group-hover:rotate-90 transition-transform duration-300" /> Nueva Valoración Clínica
           </button>
        </div>

        {/* KPIs MODERNOS */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <KpiCardCompact label="Peso de Control" value={`${currentVal?.pesoActual || currentVal?.peso || '--'} KG`} icon={Activity} />
          <KpiCardCompact label="Masa Magra" value={`${(currentVal as any)?.masaMagra || currentVal?.kgMasaMagra2comp || '--'} KG`} active icon={Shield} />
          <KpiCardCompact label="Porcentaje Grasa" value={`${(currentVal as any)?.pctGrasaCorp || (currentVal as any)?.pctGrasaCorporal4comp || currentVal?.pctGrasa2comp || '--'}%`} icon={Heart} />
          <KpiCardCompact label="Score Ponderal" value={formatDecimal((currentVal as any)?.indicePonderal || 0)} icon={Ruler} />
        </section>

        {/* PROGRESS CHARTS HIGH-CONTRAST */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <ChartBox title="Evolución de Peso">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={historyData} margin={{ top: 10, right: 10, left: -25, bottom: 20 }}>
                <defs>
                  <linearGradient id="premiumGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0f172a" stopOpacity={0.08}/>
                    <stop offset="95%" stopColor="#0f172a" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis 
                  dataKey="fecha" 
                  tickFormatter={(val) => formatDateShort(val)}
                  tick={{ fontSize: 9, fontWeight: 700, fill: '#94a3b8' }}
                  axisLine={false}
                  tickLine={false}
                  dy={10}
                />
                <YAxis 
                  tick={{ fontSize: 9, fontWeight: 700, fill: '#94a3b8' }}
                  axisLine={false}
                  tickLine={false}
                  domain={['auto', 'auto']}
                />
                <Tooltip 
                  contentStyle={{ borderRadius: '0', border: 'none', background: '#0f172a', color: '#fff', fontSize: '10px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                  itemStyle={{ color: '#fff', textTransform: 'uppercase' }}
                  labelStyle={{ display: 'none' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="peso" 
                  stroke="#0f172a" 
                  strokeWidth={3} 
                  fillOpacity={1} 
                  fill="url(#premiumGradient)" 
                  dot={{ r: 4, fill: '#fff', stroke: '#0f172a', strokeWidth: 2 }}
                  activeDot={{ r: 6, fill: '#0f172a', stroke: '#fff', strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </ChartBox>

          <ChartBox title="Dinámica Grasa %">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={historyData} margin={{ top: 10, right: 10, left: -25, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis 
                  dataKey="fecha" 
                  tickFormatter={(val) => formatDateShort(val)}
                  tick={{ fontSize: 9, fontWeight: 700, fill: '#94a3b8' }}
                  axisLine={false}
                  tickLine={false}
                  dy={10}
                />
                <YAxis 
                  tick={{ fontSize: 9, fontWeight: 700, fill: '#94a3b8' }}
                  axisLine={false}
                  tickLine={false}
                  domain={['auto', 'auto']}
                />
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', background: '#0f172a', color: '#fff' }} labelStyle={{ display: 'none' }} />
                <Area 
                  type="step" 
                  dataKey="grasaEvolucion" 
                  stroke="#64748b" 
                  strokeWidth={2} 
                  fill="rgba(100, 116, 139, 0.05)"
                  dot={{ r: 3, fill: '#64748b' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </ChartBox>

          <ChartBox title="Desarrollo MLG (Masa Magra)">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={historyData} margin={{ top: 10, right: 10, left: -25, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis 
                  dataKey="fecha" 
                  tickFormatter={(val) => formatDateShort(val)}
                  tick={{ fontSize: 9, fontWeight: 700, fill: '#94a3b8' }}
                  axisLine={false}
                  tickLine={false}
                  dy={10}
                />
                <YAxis 
                  tick={{ fontSize: 9, fontWeight: 700, fill: '#94a3b8' }}
                  axisLine={false}
                  tickLine={false}
                  domain={['auto', 'auto']}
                />
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', background: '#0f172a', color: '#fff' }} labelStyle={{ display: 'none' }} />
                <Area 
                  type="monotone" 
                  dataKey="masaMagraEvolucion" 
                  stroke="#000" 
                  strokeWidth={3} 
                  fill="rgba(0,0,0,0.02)"
                  dot={{ r: 4, fill: '#fff', stroke: '#000', strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </ChartBox>
        </section>

        {/* LOG DE CONSULTAS PREMIUM */}
        <section className="space-y-8" id="historial">
          <div className="flex items-center gap-4">
            <h2 className="text-[12px] font-bold text-slate-400 uppercase tracking-[0.4em] opacity-80">Historial de consultas</h2>
            <div className="flex-1 h-[1px] bg-slate-100" />
          </div>
          
          {valoraciones.length > 0 ? (
            <div className="space-y-1">
              {valoraciones.map((v, i) => (
                <AccordionRow 
                  key={v.id} 
                  val={v} 
                  index={i} 
                  onVerDetalles={(valId) => navigate(`/pacientes/${id}/valoraciones/${valId}`)}
                  onVerPlan={(planId) => navigate(`/pacientes/${id}/planes/${planId}`)}
                  onAsignarPlan={(valId) => navigate(`/pacientes/${id}/planes/nuevo?valoracionId=${valId}`)}
                />
              ))}
            </div>
          ) : (
            <div className="py-24 text-center border-2 border-slate-50 border-dashed rounded-none">
              <ClipboardList className="h-10 w-10 text-slate-200 mx-auto mb-4" />
              <p className="text-[10px] font-bold text-slate-300 uppercase tracking-[0.4em]">Sin registros clínicos hasta el momento</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default PatientProfile;
