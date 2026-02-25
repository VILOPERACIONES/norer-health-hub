import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit2, FileText, Trash2, Printer, Activity } from 'lucide-react';
import api from '@/lib/api';
import type { Valoracion } from '@/types';
import { formatDate, formatDecimal } from '@/lib/format';
import { useToast } from '@/hooks/use-toast';

const AssessmentDetail = () => {
  const { id: pacienteId, valoracionId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [val, setVal] = useState<Valoracion | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data } = await api.get(`/api/pacientes/${pacienteId}/valoraciones/${valoracionId}`);
        const serverData = data?.data || data;
        if (serverData) setVal(serverData);
      } catch (err) {
        console.error('Error cargando valoración:', err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [pacienteId, valoracionId]);

  const Section = ({ title, children, icon: Icon }: { title: string; children: React.ReactNode; icon?: any }) => (
  <div className="bg-background border-2 border-border/40 p-10 rounded-2xl shadow-sm animate-slide-up hover:border-foreground/30 transition-all ring-1 ring-foreground/5">
    <div className="flex items-center gap-6 mb-10">
      {Icon && <Icon className="h-6 w-6 text-muted-foreground/30" />}
      <h3 className="text-[12px] font-black text-foreground uppercase tracking-[0.4em] opacity-40 leading-none">{title}</h3>
    </div>
    {children}
  </div>
);

const DataValue = ({ label, value, unit = '' }: { label: string; value: string | number; unit?: string }) => (
  <div className="space-y-4">
    <p className="text-[11px] font-black text-muted-foreground uppercase tracking-[0.3em] ml-1 leading-none opacity-40">{label}</p>
    <p className="text-3xl font-black text-foreground tracking-tighter leading-none whitespace-nowrap">
      {typeof value === 'number' ? formatDecimal(value) : value || '—'}
      {unit && <span className="text-[12px] ml-3 opacity-30 uppercase tracking-[0.2em] font-mono leading-none">{unit}</span>}
    </p>
  </div>
);

  if (loading) return (
    <div className="p-16 flex flex-col items-center justify-center space-y-10 h-[70vh]">
       <div className="w-20 h-20 border-[8px] border-foreground/5 border-t-foreground rounded-full animate-spin" />
       <p className="text-[12px] font-black uppercase tracking-[0.5em] animate-pulse text-muted-foreground">SINCRONIZANDO BIODATA ANALYTICA...</p>
    </div>
  );
  
  if (!val) return (
    <div className="p-16 text-center space-y-10 h-[60vh] flex flex-col items-center justify-center">
      <p className="text-3xl font-black text-muted-foreground uppercase tracking-[0.5em] opacity-10">PROTOCOLO NO LOCALIZADO</p>
      <button onClick={() => navigate(`/pacientes/${pacienteId}`)} className="text-[12px] font-black text-foreground uppercase tracking-[0.4em] border-b-2 border-foreground pb-2 hover:opacity-70 transition-all leading-none">REGRESAR AL DIRECTORIO</button>
    </div>
  );

  const handleDelete = async () => {
    if (!window.confirm('¿ELIMINAR ESTE REGISTRO DE BIODATA?')) return;
    try {
      await api.delete(`/api/pacientes/${pacienteId}/valoraciones/${valoracionId}`);
      toast({ title: 'PROTOCOLO ELIMINADO', description: 'El registro ha sido purgado de la infraestructura.' });
      navigate(`/pacientes/${pacienteId}`);
    } catch (err) {
      toast({ title: 'Fallo de Persistencia', description: 'No se pudo purgar el registro del sistema.', variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-16 animate-fade-in max-w-7xl pb-40 mx-auto">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-12 border-b border-border/40 pb-12">
        <div className="space-y-10">
           <button onClick={() => navigate(`/pacientes/${pacienteId}`)} className="flex items-center gap-4 text-[12px] font-black uppercase tracking-[0.3em] text-muted-foreground hover:text-foreground transition-all group leading-none">
             <ArrowLeft className="h-5 w-5 group-hover:-translate-x-1 transition-all" /> VOLVER AL EXPEDIENTE
           </button>
           <div className="animate-slide-up space-y-4">
              <h1 className="text-5xl font-black text-foreground tracking-tighter uppercase leading-none whitespace-nowrap">BioData Analytica</h1>
              <p className="text-muted-foreground font-black text-[12px] uppercase tracking-[0.4em] opacity-40 leading-none">CONSULTA GLOBAL #{val.numeracion || '—'} · {formatDate(val.fecha)}</p>
           </div>
        </div>
        <div className="flex gap-6">
           <button 
             onClick={handleDelete}
             className="px-10 py-5 border-2 border-border/40 text-destructive text-[12px] font-black uppercase tracking-[0.3em] rounded-2xl hover:bg-destructive/5 transition-all shadow-sm leading-none"
           >
             PURGAR REGISTRO
           </button>
           <button 
             className="px-10 py-5 bg-foreground text-background rounded-2xl text-[12px] font-black uppercase tracking-[0.4em] flex items-center gap-6 hover:scale-[1.03] transition-all shadow-lg leading-none"
           >
             <Printer className="h-5 w-5" /> DESCARGAR MASTER PDF
           </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-12 gap-12">
        <div className="lg:col-span-8 space-y-12">
          <Section title="CONTROL ANTROPOMÉTRICO MAESTRO" icon={Activity}>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-12">
              <DataValue label="Masa Corporal" value={val.peso} unit="kg" />
              <DataValue label="Estatura" value={val.talla} unit="m" />
              <DataValue label="IMC Protocolo" value={val.imc} />
              <DataValue label="Grasa Corporal" value={val.porcentajeGrasa} unit="%" />
            </div>
          </Section>

          {val.composicion && (
            <div className="bg-foreground text-background p-12 rounded-[2.5rem] shadow-xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-12 opacity-5 translate-x-10 translate-y-[-2rem] rotate-12 transition-transform group-hover:rotate-0 duration-1000">
                <FileText className="w-64 h-64" />
              </div>
              <h3 className="text-[12px] font-black uppercase tracking-[0.5em] mb-12 opacity-30 leading-none">COMPOSICIÓN ESTRUCTURAL PROACTIVA</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-12 relative z-10">
                <div className="space-y-4">
                   <p className="text-[11px] font-black opacity-30 uppercase tracking-[0.4em] leading-none">Tejido Adiposo</p>
                   <p className="text-6xl font-black tracking-tighter leading-none text-emerald-400">{formatDecimal(val.composicion.pctGrasa || 0)}%</p>
                   <p className="text-[12px] font-black opacity-40 uppercase tracking-[0.2em] font-mono leading-none">{formatDecimal(val.composicion.kgGrasa || 0)} KG TOTAL</p>
                </div>
                <div className="space-y-4">
                   <p className="text-[11px] font-black opacity-30 uppercase tracking-[0.4em] leading-none">Masa Libre Grasa</p>
                   <p className="text-6xl font-black tracking-tighter leading-none">{formatDecimal(val.composicion.kgMagra || 0)}<span className="text-xl ml-3 opacity-30 uppercase tracking-widest font-mono">kg</span></p>
                </div>
                {val.composicion.densidad && (
                  <div className="space-y-4">
                    <p className="text-[11px] font-black opacity-30 uppercase tracking-[0.4em] leading-none">Densidad Corporal</p>
                    <p className="text-6xl font-black tracking-tighter leading-none opacity-50">{formatDecimal(val.composicion.densidad, 4)}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-12">
            {val.pliegues && Object.keys(val.pliegues).length > 0 && (
              <Section title="ESTRATIGRAFÍA TÁCTIL (PLIEGUES)">
                <div className="grid grid-cols-2 gap-x-10 gap-y-12">
                  {Object.entries(val.pliegues).map(([k, v]) => (
                    <DataValue key={k} label={k} value={v as number} unit="mm" />
                  ))}
                </div>
              </Section>
            )}

            {val.perimetros && Object.keys(val.perimetros).length > 0 && (
              <Section title="PERIMETRÍA MUSCULAR SOMÁTICA">
                <div className="grid grid-cols-2 gap-x-10 gap-y-12">
                  {Object.entries(val.perimetros).map(([k, v]) => (
                    <DataValue key={k} label={k} value={v as number} unit="cm" />
                  ))}
                </div>
              </Section>
            )}
          </div>
        </div>

        <div className="lg:col-span-4 space-y-12">
          <Section title="PROTOCOLO TERAPÉUTICO" icon={Activity}>
            <div className="space-y-12">
              {val.comentarios ? (
                <div className="space-y-6">
                  <p className="text-[11px] font-black text-muted-foreground uppercase tracking-[0.4em] font-mono leading-none opacity-30">{`// OBSERVACIONES CLÍNICAS`}</p>
                  <p className="text-lg font-black leading-relaxed border-l-4 border-foreground/10 pl-6 text-foreground uppercase tracking-tight">{val.comentarios}</p>
                </div>
              ) : (
                <p className="text-[12px] font-black text-muted-foreground uppercase tracking-[0.4em] opacity-20 leading-none">SIN NOTAS REGISTRADAS</p>
              )}
              
              {val.suplementacion && (
                <div className="space-y-6 pt-10 border-t border-border/40">
                  <p className="text-[11px] font-black text-muted-foreground uppercase tracking-[0.4em] font-mono leading-none opacity-30">{`// SUPLEMENTACIÓN SINCRÓNICA`}</p>
                  <p className="text-base font-black leading-relaxed border-l-4 border-foreground/5 pl-6 text-foreground/40 uppercase tracking-tight">{val.suplementacion}</p>
                </div>
              )}
            </div>
          </Section>
          
          <button
             onClick={() => navigate(`/pacientes/${pacienteId}/planes/nuevo?valoracionId=${valoracionId}`)}
             className="w-full py-8 bg-background border-2 border-foreground/10 rounded-[3rem] text-[12px] font-black uppercase tracking-[0.5em] hover:bg-foreground hover:text-background transition-all duration-500 shadow-sm hover:scale-[1.02] leading-none active:scale-95"
          >
             ACTUALIZAR PROTOCOLO MAESTRO
          </button>
        </div>
      </div>
    </div>
  );
};

export default AssessmentDetail;
