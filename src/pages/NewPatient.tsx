import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, User, Activity, Heart, Shield, Clock, BookOpen } from 'lucide-react';
import api from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

const Input = ({ label, value, onChange, placeholder, type = 'text', readOnly = false }: any) => (
  <div className="space-y-2 group">
    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 group-hover:text-slate-500 transition-colors leading-none">{label}</label>
    <input 
      type={type}
      value={value} 
      onChange={(e) => onChange(e.target.value)} 
      readOnly={readOnly}
      className={`w-full bg-background rounded-none px-5 py-3.5 text-[13px] font-medium text-slate-700 tracking-tight outline-none focus:ring-2 focus:ring-slate-900/5 focus:border-slate-900 transition-all border border-slate-200 ${readOnly ? 'bg-secondary cursor-not-allowed opacity-60' : 'hover:border-slate-300'}`} 
      placeholder={placeholder} 
    />
  </div>
);

const Select = ({ label, value, onChange, options }: any) => (
  <div className="space-y-2 group">
    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 group-hover:text-slate-500 transition-colors leading-none">{label}</label>
    <select 
      value={value} 
      onChange={(e) => onChange(e.target.value)} 
      className="w-full bg-background rounded-none px-5 py-3.5 text-[11px] font-bold text-slate-700 uppercase tracking-widest outline-none focus:ring-2 focus:ring-slate-900/5 focus:border-slate-900 transition-all border border-slate-200 hover:border-slate-300 appearance-none cursor-pointer"
    >
      {options.map((o: string) => <option key={o} value={o}>{o.toUpperCase()}</option>)}
    </select>
  </div>
);

const TextArea = ({ label, value, onChange, placeholder }: any) => (
  <div className="space-y-2 col-span-full group">
    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 group-hover:text-slate-500 transition-colors leading-none">{label}</label>
    <textarea 
      value={value} 
      onChange={(e) => onChange(e.target.value)} 
      className="w-full bg-background rounded-none p-5 text-[13px] font-medium text-slate-700 tracking-tight outline-none focus:ring-2 focus:ring-slate-900/5 focus:border-slate-900 transition-all border border-slate-200 hover:border-slate-300 min-h-[120px] resize-none" 
      placeholder={placeholder} 
    />
  </div>
);

const FormSection = ({ title, icon: Icon, children }: { title: string, icon: any, children: React.ReactNode }) => (
  <div className="bg-background p-8 md:p-10 rounded-none border border-slate-100 shadow-sm animate-slide-up">
    <div className="flex items-center gap-4 mb-10 border-b border-border/40 pb-6">
      <div className="p-2 bg-slate-900 rounded-none">
        <Icon className="h-4 w-4 text-white" />
      </div>
      <h3 className="text-[12px] font-bold text-slate-800 uppercase tracking-[0.3em] leading-none">
        {title}
      </h3>
    </div>
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
      {children}
    </div>
  </div>
);

const NewPatient = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  
  const [form, setForm] = useState({
    nombre: '', apellido: '', telefono: '', email: '',
    fechaNacimiento: '', sexo: 'F' as 'M' | 'F',
    objetivo: '', gymOrigen: '', disciplina: '', frecuencia: '', tiempo: '',
    nivelActividad: 'Sedentario',
    porcentajeSedentario: '', porcentajeLeve: '', porcentajeModerado: '', porcentajeIntenso: '',
    horaDesayuno: '', ayerDesayuno: '', usalmenteDesayuno: '',
    horaColacion1: '', ayerColacion1: '', usalmenteColacion1: '',
    horaAlmuerzo: '', ayerAlmuerzo: '', usalmenteAlmuerzo: '',
    horaColacion2: '', ayerColacion2: '', usalmenteColacion2: '',
    horaCena: '', ayerCena: '', usalmenteCena: '',
    historialProductos: '', recomSuplementos: '',
    alimentosNoGusta: '', alimentosGusta: '', alergico: '',
    patologia: '', cirugias: '', estrenimiento: 'No',
    alcohol: 'No', tabaco: 'No', agua: '',
    cicloMenstrual: '', signosSintomas: '',
    talla: '',
  });

  const update = (field: string, value: any) => setForm({ ...form, [field]: value });
  
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
      telefono: form.telefono,
      email: form.email,
      fechaNacimiento: form.fechaNacimiento,
      sexo: form.sexo,
      edad,
      estatura: form.talla,
      fechaActual: new Date().toISOString(),
      
      ejercicio: {
        objetivo: form.objetivo,
        gymOrigen: form.gymOrigen,
        disciplina: form.disciplina,
        frecuencia: form.frecuencia,
        tiempo: form.tiempo,
        nivelActividad: form.nivelActividad,
        porcentajeSedentario: parseFloat(form.porcentajeSedentario) || 0,
        porcentajeLeve: parseFloat(form.porcentajeLeve) || 0,
        porcentajeModerado: parseFloat(form.porcentajeModerado) || 0,
        porcentajeIntenso: parseFloat(form.porcentajeIntenso) || 0,
      },
      
      antecedentes: {
        patologia: form.patologia,
        cirugias: form.cirugias,
        alergias: form.alergico,
        alimentosGustan: form.alimentosGusta,
        alimentosNoGustan: form.alimentosNoGusta,
        estrenimiento: form.estrenimiento,
        cicloMenstrual: form.cicloMenstrual,
        signosYSintomas: form.signosSintomas,
        consumoAlcohol: form.alcohol,
        tabaco: form.tabaco,
        agua: form.agua,
        historialProductos: form.historialProductos,
        recomendacionSuplementos: form.recomSuplementos
      },
      
      habitos: {
        horaDesayuno: form.horaDesayuno,
        ayerDesayuno: form.ayerDesayuno,
        usalmenteDesayuno: form.usalmenteDesayuno,
        horaColacion1: form.horaColacion1,
        ayerColacion1: form.ayerColacion1,
        usalmenteColacion1: form.usalmenteColacion1,
        horaAlmuerzo: form.horaAlmuerzo,
        ayerAlmuerzo: form.ayerAlmuerzo,
        usalmenteAlmuerzo: form.usalmenteAlmuerzo,
        horaColacion2: form.horaColacion2,
        ayerColacion2: form.ayerColacion2,
        usalmenteColacion2: form.usalmenteColacion2,
        horaCena: form.horaCena,
        ayerCena: form.ayerCena,
        usalmenteCena: form.usalmenteCena,
      }
    };

    try {
      const response = await api.post('/api/pacientes', payload);
      const serverData = response.data?.data || response.data;
      const patientId = serverData?.id;
      
      toast({ title: 'Expediente digitalizado correctamente' });
      if (patientId) navigate(`/pacientes/${patientId}`);
      else navigate('/pacientes');
    } catch (err: any) {
      toast({ title: 'Fallo de Sistema', description: 'No se pudo crear el expediente.', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-12 animate-fade-in max-w-none pb-32 px-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8 pt-8">
        <div className="space-y-4">
          <button onClick={() => navigate('/pacientes')} className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 hover:text-slate-900 transition-all w-fit group leading-none">
            <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-all" /> Volver al listado
          </button>
          <div className="space-y-2">
            <h1 className="text-4xl font-bold text-slate-900 tracking-[-0.04em] uppercase leading-none">Nuevo Expediente</h1>
            <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.4em] ml-1 leading-none">Configuración inicial de Nodo Maestro</p>
          </div>
        </div>
        <div className="flex items-center gap-4 bg-secondary p-4 rounded-none border border-slate-100">
          <BookOpen className="h-5 w-5 text-slate-400" />
          <div className="flex flex-col">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Protocolo</span>
            <span className="text-[11px] font-bold text-slate-700">EYDER V2.4</span>
          </div>
        </div>
      </div>

      <div className="space-y-12">
        <FormSection title="Identificación del Paciente" icon={User}>
          <Input label="Nombre(s) *" value={form.nombre} onChange={(v: string) => update('nombre', v)} placeholder="JUAN MANUEL" />
          <Input label="Apellidos *" value={form.apellido} onChange={(v: string) => update('apellido', v)} placeholder="GONZÁLEZ" />
          <Input label="Teléfono *" value={form.telefono} onChange={(v: string) => update('telefono', v)} placeholder="+52 999 000 0000" />
          <Input label="E-mail" value={form.email} onChange={(v: string) => update('email', v)} placeholder="PACIENTE@NORDER.HEALTH" />
          <Input label="Fecha de Nacimiento" value={form.fechaNacimiento} onChange={(v: string) => update('fechaNacimiento', v)} type="date" />
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 leading-none">Edad (Cálculo)</label>
            <div className="bg-secondary rounded-none px-5 py-3.5 text-[13px] font-bold text-slate-400 border border-slate-100 flex items-center justify-between">
              {edad} AÑOS <Clock className="h-3 w-3 opacity-30" />
            </div>
          </div>
          <Select label="Sexo Biológico" value={form.sexo} onChange={(v: string) => update('sexo', v)} options={['F', 'M']} />
          <Input label="Estatura (M)" value={form.talla} onChange={(v: string) => update('talla', v)} placeholder="1.75" />
          <Input label="Objetivo Primario" value={form.objetivo} onChange={(v: string) => update('objetivo', v)} placeholder="RECOMPOSICIÓN CORPORAL" />
        </FormSection>

        <FormSection title="Dinámica Deportiva" icon={Activity}>
          <Input label="Gym de Origen" value={form.gymOrigen} onChange={(v: string) => update('gymOrigen', v)} placeholder="NORDER CLUB" />
          <Input label="Disciplina" value={form.disciplina} onChange={(v: string) => update('disciplina', v)} placeholder="CROSSFIT / PESAS" />
          <Input label="Frecuencia" value={form.frecuencia} onChange={(v: string) => update('frecuencia', v)} placeholder="5 DÍAS / SEMANA" />
          <Input label="Duración Sesión" value={form.tiempo} onChange={(v: string) => update('tiempo', v)} placeholder="60-90 MINUTOS" />
          <Select label="Nivel de Actividad" value={form.nivelActividad} onChange={(v: string) => update('nivelActividad', v)} options={['Sedentario', 'Leve', 'Moderado', 'Intenso']} />
          <div className="grid grid-cols-2 gap-4 col-span-full">
            <Input label="SEDENTARIO %" value={form.porcentajeSedentario} onChange={(v: string) => update('porcentajeSedentario', v)} placeholder="0" type="number" />
            <Input label="LEVE %" value={form.porcentajeLeve} onChange={(v: string) => update('porcentajeLeve', v)} placeholder="0" type="number" />
            <Input label="MODERADO %" value={form.porcentajeModerado} onChange={(v: string) => update('porcentajeModerado', v)} placeholder="0" type="number" />
            <Input label="INTENSO %" value={form.porcentajeIntenso} onChange={(v: string) => update('porcentajeIntenso', v)} placeholder="0" type="number" />
          </div>
        </FormSection>

        <div className="bg-background p-8 md:p-10 rounded-none border border-slate-100 shadow-sm animate-slide-up">
          <div className="flex items-center gap-4 mb-10 border-b border-border/40 pb-6">
            <div className="p-2 bg-slate-900 rounded-none">
              <Clock className="h-4 w-4 text-white" />
            </div>
            <h3 className="text-[12px] font-bold text-slate-800 uppercase tracking-[0.3em] leading-none">
              Recordatorio de 24 Horas
            </h3>
          </div>
          <div className="overflow-hidden rounded-none border border-slate-100 bg-background">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-secondary border-b border-slate-100">
                  <th className="py-5 px-8 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tiempo</th>
                  <th className="py-5 px-8 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Hora</th>
                  <th className="py-5 px-8 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Ayer (Ingesta)</th>
                  <th className="py-5 px-8 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Usualmente</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-secondary">
                {[
                  { k: 'Desayuno', label: 'Desayuno' },
                  { k: 'Colacion1', label: 'Colación 1' },
                  { k: 'Almuerzo', label: 'Almuerzo' },
                  { k: 'Colacion2', label: 'Colación 2' },
                  { k: 'Cena', label: 'Cena' },
                ].map((t) => (
                  <tr key={t.k} className="hover:bg-secondary/50 transition-colors">
                    <td className="py-5 px-8 text-[11px] font-bold text-slate-900 uppercase tracking-widest">{t.label}</td>
                    <td className="py-3 px-4">
                      <input type="time" value={(form as any)[`hora${t.k}`]} onChange={(e) => update(`hora${t.k}`, e.target.value)} className="w-full bg-secondary/50 border border-slate-100 rounded-none px-3 py-2 text-[11px] font-bold text-slate-600 outline-none focus:bg-background focus:border-slate-900 transition-all" />
                    </td>
                    <td className="py-3 px-4">
                      <input value={(form as any)[`ayer${t.k}`]} onChange={(e) => update(`ayer${t.k}`, e.target.value)} className="w-full bg-secondary/50 border border-slate-100 rounded-none px-3 py-2 text-[11px] font-medium text-slate-600 uppercase outline-none focus:bg-background focus:border-slate-900 transition-all" placeholder="EJ. POLLO CON ARROZ" />
                    </td>
                    <td className="py-3 px-8">
                      <input value={(form as any)[`usalmente${t.k}`]} onChange={(e) => update(`usalmente${t.k}`, e.target.value)} className="w-full bg-secondary/50 border border-slate-100 rounded-none px-3 py-2 text-[11px] font-medium text-slate-600 uppercase outline-none focus:bg-background focus:border-slate-900 transition-all" placeholder="MISMO PATRÓN" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <FormSection title="Anámnesis y Suplementación" icon={Shield}>
          <TextArea label="Historial de Suplementos (Fase Actual)" value={form.historialProductos} onChange={(v: string) => update('historialProductos', v)} placeholder="DESCRIBA LOS PRODUCTOS QUE CONSUME EL PACIENTE ACTUALMENTE..." />
          <TextArea label="Propuesta Inicial de Suplementación" value={form.recomSuplementos} onChange={(v: string) => update('recomSuplementos', v)} placeholder="RECOMENDACIONES BASADAS EN EL OBJETIVO..." />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 col-span-full">
            <Input label="Alergias Alimentarias" value={form.alergico} onChange={(v: string) => update('alergico', v)} placeholder="EJ. LOREATINA, NUECES" />
            <Input label="Preferencias (Gusta)" value={form.alimentosGusta} onChange={(v: string) => update('alimentosGusta', v)} placeholder="POLLO, ATÚN, AVENA" />
            <Input label="Aversiones (No Gusta)" value={form.alimentosNoGusta} onChange={(v: string) => update('alimentosNoGusta', v)} placeholder="CEBOLLA, HÍGADO" />
          </div>
        </FormSection>

        <FormSection title="Perfil Clínico Maestro" icon={Heart}>
          <Input label="Patologías" value={form.patologia} onChange={(v: string) => update('patologia', v)} placeholder="DIABETES, HIPERTENSIÓN..." />
          <Input label="Cirugías o Traumas" value={form.cirugias} onChange={(v: string) => update('cirugias', v)} placeholder="NINGUNA" />
          <Select label="Tránsito Intestinal" value={form.estrenimiento} onChange={(v: string) => update('estrenimiento', v)} options={['No', 'Leve', 'Frecuente']} />
          <Select label="Consumo Alcohol" value={form.alcohol} onChange={(v: string) => update('alcohol', v)} options={['No', 'Social', 'Frecuente']} />
          <Select label="Hábito Tabáquico" value={form.tabaco} onChange={(v: string) => update('tabaco', v)} options={['No', 'Social', 'Frecuente']} />
          <Input label="Ingesta de Agua (L)" value={form.agua} onChange={(v: string) => update('agua', v)} placeholder="2.5 LTS" />
          {form.sexo === 'F' && <Input label="Ciclo Menstrual" value={form.cicloMenstrual} onChange={(v: string) => update('cicloMenstrual', v)} placeholder="REGULAR / 28 DÍAS" />}
          <TextArea label="Signos y Síntomas Adicionales" value={form.signosSintomas} onChange={(v: string) => update('signosSintomas', v)} placeholder="CANSANCIO, MALESTAR, ETC..." />
        </FormSection>

        <div className="pt-12 flex justify-end items-center gap-8">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-none bg-slate-200 animate-pulse" />
            <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Validación de campos pendiente</span>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-4 bg-slate-900 text-white px-12 py-5 rounded-none text-[11px] font-bold uppercase tracking-[0.25em] transition-all hover:bg-slate-800 hover:shadow-2xl hover:shadow-slate-200 disabled:opacity-50 group"
          >
            {saving ? <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : <Save className="h-5 w-5 group-hover:scale-110 transition-transform" />}
            {saving ? 'Digitalizando...' : 'Alta de Expediente Maestro'}
          </button>
        </div>
      </div>
    </div>
  );
};


export default NewPatient;
