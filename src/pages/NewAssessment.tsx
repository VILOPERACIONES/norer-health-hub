import { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Plus, Activity, Beaker, Clipboard, ChevronDown, Trash2, MoreHorizontal, Clock } from 'lucide-react';
import api from '@/lib/api';
import { formatDecimal } from '@/lib/format';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const TABLA_2COMP = {
  Hombres: [
    { rango: '17-19', densidad: 1.0739, pctGrasa: 10.9, kgGrasa: 8.8,  kgMagra: 71.4 },
    { rango: '20-29', densidad: 1.0748, pctGrasa: 10.6, kgGrasa: 8.5,  kgMagra: 71.7 },
    { rango: '30-39', densidad: 1.0662, pctGrasa: 14.3, kgGrasa: 11.5, kgMagra: 68.7 },
    { rango: '40-49', densidad: 1.0641, pctGrasa: 15.2, kgGrasa: 12.2, kgMagra: 68.0 },
    { rango: '50+',   densidad: 1.0626, pctGrasa: 15.8, kgGrasa: 12.7, kgMagra: 67.5 },
  ],
  Mujeres: [
    { rango: '17-19', densidad: 1.0601, pctGrasa: 16.9, kgGrasa: 13.6, kgMagra: 66.6 },
    { rango: '20-29', densidad: 1.0597, pctGrasa: 17.1, kgGrasa: 13.7, kgMagra: 66.5 },
    { rango: '30-39', densidad: 1.0540, pctGrasa: 19.7, kgGrasa: 15.8, kgMagra: 64.4 },
    { rango: '40-49', densidad: 1.0477, pctGrasa: 22.4, kgGrasa: 18.0, kgMagra: 62.2 },
    { rango: '50+',   densidad: 1.0437, pctGrasa: 24.3, kgGrasa: 19.5, kgMagra: 60.7 },
  ]
};

const TABLA_FAO_OMS = {
  Hombres: { '10-18': 2054.5, '19-30': 1906.06, '31-60': 1809.32, '60+': 1569.7 },
  Mujeres: { '10-18': 1724.44, '19-30': 1674.94, '31-60': 1526.74, '60+': 1438.1 }
};

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

    const perBrazo = parseFloat(perimetros['Brazo Contraído']) || 0;
    const perPantorrilla = parseFloat(perimetros['Pantorrilla']) || 0;
    const perMuneca = parseFloat(perimetros['Muñeca']) || 0;
    const perCintura = parseFloat(perimetros['Cintura']) || 0;
    const perCadera = parseFloat(perimetros['Cadera']) || 0;

    const brazoCor = perBrazo - (tricep / 10);
    const piernaCor = perPantorrilla - (panto / 10);
    const pantoCor = perPantorrilla - (panto / 10); // Pantorrilla corregida es la misma que pierna corregida en este contexto

    const get2Comp = (edad: number, sexo: string) => {
      const tabla = sexo === 'M' ? TABLA_2COMP.Hombres : TABLA_2COMP.Mujeres;
      if (edad <= 19) return tabla[0];
      if (edad <= 29) return tabla[1];
      if (edad <= 39) return tabla[2];
      if (edad <= 49) return tabla[3];
      return tabla[4];
    };

    const comp2 = get2Comp(edad, sexo);
    const pctGrasa2comp = comp2.pctGrasa;
    const kgGrasa2comp = comp2.kgGrasa;
    const kgMasaMagra2comp = comp2.kgMagra;

    let superficieCorp = 0;
    let pctGrasaCorp = 0, masaGrasaReal = 0, pctGrasaIdeal = 0, masaGrasaIdeal = 0;
    let masaOsea = 0, pctMasaOsea = 0, masaVisceral = 0, pctMasaVisceral = 0;
    let masaMuscular = 0, pctMasaMuscular = 0, pctMusculoIdeal = 0, musculoIdeal = 0, deficitMuscular = 0;
    let masaMagra = 0, ptMin = 0, ptMax = 0, pesoIdeal = 0, sobrepeso = 0, pesoAjustado = 0, pesoIdeal4comp = 0;

    const sumaPliegues6 = supra + tricep + subes + muslo + abdo + panto;

    if (p > 0 && tCm > 0) {
      superficieCorp = 0.007184 * Math.pow(p, 0.425) * Math.pow(tCm, 0.725);
      
      pctGrasaCorp = sumaPliegues6 > 0 ? (sumaPliegues6 * 0.153) + 5.8 : 0;
      masaGrasaReal = (pctGrasaCorp * p) / 100;
      
      pctGrasaIdeal = sexo === 'M' ? 15 : 23;
      masaGrasaIdeal = (pctGrasaIdeal * p) / 100;

      masaVisceral = p * 0.24;
      pctMasaVisceral = p * 0.241;

      if (perMuneca > 0 && perPantorrilla > 0) {
        masaOsea = Math.pow(
          Math.pow(tCm, 2) * (perMuneca / 1000) * (perPantorrilla / 1000) * 400,
          0.712
        ) * 3.02;
        pctMasaOsea = (masaOsea * 100) / p;
      }

      masaMuscular = p - (masaGrasaReal + masaVisceral + masaOsea);
      pctMasaMuscular = (masaMuscular * 100) / p;

      pctMusculoIdeal = sexo === 'M' ? 45 : 36;
      musculoIdeal = (pctMusculoIdeal * p) / 100;
      deficitMuscular = Math.max(0, musculoIdeal - masaMuscular);

      masaMagra = p - masaGrasaReal;

      // Peso Teórico (Lorentz adaptadas)
      const basePT = (tCm - 100) * 0.85;
      if (sexo === 'M') {
        pesoIdeal = basePT * 1.00;
        ptMin = basePT * 0.95;
        ptMax = basePT * 1.05;
      } else {
        pesoIdeal = basePT * 0.95;
        ptMin = basePT * 0.90;
        ptMax = basePT * 1.00;
      }

      pesoIdeal4comp = masaMagra + masaGrasaIdeal;
      sobrepeso = p - pesoIdeal4comp;
      pesoAjustado = ((p - pesoIdeal) * 0.25) + pesoIdeal;
    }

    // Harris-Benedict con ETA 10%
    let tmb = 0;
    if (sexo === 'M') {
      tmb = 66.5 + (13.75 * p) + (5.003 * tCm) - (6.775 * edad);
    } else {
      tmb = 655.1 + (9.563 * p) + (1.850 * tCm) - (4.676 * edad);
    }

    const calcGET = (tmbVal: number, factorPct: number) => {
      const subtotal = tmbVal + (tmbVal * factorPct);
      const eta = subtotal * 0.10;
      return subtotal + eta;
    };

    const getFAOOMS = (edadVal: number, sexoVal: string) => {
      const tabla = sexoVal === 'M' ? TABLA_FAO_OMS.Hombres : TABLA_FAO_OMS.Mujeres;
      if (edadVal <= 18) return (tabla as any)['10-18'];
      if (edadVal <= 30) return (tabla as any)['19-30'];
      if (edadVal <= 60) return (tabla as any)['31-60'];
      return (tabla as any)['60+'];
    };

    const hbeSedentario = calcGET(tmb, 0.10);
    const hbeLeve = calcGET(tmb, 0.20);
    const hbeModerado = calcGET(tmb, 0.30);
    const hbeIntenso = calcGET(tmb, 0.40);
    const faoomsBase = getFAOOMS(edad, sexo);

    // IP corregido
    const x1 = tCm / (perMuneca || 1);
    const x2 = x1 * x1;
    const IP = x2 * 0.418;

    let endomorfico = null, mesomorfico = null, ectomorfico = null;
    const S4 = tricep + subes + supra + panto;
    if (S4 > 0) {
      endomorfico = -0.7182 + (0.1451 * S4) - (0.00068 * Math.pow(S4, 2)) + (0.0000014 * Math.pow(S4, 3));
    }
    
    if (perCintura > 0 && perCadera > 0 && tCm > 0) {
      mesomorfico = (0.858 * perCintura) + (0.601 * perCadera) + (0.188 * brazoCor) + (0.161 * piernaCor) - (0.131 * tCm) + 4.5;
    }

    if (IP >= 40.75) ectomorfico = 0.732 * IP - 28.58;
    else if (IP > 38.25) ectomorfico = 0.463 * IP - 17.63;
    else if (IP > 0) ectomorfico = 0.1;

    let clasificacionIp = '';
    if (IP > 0) {
      if (IP < 38.25) clasificacionIp = 'Pícnico';
      else if (IP <= 40.75) clasificacionIp = 'Normotipo';
      else clasificacionIp = 'Leptosómico';
    }

    // Complexión (se mantiene para el JSX)
    let complexion = 0;
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

    return {
      imc: imcVal, 
      sumaPliegues, 
      brazoCor: brazoCor, 
      piernaCor: piernaCor, 
      pantoCor: pantoCor, 
      densidad2comp: comp2.densidad, 
      pctGrasa2comp, 
      kgGrasa2comp, 
      kgMasaMagra2comp, 
      superficieCorp: superficieCorp,
      pctGrasaCorp: pctGrasaCorp,
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
      deficitMuscular: deficitMuscular, 
      masaMagra,
      pesoTeoricoMin: ptMin, 
      pesoTeoricoMax: ptMax, 
      pesoIdeal, 
      sobrepeso,
      pesoAjustado,
      pesoIdeal4comp,
      tmb,
      getSedentario: hbeSedentario,
      getLeve: hbeLeve,
      getModerado: hbeModerado,
      getIntenso: hbeIntenso,
      faoOmsRequerimiento: faoomsBase,
      calcRapidoNormal: p * 30, // Valores base por defecto
      calcRapidoObeso: p * 25,
      calcRapidoDesnutricion: p * 35,
      endomorfico, 
      mesomorfico, 
      ectomorfico, 
      indicePonderal: IP, 
      clasificacionIp,
      complexion,
      clasifComplexion
    };
  }, [pliegues, perimetros, diametros, peso, talla, sexo, edad, bio]);

  const [showConfirm, setShowConfirm] = useState(false);

  const handleSave = async (redirectAPlan: boolean = false) => {
    if (!peso || !talla) {
      toast({ title: 'Datos Faltantes', description: 'Peso y Talla son obligatorios para el protocolo.', variant: 'destructive' });
      return;
    }

    // Ajuste 6: Verificar campos incompletos
    const plieguesVacios = ['Trícep', 'Bícep', 'Subescapular', 'Cresta Ilíaca', 'Supraespinal', 'Abdominal', 'Muslo', 'Pantorrilla'].some(p => !pliegues[p]);
    const perimetrosVacios = ['Brazo', 'Muñeca', 'Muslo', 'Pantorrilla'].some(p => !perimetros[p]);

    if ((plieguesVacios || perimetrosVacios) && !showConfirm) {
      setShowConfirm(true);
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
      bioimpedancia: bio, bioquimicos: bioq, comentarios, suplementacion, temario,
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
      setShowConfirm(false);
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
                  <Field 
                    key={n} 
                    label={n} 
                    value={n === 'Muñeca' && !peso ? '-' : (perimetros[n] || '')} 
                    onChange={(v) => setPerimetros({ ...perimetros, [n]: v })} 
                  />
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

            <Collapsible title="Bioquímicos" icon={Plus}>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                <Field label="Glucosa" value={bioq['Glu'] || ''} onChange={(v) => setBioq({...bioq, Glu: v})} suffix="mg/dL" />
                <Field label="Triglicéridos" value={bioq['Tag'] || ''} onChange={(v) => setBioq({...bioq, Tag: v})} suffix="mg/dL" />
                <Field label="Colesterol" value={bioq['Col'] || ''} onChange={(v) => setBioq({...bioq, Col: v})} suffix="mg/dL" />
                <Field label="Creatinina" value={bioq['Creat'] || ''} onChange={(v) => setBioq({...bioq, Creat: v})} suffix="mg/dL" />
                <Field label="Ácido Úrico" value={bioq['Urico'] || ''} onChange={(v) => setBioq({...bioq, Urico: v})} suffix="mg/dL" />
              </div>
            </Collapsible>

            <Collapsible title="Bioimpedancia (Opcional)" icon={Clipboard}>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {['Grasa %', 'Músculo %', 'Agua %', 'Grasa Visceral', 'Edad Metabólica'].map(n => (
                  <Field key={n} label={n} value={bio[n] || ''} onChange={v => setBio({...bio, [n]: v})} />
                ))}
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
                      <p className="text-sm font-black">{formatDecimal(calcData.indicePonderal)}</p>
                    </div>
                    <div>
                      <p className="text-[8px] uppercase tracking-widest opacity-40">Lorentz (Peso Ideal)</p>
                      <p className="text-sm font-black">{formatDecimal(calcData.pesoIdeal)} kg</p>
                    </div>
                    <div className="col-span-1">
                      <p className="text-[8px] uppercase tracking-widest opacity-40">Peso Ajustado</p>
                      <p className="text-sm font-black">{formatDecimal(calcData.pesoAjustado)} kg</p>
                    </div>
                    <div className="col-span-1">
                      <p className="text-[8px] uppercase tracking-widest opacity-40">Sobrepeso (Exceso)</p>
                      <p className="text-sm font-black text-rose-500">+{formatDecimal(calcData.sobrepeso)} kg</p>
                    </div>
                  </div>
                </div>

                <div className="border-t border-background/20 pt-6 mt-6 space-y-4">
                  <h4 className="text-[9px] font-black uppercase tracking-[0.3em] opacity-30 leading-none">Cálculo de Energía (TMB/GET)</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-[8px] uppercase tracking-widest opacity-40">TMB Base (H-B)</p>
                      <p className="text-sm font-black">{formatDecimal(calcData.tmb)} kcal</p>
                    </div>
                       <div>
                          <p className="text-[8px] uppercase tracking-widest opacity-40">FAO/OMS</p>
                          <p className="text-sm font-black">{formatDecimal(calcData.faoOmsRequerimiento)} kcal</p>
                       </div>
                       <div className="col-span-2 space-y-2 pt-2">
                          <p className="text-[8px] uppercase tracking-widest opacity-30">H-B (GET con ETA 10%)</p>
                          <div className="grid grid-cols-2 gap-2">
                            <div className="text-[10px] font-bold opacity-60 uppercase">SEDENTARIO: {formatDecimal(calcData.getSedentario)}</div>
                            <div className="text-[10px] font-bold opacity-60 uppercase">LIGERO: {formatDecimal(calcData.getLeve)}</div>
                            <div className="text-[10px] font-bold opacity-60 uppercase">MODERADO: {formatDecimal(calcData.getModerado)}</div>
                            <div className="text-[10px] font-bold opacity-60 uppercase">INTENSO: {formatDecimal(calcData.getIntenso)}</div>
                          </div>
                       </div>
                  </div>
                </div>
              </div>
            )}

             <div className="flex flex-col gap-2">
                <button
                   onClick={() => handleSave(true)}
                   disabled={saving}
                   className="w-full py-6 bg-foreground text-background rounded-none text-[11px] font-black uppercase tracking-[0.3em] transition-all disabled:opacity-50 flex items-center justify-center gap-4 hover:shadow-[0_0_20px_rgba(0,0,0,0.1)] active:scale-[0.98]"
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
                   className="w-full py-4 bg-background border border-foreground/10 text-foreground rounded-none text-[10px] font-black uppercase tracking-[0.2em] hover:bg-secondary/20 transition-all opacity-40 hover:opacity-100 flex items-center justify-center gap-2"
                 >
                    <Clock className="h-3 w-3" /> SOLO GUARDAR VALORACIÓN (QUEDA PENDIENTE)
                 </button>
             </div>
          </div>
        </div>
      </div>
      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent className="rounded-none border-2 border-black">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-sm font-black uppercase tracking-widest">Protocolo Incompleto</AlertDialogTitle>
            <AlertDialogDescription className="text-xs font-bold leading-relaxed">
              No todos los campos han sido completados. ¿Está seguro de que desea persistir la consulta con datos parciales?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel className="rounded-none border-black text-[10px] font-black uppercase tracking-widest">No, completar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => handleSave()}
              className="rounded-none bg-black text-white hover:bg-neutral-800 text-[10px] font-black uppercase tracking-widest"
            >
              Sí, guardar así
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default NewAssessment;
