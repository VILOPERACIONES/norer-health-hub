import { useEffect, useState, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, User, Activity, Heart, Shield, Clock, BookOpen } from 'lucide-react';
import api from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

const Input = ({ label, value, onChange, placeholder, type = 'text', readOnly = false }: any) => (
  <div className="space-y-2 group">
    <label className="text-[12px] font-medium text-text-secondary uppercase tracking-widest ml-1 leading-none">{label}</label>
    <input 
      type={type}
      value={value} 
      onChange={(e) => onChange(e.target.value)} 
      readOnly={readOnly}
      className={`w-full bg-bg-elevated rounded-[8px] px-4 py-3 text-[14px] font-normal text-text-primary tracking-tight outline-none focus:border-[#444] transition-all border border-border-subtle ${readOnly ? 'opacity-60 cursor-not-allowed' : 'hover:border-border-default'}`} 
      placeholder={placeholder} 
    />
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

const FormSection = ({ title, icon: Icon, children }: { title: string, icon: any, children: React.ReactNode }) => (
  <div className="bg-bg-surface p-8 rounded-[12px] border border-border-subtle shadow-none animate-slide-up">
    <div className="flex items-center gap-3 mb-8 border-b border-border-subtle pb-4">
      <div className="p-2 bg-bg-elevated border border-border-default rounded-[8px]">
        <Icon className="h-[18px] w-[18px] text-text-secondary" />
      </div>
      <h3 className="text-[16px] font-semibold text-text-primary m-0">
        {title}
      </h3>
    </div>
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {children}
    </div>
  </div>
);

const EditPatient = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
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

  useEffect(() => {
    const fetchPatient = async () => {
      try {
        const { data } = await api.get(`/api/pacientes/${id}`);
        const p = data?.data || data;
        if (p) {
          const ej = p.ejercicio || p.datosEjercicio || {};
          const ant = p.antecedentes || {};
          const hab = p.habitos || p.consumoCalorico || {};
          
          setForm({
            nombre: p.nombre || '',
            apellido: p.apellido || '',
            telefono: p.telefono || '',
            email: p.email || '',
            fechaNacimiento: p.fechaNacimiento ? p.fechaNacimiento.split('T')[0] : '',
            sexo: p.sexo || 'F',
            talla: p.estatura || p.talla || '',
            
            objetivo: ej.objetivo || '',
            gymOrigen: ej.gymOrigen || '',
            disciplina: ej.disciplina || '',
            frecuencia: ej.frecuencia || '',
            tiempo: ej.tiempo || '',
            nivelActividad: ej.nivelActividad || 'Sedentario',
            porcentajeSedentario: ej.porcentajeSedentario?.toString() || '',
            porcentajeLeve: ej.porcentajeLeve?.toString() || '',
            porcentajeModerado: ej.porcentajeModerado?.toString() || '',
            porcentajeIntenso: ej.porcentajeIntenso?.toString() || '',

            horaDesayuno: hab.horaDesayuno || '',
            ayerDesayuno: hab.ayerDesayuno || '',
            usalmenteDesayuno: hab.usalmenteDesayuno || '',
            horaColacion1: hab.horaColacion1 || '',
            ayerColacion1: hab.ayerColacion1 || '',
            usalmenteColacion1: hab.usalmenteColacion1 || '',
            horaAlmuerzo: hab.horaAlmuerzo || '',
            ayerAlmuerzo: hab.ayerAlmuerzo || '',
            usalmenteAlmuerzo: hab.usalmenteAlmuerzo || '',
            horaColacion2: hab.horaColacion2 || '',
            ayerColacion2: hab.ayerColacion2 || '',
            usalmenteColacion2: hab.usalmenteColacion2 || '',
            horaCena: hab.horaCena || '',
            ayerCena: hab.ayerCena || '',
            usalmenteCena: hab.usalmenteCena || '',

            historialProductos: ant.historialProductos || '',
            recomSuplementos: ant.recomendacionSuplementos || ant.recomSuplementos || '',
            alimentosNoGusta: ant.alimentosNoGusta || '',
            alimentosGusta: ant.alimentosGusta || '',
            alergico: ant.alergias || ant.alergico || '',
            patologia: ant.patologia || '',
            cirugias: ant.cirugias || '',
            estrenimiento: ant.estrenimiento || 'No',
            alcohol: ant.consumoAlcohol || ant.alcohol || 'No',
            tabaco: ant.tabaco || 'No',
            agua: ant.agua || '',
            cicloMenstrual: ant.cicloMenstrual || '',
            signosSintomas: ant.signosYSintomas || ant.signosSintomas || '',
          });
        }
      } catch (err) {
        toast({ title: 'Error', description: 'No se pudo cargar la información del paciente', variant: 'destructive' });
      } finally {
        setLoading(false);
      }
    };
    fetchPatient();
  }, [id, toast]);

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
      await api.put(`/api/pacientes/${id}`, payload);
      toast({ title: 'Expediente actualizado correctamente' });
      navigate(`/pacientes/${id}`);
    } catch (err: any) {
      toast({ title: 'Error de Sistema', description: 'No se pudo actualizar el expediente', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="h-[80vh] flex flex-col items-center justify-center gap-6 animate-pulse">
        <div className="w-8 h-8 rounded-full border-2 border-border-subtle border-t-text-primary animate-spin" />
        <p className="text-[14px] font-medium text-text-muted">Cargando expediente para edición...</p>
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-fade-in max-w-none pb-24 px-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 pt-6">
        <div className="space-y-2">
          <button onClick={() => navigate(`/pacientes/${id}`)} className="flex items-center gap-2 text-[14px] font-medium text-text-secondary hover:text-text-primary transition-colors w-fit group mb-4">
            <ArrowLeft className="h-[18px] w-[18px] group-hover:-translate-x-1 transition-transform" /> Volver al perfil
          </button>
          <div className="space-y-1">
            <h1 className="text-[26px] font-bold text-text-primary m-0 tracking-tight">Editar Expediente</h1>
            <p className="text-text-secondary font-normal text-[14px] m-0">Actualización de datos de paciente</p>
          </div>
        </div>
      </div>

      <div className="space-y-8">
        <FormSection title="Identificación del Paciente" icon={User}>
          <Input label="Nombre(s) *" value={form.nombre} onChange={(v: string) => update('nombre', v)} placeholder="Juan Manuel" />
          <Input label="Apellidos *" value={form.apellido} onChange={(v: string) => update('apellido', v)} placeholder="González" />
          <Input label="Teléfono *" value={form.telefono} onChange={(v: string) => update('telefono', v)} placeholder="+52 999 000 0000" />
          <Input label="E-mail" value={form.email} onChange={(v: string) => update('email', v)} placeholder="paciente@ejemplo.com" />
          <Input label="Fecha de Nacimiento" value={form.fechaNacimiento} onChange={(v: string) => update('fechaNacimiento', v)} type="date" />
          <div className="space-y-2">
            <label className="text-[12px] font-medium text-text-secondary uppercase tracking-widest ml-1 leading-none">Edad (Cálculo)</label>
            <div className="bg-bg-elevated rounded-[8px] px-4 py-3 text-[14px] font-normal text-text-muted border border-border-subtle flex items-center justify-between">
              {edad} Años <Clock className="h-[18px] w-[18px] text-text-muted" />
            </div>
          </div>
          <Select label="Sexo Biológico" value={form.sexo} onChange={(v: string) => update('sexo', v)} options={['F', 'M']} />
          <Input label="Estatura (M)" value={form.talla} onChange={(v: string) => update('talla', v)} placeholder="1.75" />
          <Input label="Objetivo Primario" value={form.objetivo} onChange={(v: string) => update('objetivo', v)} placeholder="Recomposición corporal" />
        </FormSection>

        <FormSection title="Dinámica Deportiva" icon={Activity}>
          <Input label="Gimnasio de Origen" value={form.gymOrigen} onChange={(v: string) => update('gymOrigen', v)} placeholder="Nombre del club" />
          <Input label="Disciplina" value={form.disciplina} onChange={(v: string) => update('disciplina', v)} placeholder="Crossfit / Pesas / Correr" />
          <Input label="Frecuencia" value={form.frecuencia} onChange={(v: string) => update('frecuencia', v)} placeholder="EJ: 5 días a la semana" />
          <Input label="Duración Sesión" value={form.tiempo} onChange={(v: string) => update('tiempo', v)} placeholder="EJ: 60-90 Minutos" />
          <Select label="Nivel de Actividad" value={form.nivelActividad} onChange={(v: string) => update('nivelActividad', v)} options={['Sedentario', 'Leve', 'Moderado', 'Intenso']} />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 col-span-full">
            <Input label="Sedentario %" value={form.porcentajeSedentario} onChange={(v: string) => update('porcentajeSedentario', v)} placeholder="0" type="number" />
            <Input label="Leve %" value={form.porcentajeLeve} onChange={(v: string) => update('porcentajeLeve', v)} placeholder="0" type="number" />
            <Input label="Moderado %" value={form.porcentajeModerado} onChange={(v: string) => update('porcentajeModerado', v)} placeholder="0" type="number" />
            <Input label="Intenso %" value={form.porcentajeIntenso} onChange={(v: string) => update('porcentajeIntenso', v)} placeholder="0" type="number" />
          </div>
        </FormSection>

        <div className="bg-bg-surface p-8 rounded-[12px] border border-border-subtle shadow-none animate-slide-up">
          <div className="flex items-center gap-3 mb-8 border-b border-border-subtle pb-4">
            <div className="p-2 bg-bg-elevated border border-border-default rounded-[8px]">
              <Clock className="h-[18px] w-[18px] text-text-secondary" />
            </div>
            <h3 className="text-[16px] font-semibold text-text-primary m-0">
              Recordatorio de 24 Horas
            </h3>
          </div>
          <div className="overflow-hidden rounded-[8px] border border-border-subtle bg-bg-surface">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-bg-elevated border-b border-border-subtle">
                  <th className="py-4 px-6 text-[12px] font-medium text-text-secondary uppercase">Tiempo</th>
                  <th className="py-4 px-6 text-[12px] font-medium text-text-secondary uppercase">Hora</th>
                  <th className="py-4 px-6 text-[12px] font-medium text-text-secondary uppercase">Ayer (Ingesta)</th>
                  <th className="py-4 px-6 text-[12px] font-medium text-text-secondary uppercase">Usualmente</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {[
                  { k: 'Desayuno', label: 'Desayuno' },
                  { k: 'Colacion1', label: 'Colación 1' },
                  { k: 'Almuerzo', label: 'Almuerzo' },
                  { k: 'Colacion2', label: 'Colación 2' },
                  { k: 'Cena', label: 'Cena' },
                ].map((t) => (
                  <tr key={t.k} className="hover:bg-bg-elevated transition-colors">
                    <td className="py-4 px-6 text-[14px] font-medium text-text-primary">{t.label}</td>
                    <td className="py-2 px-6">
                      <input type="time" value={(form as any)[`hora${t.k}`]} onChange={(e) => update(`hora${t.k}`, e.target.value)} className="w-full bg-bg-surface border border-border-subtle rounded-[6px] px-3 py-2 text-[14px] font-normal text-text-primary outline-none focus:border-[#444] transition-all" />
                    </td>
                    <td className="py-2 px-6">
                      <input value={(form as any)[`ayer${t.k}`]} onChange={(e) => update(`ayer${t.k}`, e.target.value)} className="w-full bg-bg-surface border border-border-subtle rounded-[6px] px-3 py-2 text-[14px] font-normal text-text-primary outline-none focus:border-[#444] transition-all placeholder:text-text-muted" placeholder="Ej. Pollo con arroz" />
                    </td>
                    <td className="py-2 px-6">
                      <input value={(form as any)[`usalmente${t.k}`]} onChange={(e) => update(`usalmente${t.k}`, e.target.value)} className="w-full bg-bg-surface border border-border-subtle rounded-[6px] px-3 py-2 text-[14px] font-normal text-text-primary outline-none focus:border-[#444] transition-all placeholder:text-text-muted" placeholder="Mismo patrón" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <FormSection title="Anamnesis y Suplementación" icon={Shield}>
          <TextArea label="Historial de Suplementos (Fase Actual)" value={form.historialProductos} onChange={(v: string) => update('historialProductos', v)} placeholder="Describa los productos que consume el paciente actualmente..." />
          <TextArea label="Propuesta Inicial de Suplementación" value={form.recomSuplementos} onChange={(v: string) => update('recomSuplementos', v)} placeholder="Recomendaciones basadas en el objetivo..." />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 col-span-full">
            <Input label="Alergias Alimentarias" value={form.alergico} onChange={(v: string) => update('alergico', v)} placeholder="Ej. Lácteos, Maní" />
            <Input label="Preferencias (Gusta)" value={form.alimentosGusta} onChange={(v: string) => update('alimentosGusta', v)} placeholder="Ej. Pollo, Avena, Manzanas" />
            <Input label="Aversiones (No Gusta)" value={form.alimentosNoGusta} onChange={(v: string) => update('alimentosNoGusta', v)} placeholder="Ej. Pescado, Brócoli" />
          </div>
        </FormSection>

        <FormSection title="Perfil Clínico" icon={Heart}>
          <Input label="Patologías" value={form.patologia} onChange={(v: string) => update('patologia', v)} placeholder="Diabetes, Hipertensión..." />
          <Input label="Cirugías o Traumas" value={form.cirugias} onChange={(v: string) => update('cirugias', v)} placeholder="Ninguna" />
          <Select label="Tránsito Intestinal" value={form.estrenimiento} onChange={(v: string) => update('estrenimiento', v)} options={['No', 'Leve', 'Frecuente']} />
          <Select label="Consumo de Alcohol" value={form.alcohol} onChange={(v: string) => update('alcohol', v)} options={['No', 'Social', 'Frecuente']} />
          <Select label="Hábito Tabáquico" value={form.tabaco} onChange={(v: string) => update('tabaco', v)} options={['No', 'Ocasional', 'Frecuente']} />
          <Input label="Ingesta de Agua (L)”" value={form.agua} onChange={(v: string) => update('agua', v)} placeholder="Ej. 2.5 Lts" />
          {form.sexo === 'F' && <Input label="Ciclo Menstrual" value={form.cicloMenstrual} onChange={(v: string) => update('cicloMenstrual', v)} placeholder="Regular / 28 Días" />}
          <TextArea label="Signos y Síntomas Adicionales" value={form.signosSintomas} onChange={(v: string) => update('signosSintomas', v)} placeholder="Cansancio crónico, dolor de cabeza..." />
        </FormSection>

        <div className="pt-6 flex justify-end items-center gap-6">
          <p className="text-[14px] font-normal text-text-secondary m-0">Revisa los datos antes de guardar</p>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 bg-brand-primary text-bg-base px-[24px] py-[12px] rounded-[8px] text-[14px] font-medium transition-colors hover:bg-[#e0e0e0] disabled:opacity-50"
          >
            {saving ? <div className="w-[18px] h-[18px] border-2 border-bg-base/20 border-t-bg-base rounded-full animate-spin" /> : <Save className="h-[18px] w-[18px]" />}
            {saving ? 'Guardando...' : 'Actualizar Información'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditPatient;
