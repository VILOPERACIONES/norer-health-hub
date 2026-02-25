import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, User as UserIcon } from 'lucide-react';
import api from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import type { Paciente } from '@/types';

const EditPatient = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    nombre: '',
    apellido: '',
    telefono: '',
    email: '',
    fechaNacimiento: '',
    sexo: 'F' as 'M' | 'F',
  });

  useEffect(() => {
    const fetchPatient = async () => {
      try {
        const { data } = await api.get(`/api/pacientes/${id}`);
        const p = data?.data || data;
        if (p) {
          setForm({
            nombre: p.nombre || '',
            apellido: p.apellido || '',
            telefono: p.telefono || '',
            email: p.email || '',
            fechaNacimiento: p.fechaNacimiento ? p.fechaNacimiento.split('T')[0] : '',
            sexo: p.sexo || 'F',
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

  const update = (field: string, value: string) => setForm({ ...form, [field]: value });

  const handleSave = async () => {
    if (!form.nombre || !form.apellido || !form.telefono) {
      toast({ title: 'Error de Validación', description: 'Nombre, apellido y teléfono son requeridos.', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      await api.put(`/api/pacientes/${id}`, form);
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
      <div className="p-8 text-center text-[11px] font-black uppercase tracking-[0.4em] animate-pulse h-[60vh] flex items-center justify-center">
        Sincronizando Expediente...
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in max-w-4xl pb-20 mx-auto">
      <div className="flex flex-col gap-6">
        <button onClick={() => navigate(`/pacientes/${id}`)} className="flex items-center gap-3 text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground transition-all w-fit group leading-none">
          <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-all" /> Volver al perfil
        </button>
        <div className="animate-slide-up space-y-2">
          <h1 className="text-3xl font-black text-foreground tracking-tighter uppercase leading-none">Editar Expediente</h1>
          <p className="text-muted-foreground font-black text-[10px] uppercase tracking-[0.3em] opacity-40 leading-none">Actualización de datos maestros e identificación</p>
        </div>
      </div>

      <div className="bg-secondary/10 p-6 rounded-none animate-slide-up border border-border/20">
        <div className="flex items-center gap-3 mb-8">
           <div className="w-8 h-8 rounded-none bg-foreground text-background flex items-center justify-center">
              <UserIcon className="h-4 w-4" />
           </div>
           <h3 className="text-[10px] font-black text-foreground uppercase tracking-[0.3em] leading-none">Identificación Maestro</h3>
        </div>
        
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1 opacity-40 leading-none">Nombre(s) *</label>
            <input value={form.nombre} onChange={(e) => update('nombre', e.target.value)} className="w-full bg-background rounded-none px-4 py-3 text-sm font-black uppercase tracking-tight outline-none focus:border-foreground/20 transition-all border border-border/40" />
          </div>
          <div className="space-y-2">
            <label className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1 opacity-40 leading-none">Apellidos *</label>
            <input value={form.apellido} onChange={(e) => update('apellido', e.target.value)} className="w-full bg-background rounded-none px-4 py-3 text-sm font-black uppercase tracking-tight outline-none focus:border-foreground/20 transition-all border border-border/40" />
          </div>
          <div className="space-y-2">
            <label className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1 opacity-40 leading-none">Teléfono Móvil *</label>
            <input value={form.telefono} onChange={(e) => update('telefono', e.target.value)} className="w-full bg-background rounded-none px-4 py-3 text-sm font-black uppercase tracking-tight outline-none focus:border-foreground/20 transition-all font-mono border border-border/40" />
          </div>
          <div className="space-y-2">
            <label className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1 opacity-40 leading-none">Correo Electrónico</label>
            <input type="email" value={form.email} onChange={(e) => update('email', e.target.value)} className="w-full bg-background rounded-none px-4 py-3 text-sm font-black uppercase tracking-tight outline-none focus:border-foreground/20 transition-all border border-border/40" />
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
            {saving ? 'Guardando...' : 'Actualizar Expediente'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditPatient;
