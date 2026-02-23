import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
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
      toast({ title: 'Error', description: 'Nombre, apellido y teléfono son obligatorios', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      const { data } = await api.post('/api/pacientes', form);
      toast({ title: 'Paciente creado' });
      navigate(`/pacientes/${data._id || 'nuevo'}`);
    } catch (err: any) {
      toast({ title: 'Error', description: err.response?.data?.message || 'Error al crear paciente', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl">
      <button onClick={() => navigate('/pacientes')} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Volver a pacientes
      </button>
      <h1 className="text-2xl font-bold text-foreground">Nuevo paciente</h1>

      <div className="norer-card">
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-muted-foreground mb-1">Nombre *</label>
            <input value={form.nombre} onChange={(e) => update('nombre', e.target.value)} className="norer-input w-full" />
          </div>
          <div>
            <label className="block text-xs text-muted-foreground mb-1">Apellido *</label>
            <input value={form.apellido} onChange={(e) => update('apellido', e.target.value)} className="norer-input w-full" />
          </div>
          <div>
            <label className="block text-xs text-muted-foreground mb-1">Teléfono *</label>
            <input value={form.telefono} onChange={(e) => update('telefono', e.target.value)} className="norer-input w-full" />
          </div>
          <div>
            <label className="block text-xs text-muted-foreground mb-1">Email</label>
            <input type="email" value={form.email} onChange={(e) => update('email', e.target.value)} className="norer-input w-full" />
          </div>
          <div>
            <label className="block text-xs text-muted-foreground mb-1">Fecha de nacimiento</label>
            <input type="date" value={form.fechaNacimiento} onChange={(e) => update('fechaNacimiento', e.target.value)} className="norer-input w-full" />
          </div>
          <div>
            <label className="block text-xs text-muted-foreground mb-1">Sexo</label>
            <select value={form.sexo} onChange={(e) => update('sexo', e.target.value)} className="norer-input w-full">
              <option value="F">Femenino</option>
              <option value="M">Masculino</option>
            </select>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-accent transition-colors disabled:opacity-50"
        >
          <Save className="h-4 w-4" /> {saving ? 'Guardando...' : 'Crear paciente'}
        </button>
      </div>
    </div>
  );
};

export default NewPatient;
