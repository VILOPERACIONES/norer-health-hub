import { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Plus, Trash2, Clock, Activity, Layers, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react';
import api from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import BarridoEquivalenciasComp, { type BarridoData } from '@/components/BarridoEquivalencias';

const Field = ({
  label, value, onChange, type = 'number', disabled = false, suffix = '', placeholder = '',
}: {
  label: string; value: string | number; onChange?: (v: string) => void;
  type?: string; disabled?: boolean; suffix?: string; placeholder?: string;
}) => (
  <div className="space-y-1.5">
    <label className="block text-[12px] font-medium text-text-secondary m-0">
      {label}{suffix && ` (${suffix})`}
    </label>
    <div className="relative">
      <input
        type={type}
        value={value}
        onChange={onChange ? (e) => onChange(e.target.value) : undefined}
        disabled={disabled}
        placeholder={placeholder}
        className={`w-full bg-bg-elevated rounded-[8px] px-3 py-2 text-[14px] font-normal text-text-primary outline-none border border-border-subtle focus:border-[#444] transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${disabled ? 'opacity-50 cursor-not-allowed bg-bg-base' : ''}`}
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

  const now = new Date();
  const [fecha, setFecha] = useState(now.toISOString().split('T')[0]);
  const [hora, setHora] = useState(`${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`);
  const [numeroValoracion, setNumeroValoracion] = useState(1);
  const [peso, setPeso] = useState('');
  const [estatura, setEstatura] = useState('');
  const [pctGrasa, setPctGrasa] = useState('');
  const [comentarios, setComentarios] = useState('');
  const [temario, setTemario] = useState<{ id: string; tema: string; detalle: string }[]>([]);

  // Barrido de equivalencias (opcional)
  const [barridoData, setBarridoData] = useState<BarridoData | null>(null);
  const [showBarrido, setShowBarrido] = useState(false);

  useEffect(() => {
    const fetchPatient = async () => {
      try {
        const { data } = await api.get(`/api/pacientes/${pacienteId}`);
        const p = data?.data || data;
        // Pre-llenar estatura desde el perfil del paciente
        const rawEstatura = p?.estatura || p?.talla;
        if (rawEstatura) {
          const t = parseFloat(rawEstatura);
          setEstatura(String(t < 10 ? Math.round(t * 100) : t));
        }
        // Calcular número de valoración
        const vals = p?.valoraciones || [];
        setNumeroValoracion(vals.length + 1);
      } catch (err) {
        console.error('Error cargando paciente:', err);
      }
    };
    fetchPatient();
  }, [pacienteId]);

  const pesoNum = parseFloat(peso) || 0;
  const estaturaNum = parseFloat(estatura) || 0;

  // Si el usuario ingresó en metros (ej. 1.70) en lugar de cm (170),
  // normalizar automáticamente para el cálculo.
  // Un humano adulto raramente mide < 100cm, pero sí puede escribir "1.70"
  const estaturaEnMetros = estaturaNum > 0 && estaturaNum < 3
    ? estaturaNum          // ya está en metros
    : estaturaNum / 100;   // convertir cm → metros

  const imc = useMemo(() => {
    if (pesoNum <= 0 || estaturaNum <= 0) return 0;
    return pesoNum / (estaturaEnMetros * estaturaEnMetros);
  }, [pesoNum, estaturaNum, estaturaEnMetros]);

  const masaMagra = useMemo(() => {
    const pg = parseFloat(pctGrasa);
    if (!pesoNum || !pg) return null;
    return pesoNum - (pesoNum * pg / 100);
  }, [pesoNum, pctGrasa]);

  const addTema = () => {
    setTemario([...temario, { id: Date.now().toString(), tema: '', detalle: '' }]);
  };

  const removeTema = (idx: number) => {
    setTemario(temario.filter((_, i) => i !== idx));
  };

  const updateTema = (idx: number, field: 'tema' | 'detalle', val: string) => {
    const nt = [...temario];
    nt[idx][field] = val;
    setTemario(nt);
  };

  const handleSave = async (redirectAPlan = false) => {
    if (!peso) {
      toast({ title: 'Campo requerido', description: 'El peso actual es obligatorio.', variant: 'destructive' });
      return;
    }
    if (!estatura) {
      toast({ title: 'Campo requerido', description: 'La estatura es obligatoria.', variant: 'destructive' });
      return;
    }

    setSaving(true);
    const body: Record<string, any> = {
      fecha,
      hora,
      numeroValoracion,
      pesoActual: pesoNum,
      estatura: estaturaNum < 10 ? Math.round(estaturaNum * 100) : estaturaNum,
      imc: parseFloat(imc.toFixed(2)),
      comentarios,
      temario: temario.map(({ tema, detalle }) => ({ tema, detalle })),
    };

    if (pctGrasa) {
      body.pctGrasa = parseFloat(pctGrasa);
      if (masaMagra !== null) body.masaMagra = parseFloat(masaMagra.toFixed(2));
    }

    try {
      const response = await api.post(`/api/pacientes/${pacienteId}/valoraciones`, body);
      const serverData = response.data?.data || response.data;
      const valoracionId = serverData?.id;

      // Guardar barrido si fue llenado (opcional)
      if (valoracionId && barridoData && barridoData.kcalTotal > 0) {
        try {
          await api.post(
            `/api/pacientes/${pacienteId}/valoraciones/${valoracionId}/barrido`,
            barridoData
          );
        } catch {
          // No bloquear el flujo si el barrido falla
        }
      }

      toast({ title: 'Valoración guardada correctamente' });

      if (redirectAPlan && valoracionId) {
        navigate(`/pacientes/${pacienteId}/planes/nuevo?valoracionId=${valoracionId}`);
      } else if (valoracionId) {
        // Navegar al detalle de la valoración para continuar editando
        navigate(`/pacientes/${pacienteId}/valoraciones/${valoracionId}`);
      } else {
        navigate(`/pacientes/${pacienteId}`);
      }
    } catch (err: any) {
      toast({ title: 'Error al guardar', description: err.response?.data?.message || 'No se pudo guardar la valoración.', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in w-full pb-20 px-6">
      {/* HEADER */}
      <div className="flex flex-col gap-2 border-b border-border-subtle pb-6 pt-6">
        <button
          onClick={() => navigate(`/pacientes/${pacienteId}`)}
          className="flex items-center gap-2 text-[14px] font-medium text-text-secondary hover:text-text-primary transition-colors w-fit group mb-2"
        >
          <ArrowLeft className="h-[18px] w-[18px] group-hover:-translate-x-1 transition-transform" /> Volver al expediente
        </button>
        <h1 className="text-[26px] font-bold text-text-primary tracking-tight m-0">Nueva Valoración</h1>
        <p className="text-text-secondary font-normal text-[14px] m-0">Registro simplificado de consulta clínica</p>
      </div>

      <div className="space-y-6">
        {/* DATOS GENERALES */}
        <div className="bg-bg-surface p-6 rounded-[12px] border border-border-subtle space-y-6">
          <h3 className="text-[15px] font-semibold text-text-primary m-0 flex items-center gap-2 border-b border-border-default pb-4">
            <Activity className="w-4 h-4 text-text-muted" /> Datos de la Consulta
          </h3>
          <div className="grid sm:grid-cols-3 gap-6">
            <Field label="Fecha" value={fecha} onChange={setFecha} type="date" />
            <Field label="Hora" value={hora} onChange={setHora} type="time" />
            <div className="space-y-1.5">
              <label className="block text-[12px] font-medium text-text-secondary m-0">Número de Valoración</label>
              <div className="flex items-center px-3 py-2 bg-bg-base border border-border-subtle rounded-[8px] opacity-60">
                <span className="text-[14px] font-bold text-text-primary">#{numeroValoracion}</span>
                <span className="text-[12px] text-text-muted ml-2">Automático</span>
              </div>
            </div>
          </div>
        </div>

        {/* MÉTRICAS CORPORALES */}
        <div className="bg-bg-surface p-6 rounded-[12px] border border-border-subtle space-y-6">
          <h3 className="text-[15px] font-semibold text-text-primary m-0 border-b border-border-default pb-4">Métricas Corporales</h3>

          <div className="grid sm:grid-cols-2 gap-6">
            <Field label="Peso actual" value={peso} onChange={setPeso} suffix="kg" placeholder="Ej. 75.5" />
            <div className="space-y-1.5">
              <Field label="Estatura" value={estatura} onChange={setEstatura} suffix="cm" placeholder="Ej. 170" />
              {/* Aviso si ingresó en metros */}
              {estaturaNum > 0 && estaturaNum < 3 && (
                <p className="text-[11px] text-amber-400 font-medium m-0 flex items-center gap-1">
                  ⚠ Parece que ingresaste metros — el campo espera cm.
                  Se usa {(estaturaNum * 100).toFixed(0)} cm automáticamente.
                </p>
              )}
            </div>
          </div>

          {/* IMC calculado */}
          {imc > 0 && (
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="bg-bg-elevated p-4 rounded-[8px] border border-border-default flex items-center justify-between">
                <div>
                   <p className="text-[12px] font-medium text-text-secondary mb-1 m-0">IMC</p>
                   <p className={`text-[22px] font-bold m-0 ${
                     imc > 70 || imc < 10 ? 'text-accent-red' : 'text-text-primary'
                   }`}>
                     {imc > 70 || imc < 10 ? '—' : imc.toFixed(2)}
                   </p>
                   {(imc > 70 || imc < 10) && (
                     <p className="text-[10px] text-accent-red m-0">Verifica peso/estatura</p>
                   )}
                </div>
                <span className="text-[11px] font-medium text-text-muted uppercase tracking-wider px-2 py-1 bg-bg-base rounded-[6px] border border-border-subtle">Auto</span>
              </div>

            </div>
          )}

          <div className="grid sm:grid-cols-2 gap-6">
            <Field
              label="% Grasa corporal (opcional)"
              value={pctGrasa}
              onChange={setPctGrasa}
              suffix="%"
              placeholder="Ej. 18.5"
            />
            <div className="space-y-1.5">
              <label className="block text-[12px] font-medium text-text-secondary m-0">Masa magra (kg)</label>
              <div className={`flex items-center px-3 py-2 rounded-[8px] border border-border-subtle ${masaMagra !== null ? 'bg-bg-elevated' : 'bg-bg-base opacity-50'}`}>
                <span className="text-[14px] font-bold text-text-primary">
                  {masaMagra !== null ? masaMagra.toFixed(2) : '—'}
                </span>
                {masaMagra !== null && <span className="text-[12px] text-text-muted ml-2">kg — Auto</span>}
              </div>
            </div>
          </div>
        </div>

        {/* NOTAS Y TEMARIO */}
        <div className="bg-bg-surface p-6 rounded-[12px] border border-border-subtle space-y-6">
          <h3 className="text-[15px] font-semibold text-text-primary m-0 border-b border-border-default pb-4">Notas y Temario</h3>

          <div className="space-y-2">
            <label className="text-[12px] font-medium text-text-secondary m-0">Notas de consulta</label>
            <textarea
              value={comentarios}
              onChange={(e) => setComentarios(e.target.value)}
              className="w-full bg-bg-elevated rounded-[8px] p-4 text-[14px] font-normal text-text-primary border border-border-subtle focus:border-[#444] outline-none min-h-[140px] resize-y transition-colors"
              placeholder="Observaciones clínicas, evolución, acuerdos con el paciente..."
            />
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-[12px] font-medium text-text-secondary m-0">Temario abordado</label>
              <button
                onClick={addTema}
                className="text-[12px] font-medium text-text-secondary hover:text-text-primary flex items-center gap-1.5 transition-colors"
              >
                <Plus className="h-3.5 w-3.5" /> Agregar tema
              </button>
            </div>

            {temario.length === 0 && (
              <p className="text-[13px] text-text-muted text-center py-6 border border-dashed border-border-subtle rounded-[8px]">
                Sin temas agregados — haz clic en "+ Agregar tema"
              </p>
            )}

            {temario.map((t, idx) => (
              <div key={t.id} className="bg-bg-elevated p-4 rounded-[8px] border border-border-subtle space-y-3 relative group hover:border-[#444] transition-all">
                <button
                  onClick={() => removeTema(idx)}
                  className="absolute top-3 right-3 p-1.5 text-text-muted hover:text-accent-red hover:bg-[#2e1a1a] rounded-[6px] opacity-0 group-hover:opacity-100 transition-all"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
                <input
                  type="text"
                  placeholder="Título del tema..."
                  value={t.tema}
                  onChange={(e) => updateTema(idx, 'tema', e.target.value)}
                  className="w-full bg-transparent text-[14px] font-semibold text-text-primary outline-none placeholder:text-text-muted border-b border-border-default pb-2 focus:border-border-subtle pr-8 transition-all"
                />
                <textarea
                  placeholder="Detalles o acuerdos..."
                  value={t.detalle}
                  onChange={(e) => updateTema(idx, 'detalle', e.target.value)}
                  className="w-full bg-transparent text-[13px] font-normal text-text-secondary outline-none min-h-[60px] resize-none placeholder:text-text-muted pt-1"
                />
              </div>
            ))}
          </div>
        </div>

        {/* BARRIDO DE EQUIVALENCIAS (opcional) */}
        <div className="bg-bg-surface border border-border-subtle rounded-[12px] overflow-hidden">
          <button
            type="button"
            onClick={() => setShowBarrido(!showBarrido)}
            className="w-full flex items-center justify-between p-5 hover:bg-bg-elevated/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-[8px] transition-all ${showBarrido ? 'bg-brand-primary/20 text-brand-primary' : 'bg-bg-elevated text-text-muted'}`}>
                <Layers className="w-4 h-4" />
              </div>
              <div className="text-left">
                <h3 className="text-[15px] font-semibold text-text-primary m-0">Barrido de Equivalencias</h3>
                <p className="text-[12px] text-text-muted m-0">
                  {barridoData && barridoData.kcalTotal > 0
                    ? `${Math.round(barridoData.kcalTotal).toLocaleString()} kcal — se guardará al crear la valoración`
                    : 'Opcional — puedes llenarlo ahora o después en el detalle'}
                </p>
              </div>
            </div>
            {showBarrido ? <ChevronUp className="w-5 h-5 text-text-muted" /> : <ChevronDown className="w-5 h-5 text-text-muted" />}
          </button>

          {showBarrido && (
            <div className="p-5 border-t border-border-subtle animate-fade-in">
              <BarridoEquivalenciasComp
                value={barridoData}
                onChange={(data) => setBarridoData(data)}
              />
            </div>
          )}
        </div>

        {/* BOTONES */}
        <div className="space-y-4">
          {barridoData?.isValid === false && (
            <div className="text-[13px] text-accent-red font-medium flex items-center justify-center gap-2 p-3 bg-[#2e1a1a] border border-[#ff6b6b]/20 rounded-[8px]">
              <AlertCircle className="w-4 h-4" /> La distribución de comidas del barrido no cuadra con las porciones objetivo. Corrígelo para guardar.
            </div>
          )}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => handleSave(true)}
              disabled={saving || barridoData?.isValid === false}
              className="flex-1 py-4 bg-brand-primary text-bg-base rounded-[8px] text-[14px] font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 hover:bg-[#e0e0e0]"
            >
              {saving ? (
                <div className="w-5 h-5 border-2 border-bg-base/20 border-t-bg-base rounded-full animate-spin" />
              ) : (
                <>
                  <Save className="h-[18px] w-[18px]" /> Guardar y Crear Plan
                </>
              )}
            </button>
            <button
              onClick={() => handleSave(false)}
              disabled={saving || barridoData?.isValid === false}
              className="flex-1 py-3 bg-bg-surface border border-border-subtle text-text-primary rounded-[8px] text-[13px] font-medium hover:bg-bg-elevated transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Clock className="h-4 w-4 text-text-muted" /> Solo guardar valoración
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewAssessment;
