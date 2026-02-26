import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, FileText, Printer, Activity, Shield, Heart, Ruler, Droplets, Zap, Beaker, Thermometer, Brain } from 'lucide-react';
import api from '@/lib/api';
import { formatDate, formatDecimal } from '@/lib/format';
import { useToast } from '@/hooks/use-toast';

const AssessmentDetail = () => {
  const { id: pacienteId, valoracionId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [val, setVal] = useState<any>(null);
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

  const Section = ({ title, children, icon: Icon, active = false }: { title: string; children: React.ReactNode; icon?: any; active?: boolean }) => (
    <div className={`p-8 md:p-10 border-b border-slate-100 ${active ? 'bg-slate-50/50' : 'bg-background'}`}>
      <div className="flex items-center gap-4 mb-10">
        <div className={`p-2 rounded-none ${active ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-400'}`}>
          {Icon && <Icon className="h-4 w-4" />}
        </div>
        <h3 className="text-[12px] font-bold text-slate-800 uppercase tracking-[0.3em] leading-none">{title}</h3>
      </div>
      {children}
    </div>
  );

  const DataItem = ({ label, value, unit = '', highlight = false, alert = false }: { label: string; value: any; unit?: string; highlight?: boolean; alert?: boolean }) => (
    <div className="space-y-1">
      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none">{label}</p>
      <p className={`text-[16px] font-bold tracking-tight ${highlight ? 'text-slate-900' : 'text-slate-600'} ${alert ? 'text-rose-600' : ''}`}>
        {formatDecimal(value)}
        {value !== null && value !== undefined && value !== '' && unit && <span className="text-[10px] ml-1 opacity-40 font-bold">{unit}</span>}
      </p>
    </div>
  );

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background">
       <Activity className="h-10 w-10 text-slate-900 animate-pulse mb-6" />
       <p className="text-[11px] font-bold uppercase tracking-[0.5em] text-slate-400">Desencriptando BioData Maestro...</p>
    </div>
  );
  
  if (!val) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-10 text-center">
      <h1 className="text-2xl font-bold text-slate-300 uppercase tracking-widest mb-6">Registro no localizado</h1>
      <button onClick={() => navigate(`/pacientes/${pacienteId}`)} className="px-8 py-3 bg-slate-900 text-white text-[10px] font-bold uppercase tracking-widest">Volver al expediente</button>
    </div>
  );

  return (
    <div className="min-h-screen bg-background pb-32">
      {/* HEADER TIPO REPORTE */}
      <header className="bg-slate-900 text-white px-10 py-12 md:py-16">
        <div className="w-full flex flex-col md:flex-row justify-between items-start md:items-end gap-10">
          <div className="space-y-6">
            <button onClick={() => navigate(`/pacientes/${pacienteId}`)} className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.25em] text-slate-400 hover:text-white transition-all group">
              <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-all" /> Regresar al Perfil
            </button>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                 <span className="px-2 py-0.5 bg-emerald-500 text-[9px] font-black uppercase tracking-widest">Corte Maestro</span>
                 <span className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Protocolo #{val.numeroValoracion || '—'}</span>
              </div>
              <h1 className="text-4xl md:text-6xl font-black tracking-[-0.04em] uppercase leading-none italic">BioData Analytica</h1>
              <p className="text-slate-400 font-bold text-[11px] uppercase tracking-[0.5em] ml-1">{formatDate(val.fecha)} · ID: {val.id.slice(-12).toUpperCase()}</p>
            </div>
          </div>
          <div className="flex gap-4">
            <button className="px-8 py-4 bg-white/5 hover:bg-white/10 text-white border border-white/10 text-[10px] font-bold uppercase tracking-[0.2em] transition-all flex items-center gap-3">
              <Printer className="h-4 w-4" /> Exportar PDF
            </button>
          </div>
        </div>
      </header>

      <div className="w-full px-10 -translate-y-6 md:-translate-y-8">
        <div className="grid lg:grid-cols-12 gap-8">
          
          {/* COLUMNA PRINCIPAL */}
          <div className="lg:col-span-8 space-y-8">
            <div className="bg-white border border-slate-100 shadow-2xl shadow-slate-200/50 overflow-hidden">
              
              {/* RESUMEN CRÍTICO */}
              <div className="grid grid-cols-2 md:grid-cols-4 bg-slate-50/50 border-b border-slate-100 p-8 md:p-10 gap-8">
                <DataItem label="Masa Corporal" value={val.pesoActual || val.peso} unit="kg" highlight />
                <DataItem label="IMC Protocolo" value={val.imc} highlight alert={parseFloat(val.imc) > 25} />
                <DataItem label="Grasa Real" value={val.pctGrasaCorp || val.pctGrasa2comp} unit="%" highlight />
                <DataItem label="Masa Muscular" value={val.masaMuscular} unit="kg" highlight />
              </div>

              {/* ANTROPOMETRÍA PLIEGUES */}
              <Section title="Estratigrafía Táctil (Pliegues)" icon={Ruler}>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-y-12">
                   <DataItem label="Tríceps" value={val.pliegeTricep} unit="mm" />
                   <DataItem label="Bíceps" value={val.pliegeBicep} unit="mm" />
                   <DataItem label="Subescapular" value={val.pliegueSubescapular} unit="mm" />
                   <DataItem label="Cresta Iliaca" value={val.pliegueCrestaIliaca} unit="mm" />
                   <DataItem label="Supraespinal" value={val.pliegueSupraespinal} unit="mm" />
                   <DataItem label="Abdominal" value={val.pliegueAbdominal} unit="mm" />
                   <DataItem label="Muslo Frontal" value={val.pliegueMusloFrontal} unit="mm" />
                   <DataItem label="Pantorrilla" value={val.plieguePantorrilla} unit="mm" />
                   <div className="col-span-full pt-4">
                     <div className="inline-block px-6 py-3 bg-slate-900 text-white">
                        <p className="text-[10px] font-bold uppercase tracking-[0.3em] opacity-50 mb-1">Suma 8 Pliegues</p>
                        <p className="text-2xl font-black leading-none">{val.sumaPliegues || '—'} <span className="text-xs opacity-30">MM</span></p>
                     </div>
                   </div>
                </div>
              </Section>

              {/* PERÍMETROS */}
              <Section title="Perimetría Muscular Somática" icon={Activity}>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-8 md:gap-y-12">
                   <DataItem label="Muñeca" value={val.perimetroMuneca} unit="cm" />
                   <DataItem label="Brazo Relajado" value={val.perimetroBrazoRelajado} unit="cm" />
                   <DataItem label="Brazo Contraído" value={val.perimetroBrazoContraido} unit="cm" />
                   <DataItem label="Pectoral" value={val.perimetroPectoral} unit="cm" />
                   <DataItem label="Cintura" value={val.perimetroCintura} unit="cm" />
                   <DataItem label="Abdomen" value={val.perimetroAbdomen} unit="cm" />
                   <DataItem label="Cadera" value={val.perimetroCadera} unit="cm" />
                   <DataItem label="Muslo Frontal" value={val.perimetroMusloFrontal} unit="cm" />
                   <DataItem label="Pantorrilla" value={val.perimetroPantorrilla} unit="cm" />
                </div>
              </Section>

              {/* DIÁMETROS Y BIOTIPO */}
              <Section title="Estructura Ósea y Biotipo" icon={Zap}>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                   <DataItem label="Biestiloideo" value={val.diametroBiestiloideo} unit="cm" />
                   <DataItem label="Biepicond. Humero" value={val.diametroBiepicondHumero} unit="cm" />
                   <DataItem label="Biepicond. Femur" value={val.diametroBiepicondFemur} unit="cm" />
                   <DataItem label="Complexión" value={val.complexion} unit={val.clasifComplexion} />
                </div>
              </Section>

              {/* BIOQUÍMICOS */}
              <Section title="Analítica de Bioquímicos" icon={Beaker}>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
                   <DataItem label="Glucosa" value={val.glucosa} unit="mg/dl" />
                   <DataItem label="Triglicéridos" value={val.trigliceridos} unit="mg/dl" />
                   <DataItem label="Colesterol" value={val.colesterol} unit="mg/dl" />
                   <DataItem label="Creatinina" value={val.creatinina} unit="mg/dl" />
                   <DataItem label="Ácido Úrico" value={val.acidoUrico} unit="mg/dl" />
                   <DataItem label="Presión Arterial" value={val.presionArterial || '—/—'} />
                </div>
              </Section>

              {/* TEMARIO */}
              {val.temarioConsulta && val.temarioConsulta.length > 0 && (
                <Section title="Acuerdos y Temario" icon={Brain} active>
                  <div className="space-y-6">
                    {val.temarioConsulta.map((tema: any) => (
                      <div key={tema.id} className="border-l-2 border-slate-900 pl-6 py-1">
                        <h4 className="text-[11px] font-bold text-slate-900 uppercase tracking-widest mb-2">{tema.tema}</h4>
                        <p className="text-[13px] text-slate-600 leading-relaxed italic">"{tema.detalle}"</p>
                      </div>
                    ))}
                  </div>
                </Section>
              )}

              {/* NOTAS FINALES */}
              {(val.comentarios || val.suplementacion) && (
                <div className="p-10 bg-slate-900 text-white">
                   <div className="grid md:grid-cols-2 gap-12">
                      {val.comentarios && (
                        <div className="space-y-4">
                           <p className="text-[9px] font-bold text-slate-500 uppercase tracking-[0.3em]">Observaciones Clínicas</p>
                           <p className="text-[14px] leading-relaxed text-slate-300 font-medium italic">"{val.comentarios}"</p>
                        </div>
                      )}
                      {val.suplementacion && (
                        <div className="space-y-4">
                           <p className="text-[9px] font-bold text-slate-500 uppercase tracking-[0.3em]">Protocolo de Suplementos</p>
                           <p className="text-[14px] leading-relaxed text-slate-300 font-medium italic">"{val.suplementacion}"</p>
                        </div>
                      )}
                   </div>
                </div>
              )}
            </div>
          </div>

          {/* SIDEBAR DE MÉTRICAS AVANZADAS */}
          <div className="lg:col-span-4 space-y-8">
            
            {/* CARD 4 COMPONENTES */}
            <div className="bg-white border border-slate-100 p-8 shadow-xl shadow-slate-200/50 space-y-10">
               <div className="flex items-center gap-3 border-b border-slate-50 pb-4">
                  <Shield className="h-4 w-4 text-emerald-500" />
                  <h4 className="text-[10px] font-black text-slate-800 uppercase tracking-[0.3em]">Algoritmo 4 Componentes</h4>
               </div>
               
               <div className="space-y-8">
                  <div className="flex justify-between items-end border-b border-slate-50 pb-4">
                     <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Masa Ósea</p>
                     <div className="text-right">
                        <p className="text-xl font-black text-slate-900 leading-none">{formatDecimal(val.masaOsea)} <span className="text-[10px] opacity-30">KG</span></p>
                        <p className="text-[10px] font-bold text-slate-400 mt-1">{formatDecimal(val.pctMasaOsea)}%</p>
                     </div>
                  </div>
                  <div className="flex justify-between items-end border-b border-slate-100 pb-4">
                     <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Masa Visceral</p>
                     <div className="text-right">
                        <p className="text-xl font-black text-slate-900 leading-none">{formatDecimal(val.masaVisceral)} <span className="text-[10px] opacity-30">KG</span></p>
                        <p className="text-[10px] font-bold text-slate-400 mt-1">{formatDecimal(val.pctMasaVisceral)}%</p>
                     </div>
                  </div>
                  <div className="flex justify-between items-end border-b border-slate-50 pb-4">
                     <p className="text-[9px] font-bold text-emerald-600 uppercase tracking-widest">Masa Magra (MLG)</p>
                     <div className="text-right">
                        <p className="text-xl font-black text-emerald-600 leading-none">{formatDecimal(val.masaMagra)} <span className="text-[10px] opacity-30">KG</span></p>
                        <p className="text-[10px] font-bold text-slate-400 mt-1">S.C. {formatDecimal(val.superficieCorp)} M²</p>
                     </div>
                  </div>
                  <div className="flex justify-between items-end">
                     <p className="text-[9px] font-bold text-rose-600 uppercase tracking-widest">Déficit Muscular</p>
                     <div className="text-right">
                        <p className="text-2xl font-black text-rose-600 leading-none">-{formatDecimal(val.deficitMusculo)} <span className="text-[10px] opacity-30">KG</span></p>
                     </div>
                  </div>
               </div>
            </div>

            {/* CARD BIOTIPOLOGÍA */}
            <div className="bg-slate-900 text-white p-8 space-y-10">
               <div className="flex items-center gap-3 border-b border-white/5 pb-4">
                  <Zap className="h-4 w-4 text-amber-400" />
                  <h4 className="text-[10px] font-black text-white/50 uppercase tracking-[0.3em]">Somatotipo & Biotipología</h4>
               </div>
               <div className="grid grid-cols-2 gap-8">
                  <div>
                    <p className="text-[8px] font-bold text-white/30 uppercase tracking-[0.2em] mb-1">Endomorfia</p>
                    <p className="text-lg font-black">{formatDecimal(val.endomorfico)}</p>
                  </div>
                  <div>
                    <p className="text-[8px] font-bold text-white/30 uppercase tracking-[0.2em] mb-1">Mesomorfia</p>
                    <p className="text-lg font-black">{formatDecimal(val.mesomorfico)}</p>
                  </div>
                  <div className="col-span-full">
                    <p className="text-[8px] font-bold text-white/30 uppercase tracking-[0.2em] mb-1">Clasificación Somática</p>
                    <p className="text-xl font-black text-amber-400 uppercase tracking-tighter">{val.clasificacionIp || '—'}</p>
                  </div>
                  <div>
                    <p className="text-[8px] font-bold text-white/30 uppercase tracking-[0.2em] mb-1">Edad Metabólica</p>
                    <p className="text-lg font-black">{val.edadMetabolica || val.edad || '—'}</p>
                  </div>
                  <div>
                    <p className="text-[8px] font-bold text-emerald-400/50 uppercase tracking-[0.2em] mb-1">Peso Ideal</p>
                    <p className="text-lg font-black text-emerald-400">{formatDecimal(val.pesoIdeal)} <span className="text-[10px] opacity-30">KG</span></p>
                  </div>
               </div>
            </div>

            {/* CARD BIOIMPEDANCIA (SI EXISTE) */}
            {(val.bioGrasa || val.bioMusculo) && (
              <div className="bg-white border border-slate-100 p-8 shadow-sm space-y-6">
                 <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Referencia Bioimpedancia</h4>
                 <div className="grid grid-cols-3 gap-4">
                    <DataItem label="Grasa BIA" value={val.bioGrasa} unit="%" />
                    <DataItem label="Músculo BIA" value={val.bioMusculo} unit="%" />
                    <DataItem label="Agua" value={val.bioAgua} unit="%" />
                 </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
};

export default AssessmentDetail;
