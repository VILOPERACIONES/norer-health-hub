import { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Plus, Activity, Beaker, Clipboard, ChevronDown, Trash2, MoreHorizontal } from 'lucide-react';
import api from '@/lib/api';
import { formatDecimal } from '@/lib/format';
import { useToast } from '@/hooks/use-toast';

const Collapsible = ({ title, icon: Icon, defaultOpen = false, children }: { title: string; icon?: any; defaultOpen?: boolean; children: React.ReactNode }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className={`bg-secondary/10 rounded-none transition-all duration-300 overflow-hidden ${open ? 'ring-1 ring-foreground/10' : ''}`}>
      <button onClick={() => setOpen(!open)} className="flex items-center justify-between w-full p-4 group">
        <div className="flex items-center gap-4">
          {Icon && <div className={`w-10 h-10 rounded-none flex items-center justify-center transition-all ${open ? 'bg-foreground text-background' : 'bg-background text-muted-foreground'}`}><Icon className="h-4 w-4" /></div>}
          <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-foreground leading-none">{title}</h3>
        </div>
        <div className={`transition-all duration-300 ${open ? 'rotate-180 opacity-100' : 'opacity-20'}`}>
           <ChevronDown className="h-4 w-4 text-foreground" />
        </div>
      </button>
      {open && <div className="p-4 pt-0 space-y-6 animate-fade-in border-t border-foreground/5 mt-2">{children}</div>}
    </div>
  );
};

const Field = ({ label, value, onChange, type = 'number', disabled = false, suffix = '', placeholder = '' }: {
  label: string; value: string | number; onChange?: (v: string) => void; type?: string; disabled?: boolean; suffix?: string; placeholder?: string;
}) => (
  <div className="space-y-2">
    <label className="block text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1 opacity-40 leading-none">{label}{suffix && ` (${suffix})`}</label>
    <div className="relative group">
      <input
        type={type}
        value={value}
        onChange={onChange ? (e) => onChange(e.target.value) : undefined}
        disabled={disabled}
        placeholder={placeholder}
        className={`w-full bg-background rounded-none px-4 py-3 text-sm font-black uppercase tracking-tight border-2 border-transparent focus:border-foreground/20 focus:bg-background outline-none transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${disabled ? 'opacity-20' : 'group-hover:border-foreground/5'}`}
        step="0.01"
      />
    </div>
  </div>
);

const NewAssessment = () => {
  const { id: pacienteId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);

  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
  const [hora, setHora] = useState('');
  const [peso, setPeso] = useState('');
  const [talla, setTalla] = useState('');
  const [sexo, setSexo] = useState<'M' | 'F'>('F');
  const [edad, setEdad] = useState(25);

  useEffect(() => {
    const fetchPatient = async () => {
      try {
        const { data } = await api.get(`/api/pacientes/${pacienteId}`);
        const p = data?.data || data;
        if (p?.sexo) setSexo(p.sexo);
        if (p?.fechaNacimiento) {
            const birthDate = new Date(p.fechaNacimiento);
            const today = new Date();
            let age = today.getFullYear() - birthDate.getFullYear();
            const m = today.getMonth() - birthDate.getMonth();
            if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
            setEdad(age);
        }
      } catch (err) {
        console.error('Error cargando paciente:', err);
      }
    };
    fetchPatient();
  }, [pacienteId]);

  const [pliegues, setPliegues] = useState<Record<string, string>>({});
  const [perimetros, setPerimetros] = useState<Record<string, string>>({});
  const [diametros, setDiametros] = useState<Record<string, string>>({});
  const [bio, setBio] = useState<Record<string, string>>({});
  const [bioq, setBioq] = useState<Record<string, string>>({});
  const [fc, setFc] = useState('');
  const [pa, setPa] = useState('');
  const [comentarios, setComentarios] = useState('');
  const [suplementacion, setSuplementacion] = useState('');
  const [esquema, setEsquema] = useState({ competencia: '', etapa: '', tipoDieta: '' });
  const [temario, setTemario] = useState<{id: string, titulo: string, detalle: string}[]>([]);

  const calcData = useMemo(() => {
    const p = parseFloat(peso) || 0;
    const t = parseFloat(talla) || 0; 
    const tCm = t * 100;
    const imcVal = t > 0 ? p / (t * t) : 0;

    const tricep = parseFloat(pliegues['Trícep']) || 0;
    const bicep = parseFloat(pliegues['Bícep']) || 0;
    const subes = parseFloat(pliegues['Subescapular']) || 0;
    const cresta = parseFloat(pliegues['Cresta Ilíaca']) || 0;
    const supra = parseFloat(pliegues['Supraespinal']) || 0;
    const abdo = parseFloat(pliegues['Abdominal']) || 0;
    const muslo = parseFloat(pliegues['Muslo']) || 0;
    const panto = parseFloat(pliegues['Pantorrilla']) || 0;

    const sumaPliegues = tricep + bicep + subes + cresta + supra + abdo + muslo + panto;

    const perBrazo = parseFloat(perimetros['Brazo']) || 0;
    const perMuslo = parseFloat(perimetros['Muslo']) || 0;
    const perPanto = parseFloat(perimetros['Pantorrilla']) || 0;
    const perMuneca = parseFloat(perimetros['Muñeca']) || 0;

    const brazoCor = perBrazo - (Math.PI * tricep / 10);
    const piernaCor = perMuslo - (Math.PI * muslo / 10);
    const pantoCor = perPanto - (Math.PI * panto / 10);

    let complexion = null;
    let clasifComplexion = '';
    if (tCm > 0 && perMuneca > 0) {
      complexion = (perMuneca / tCm) * 100;
      if (sexo === 'M') {
        if (complexion > 10.4) clasifComplexion = 'Pequeña';
        else if (complexion >= 9.6) clasifComplexion = 'Mediana';
        else clasifComplexion = 'Grande';
      } else {
        if (complexion > 11) clasifComplexion = 'Pequeña';
        else if (complexion >= 10.1) clasifComplexion = 'Mediana';
        else clasifComplexion = 'Grande';
      }
    }

    const coefs: any = {
      M: { '17-19': { a: 1.1620, b: 0.0630 }, '20-29': { a: 1.1631, b: 0.0632 }, '30-39': { a: 1.1422, b: 0.0544 }, '40-49': { a: 1.1620, b: 0.0700 }, '50+': { a: 1.1715, b: 0.0779 } },
      F: { '17-19': { a: 1.1549, b: 0.0678 }, '20-29': { a: 1.1599, b: 0.0717 }, '30-39': { a: 1.1423, b: 0.0632 }, '40-49': { a: 1.1333, b: 0.0612 }, '50+': { a: 1.1339, b: 0.0645 } }
    };

    let rango = '50+';
    if (edad <= 19) rango = '17-19';
    else if (edad <= 29) rango = '20-29';
    else if (edad <= 39) rango = '30-39';
    else if (edad <= 49) rango = '40-49';

    const suma4 = tricep + bicep + subes + cresta;
    let densidad2comp = null, pctGrasa2comp = null, kgGrasa2comp = null, kgMasaMagra2comp = null;

    if (suma4 > 0 && p > 0) {
      const { a, b } = coefs[sexo][rango];
      densidad2comp = a - (b * Math.log10(suma4));
      pctGrasa2comp = ((4.95 / densidad2comp) - 4.5) * 100;
      kgGrasa2comp = (pctGrasa2comp / 100) * p;
      kgMasaMagra2comp = p - kgGrasa2comp;
    }

    let superficieCorp = null, pctGrasaCorp = null, masaGrasaReal = null, pctGrasaIdeal = null, masaGrasaIdeal = null;
    let masaOsea = null, pctMasaOsea = null, masaVisceral = null, pctMasaVisceral = null;
    let masaMuscular = null, pctMasaMuscular = null, pctMusculoIdeal = null, musculoIdeal = null, deficitMuscular = null;
    let masaMagra = null, ptMin = null, ptMax = null, pesoIdeal = null, sobrepeso = null;

    const diamBiest = parseFloat(diametros['Biestiloideo (Muñeca)']) || 0;
    const diamHumero = parseFloat(diametros['Biepicondilar Húmero']) || 0;
    const diamFemur = parseFloat(diametros['Biepicondilar Fémur']) || 0;
    const bioVisceral = parseFloat(bio['Masa Visceral']) || 0;

    if (p > 0 && tCm > 0) {
      superficieCorp = 0.007184 * Math.pow(p, 0.425) * Math.pow(tCm, 0.725);
      if (pctGrasa2comp !== null) {
        pctGrasaCorp = pctGrasa2comp;
        masaGrasaReal = kgGrasa2comp;
        pctGrasaIdeal = sexo === 'M' ? 15 : 23;
        masaGrasaIdeal = (pctGrasaIdeal / 100) * p;
        masaMagra = p - (masaGrasaReal || 0);

        if (diamBiest > 0 && diamHumero > 0) {
          masaOsea = 3.02 * Math.pow((Math.pow(t, 2) * diamBiest * diamHumero * 400), 0.712);
          pctMasaOsea = (masaOsea / p) * 100;
          
          masaMuscular = p - (masaGrasaReal || 0) - masaOsea;
          pctMasaMuscular = (masaMuscular / p) * 100;

          pctMusculoIdeal = sexo === 'M' ? 45 : 36;
          musculoIdeal = (pctMusculoIdeal / 100) * p;
          deficitMuscular = Math.max(0, musculoIdeal - masaMuscular);
        }
      }

      if (bioVisceral > 0) {
        masaVisceral = bioVisceral;
        pctMasaVisceral = (masaVisceral / p) * 100;
      }

      if (sexo === 'M') {
        ptMin = (tCm - 100) - ((tCm - 150) / 4);
        ptMax = (tCm - 100) - ((tCm - 150) / 2.5);
      } else {
        ptMin = (tCm - 100) - ((tCm - 150) / 2.5);
        ptMax = (tCm - 100) - ((tCm - 150) / 2);
      }
      pesoIdeal = (ptMin + ptMax) / 2;
      sobrepeso = Math.max(0, p - ptMax);
    }

    let endomorfico = null, mesomorfico = null, ectomorfico = null;
    const S3 = tricep + subes + supra;
    if (S3 > 0) {
      endomorfico = -0.7182 + (0.1451 * S3) - (0.00068 * Math.pow(S3, 2)) + (0.0000014 * Math.pow(S3, 3));
    }
    if (diamHumero > 0 && diamFemur > 0 && tCm > 0) {
      mesomorfico = (0.858 * diamHumero) + (0.601 * diamFemur) + (0.188 * brazoCor) + (0.161 * piernaCor) - (0.131 * tCm) + 4.5;
    }
    const IP = p > 0 ? tCm / Math.pow(p, 1/3) : 0;
    if (IP >= 40.75) ectomorfico = 0.732 * IP - 28.58;
    else if (IP >= 38.25) ectomorfico = 0.463 * IP - 17.63;
    else if (IP > 0) ectomorfico = 0.1;

    let clasificacionIp = '';
    if (IP > 0) {
      if (IP < 38.25) clasificacionIp = 'Pícnico';
      else if (IP <= 40.75) clasificacionIp = 'Normotipo';
      else clasificacionIp = 'Leptosómico';
    }

    return {
      imc: imcVal, 
      sumaPliegues, 
      brazoCorregido: brazoCor, 
      piernaCorregida: piernaCor, 
      pantorrillaCorregida: pantoCor, 
      complexion, 
      clasifComplexion,
      densidad2comp, 
      pctGrasa2comp, 
      kgGrasa2comp, 
      kgMasaMagra2comp, 
      superficieCorporal: superficieCorp,
      pctGrasaCorporal4comp: pctGrasaCorp, 
      masaGrasaReal, 
      pctGrasaIdeal, 
      masaGrasaIdeal,
      masaOsea, 
      pctMasaOsea, 
      masaVisceral, 
      pctMasaVisceral,
      masaMuscular, 
      pctMasaMuscular, 
      pctMusculoIdeal, 
      musculoIdeal, 
      deficitMuscular, 
      masaMagra,
      pesoTeoricoMin: ptMin, 
      pesoTeoricoMax: ptMax, 
      pesoIdeal, 
      sobrepeso,
      endomorfico, 
      mesomorfico, 
      ectomorfico, 
      indicePonderal: IP, 
      clasificacionIp
    };
  }, [pliegues, perimetros, diametros, peso, talla, sexo, edad, bio]);

  const handleSave = async (redirectAPlan: boolean = false) => {
    if (!peso || !talla) {
      toast({ title: 'Datos Faltantes', description: 'Peso y Talla son obligatorios para el protocolo.', variant: 'destructive' });
      return;
    }
    setSaving(true);
    const pesoNum = parseFloat(peso) || 0;
    const tallaNum = parseFloat(talla) || 0;
    const body = {
      fecha, hora, peso: pesoNum, talla: tallaNum, imc: calcData.imc,
      pliegues: Object.fromEntries(Object.entries(pliegues).map(([k, v]) => [k, parseFloat(v) || 0])),
      perimetros: Object.fromEntries(Object.entries(perimetros).map(([k, v]) => [k, parseFloat(v) || 0])),
      diametros: Object.fromEntries(Object.entries(diametros).map(([k, v]) => [k, parseFloat(v) || 0])),
      bioimpedancia: bio, bioquimicos: bioq, signosVitales: { fc, pa }, comentarios, suplementacion, temario,
      esquemaCompetencia: esquema.competencia,
      etapaCompetitiva: esquema.etapa,
      tipoDietaCompetencia: esquema.tipoDieta,
      ...calcData
    };
    try {
      const response = await api.post(`/api/pacientes/${pacienteId}/valoraciones`, body);
      const serverData = response.data?.data || response.data;
      const valoracionId = serverData?.id;
      
      toast({ title: 'Protocolo BioWeb Sincronizado' });
      if (redirectAPlan && valoracionId) {
        navigate(`/pacientes/${pacienteId}/planes/nuevo?valoracionId=${valoracionId}`);
      } else {
        navigate(`/pacientes/${pacienteId}`);
      }
    } catch (err: any) {
      toast({ title: 'Fallo de Red', description: 'No se pudo digitalizar la consulta', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in max-w-7xl pb-20 mx-auto">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-border/40 pb-6">
        <div className="space-y-6">
           <button onClick={() => navigate(`/pacientes/${pacienteId}`)} className="flex items-center gap-3 text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground transition-all w-fit group leading-none">
             <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-all" /> Regresar al Expediente
           </button>
           <div className="animate-slide-up space-y-2">
              <h1 className="text-3xl font-black text-foreground tracking-tighter uppercase leading-none">Digitalización BioData</h1>
              <p className="text-muted-foreground font-black text-[10px] uppercase tracking-[0.3em] opacity-40 leading-none">Análisis Antropométrico Maestro y Seguimiento Táctico</p>
           </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-8">
          {/* Métricas base */}
          <div className="bg-secondary/10 p-6 rounded-none animate-slide-up border border-border/20">
            <h3 className="text-[10px] font-black text-foreground uppercase tracking-[0.3em] mb-6 flex items-center gap-4 leading-none">
               <div className="w-2 h-2 rounded-full bg-foreground" /> DATOS DE CONTROL CRÍTICO
            </h3>
            <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4">
              <Field label="Fecha" value={fecha} onChange={setFecha} type="date" />
              <Field label="Hora" value={hora} onChange={setHora} type="time" />
              <Field label="Masa (KG)" value={peso} onChange={setPeso} />
              <Field label="Estatura (M)" value={talla} onChange={setTalla} />
            </div>

            {calcData.imc > 0 && (
              <div className="mt-6 p-6 bg-background rounded-none border border-foreground/5 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-2 opacity-30 leading-none">Proyección IMC / Score</p>
                  <p className="text-2xl font-black tracking-tighter uppercase leading-none">{formatDecimal(calcData.imc)}</p>
                </div>
                <div className="px-4 py-2 rounded-none bg-foreground text-background text-[10px] font-black uppercase tracking-[0.2em] font-mono">
                   SISTEMA ACTIVO
                </div>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <Collapsible title="Somatometría Pliegues (mm)" icon={Plus} defaultOpen>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                {['Trícep', 'Bícep', 'Subescapular', 'Cresta Ilíaca', 'Supraespinal', 'Abdominal', 'Muslo', 'Pantorrilla'].map((n) => (
                  <Field key={n} label={n} value={pliegues[n] || ''} onChange={(v) => setPliegues({ ...pliegues, [n]: v })} />
                ))}
              </div>
              <div className="bg-background p-4 flex items-center justify-between border border-foreground/5">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40">Suma Pliegues</span>
                <span className="text-xl font-black">{formatDecimal(calcData.sumaPliegues)} mm</span>
              </div>
            </Collapsible>

            <Collapsible title="Perimetría Muscular (cm)" icon={Plus}>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                {['Brazo', 'Brazo Contraído', 'Muñeca', 'Pectoral', 'Cintura', 'Abdomen', 'Cadera', 'Muslo', 'Pantorrilla'].map((n) => (
                  <Field key={n} label={n} value={perimetros[n] || ''} onChange={(v) => setPerimetros({ ...perimetros, [n]: v })} />
                ))}
              </div>
              <div className="grid grid-cols-3 gap-4 border-t border-foreground/5 pt-6">
                 <div>
                    <p className="text-[9px] font-black uppercase tracking-[0.2em] opacity-30">Brazo Cor.</p>
                    <p className="text-lg font-black">{formatDecimal(calcData.brazoCor)}</p>
                 </div>
                 <div>
                    <p className="text-[9px] font-black uppercase tracking-[0.2em] opacity-30">Muslo Cor.</p>
                    <p className="text-lg font-black">{formatDecimal(calcData.piernaCor)}</p>
                 </div>
                 <div>
                    <p className="text-[9px] font-black uppercase tracking-[0.2em] opacity-30">Pantor. Cor.</p>
                    <p className="text-lg font-black">{formatDecimal(calcData.pantoCor)}</p>
                 </div>
              </div>
            </Collapsible>

            <Collapsible title="Diámetros Óseos (cm)" icon={Plus}>
              <div className="grid sm:grid-cols-3 gap-6 mb-6">
                {['Biestiloideo (Muñeca)', 'Biepicondilar Húmero', 'Biepicondilar Fémur'].map((n) => (
                  <Field key={n} label={n} value={diametros[n] || ''} onChange={(v) => setDiametros({ ...diametros, [n]: v })} />
                ))}
              </div>
              {calcData.complexion && (
                <div className="bg-background p-4 flex items-center justify-between border border-foreground/5 mt-4">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40">Complexión Ósea</span>
                  <span className="text-lg font-black">{formatDecimal(calcData.complexion)} - {calcData.clasifComplexion}</span>
                </div>
              )}
            </Collapsible>

            <Collapsible title="Signos Vitales & Bioquímicos" icon={Plus}>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                <Field label="Frecuencia BPM" value={fc} onChange={setFc} suffix="BPM" />
                <Field label="Presión Arterial" value={pa} onChange={setPa} type="text" placeholder="120/80" />
                <Field label="Glucosa" value={bioq['Glu'] || ''} onChange={(v) => setBioq({...bioq, Glu: v})} suffix="mg/dL" />
                <Field label="Triglicéridos" value={bioq['Tag'] || ''} onChange={(v) => setBioq({...bioq, Tag: v})} suffix="mg/dL" />
                <Field label="Colesterol" value={bioq['Col'] || ''} onChange={(v) => setBioq({...bioq, Col: v})} suffix="mg/dL" />
                <Field label="Creatinina" value={bioq['Creat'] || ''} onChange={(v) => setBioq({...bioq, Creat: v})} suffix="mg/dL" />
                <Field label="Ácido Úrico" value={bioq['Urico'] || ''} onChange={(v) => setBioq({...bioq, Urico: v})} suffix="mg/dL" />
              </div>
            </Collapsible>

            <Collapsible title="Esquema Competitivo" icon={Plus}>
              <div className="grid sm:grid-cols-3 gap-6">
                <Field type="text" label="Competencia" value={esquema.competencia} onChange={(v) => setEsquema({...esquema, competencia: v})} />
                <Field type="text" label="Etapa" value={esquema.etapa} onChange={(v) => setEsquema({...esquema, etapa: v})} />
                <Field type="text" label="Dieta" value={esquema.tipoDieta} onChange={(v) => setEsquema({...esquema, tipoDieta: v})} />
              </div>
            </Collapsible>

            <div className="bg-secondary/10 p-6 rounded-none border border-border/20">
              <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-foreground mb-6 opacity-40 leading-none">OBSERVACIONES DEL ESPECIALISTA</h3>
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1 opacity-30 leading-none">EVOLUCIÓN CLÍNICA Y NOTAS</label>
                  <textarea value={comentarios} onChange={(e) => setComentarios(e.target.value)} className="w-full bg-background rounded-none p-4 text-sm font-black border-2 border-transparent focus:border-foreground/20 focus:bg-background outline-none min-h-[160px] uppercase tracking-tighter leading-relaxed transition-all" />
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1 opacity-30 leading-none">PROTOCOLIZACIÓN DE SUPLEMENTOS</label>
                  <textarea value={suplementacion} onChange={(e) => setSuplementacion(e.target.value)} className="w-full bg-background rounded-none p-4 text-sm font-black border-2 border-transparent focus:border-foreground/20 focus:bg-background outline-none min-h-[120px] uppercase tracking-tighter leading-relaxed transition-all" />
                </div>
                <div className="pt-6 border-t border-foreground/10 space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1 opacity-30 leading-none">TEMARIO ABORDADO</label>
                    <button onClick={() => setTemario([...temario, { id: Date.now().toString(), titulo: '', detalle: '' }])} className="text-[10px] font-black uppercase tracking-widest text-foreground hover:opacity-70 flex items-center gap-2 transition-all">
                      <Plus className="h-3 w-3" /> AGREGAR TEMA
                    </button>
                  </div>
                  {temario.map((t, idx) => (
                    <div key={t.id || idx} className="bg-background p-4 border border-foreground/5 space-y-4 relative group hover:border-foreground/20 transition-all">
                      <button onClick={() => setTemario(temario.filter((_, i) => i !== idx))} className="absolute top-4 right-4 text-destructive opacity-0 group-hover:opacity-100 transition-all">
                         <Trash2 className="h-4 w-4" />
                      </button>
                      <input type="text" placeholder="TÍTULO DEL TEMA..." value={t.titulo} onChange={(e) => { const nt = [...temario]; nt[idx].titulo = e.target.value; setTemario(nt); }} className="w-full bg-transparent text-sm font-black uppercase tracking-tighter outline-none placeholder:opacity-30 border-b border-foreground/10 pb-2 focus:border-foreground/40 pr-8 transition-all" />
                      <textarea placeholder="Detalle y acuerdos..." value={t.detalle} onChange={(e) => { const nt = [...temario]; nt[idx].detalle = e.target.value; setTemario(nt); }} className="w-full bg-transparent text-xs font-bold outline-none min-h-[60px] resize-none placeholder:opacity-30 pt-2" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-4 space-y-8">
          <div className="sticky top-20 space-y-6 animate-slide-up">
            {calcData.pctGrasaCorp !== null && (
              <div className="bg-foreground text-background p-6 rounded-none relative overflow-hidden space-y-8">
                <div className="absolute top-0 right-0 p-6 opacity-5 translate-x-6 translate-y-[-0.5rem]">
                   <MoreHorizontal className="w-24 h-24" />
                </div>
                <h3 className="text-[10px] font-black uppercase tracking-[0.3em] opacity-30 leading-none">CÓMPUTO ALGORÍTMICO 4 COMPONENTES</h3>
                
                <div className="space-y-4 relative">
                   <div className="flex items-center justify-between border-b border-background/10 pb-4">
                      <span className="text-[11px] font-black uppercase tracking-[0.2em] opacity-40">Grasa Real // Grasa Ideal</span>
                      <div className="text-right space-y-1">
                         <p className="text-xl font-black tracking-tighter leading-none text-destructive">{formatDecimal(calcData.pctGrasaCorp)}% // {formatDecimal(calcData.pctGrasaIdeal)}%</p>
                         <p className="text-[10px] font-bold opacity-30 mt-1 font-mono leading-none">{formatDecimal(calcData.masaGrasaReal)} KG // {formatDecimal(calcData.masaGrasaIdeal)} KG</p>
                      </div>
                   </div>
                   <div className="flex items-center justify-between border-b border-background/10 pb-4">
                      <span className="text-[11px] font-black uppercase tracking-[0.2em] opacity-40">Muscular // Ideal Mínimo</span>
                      <div className="text-right space-y-1">
                         <p className="text-xl font-black tracking-tighter leading-none text-emerald-400">{formatDecimal(calcData.pctMasaMuscular)}% // {formatDecimal(calcData.pctMusculoIdeal)}%</p>
                         <p className="text-[10px] font-bold opacity-30 mt-1 font-mono leading-none">{formatDecimal(calcData.masaMuscular)} KG // {formatDecimal(calcData.musculoIdeal)} KG</p>
                         {calcData.deficitMuscular !== null && calcData.deficitMuscular > 0 && <p className="text-[9px] font-black text-amber-400 uppercase tracking-widest mt-2 block">DÉFICIT: {formatDecimal(calcData.deficitMuscular)} KG</p>}
                      </div>
                   </div>
                   <div className="flex items-center justify-between border-b border-background/10 pb-4">
                      <span className="text-[11px] font-black uppercase tracking-[0.2em] opacity-40">Masa Ósea</span>
                      <div className="text-right space-y-1">
                         <p className="text-lg font-black tracking-tighter leading-none">{formatDecimal(calcData.pctMasaOsea)}%</p>
                         <p className="text-[10px] font-bold opacity-30 mt-1 font-mono leading-none">{formatDecimal(calcData.masaOsea)} KG</p>
                      </div>
                   </div>
                   <div className="flex items-center justify-between pt-2">
                      <span className="text-[11px] font-black uppercase tracking-[0.2em] opacity-40">Masa Magra / Superficie Corp</span>
                      <p className="text-lg font-black tracking-tighter leading-none font-mono">{formatDecimal(calcData.masaMagra)} <span className="opacity-40 font-sans text-[10px]">KG</span> / {formatDecimal(calcData.superficieCorp)} <span className="opacity-40 font-sans text-[10px]">M²</span></p>
                   </div>
                </div>

                <div className="border-t border-background/20 pt-6 mt-6 space-y-4">
                    <h4 className="text-[9px] font-black uppercase tracking-[0.3em] opacity-30 leading-none">Métricas Biotipológicas</h4>
                    <div className="grid grid-cols-2 gap-4">
                       <div>
                         <p className="text-[8px] uppercase tracking-widest opacity-40">Ponderal (IP)</p>
                         <p className="text-sm font-black">{formatDecimal(calcData.indicePonderal)} — {calcData.clasificacionIp}</p>
                       </div>
                       <div>
                         <p className="text-[8px] uppercase tracking-widest opacity-40">Lorentz (Peso Ideal)</p>
                         <p className="text-sm font-black">{formatDecimal(calcData.pesoIdeal)} kg | Obj: {formatDecimal(calcData.sobrepeso)} kg OFF</p>
                       </div>
                    </div>
                </div>
              </div>
            )}

            <div className="flex flex-col gap-2">
               <button
                  onClick={() => handleSave(true)}
                  disabled={saving}
                  className="w-full py-6 bg-foreground text-background rounded-none text-[11px] font-black uppercase tracking-[0.3em] transition-all disabled:opacity-50 flex items-center justify-center gap-4"
                >
                  {saving ? (
                    <div className="w-4 h-4 border-2 border-background/20 border-t-background rounded-full animate-spin" />
                  ) : (
                    <>
                      <Save className="h-4 w-4" /> PERSISTIR & DISEÑAR PLAN
                    </>
                  )}
                </button>
                <button
                  onClick={() => handleSave(false)}
                  disabled={saving}
                  className="w-full py-4 bg-background border border-foreground/10 text-foreground rounded-none text-[10px] font-black uppercase tracking-[0.2em] hover:bg-secondary/20 transition-all opacity-40 hover:opacity-100"
                >
                   Guardar Registro
                </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewAssessment;
