import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ChevronDown, ChevronRight, Plus, Trash2, Save } from 'lucide-react';
import api from '@/lib/api';
import { formatDecimal } from '@/lib/format';
import { useToast } from '@/hooks/use-toast';

interface CollapsibleProps {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

const Collapsible = ({ title, defaultOpen = false, children }: CollapsibleProps) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="norer-card">
      <button onClick={() => setOpen(!open)} className="flex items-center justify-between w-full">
        <h3 className="font-semibold text-foreground">{title}</h3>
        {open ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
      </button>
      {open && <div className="mt-4 space-y-4">{children}</div>}
    </div>
  );
};

const Field = ({ label, value, onChange, type = 'number', disabled = false, suffix = '' }: {
  label: string; value: string | number; onChange?: (v: string) => void; type?: string; disabled?: boolean; suffix?: string;
}) => (
  <div>
    <label className="block text-xs text-muted-foreground mb-1">{label}{suffix && ` (${suffix})`}</label>
    <input
      type={type}
      value={value}
      onChange={onChange ? (e) => onChange(e.target.value) : undefined}
      disabled={disabled}
      className={`norer-input w-full ${disabled ? 'bg-muted text-muted-foreground cursor-not-allowed' : ''}`}
      step="0.01"
    />
  </div>
);

const NewAssessment = () => {
  const { id: pacienteId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);

  // Section 1 - Basic
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
  const [hora, setHora] = useState('');
  const [peso, setPeso] = useState('');
  const [talla, setTalla] = useState('');
  const [sexo] = useState<'M' | 'F'>('F'); // from patient

  // Section 2 - Pliegues
  const pliegueNames = ['Trícep', 'Bícep', 'Subescapular', 'Cresta ilíaca', 'Supraespinal', 'Abdominal', 'Muslo frontal', 'Pantorrilla'];
  const [pliegues, setPliegues] = useState<Record<string, string>>({});

  // Section 3 - Perímetros
  const perimetroNames = ['Brazo relajado', 'Brazo contraído', 'Antebrazo', 'Muñeca', 'Tórax', 'Cintura', 'Cadera', 'Muslo', 'Pantorrilla'];
  const [perimetros, setPerimetros] = useState<Record<string, string>>({});

  // Section 4 - Diámetros
  const diametroNames = ['Biestiloideo', 'Biepicóndilo húmero', 'Biepicóndilo fémur'];
  const [diametros, setDiametros] = useState<Record<string, string>>({});

  // Section 6 - Bioimpedancia
  const [bio, setBio] = useState<Record<string, string>>({});

  // Section 7 - Bioquímicos
  const [bioq, setBioq] = useState<Record<string, string>>({});

  // Section 8 - Signos vitales
  const [fc, setFc] = useState('');
  const [pa, setPa] = useState('');

  // Section 9 - Competencia
  const [esquema, setEsquema] = useState('');
  const [etapa, setEtapa] = useState('');
  const [tipoDieta, setTipoDieta] = useState('');

  // Section 10 - Notas
  const [comentarios, setComentarios] = useState('');
  const [suplementacion, setSuplementacion] = useState('');
  const [temario, setTemario] = useState<{ tema: string; detalle: string }[]>([]);

  // Calculations
  const pesoNum = parseFloat(peso) || 0;
  const tallaNum = parseFloat(talla) || 0;

  const imc = useMemo(() => (tallaNum > 0 ? pesoNum / (tallaNum * tallaNum) : 0), [pesoNum, tallaNum]);

  const sumaPliegues = useMemo(() => {
    return Object.values(pliegues).reduce((sum, v) => sum + (parseFloat(v) || 0), 0);
  }, [pliegues]);

  const composicion = useMemo(() => {
    if (sumaPliegues <= 0 || pesoNum <= 0) return null;
    const log10Sum = Math.log10(sumaPliegues);
    const densidad = sexo === 'M'
      ? 1.1765 - 0.0744 * log10Sum
      : 1.1278 - 0.0775 * log10Sum;
    const pctGrasa = ((4.95 / densidad) - 4.5) * 100;
    const kgGrasa = (pctGrasa / 100) * pesoNum;
    const kgMagra = pesoNum - kgGrasa;
    return { densidad, pctGrasa, kgGrasa, kgMagra };
  }, [sumaPliegues, pesoNum, sexo]);

  const clasificacionIMC = useMemo(() => {
    if (imc < 18.5) return 'Bajo peso';
    if (imc < 25) return 'Normal';
    if (imc < 30) return 'Sobrepeso';
    if (imc < 35) return 'Obesidad I';
    if (imc < 40) return 'Obesidad II';
    return 'Obesidad III';
  }, [imc]);

  const pesoTeorico = useMemo(() => {
    if (tallaNum <= 0) return null;
    const tallaCm = tallaNum * 100;
    let min: number, max: number;
    if (sexo === 'M') {
      min = (tallaCm - 100) - ((tallaCm - 150) / 4);
      max = (tallaCm - 100) - ((tallaCm - 150) / 2.5);
    } else {
      min = (tallaCm - 100) - ((tallaCm - 150) / 2.5);
      max = (tallaCm - 100) - ((tallaCm - 150) / 2);
    }
    const ideal = (min + max) / 2;
    const sobrepeso = Math.max(0, pesoNum - max);
    return { min, max, ideal, sobrepeso };
  }, [tallaNum, pesoNum, sexo]);

  const superficieCorporal = useMemo(() => {
    if (pesoNum <= 0 || tallaNum <= 0) return 0;
    return 0.007184 * Math.pow(pesoNum, 0.425) * Math.pow(tallaNum * 100, 0.725);
  }, [pesoNum, tallaNum]);

  // Perímetros corregidos
  const brazoCor = useMemo(() => {
    const pBrazo = parseFloat(perimetros['Brazo relajado'] || '0');
    const pTricep = parseFloat(pliegues['Trícep'] || '0');
    return pBrazo > 0 && pTricep > 0 ? pBrazo - (Math.PI * pTricep / 10) : 0;
  }, [perimetros, pliegues]);

  const piernaCor = useMemo(() => {
    const pMuslo = parseFloat(perimetros['Muslo'] || '0');
    const pMusloFr = parseFloat(pliegues['Muslo frontal'] || '0');
    return pMuslo > 0 && pMusloFr > 0 ? pMuslo - (Math.PI * pMusloFr / 10) : 0;
  }, [perimetros, pliegues]);

  const pantoCor = useMemo(() => {
    const pPanto = parseFloat(perimetros['Pantorrilla'] || '0');
    const pPantoP = parseFloat(pliegues['Pantorrilla'] || '0');
    return pPanto > 0 && pPantoP > 0 ? pPanto - (Math.PI * pPantoP / 10) : 0;
  }, [perimetros, pliegues]);

  const handleSave = async () => {
    if (!peso || !talla) {
      toast({ title: 'Error', description: 'Peso y talla son obligatorios', variant: 'destructive' });
      return;
    }
    setSaving(true);
    const body = {
      fecha, hora, peso: pesoNum, talla: tallaNum, imc,
      pliegues: Object.fromEntries(Object.entries(pliegues).map(([k, v]) => [k, parseFloat(v) || 0])),
      perimetros: Object.fromEntries(Object.entries(perimetros).map(([k, v]) => [k, parseFloat(v) || 0])),
      perimetrosCorregidos: { brazoCor, piernaCor, pantoCor },
      diametros: Object.fromEntries(Object.entries(diametros).map(([k, v]) => [k, parseFloat(v) || 0])),
      sumaPliegues,
      composicion: composicion ? { ...composicion } : undefined,
      clasificacionIMC,
      pesoTeorico,
      superficieCorporal,
      bioimpedancia: Object.fromEntries(Object.entries(bio).map(([k, v]) => [k, parseFloat(v) || 0])),
      bioquimicos: Object.fromEntries(Object.entries(bioq).map(([k, v]) => [k, parseFloat(v) || 0])),
      signosVitales: { frecuenciaCardiaca: fc, presionArterial: pa },
      competencia: { esquema, etapa, tipoDieta },
      comentarios, suplementacion, temario,
    };
    try {
      await api.post(`/api/pacientes/${pacienteId}/valoraciones`, body);
      toast({ title: 'Valoración guardada' });
      navigate(`/pacientes/${pacienteId}`);
    } catch (err: any) {
      toast({ title: 'Error', description: err.response?.data?.message || 'Error al guardar', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4 animate-fade-in max-w-4xl">
      <button onClick={() => navigate(`/pacientes/${pacienteId}`)} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Volver al paciente
      </button>
      <h1 className="text-2xl font-bold text-foreground">Nueva valoración</h1>

      {/* Section 1 - Basic */}
      <div className="norer-card">
        <h3 className="font-semibold text-foreground mb-4">Datos básicos</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Field label="Fecha" value={fecha} onChange={setFecha} type="date" />
          <Field label="Hora" value={hora} onChange={setHora} type="time" />
          <Field label="Peso" value={peso} onChange={setPeso} suffix="kg" />
          <Field label="Talla" value={talla} onChange={setTalla} suffix="m" />
        </div>
        {imc > 0 && (
          <div className="mt-3 flex items-center gap-4 text-sm">
            <span className="text-muted-foreground">IMC: <strong className="text-foreground">{formatDecimal(imc)}</strong></span>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
              imc < 25 ? 'bg-emerald-50 text-emerald-700' : imc < 30 ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-700'
            }`}>{clasificacionIMC}</span>
          </div>
        )}
      </div>

      {/* Section 2 - Pliegues */}
      <Collapsible title="Pliegues (mm)">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {pliegueNames.map((n) => (
            <Field key={n} label={n} value={pliegues[n] || ''} onChange={(v) => setPliegues({ ...pliegues, [n]: v })} />
          ))}
        </div>
        {sumaPliegues > 0 && (
          <p className="text-sm text-muted-foreground">Suma de pliegues: <strong className="text-foreground">{formatDecimal(sumaPliegues)} mm</strong></p>
        )}
      </Collapsible>

      {/* Section 3 - Perímetros */}
      <Collapsible title="Perímetros (cm)">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {perimetroNames.map((n) => (
            <Field key={n} label={n} value={perimetros[n] || ''} onChange={(v) => setPerimetros({ ...perimetros, [n]: v })} />
          ))}
        </div>
        {(brazoCor > 0 || piernaCor > 0 || pantoCor > 0) && (
          <div className="grid grid-cols-3 gap-4 pt-3 border-t border-border">
            <Field label="Brazo corregido" value={formatDecimal(brazoCor)} disabled />
            <Field label="Pierna corregida" value={formatDecimal(piernaCor)} disabled />
            <Field label="Pantorrilla corregida" value={formatDecimal(pantoCor)} disabled />
          </div>
        )}
      </Collapsible>

      {/* Section 4 - Diámetros */}
      <Collapsible title="Diámetros (cm)">
        <div className="grid grid-cols-3 gap-4">
          {diametroNames.map((n) => (
            <Field key={n} label={n} value={diametros[n] || ''} onChange={(v) => setDiametros({ ...diametros, [n]: v })} />
          ))}
        </div>
      </Collapsible>

      {/* Section 5 - Composición corporal */}
      <Collapsible title="Composición corporal">
        {composicion ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Field label="% Grasa" value={formatDecimal(composicion.pctGrasa)} disabled suffix="%" />
            <Field label="Kg grasa" value={formatDecimal(composicion.kgGrasa)} disabled suffix="kg" />
            <Field label="Masa magra" value={formatDecimal(composicion.kgMagra)} disabled suffix="kg" />
            <Field label="Densidad" value={formatDecimal(composicion.densidad, 4)} disabled />
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Ingresa los pliegues para calcular la composición corporal</p>
        )}
        {pesoTeorico && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-3 border-t border-border">
            <Field label="Peso teórico mín" value={formatDecimal(pesoTeorico.min)} disabled suffix="kg" />
            <Field label="Peso teórico máx" value={formatDecimal(pesoTeorico.max)} disabled suffix="kg" />
            <Field label="Peso ideal" value={formatDecimal(pesoTeorico.ideal)} disabled suffix="kg" />
            <Field label="Sobrepeso" value={formatDecimal(pesoTeorico.sobrepeso)} disabled suffix="kg" />
          </div>
        )}
        {superficieCorporal > 0 && (
          <p className="text-sm text-muted-foreground pt-3 border-t border-border">
            Superficie corporal (DuBois): <strong className="text-foreground">{formatDecimal(superficieCorporal, 4)} m²</strong>
          </p>
        )}
      </Collapsible>

      {/* Section 6 - Bioimpedancia */}
      <Collapsible title="Bioimpedancia">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {['% Grasa', '% Agua', 'Músculo (kg)', 'Energía (kcal)'].map((n) => (
            <Field key={n} label={n} value={bio[n] || ''} onChange={(v) => setBio({ ...bio, [n]: v })} />
          ))}
        </div>
      </Collapsible>

      {/* Section 7 - Bioquímicos */}
      <Collapsible title="Bioquímicos">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {['Glucosa', 'Triglicéridos', 'Colesterol', 'Creatinina', 'Ácido úrico'].map((n) => (
            <Field key={n} label={n} value={bioq[n] || ''} onChange={(v) => setBioq({ ...bioq, [n]: v })} />
          ))}
        </div>
      </Collapsible>

      {/* Section 8 - Signos vitales */}
      <Collapsible title="Signos vitales">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Frecuencia cardíaca" value={fc} onChange={setFc} suffix="bpm" />
          <div>
            <label className="block text-xs text-muted-foreground mb-1">Presión arterial</label>
            <input value={pa} onChange={(e) => setPa(e.target.value)} className="norer-input w-full" placeholder="120/80" />
          </div>
        </div>
      </Collapsible>

      {/* Section 9 - Competencia */}
      <Collapsible title="Competencia">
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-xs text-muted-foreground mb-1">Esquema</label>
            <input value={esquema} onChange={(e) => setEsquema(e.target.value)} className="norer-input w-full" />
          </div>
          <div>
            <label className="block text-xs text-muted-foreground mb-1">Etapa</label>
            <input value={etapa} onChange={(e) => setEtapa(e.target.value)} className="norer-input w-full" />
          </div>
          <div>
            <label className="block text-xs text-muted-foreground mb-1">Tipo de dieta</label>
            <input value={tipoDieta} onChange={(e) => setTipoDieta(e.target.value)} className="norer-input w-full" />
          </div>
        </div>
      </Collapsible>

      {/* Section 10 - Notas */}
      <div className="norer-card">
        <h3 className="font-semibold text-foreground mb-4">Notas</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-xs text-muted-foreground mb-1">Comentarios</label>
            <textarea value={comentarios} onChange={(e) => setComentarios(e.target.value)} className="norer-input w-full min-h-[80px] resize-y" />
          </div>
          <div>
            <label className="block text-xs text-muted-foreground mb-1">Suplementación</label>
            <textarea value={suplementacion} onChange={(e) => setSuplementacion(e.target.value)} className="norer-input w-full min-h-[60px] resize-y" />
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs text-muted-foreground">Temario de consulta</label>
              <button
                onClick={() => setTemario([...temario, { tema: '', detalle: '' }])}
                className="flex items-center gap-1 text-xs text-primary hover:text-accent font-medium"
              >
                <Plus className="h-3 w-3" /> Agregar tema
              </button>
            </div>
            {temario.map((t, i) => (
              <div key={i} className="flex gap-2 mb-2">
                <input
                  placeholder="Tema"
                  value={t.tema}
                  onChange={(e) => { const n = [...temario]; n[i].tema = e.target.value; setTemario(n); }}
                  className="norer-input flex-1"
                />
                <input
                  placeholder="Detalle"
                  value={t.detalle}
                  onChange={(e) => { const n = [...temario]; n[i].detalle = e.target.value; setTemario(n); }}
                  className="norer-input flex-1"
                />
                <button onClick={() => setTemario(temario.filter((_, j) => j !== i))} className="text-destructive hover:text-destructive/80 p-2">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Save */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-accent transition-colors disabled:opacity-50"
        >
          <Save className="h-4 w-4" /> {saving ? 'Guardando...' : 'Guardar valoración'}
        </button>
      </div>
    </div>
  );
};

export default NewAssessment;
