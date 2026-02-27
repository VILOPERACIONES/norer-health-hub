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
    <div className={`p-6 md:p-8 border-b border-border-subtle ${active ? 'bg-bg-elevated/50' : 'bg-bg-surface'}`}>
      <div className="flex items-center gap-3 mb-8">
        <div className={`p-2 rounded-[8px] ${active ? 'bg-brand-primary/20 text-brand-primary' : 'bg-bg-elevated text-text-muted'}`}>
          {Icon && <Icon className="h-4 w-4" />}
        </div>
        <h3 className="text-[14px] font-semibold text-text-primary m-0">{title}</h3>
      </div>
      {children}
    </div>
  );

  const DataItem = ({ label, value, unit = '', highlight = false, alert = false }: { label: string; value: any; unit?: string; highlight?: boolean; alert?: boolean }) => (
    <div className="space-y-1">
      <p className="text-[12px] font-medium text-text-secondary m-0">{label}</p>
      <p className={`text-[16px] font-bold ${highlight ? 'text-text-primary' : 'text-text-secondary'} ${alert ? 'text-accent-red' : ''} m-0`}>
        {formatDecimal(value)}
        {value !== null && value !== undefined && value !== '' && unit && <span className="text-[14px] font-medium text-text-muted ml-0.5">{unit}</span>}
      </p>
    </div>
  );

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center">
       <div className="w-8 h-8 rounded-full border-2 border-text-muted border-t-text-primary animate-spin mb-4" />
       <p className="text-[14px] font-medium text-text-muted">Cargando valoración...</p>
    </div>
  );
  
  if (!val) return (
    <div className="min-h-screen flex flex-col items-center justify-center p-10 text-center animate-fade-in">
      <h1 className="text-[20px] font-bold text-text-primary m-0 mb-6">Registro no localizado</h1>
      <button onClick={() => navigate(`/pacientes/${pacienteId}`)} className="px-[18px] py-[10px] bg-bg-surface border border-border-subtle text-text-primary hover:bg-bg-elevated text-[14px] font-medium rounded-[8px] transition-colors">Volver al expediente</button>
    </div>
  );

  return (
    <div className="space-y-8 animate-fade-in pb-20 max-w-[1400px] mx-auto px-6">
      {/* HEADER TIPO REPORTE */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 pt-6 pb-6 border-b border-border-subtle">
        <div className="space-y-2">
          <button 
            onClick={() => navigate(`/pacientes/${pacienteId}`)} 
            className="flex items-center gap-2 text-[14px] font-medium text-text-secondary hover:text-text-primary transition-colors w-fit group mb-4"
          >
            <ArrowLeft className="h-[18px] w-[18px] group-hover:-translate-x-1 transition-transform" /> Volver al expediente
          </button>
          <div className="animate-slide-up space-y-1">
             <div className="flex items-center gap-2 mb-2">
                <span className="px-2.5 py-1 bg-[#1a2e1a] text-accent-green rounded-[6px] text-[12px] font-medium">Historial Clínico</span>
                <span className="text-text-muted text-[13px] font-normal">Consulta #{val.numeroValoracion || '—'}</span>
             </div>
             <h1 className="text-[26px] font-bold text-text-primary tracking-tight m-0">Detalles de Consulta</h1>
             <p className="text-text-secondary font-normal text-[14px] m-0">{formatDate(val.fecha)} · ID: {val.id.slice(-12).toUpperCase()}</p>
          </div>
        </div>
        <div className="flex gap-4">
          <button className="px-[18px] py-[10px] bg-bg-surface hover:bg-bg-elevated border border-border-subtle text-text-primary text-[14px] font-medium rounded-[8px] transition-colors flex items-center gap-2">
            <Printer className="h-[18px] w-[18px]" /> Exportar PDF
          </button>
        </div>
      </header>

      <div>
        <div className="grid lg:grid-cols-12 gap-6">
          
          {/* COLUMNA PRINCIPAL */}
          <div className="lg:col-span-8 space-y-6">
            <div className="bg-bg-surface border border-border-subtle rounded-[12px] overflow-hidden animate-slide-up">
              
              {/* RESUMEN CRÍTICO */}
              <div className="grid grid-cols-2 md:grid-cols-4 bg-bg-elevated border-b border-border-subtle p-6 md:p-8 gap-6">
                <DataItem label="Masa Corporal" value={val.pesoActual || val.peso} unit="kg" highlight />
                <DataItem label="IMC Protocolo" value={val.imc} highlight alert={parseFloat(val.imc) > 25} />
                <DataItem label="Grasa Real" value={val.pctGrasaCorp || val.pctGrasa2comp} unit="%" highlight />
                <DataItem label="Masa Muscular" value={val.masaMuscular} unit="kg" highlight />
              </div>

              {/* ANTROPOMETRÍA PLIEGUES */}
              <Section title="Estratigrafía Táctil (Pliegues)" icon={Ruler}>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-y-8">
                   <DataItem label="Tríceps" value={val.pliegeTricep} unit="mm" />
                   <DataItem label="Bíceps" value={val.pliegeBicep} unit="mm" />
                   <DataItem label="Subescapular" value={val.pliegueSubescapular} unit="mm" />
                   <DataItem label="Cresta Iliaca" value={val.pliegueCrestaIliaca} unit="mm" />
                   <DataItem label="Supraespinal" value={val.pliegueSupraespinal} unit="mm" />
                   <DataItem label="Abdominal" value={val.pliegueAbdominal} unit="mm" />
                   <DataItem label="Muslo Frontal" value={val.pliegueMusloFrontal} unit="mm" />
                   <DataItem label="Pantorrilla" value={val.plieguePantorrilla} unit="mm" />
                   <div className="col-span-full pt-4">
                     <div className="inline-block p-4 rounded-[8px] bg-bg-elevated border border-border-default">
                        <p className="text-[12px] font-medium text-text-secondary m-0 mb-1">Suma 8 Pliegues</p>
                        <p className="text-[20px] font-bold text-text-primary m-0 leading-none">{val.sumaPliegues || '—'} <span className="text-[14px] font-medium text-text-muted">mm</span></p>
                     </div>
                   </div>
                </div>
              </Section>

              {/* PERÍMETROS */}
              <Section title="Perimetría Muscular Somática" icon={Activity}>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-6 md:gap-y-8">
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
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                   <DataItem label="Biestiloideo" value={val.diametroBiestiloideo} unit="cm" />
                   <DataItem label="Biepicond. Humero" value={val.diametroBiepicondHumero} unit="cm" />
                   <DataItem label="Biepicond. Femur" value={val.diametroBiepicondFemur} unit="cm" />
                   <DataItem label="Complexión" value={val.complexion} unit={val.clasifComplexion} />
                </div>
              </Section>

              {/* BIOQUÍMICOS */}
              <Section title="Analítica de Bioquímicos" icon={Beaker}>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
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
                  <div className="space-y-4">
                    {val.temarioConsulta.map((tema: any) => (
                      <div key={tema.id} className="border-l-2 border-brand-primary pl-4 py-1">
                        <h4 className="text-[13px] font-semibold text-text-primary m-0 mb-1">{tema.tema}</h4>
                        <p className="text-[14px] text-text-secondary leading-relaxed m-0">{tema.detalle}</p>
                      </div>
                    ))}
                  </div>
                </Section>
              )}

              {/* NOTAS FINALES */}
              {(val.comentarios || val.suplementacion) && (
                <div className="p-6 md:p-8 bg-[#151515] border-t border-border-default">
                   <div className="grid md:grid-cols-2 gap-8">
                      {val.comentarios && (
                        <div className="space-y-3">
                           <p className="text-[12px] font-medium text-text-muted m-0">Observaciones Clínicas</p>
                           <p className="text-[14px] leading-relaxed text-text-secondary font-normal m-0">{val.comentarios}</p>
                        </div>
                      )}
                      {val.suplementacion && (
                        <div className="space-y-3">
                           <p className="text-[12px] font-medium text-text-muted m-0">Protocolo de Suplementos</p>
                           <p className="text-[14px] leading-relaxed text-text-secondary font-normal m-0">{val.suplementacion}</p>
                        </div>
                      )}
                   </div>
                </div>
              )}
            </div>
          </div>

          {/* SIDEBAR DE MÉTRICAS AVANZADAS */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* CARD 4 COMPONENTES */}
            <div className="bg-bg-surface border border-border-subtle p-6 rounded-[12px] space-y-6 animate-slide-up" style={{ animationDelay: '0.1s' }}>
               <div className="flex items-center gap-2 border-b border-border-default pb-4">
                  <Shield className="h-[18px] w-[18px] text-text-primary" />
                  <h4 className="text-[14px] font-semibold text-text-primary m-0">Algoritmo 4 Componentes</h4>
               </div>
               
               <div className="space-y-6">
                  <div className="flex justify-between items-end border-b border-border-default pb-4">
                     <p className="text-[12px] font-medium text-text-secondary m-0">Masa Ósea</p>
                     <div className="text-right space-y-1">
                        <p className="text-[16px] font-bold text-text-primary m-0">{formatDecimal(val.masaOsea)} <span className="text-[12px] font-normal text-text-muted">kg</span></p>
                        <p className="text-[11px] font-normal text-text-muted mt-0.5 m-0">{formatDecimal(val.pctMasaOsea)}%</p>
                     </div>
                  </div>
                  <div className="flex justify-between items-end border-b border-border-default pb-4">
                     <p className="text-[12px] font-medium text-text-secondary m-0">Masa Visceral</p>
                     <div className="text-right space-y-1">
                        <p className="text-[16px] font-bold text-text-primary m-0">{formatDecimal(val.masaVisceral)} <span className="text-[12px] font-normal text-text-muted">kg</span></p>
                        <p className="text-[11px] font-normal text-text-muted mt-0.5 m-0">{formatDecimal(val.pctMasaVisceral)}%</p>
                     </div>
                  </div>
                  <div className="flex justify-between items-end border-b border-border-default pb-4">
                     <p className="text-[12px] font-medium text-accent-green m-0">Masa Magra (MLG)</p>
                     <div className="text-right space-y-1">
                        <p className="text-[16px] font-bold text-accent-green m-0">{formatDecimal(val.masaMagra)} <span className="text-[12px] font-normal text-[#1a2e1a]">kg</span></p>
                        <p className="text-[11px] font-normal text-text-muted mt-0.5 m-0">S.C. {formatDecimal(val.superficieCorp)} m²</p>
                     </div>
                  </div>
                  <div className="flex justify-between items-center pt-2">
                     <p className="text-[12px] font-medium text-accent-red m-0">Déficit Muscular</p>
                     <div className="text-right">
                        <p className="text-[18px] font-bold text-accent-red m-0">-{formatDecimal(val.deficitMusculo)} <span className="text-[12px] font-normal text-[#2e1a1a]">kg</span></p>
                     </div>
                  </div>
               </div>
            </div>

            {/* CARD BIOTIPOLOGÍA */}
            <div className="bg-bg-elevated border border-border-subtle p-6 rounded-[12px] space-y-6 animate-slide-up" style={{ animationDelay: '0.2s' }}>
               <div className="flex items-center gap-2 border-b border-border-default pb-4">
                  <Zap className="h-[18px] w-[18px] text-brand-primary" />
                  <h4 className="text-[14px] font-semibold text-text-primary m-0">Somatotipo & Biotipología</h4>
               </div>
               <div className="grid grid-cols-2 gap-6">
                  <div>
                    <p className="text-[11px] font-medium text-text-muted m-0 mb-1">Endomorfia</p>
                    <p className="text-[14px] font-bold text-text-primary m-0">{formatDecimal(val.endomorfico)}</p>
                  </div>
                  <div>
                    <p className="text-[11px] font-medium text-text-muted m-0 mb-1">Mesomorfia</p>
                    <p className="text-[14px] font-bold text-text-primary m-0">{formatDecimal(val.mesomorfico)}</p>
                  </div>
                  <div className="col-span-full">
                    <p className="text-[11px] font-medium text-text-muted m-0 mb-1">Clasificación Somática</p>
                    <p className="text-[16px] font-bold text-brand-primary m-0">{val.clasificacionIp || '—'}</p>
                  </div>
                  <div>
                    <p className="text-[11px] font-medium text-text-muted m-0 mb-1">Edad Metabólica</p>
                    <p className="text-[14px] font-bold text-text-primary m-0">{val.edadMetabolica || val.edad || '—'}</p>
                  </div>
                  <div>
                    <p className="text-[11px] font-medium text-text-secondary m-0 mb-1">Peso Ideal</p>
                    <p className="text-[14px] font-bold text-accent-green m-0">{formatDecimal(val.pesoIdeal)} <span className="text-[11px] font-normal text-text-muted">kg</span></p>
                  </div>
               </div>
            </div>

            {/* CARD BIOIMPEDANCIA (SI EXISTE) */}
            {(val.bioGrasa || val.bioMusculo) && (
              <div className="bg-bg-surface border border-border-subtle p-6 rounded-[12px] space-y-6 animate-slide-up" style={{ animationDelay: '0.3s' }}>
                 <h4 className="text-[13px] font-semibold text-text-primary m-0">Referencia Bioimpedancia</h4>
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
