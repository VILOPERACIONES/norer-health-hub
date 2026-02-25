import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, UserPlus } from 'lucide-react';
import api from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

const NewPatient = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    nombre: '', apellido: '', telefono: '', email: '',
    fechaNacimiento: '', sexo: 'F' as 'M' | 'F',
  });

  const update = (field: string, value: string) => setForm({ ...form, [field]: value });

  const handleSave = async () => {
    if (!form.nombre || !form.apellido || !form.telefono) {
      toast({ title: 'Error de Validación', description: 'Nombre, apellido y teléfono son requeridos para la apertura.', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      const response = await api.post('/api/pacientes', form);
      const serverData = response.data?.data || response.data;
      const patientId = serverData?.id;
      
      toast({ title: 'Expediente digitalizado correctamente' });
      if (patientId) {
        navigate(`/pacientes/${patientId}`);
      } else {
        navigate('/pacientes');
      }
    } catch (err: any) {
      toast({ title: 'Fallo de Sistema', description: 'No se pudo crear el expediente en el servidor', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in max-w-4xl pb-20 mx-auto">
      <div className="flex flex-col gap-6">
        <button onClick={() => navigate('/pacientes')} className="flex items-center gap-3 text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground transition-all w-fit group leading-none">
          <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-all" /> Volver al listado
        </button>
        <div className="animate-slide-up space-y-2">
          <h1 className="text-3xl font-black text-foreground tracking-tighter uppercase leading-none">Nuevo Ingreso</h1>
          <p className="text-muted-foreground font-black text-[10px] uppercase tracking-[0.3em] opacity-40 leading-none">Apertura de expediente clínico maestro y datos operativos</p>
        </div>
      </div>

      <div className="bg-secondary/10 p-6 rounded-none animate-slide-up border border-border/20">
        <div className="flex items-center gap-3 mb-8">
           <div className="w-8 h-8 rounded-none bg-foreground text-background flex items-center justify-center">
              <UserPlus className="h-4 w-4" />
           </div>
           <h3 className="text-[10px] font-black text-foreground uppercase tracking-[0.3em] leading-none">Ficha de Identificación Maestro</h3>
        </div>
        
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1 opacity-40 leading-none">Nombre(s) *</label>
            <input value={form.nombre} onChange={(e) => update('nombre', e.target.value)} className="w-full bg-background rounded-none px-4 py-3 text-sm font-black uppercase tracking-tight outline-none focus:border-foreground/20 transition-all border border-border/40" placeholder="JUAN MANUEL" />
          </div>
          <div className="space-y-2">
            <label className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1 opacity-40 leading-none">Apellidos *</label>
            <input value={form.apellido} onChange={(e) => update('apellido', e.target.value)} className="w-full bg-background rounded-none px-4 py-3 text-sm font-black uppercase tracking-tight outline-none focus:border-foreground/20 transition-all border border-border/40" placeholder="GONZÁLEZ" />
          </div>
          <div className="space-y-2">
            <label className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1 opacity-40 leading-none">Teléfono Móvil *</label>
            <input value={form.telefono} onChange={(e) => update('telefono', e.target.value)} className="w-full bg-background rounded-none px-4 py-3 text-sm font-black uppercase tracking-tight outline-none focus:border-foreground/20 transition-all font-mono border border-border/40" placeholder="+52 999 000 0000" />
          </div>
          <div className="space-y-2">
            <label className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1 opacity-40 leading-none">Correo Electrónico</label>
            <input type="email" value={form.email} onChange={(e) => update('email', e.target.value)} className="w-full bg-background rounded-none px-4 py-3 text-sm font-black uppercase tracking-tight outline-none focus:border-foreground/20 transition-all border border-border/40" placeholder="PACIENTE@NORDER.HEALTH" />
          </div>
          <div className="space-y-2">
            <label className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1 opacity-40 leading-none">Fecha de Nacimiento</label>
            <input type="date" value={form.fechaNacimiento} onChange={(e) => update('fechaNacimiento', e.target.value)} className="w-full bg-background rounded-none px-4 py-3 text-[11px] font-black outline-none focus:border-foreground/20 transition-all font-mono border border-border/40" />
          </div>
          <div className="space-y-2">
            <label className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1 opacity-40 leading-none">Sexo Biológico</label>
            <select value={form.sexo} onChange={(e) => update('sexo', e.target.value as 'M' | 'F')} className="w-full bg-background rounded-none px-4 py-3 text-[11px] font-black uppercase tracking-widest outline-none focus:border-foreground/20 transition-all border border-border/40">
              <option value="F">FEMENINO</option>
              <option value="M">MASCULINO</option>
            </select>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-foreground/5 flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-3 bg-foreground text-background px-6 py-3 rounded-none text-[11px] font-black uppercase tracking-[0.2em] transition-all disabled:opacity-50"
          >
            {saving ? (
               <div className="w-4 h-4 border-2 border-background/20 border-t-background rounded-none animate-spin" />
            ) : (
               <Save className="h-4 w-4" />
            )}
            {saving ? 'Digitalizando...' : 'Finalizar Registro Maestro'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default NewPatient;
