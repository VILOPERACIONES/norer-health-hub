import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, User, Activity, Heart, Shield, Clock, BookOpen, ChevronDown, Plus, Trash2 } from 'lucide-react';
import api from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { encodeDisciplinas, type DisciplinaItem } from '@/lib/disciplinas';

const Input = ({ label, value, onChange, placeholder, type = 'text', readOnly = false }: any) => (
  <div className="space-y-2 group">
    <label className="text-[12px] font-medium text-text-secondary uppercase tracking-widest ml-1 leading-none">{label}</label>
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`w-full bg-bg-elevated rounded-[8px] px-4 py-3 text-[14px] font-normal text-text-primary tracking-tight outline-none focus:border-[#444] transition-all border border-border-subtle ${readOnly ? 'opacity-60 cursor-not-allowed' : 'hover:border-border-default'}`}
      placeholder={placeholder}
    />
  </div>
);

const PhoneInput = ({ label, ladaValue, onLadaChange, phoneValue, onPhoneChange, placeholder }: any) => (
  <div className="space-y-2 group">
    <label className="text-[12px] font-medium text-text-secondary uppercase tracking-widest ml-1 leading-none">{label}</label>
    <div className="flex gap-2">
      <select
        value={ladaValue}
        onChange={(e) => onLadaChange(e.target.value)}
        className="w-[110px] bg-bg-elevated rounded-[8px] px-2 py-3 text-[14px] font-normal text-text-primary tracking-tight outline-none focus:border-[#444] transition-all border border-border-subtle hover:border-border-default appearance-none cursor-pointer text-center"
      >
        <option value="52">+52 (MX)</option>
        <option value="1">+1 (US/CA)</option>
        <option value="34">+34 (ES)</option>
        <option value="54">+54 (AR)</option>
        <option value="57">+57 (CO)</option>
        <option value="56">+56 (CL)</option>
        <option value="51">+51 (PE)</option>
      </select>
      <input
        type="tel"
        value={phoneValue}
        onChange={(e) => onPhoneChange(e.target.value)}
        className="flex-1 bg-bg-elevated rounded-[8px] px-4 py-3 text-[14px] font-normal text-text-primary tracking-tight outline-none focus:border-[#444] transition-all border border-border-subtle hover:border-border-default"
        placeholder={placeholder}
      />
    </div>
  </div>
);

const Select = ({ label, value, onChange, options }: any) => (
  <div className="space-y-2 group">
    <label className="text-[12px] font-medium text-text-secondary uppercase tracking-widest ml-1 leading-none">{label}</label>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full bg-bg-elevated rounded-[8px] px-4 py-3 text-[14px] font-normal text-text-primary tracking-tight outline-none focus:border-[#444] transition-all border border-border-subtle hover:border-border-default appearance-none cursor-pointer"
      style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'%238a8a8a\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2\' d=\'M19 9l-7 7-7-7\' /%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem center', backgroundSize: '1rem' }}
    >
      {options.map((o: string) => <option key={o} value={o}>{o}</option>)}
    </select>
  </div>
);

const TextArea = ({ label, value, onChange, placeholder }: any) => (
  <div className="space-y-2 col-span-full group">
    <label className="text-[12px] font-medium text-text-secondary uppercase tracking-widest ml-1 leading-none">{label}</label>
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full bg-bg-elevated rounded-[8px] p-4 text-[14px] font-normal text-text-primary tracking-tight outline-none focus:border-[#444] transition-all border border-border-subtle hover:border-border-default min-h-[120px] resize-y"
      placeholder={placeholder}
    />
  </div>
);

const FormSection = ({ title, icon: Icon, children, defaultOpen = true }: { title: string, icon: any, children: React.ReactNode, defaultOpen?: boolean }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  return (
    <div className="bg-bg-surface rounded-[12px] border border-border-subtle shadow-none animate-slide-up overflow-hidden">
      <div
        className={`flex items-center justify-between p-8 cursor-pointer hover:bg-bg-elevated/30 transition-colors ${isOpen ? 'border-b border-border-subtle pb-6' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-3">
          <div className="p-2 bg-bg-elevated border border-border-default rounded-[8px]">
            <Icon className="h-[18px] w-[18px] text-text-secondary" />
          </div>
          <h3 className="text-[16px] font-semibold text-text-primary m-0">
            {title}
          </h3>
        </div>
        <div className="p-1.5 rounded-full bg-bg-elevated border border-border-default text-text-secondary">
          <ChevronDown className={`h-4 w-4 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </div>
      {isOpen && (
        <div className="p-8 pt-6 grid sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-slide-down">
          {children}
        </div>
      )}
    </div>
  )
};

const NewPatient = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    nombre: '', apellido: '', lada: '52', telefono: '', email: '',
    fechaNacimiento: '', sexo: 'F' as 'M' | 'F',
    objetivo: '', gymOrigen: '', horaEntrenamiento: '',
    nivelActividad: 'Sedentario',
    porcentajeSedentario: '', porcentajeLeve: '', porcentajeModerado: '', porcentajeIntenso: '',
    historialProductos: '', recomSuplementos: '',
    alimentosNoGusta: '', alimentosGusta: '', alergico: '',
    patologia: '', cirugias: '', farmacos: '', cicloMenstrual: '', estrenimiento: 'No',
    alcohol: 'No', tabaco: 'No', agua: '',
    signosSintomas: '',
    talla: '',
    peso: '',
    complexion: '',
  });

  const update = (field: string, value: any) => setForm({ ...form, [field]: value });

  const [suplementosIniciales, setSuplementosIniciales] = useState<{ id: string; nombre: string; indicaciones: string; activo: boolean }[]>([]);

  const [disciplinas, setDisciplinas] = useState<DisciplinaItem[]>([{ disciplina: '', frecuencia: '', tiempo: '' }]);
  const addDisciplina = () => setDisciplinas([...disciplinas, { disciplina: '', frecuencia: '', tiempo: '' }]);
  const removeDisciplina = (idx: number) => setDisciplinas(disciplinas.length > 1 ? disciplinas.filter((_, i) => i !== idx) : disciplinas);
  const updateDisciplina = (idx: number, field: keyof DisciplinaItem, val: string) =>
    setDisciplinas(disciplinas.map((d, i) => i === idx ? { ...d, [field]: val } : d));

  const edad = useMemo(() => {
    if (!form.fechaNacimiento) return 0;
    const birth = new Date(form.fechaNacimiento);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age;
  }, [form.fechaNacimiento]);

  const handleSave = async () => {
    if (!form.nombre || !form.apellido || !form.telefono) {
      toast({ title: 'Error de Validación', description: 'Nombre, apellido y teléfono son requeridos.', variant: 'destructive' });
      return;
    }
    setSaving(true);

    const payload = {
      nombre: form.nombre,
      apellido: form.apellido,
      telefono: form.lada + form.telefono.replace(/\D/g, ''),
      email: form.email,
      fechaNacimiento: form.fechaNacimiento,
      sexo: form.sexo,
      edad,
      estatura: (() => {
        const raw = parseFloat(form.talla);
        if (!raw) return '';
        return String(raw < 10 ? Math.round(raw * 100) : raw);
      })(),
      peso: parseFloat(form.peso) || null,
      // Complexión: Ectomorfo=1, Mesomorfo=2, Endomorfo=3
      complexion: form.complexion === 'Ectomorfo' ? 1 : form.complexion === 'Mesomorfo' ? 2 : form.complexion === 'Endomorfo' ? 3 : null,
      fechaActual: new Date().toISOString(),

      ejercicio: {
        objetivo: form.objetivo,
        gymOrigen: form.gymOrigen,
        horaEntrenamiento: form.horaEntrenamiento,
        ...encodeDisciplinas(disciplinas),
        nivelActividad: form.nivelActividad,
        porcentajeSedentario: parseFloat(form.porcentajeSedentario) || 0,
        porcentajeLeve: parseFloat(form.porcentajeLeve) || 0,
        porcentajeModerado: parseFloat(form.porcentajeModerado) || 0,
        porcentajeIntenso: parseFloat(form.porcentajeIntenso) || 0,
      },

      antecedentes: {
        patologia: form.patologia,
        cirugias: form.cirugias,
        farmacos: form.farmacos,
        cicloMenstrual: form.cicloMenstrual,
        alergias: form.alergico,
        alimentosGustan: form.alimentosGusta,
        alimentosNoGustan: form.alimentosNoGusta,
        estrenimiento: form.estrenimiento,
        signosYSintomas: form.signosSintomas,
        consumoAlcohol: form.alcohol,
        tabaco: form.tabaco,
        agua: form.agua,
        suplementosDetalle: suplementosIniciales.filter(s => s.nombre.trim()),
      },


    };

    try {
      const response = await api.post('/api/pacientes', payload);
      const serverData = response.data?.data || response.data;
      const patientId = serverData?.id;

      toast({ title: 'Expediente digitalizado correctamente' });
      if (patientId) navigate(`/pacientes/${patientId}`);
      else navigate('/pacientes');
    } catch (err: any) {
      const msg = err.response?.data?.error || err.response?.data?.message || err.message || '';
      if (err.response?.status === 409 || msg.toLowerCase().includes('teléfono') || msg.toLowerCase().includes('telefono') || msg.toLowerCase().includes('correo') || msg.toLowerCase().includes('email')) {
        toast({ title: 'Registro Duplicado', description: msg || 'Este paciente ya existe en el sistema.', variant: 'destructive', duration: 7000 });
      } else {
        toast({ title: 'Fallo de Sistema', description: msg || 'No se pudo crear el expediente.', variant: 'destructive' });
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-10 animate-fade-in max-w-none pb-24">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 pt-6">
        <div className="space-y-2">
          <button onClick={() => navigate('/pacientes')} className="flex items-center gap-2 text-[14px] font-medium text-text-secondary hover:text-text-primary transition-colors w-fit group mb-4">
            <ArrowLeft className="h-[18px] w-[18px] group-hover:-translate-x-1 transition-transform" /> Volver al directorio
          </button>
          <div className="space-y-1">
            <h1 className="text-[26px] font-bold text-text-primary m-0 tracking-tight">Nuevo Expediente</h1>
            <p className="text-text-secondary font-normal text-[14px] m-0">Registro y configuración inicial de paciente</p>
          </div>
        </div>
      </div>

      <div className="space-y-8">
        <FormSection title="Identificación del Paciente" icon={User}>
          <Input label="Nombre(s) *" value={form.nombre} onChange={(v: string) => update('nombre', v)} placeholder="Juan Manuel" />
          <Input label="Apellidos *" value={form.apellido} onChange={(v: string) => update('apellido', v)} placeholder="González" />
          <Input label="Fecha de Nacimiento" value={form.fechaNacimiento} onChange={(v: string) => update('fechaNacimiento', v)} type="date" />
          <Input label="E-mail" value={form.email} onChange={(v: string) => update('email', v)} placeholder="paciente@ejemplo.com" />
          <PhoneInput label="Teléfono (Lada + Número) *" ladaValue={form.lada} onLadaChange={(v: string) => update('lada', v)} phoneValue={form.telefono} onPhoneChange={(v: string) => update('telefono', v)} placeholder="999 000 0000" />

          <div className="space-y-2">
            <label className="text-[12px] font-medium text-text-secondary uppercase tracking-widest ml-1 leading-none">Edad (Cálculo)</label>
            <div className="bg-bg-elevated rounded-[8px] px-4 py-3 text-[14px] font-normal text-text-muted border border-border-subtle flex items-center justify-between">
              {edad} Años <Clock className="h-[18px] w-[18px] text-text-muted" />
            </div>
          </div>
          <Select label="Sexo Biológico" value={form.sexo} onChange={(v: string) => update('sexo', v)} options={['F', 'M']} />
          <Input label="Estatura (cm)" value={form.talla} onChange={(v: string) => update('talla', v)} placeholder="175" />
          <Input label="Peso Inicial (kg)" value={form.peso} onChange={(v: string) => update('peso', v)} placeholder="70.5" type="number" />
          <Select label="Somatotipo" value={form.complexion} onChange={(v: string) => update('complexion', v)} options={['', 'Ectomorfo', 'Mesomorfo', 'Endomorfo']} />
        </FormSection>

        <FormSection title="Dinámica Deportiva" icon={Activity} defaultOpen={false}>
          <Input label="Objetivo" value={form.objetivo} onChange={(v: string) => update('objetivo', v)} placeholder="Ej: Aumento de masa muscular, pérdida de grasa" />
          <Input label="Gimnasio de Origen" value={form.gymOrigen} onChange={(v: string) => update('gymOrigen', v)} placeholder="Nombre del club" />
          <Input label="Hora de Entrenamiento" value={form.horaEntrenamiento} onChange={(v: string) => update('horaEntrenamiento', v)} placeholder="Ej: 7:00am / Tarde" />
          <div className="col-span-full space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-[12px] font-medium text-text-secondary uppercase tracking-widest ml-1">Disciplinas</label>
              <button
                type="button"
                onClick={addDisciplina}
                className="flex items-center gap-1 text-[11px] font-bold text-text-secondary hover:text-text-primary bg-bg-elevated border border-border-subtle hover:border-border-default px-3 py-1.5 rounded-[6px] uppercase tracking-wider transition-colors"
              >
                <Plus className="w-3 h-3" /> Agregar disciplina
              </button>
            </div>
            {disciplinas.map((d, idx) => (
              <div key={idx} className="grid sm:grid-cols-3 gap-3 items-end p-3 bg-bg-elevated/40 border border-border-subtle rounded-[8px] relative">
                <Input label={`Disciplina ${disciplinas.length > 1 ? idx + 1 : ''}`} value={d.disciplina} onChange={(v: string) => updateDisciplina(idx, 'disciplina', v)} placeholder="Crossfit / Pesas / Correr" />
                <Input label="Frecuencia" value={d.frecuencia} onChange={(v: string) => updateDisciplina(idx, 'frecuencia', v)} placeholder="EJ: 5 días a la semana" />
                <div className="flex gap-2 items-end">
                  <div className="flex-1">
                    <Input label="Duración" value={d.tiempo} onChange={(v: string) => updateDisciplina(idx, 'tiempo', v)} placeholder="EJ: 60-90 min" />
                  </div>
                  {disciplinas.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeDisciplina(idx)}
                      className="p-3 text-text-muted hover:text-accent-red rounded-[8px] hover:bg-bg-elevated transition-colors"
                      title="Eliminar disciplina"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

        </FormSection>

        <FormSection title="Anamnesis y Suplementación" icon={Shield} defaultOpen={false}>
          <div className="col-span-full space-y-3">
            <label className="text-[12px] font-medium text-text-secondary uppercase tracking-widest ml-1 leading-none block">
              Suplementos Actuales del Paciente
            </label>
            <div className="bg-[#111111] border border-[#2a2a2a] rounded-[12px] p-4 space-y-2">
              {suplementosIniciales.length > 0 && (
                <div className="grid grid-cols-[1.5fr_2fr_48px_40px] gap-3 items-center px-2 py-1 text-[10px] font-bold text-[#8a8a8a] uppercase tracking-widest border-b border-[#2a2a2a] mb-2">
                  <div>Suplemento</div>
                  <div>Indicaciones / Dosis</div>
                  <div className="text-center">Activo</div>
                  <div></div>
                </div>
              )}
              <div className="space-y-2 max-h-[200px] overflow-y-auto">
                {suplementosIniciales.map((sup, idx) => (
                  <div key={sup.id} className="grid grid-cols-[1.5fr_2fr_48px_40px] gap-3 items-center bg-[#181818] p-3 rounded-[8px] border border-[#2a2a2a]">
                    <input
                      type="text"
                      value={sup.nombre}
                      onChange={(e) => {
                        const arr = [...suplementosIniciales];
                        arr[idx] = { ...arr[idx], nombre: e.target.value };
                        setSuplementosIniciales(arr);
                      }}
                      placeholder="Ej. Creatina"
                      className="w-full bg-transparent text-[13px] font-semibold text-white outline-none placeholder-[#555] p-1 border-b border-transparent focus:border-[#444] transition-colors"
                    />
                    <input
                      type="text"
                      value={sup.indicaciones}
                      onChange={(e) => {
                        const arr = [...suplementosIniciales];
                        arr[idx] = { ...arr[idx], indicaciones: e.target.value };
                        setSuplementosIniciales(arr);
                      }}
                      placeholder="Ej. 5g pre-entreno"
                      className="w-full bg-transparent text-[13px] text-[#c0c0c0] outline-none placeholder-[#555] p-1 border-b border-transparent focus:border-[#444] transition-colors"
                    />
                    <div className="flex justify-center">
                      <button
                        type="button"
                        onClick={() => { const arr = [...suplementosIniciales]; arr[idx] = { ...arr[idx], activo: !arr[idx].activo }; setSuplementosIniciales(arr); }}
                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${sup.activo ? 'bg-accent-green' : 'bg-[#333]'}`}
                      >
                        <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${sup.activo ? 'translate-x-4' : 'translate-x-1'}`} />
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSuplementosIniciales(suplementosIniciales.filter((_, i) => i !== idx))}
                      className="p-2 text-[#555] hover:text-[#ff6b6b] hover:bg-[#ff6b6b]/10 rounded-[6px] transition-colors flex justify-center items-center"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                {suplementosIniciales.length === 0 && (
                  <p className="text-[12px] text-[#8a8a8a] text-center py-4">Sin suplementos registrados.</p>
                )}
              </div>
              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setSuplementosIniciales([...suplementosIniciales, { id: Date.now().toString(), nombre: '', indicaciones: '', activo: true }])}
                  className="flex items-center gap-2 text-[12px] font-bold text-[#0a0a0a] bg-[#f0f0f0] hover:bg-white px-4 py-2 rounded-[8px] transition-colors uppercase tracking-wider"
                >
                  <Plus className="w-4 h-4" /> Agregar Suplemento
                </button>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 col-span-full">
            <Input label="Alergias Alimentarias" value={form.alergico} onChange={(v: string) => update('alergico', v)} placeholder="Ej. Lácteos, Maní" />
            <Input label="Preferencias (Gusta)" value={form.alimentosGusta} onChange={(v: string) => update('alimentosGusta', v)} placeholder="Ej. Pollo, Avena, Manzanas" />
            <Input label="Aversiones (No Gusta)" value={form.alimentosNoGusta} onChange={(v: string) => update('alimentosNoGusta', v)} placeholder="Ej. Pescado, Brócoli" />
          </div>
        </FormSection>

        <FormSection title="Perfil Clínico" icon={Heart} defaultOpen={false}>
          <Input label="Patologías" value={form.patologia} onChange={(v: string) => update('patologia', v)} placeholder="Diabetes, Hipertensión..." />
          <Input label="Cirugías o Traumas" value={form.cirugias} onChange={(v: string) => update('cirugias', v)} placeholder="Ninguna" />
          <Input label="Fármacos / Medicamentos" value={form.farmacos} onChange={(v: string) => update('farmacos', v)} placeholder="Metformina 500mg, Eutirox..." />
          <Input label="Ciclo Menstrual" value={form.cicloMenstrual} onChange={(v: string) => update('cicloMenstrual', v)} placeholder="Regular / Irregular / N/A" />
          <Select label="Tránsito Intestinal" value={form.estrenimiento} onChange={(v: string) => update('estrenimiento', v)} options={['No', 'Leve', 'Frecuente']} />
          <Select label="Consumo de Alcohol" value={form.alcohol} onChange={(v: string) => update('alcohol', v)} options={['No', 'Social', 'Frecuente']} />
          <Select label="Hábito Tabáquico" value={form.tabaco} onChange={(v: string) => update('tabaco', v)} options={['No', 'Ocasional', 'Frecuente']} />
          <Input label="Ingesta de Agua (L)”" value={form.agua} onChange={(v: string) => update('agua', v)} placeholder="Ej. 2.5 Lts" />
          <TextArea label="Signos y Síntomas Adicionales" value={form.signosSintomas} onChange={(v: string) => update('signosSintomas', v)} placeholder="Cansancio crónico, dolor de cabeza..." />
        </FormSection>

      </div>

      {/* Barra guardar sticky */}
      <div className="sticky bottom-0 -mx-3 sm:-mx-4 md:-mx-6 lg:-mx-8 px-3 sm:px-4 md:px-6 lg:px-8 py-3 bg-[#0a0a0a]/95 backdrop-blur-md border-t border-[#1a1a1a] flex items-center justify-between z-20">
        <p className="text-[13px] text-text-muted hidden sm:block">Revisa los datos antes de guardar</p>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 bg-brand-primary text-bg-base px-[24px] py-[11px] rounded-[8px] text-[14px] font-bold transition-colors hover:bg-[#e0e0e0] disabled:opacity-50 ml-auto"
        >
          {saving ? <div className="w-[18px] h-[18px] border-2 border-black/20 border-t-black rounded-full animate-spin" /> : <Save className="h-[18px] w-[18px]" />}
          {saving ? 'Guardando...' : 'Guardar expediente'}
        </button>
      </div>
    </div>
  );
};


export default NewPatient;
