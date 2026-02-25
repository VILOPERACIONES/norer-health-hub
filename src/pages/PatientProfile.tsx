import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Edit, Plus, ChevronDown, X, User, Phone, Mail, Clock, Calendar, Shield, Hash } from 'lucide-react';
import api from '@/lib/api';
import type { Paciente, Valoracion, Plan } from '@/types';
import { formatDate, formatDateShort, formatDecimal } from '@/lib/format';
import { useToast } from '@/hooks/use-toast';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell
} from 'recharts';

// --- Sub-componentes Estilo Brutalista Compacto ---

const InfoItem = ({ label, value, icon: Icon }: { label: string, value: string | number, icon: any }) => (
  <div className="flex items-center gap-3 py-2 border-r border-black/5 last:border-r-0 px-4 first:pl-0">
    <div className="flex-shrink-0 opacity-20">
      <Icon className="h-4 w-4" />
    </div>
    <div className="flex flex-col">
      <span className="text-[8px] font-black uppercase tracking-[0.2em] opacity-30 leading-none mb-1">{label}</span>
      <span className="text-[11px] font-bold uppercase tracking-tight truncate max-w-[150px]">{value}</span>
    </div>
  </div>
);

const KpiCardCompact = ({ label, value, active }: { label: string, value: any, active?: boolean }) => (
  <div className={`py-6 px-4 border border-black flex flex-col items-center justify-center text-center transition-all flex-1 ${active ? 'bg-black text-white' : 'bg-white text-black hover:bg-neutral-50'}`}>
    <span className={`text-[8px] font-black uppercase tracking-[0.3em] mb-2 leading-none ${active ? 'opacity-50' : 'opacity-30'}`}>{label}</span>
    <span className="text-2xl font-black tracking-tighter leading-none">{value}</span>
  </div>
);

const ChartBox = ({ title, children }: { title: string, children: React.ReactNode }) => (
  <div className="border border-black p-6 bg-white flex flex-col hover:bg-neutral-50 transition-all rounded-none min-h-[280px]">
    <h2 className="text-[9px] font-black uppercase tracking-[0.3em] mb-6 text-center opacity-30 leading-none">
      {title}
    </h2>
    <div className="w-full flex-1 min-h-0">
      {children}
    </div>
  </div>
);

const AccordionRow = ({ val, index, onVerDetalles, onVerPlan }: { val: Valoracion, index: number, onVerDetalles: (id: string) => void, onVerPlan: (id: string) => void }) => {
  const [isOpen, setIsOpen] = useState(index === 0);
  const planId = val.plan?.id || (val as any).planId;

  return (
    <div className="border border-black bg-white mb-[-1px] w-full">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 hover:bg-black hover:text-white transition-all group"
      >
        <div className="flex items-center gap-6">
          <span className="font-black text-[10px] opacity-20 w-8">#{val.medicionNumero || index + 1}</span>
          <span className="font-black uppercase tracking-widest text-[10px]">{formatDate(val.fecha)}</span>
        </div>
        <div className="flex items-center gap-8">
           <span className="text-[10px] font-bold opacity-30 group-hover:opacity-100 uppercase tracking-tighter">{val.peso} KG · {val.imc} IMC · {val.pctGrasa2comp || (val as any).pctGrasaCorporal4comp || '--'}% GRASA</span>
           {isOpen ? <X className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
        </div>
      </button>
      
      {isOpen && (
        <div className="p-8 border-t border-black bg-white text-black animate-slide-down">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-8">
            <div className="space-y-1">
              <p className="text-[8px] font-black opacity-30 uppercase tracking-widest">ESTATURA</p>
              <p className="text-lg font-black">{val.talla} M</p>
            </div>
            <div className="space-y-1">
              <p className="text-[8px] font-black opacity-30 uppercase tracking-widest">GLUCOSA</p>
              <p className="text-lg font-black">{(val as any).bioquimicoGlucosa || '—'} MG/DL</p>
            </div>
            <div className="space-y-1">
              <p className="text-[8px] font-black opacity-30 uppercase tracking-widest">PRESIÓN ART.</p>
              <p className="text-lg font-black">{(val as any).presionArterial || '—'}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[8px] font-black opacity-30 uppercase tracking-widest">SUMA PLIEGUES</p>
              <p className="text-lg font-black">{(val as any).sumaPliegues || '—'} MM</p>
            </div>
            <div className="space-y-1 text-right md:text-left">
              <p className="text-[8px] font-black opacity-30 uppercase tracking-widest">MASA MAGRA</p>
              <p className="text-lg font-black">{(val as any).kgMasaMagra2comp || '—'} KG</p>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-3 pt-6 border-t border-black/5">
            <button 
              onClick={() => onVerDetalles(val.id)}
              className="px-6 py-2 border border-black text-[9px] font-black uppercase tracking-widest hover:bg-black hover:text-white transition-all"
            >
              EXPEDIENTE DETALLADO
            </button>
            {planId && (
              <button 
                onClick={() => onVerPlan(planId)}
                className="px-6 py-2 bg-black text-white text-[9px] font-black uppercase tracking-widest hover:bg-neutral-800 transition-all border border-black"
              >
                VER PLAN ACTIVO
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const PatientProfile = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [paciente, setPaciente] = useState<Paciente | null>(null);
  const [valoraciones, setValoraciones] = useState<Valoracion[]>([]);
  const [loading, setLoading] = useState(true);

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
              // Normalizar claves para evolución
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

  if (loading || !paciente) return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-[10px] font-black uppercase tracking-[0.5em] animate-pulse">Sincronizando Nodo Maestro...</div>
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
    <div className="min-h-screen bg-white text-black font-sans pb-20 animate-fade-in selection:bg-black selection:text-white">
      {/* HEADER COMPACTO - No Sticky */}
      <header className="w-full border-b border-black px-8 pt-1 pb-5 flex flex-col md:flex-row justify-between items-center gap-6 bg-white">
        <div className="flex flex-col">
          <h1 className="text-3xl md:text-5xl font-black text-black tracking-[-0.04em] uppercase leading-none">
            {paciente.nombre} {paciente.apellido}
          </h1>
          <div className="text-[9px] font-black opacity-30 uppercase tracking-[0.3em] mt-2">Expediente Clínico Maestro</div>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <button
            onClick={() => navigate(`/pacientes/${id}/valoracion/nueva`)}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 border border-black bg-black text-white px-8 py-3 text-[9px] font-black uppercase tracking-widest hover:bg-white hover:text-black transition-all"
          >
            <Plus className="h-4 w-4" /> CONSULTA
          </button>
          <button
            onClick={() => navigate(`/pacientes/${id}/editar`)}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 border border-black bg-white text-black px-8 py-3 text-[9px] font-black uppercase tracking-widest hover:bg-black hover:text-white transition-all"
          >
            <Edit className="h-3 w-3" /> EDITAR
          </button>
        </div>
      </header>

      <div className="max-w-full px-8 py-6 space-y-10">
        {/* FILA DE DATOS PERSONALES REORGANIZADA & COMPACTA - Espaciado Reducido */}
        <section className="grid grid-cols-2 md:grid-cols-4 lg:flex lg:flex-row lg:justify-between border-b border-black pb-4 gap-y-4">
          <InfoItem label="EDAD" value={`${calcAge(paciente.fechaNacimiento)} AÑOS`} icon={Clock} />
          <InfoItem label="SEXO" value={paciente.sexo === 'F' ? 'FEMENINO' : 'MASCULINO'} icon={User} />
          <InfoItem label="TELÉFONO" value={paciente.telefono} icon={Phone} />
          <InfoItem label="E-MAIL" value={paciente.email || '—'} icon={Mail} />
          <InfoItem label="MEMBRESÍA" value={(paciente as any).nivelMembresia || 'NINGUNA'} icon={Shield} />
          <InfoItem label="REGISTRO" value={formatDate((paciente as any).fechaRegistro)} icon={Calendar} />
          <InfoItem label="REF ID" value={id?.slice(-8).toUpperCase() || ''} icon={Hash} />
        </section>

        {/* KPIs COMPACTOS - USAN EL ÚLTIMO VALOR REGISTRADO */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <KpiCardCompact label="PESO ACTUAL" value={`${currentVal?.peso || '--'} KG`} />
          <KpiCardCompact label="MASA MAGRA (MLG)" value={`${currentVal?.kgMasaMagra2comp || (currentVal as any)?.masaMagra || '--'} KG`} active />
          <KpiCardCompact label="GRASA %" value={`${currentVal?.pctGrasa2comp || (currentVal as any)?.pctGrasaCorporal4comp || '--'}%`} />
          <KpiCardCompact label="VALORACIONES" value={valoraciones.length} />
        </section>

        {/* PROGRESS CHARTS (HISTÓRICOS) */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <ChartBox title="EVOLUCIÓN DE PESO (KG)">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={historyData} margin={{ top: 20, right: 10, left: -20, bottom: 40 }}>
                <defs>
                  <linearGradient id="weightGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#000" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#000" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="0" stroke="#000" opacity={0.06} vertical={true} horizontal={true} />
                <XAxis 
                  dataKey="fecha" 
                  tickFormatter={(val) => formatDateShort(val)}
                  tick={{ fontSize: 8, fontWeight: 'bold' }}
                  angle={-45}
                  textAnchor="end"
                  interval={0}
                  stroke="#000"
                />
                <YAxis 
                  tick={{ fontSize: 8, fontWeight: 'bold' }}
                  stroke="#000"
                  domain={['auto', 'auto']}
                />
                <Tooltip 
                  contentStyle={{ borderRadius: '0', border: '1px solid #000', background: '#fff', fontSize: '9px', fontWeight: '900', padding: '10px' }}
                  itemStyle={{ color: '#000', textTransform: 'uppercase' }}
                  labelStyle={{ display: 'none' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="peso" 
                  stroke="#000" 
                  strokeWidth={3} 
                  fillOpacity={1} 
                  fill="url(#weightGradient)" 
                  dot={{ r: 4, fill: '#fff', stroke: '#000', strokeWidth: 2 }}
                  activeDot={{ r: 6, fill: '#000', stroke: '#fff', strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </ChartBox>

          <ChartBox title="VOLUMEN GRASA (%)">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={historyData} margin={{ top: 20, right: 10, left: -20, bottom: 40 }}>
                <defs>
                  <linearGradient id="fatGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#000" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#000" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#000" opacity={0.1} vertical={false} />
                <XAxis 
                  dataKey="fecha" 
                  tickFormatter={(val) => formatDateShort(val)}
                  tick={{ fontSize: 8, fontWeight: 'bold' }}
                  angle={-45}
                  textAnchor="end"
                  interval={0}
                  stroke="#000"
                />
                <YAxis 
                  tick={{ fontSize: 8, fontWeight: 'bold' }}
                  stroke="#000"
                  domain={['auto', 'auto']}
                />
                <Tooltip 
                  contentStyle={{ borderRadius: '0', border: '1px solid #000', background: '#fff', fontSize: '9px', fontWeight: '900' }}
                  itemStyle={{ color: '#000', textTransform: 'uppercase' }}
                  labelStyle={{ display: 'none' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="grasaEvolucion" 
                  stroke="#000" 
                  strokeWidth={4} 
                  fillOpacity={1}
                  fill="url(#fatGradient)"
                  dot={{ r: 4, fill: '#fff', stroke: '#000', strokeWidth: 2 }}
                  activeDot={{ r: 6, fill: '#000', stroke: '#fff', strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </ChartBox>

          <ChartBox title="MASA MAGRA HISTÓRICA (KG)">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={historyData} margin={{ top: 20, right: 10, left: -20, bottom: 40 }}>
                <defs>
                  <linearGradient id="leanMassGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#666" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#666" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="0" stroke="#000" opacity={0.06} vertical={true} horizontal={true} />
                <XAxis 
                  dataKey="fecha" 
                  tickFormatter={(val) => formatDateShort(val)}
                  tick={{ fontSize: 8, fontWeight: 'bold' }}
                  angle={-45}
                  textAnchor="end"
                  interval={0}
                  stroke="#000"
                />
                <YAxis 
                  tick={{ fontSize: 8, fontWeight: 'bold' }}
                  stroke="#000"
                  domain={['auto', 'auto']}
                />
                <Tooltip 
                  contentStyle={{ borderRadius: '0', border: '1px solid #000', background: '#fff', fontSize: '9px', fontWeight: '900', padding: '10px' }}
                  itemStyle={{ color: '#000', textTransform: 'uppercase' }}
                  labelStyle={{ display: 'none' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="masaMagraEvolucion" 
                  stroke="#666" 
                  strokeWidth={3} 
                  fillOpacity={1} 
                  fill="url(#leanMassGradient)" 
                  dot={{ r: 4, fill: '#fff', stroke: '#666', strokeWidth: 2 }}
                  activeDot={{ r: 6, fill: '#666', stroke: '#fff', strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </ChartBox>
        </section>

        {/* BITÁCORA COMPACTA */}
        <section className="space-y-4">
          <h2 className="text-[10px] font-black uppercase tracking-[0.4em] opacity-30">LOG DE VALORACIONES</h2>
          {valoraciones.length > 0 ? (
            <div className="border border-black">
              {valoraciones.map((v, i) => (
                <AccordionRow 
                  key={v.id} 
                  val={v} 
                  index={i} 
                  onVerDetalles={(valId) => navigate(`/pacientes/${id}/valoraciones/${valId}`)}
                  onVerPlan={(planId) => navigate(`/pacientes/${id}/planes/${planId}`)}
                />
              ))}
            </div>
          ) : (
            <div className="py-12 text-center border border-black border-dashed opacity-20">
              <p className="text-[9px] font-black uppercase tracking-[0.4em]">Sin registros históricos</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default PatientProfile;
