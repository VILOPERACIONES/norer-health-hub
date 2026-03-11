import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/auth';
import api from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { User, Mail, Phone, Lock, Save, Loader2, UserCircle } from 'lucide-react';

const ProfileSettings = () => {
  const { user, updateUser } = useAuthStore();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  
  const [form, setForm] = useState({
    nombre: '',
    telefono: '',
    passwordActual: '',
    passwordNuevo: ''
  });

  useEffect(() => {
    const fetchMe = async () => {
      try {
        const { data } = await api.get('/api/admin/me');
        const userInfo = data?.data || data;
        setForm(f => ({
          ...f,
          nombre: userInfo.nombre || '',
          telefono: userInfo.telefono || ''
        }));
      } catch (err) {
        toast({ title: 'Error de carga', description: 'No se pudo sincronizar tu perfil.', variant: 'destructive' });
      } finally {
        setFetching(false);
      }
    };
    fetchMe();
  }, [toast]);

  const update = (field: string, value: string) => setForm({ ...form, [field]: value });

  const handleSave = async () => {
    if (!form.nombre) {
      toast({ title: 'Campo requerido', description: 'El nombre es obligatorio.', variant: 'destructive' });
      return;
    }

    if (form.passwordNuevo && !form.passwordActual && user?.id !== 'super-admin') {
      toast({ title: 'Aviso', description: 'Necesitas confirmar tu contraseña actual.', variant: 'destructive' });
      return;
    }

    setLoading(true);
    try {
      const payload: any = {
        nombre: form.nombre,
        telefono: form.telefono,
      };

      if (form.passwordNuevo) {
        payload.passwordActual = form.passwordActual;
        payload.passwordNuevo = form.passwordNuevo;
      }

      await api.put('/api/admin/me', payload);
      
      toast({ title: 'Perfil actualizado', description: 'Tus datos se guardaron correctamente.' });

      updateUser({ nombre: form.nombre, telefono: form.telefono });
      setForm(f => ({ ...f, passwordActual: '', passwordNuevo: '' }));
      
    } catch (err: any) {
      toast({
        title: 'Error al actualizar',
        description: err.response?.data?.error || err.response?.data?.message || 'Contraseña actual incorrecta.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  if (fetching) return (
    <div className="h-[40vh] flex flex-col items-center justify-center gap-4">
      <div className="w-6 h-6 rounded-full border-2 border-border-subtle border-t-text-primary animate-spin" />
      <p className="text-[13px] font-medium text-text-muted">Cargando perfil...</p>
    </div>
  );

  if (user?.id === 'super-admin') {
    return (
      <div className="bg-bg-surface border border-border-subtle rounded-[12px] p-8 flex flex-col items-center justify-center text-center animate-fade-in w-full min-h-[40vh]">
        <div className="w-16 h-16 bg-brand-primary/10 rounded-full flex items-center justify-center mb-4">
          <UserCircle className="w-8 h-8 text-brand-primary" />
        </div>
        <h2 className="text-[20px] font-bold text-text-primary mb-2">Perfil de Servidor (.env)</h2>
        <p className="text-[14px] text-text-muted max-w-md">
          Al tener los privilegios máximos de la aplicación, tus datos de acceso y configuraciones personales están incrustados directamente y bajo control estricto a nivel de código para tu propia seguridad, y por lo tanto, no requieres administrarlos desde aquí.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-bg-surface border border-border-subtle rounded-[12px] p-6 space-y-6 animate-fade-in w-full">
      {/* DATOS PERSONALES */}
      <div className="space-y-4">
        <div className="flex items-center gap-3 border-b border-border-default pb-3">
          <div className="p-2 rounded-[8px] bg-bg-elevated">
            <UserCircle className="w-4 h-4 text-text-muted" />
          </div>
          <div>
            <h3 className="text-[15px] font-semibold text-text-primary m-0">Datos Personales</h3>
            <p className="text-[12px] text-text-muted m-0">Ajusta tu nombre profesional y contacto</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <label className="text-[12px] font-bold text-text-secondary uppercase px-1 leading-none">
              Nombre Completo
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
              <input 
                className="w-full bg-bg-elevated rounded-[8px] pl-10 pr-4 py-2.5 text-[14px] text-text-primary border border-border-subtle focus:border-text-primary outline-none transition-all placeholder:text-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
                value={form.nombre}
                onChange={e => update('nombre', e.target.value)}
                placeholder="Dr. Ej. Eyder"
                disabled={user?.id === 'super-admin'}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[12px] font-bold text-text-secondary uppercase px-1 leading-none">
              Teléfono Celular
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
              <input 
                className="w-full bg-bg-elevated rounded-[8px] pl-10 pr-4 py-2.5 text-[14px] text-text-primary border border-border-subtle focus:border-text-primary outline-none transition-all placeholder:text-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
                value={form.telefono}
                onChange={e => update('telefono', e.target.value)}
                placeholder="Ej. 123 456 7890"
                disabled={user?.id === 'super-admin'}
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <label className="text-[12px] font-bold text-text-secondary uppercase px-1 leading-none">
              Email (No editable)
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
              <input 
                className="w-full bg-bg-elevated/50 rounded-[8px] pl-10 pr-4 py-2.5 text-[14px] text-text-muted border border-border-subtle cursor-not-allowed"
                value={user?.email || ''}
                readOnly
              />
            </div>
          </div>
        </div>
      </div>

      {/* SEGURIDAD */}
      <div className="space-y-4 pt-2">
        <div className="flex items-center gap-3 border-b border-border-default pb-3">
          <div className="p-2 rounded-[8px] bg-bg-elevated">
            <Lock className="w-4 h-4 text-text-muted" />
          </div>
          <div>
            <h3 className="text-[15px] font-semibold text-text-primary m-0">Seguridad de Acceso</h3>
            <p className="text-[12px] text-text-muted m-0">Cambia tu contraseña periódicamente</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-[12px] font-bold text-text-secondary uppercase px-1 leading-none">
              Contraseña Actual
            </label>
            <input 
              type="password"
              className="w-full bg-bg-elevated rounded-[8px] px-4 py-2.5 text-[14px] text-text-primary border border-border-subtle focus:border-text-primary outline-none transition-all placeholder:text-white/10"
              value={form.passwordActual}
              onChange={e => update('passwordActual', e.target.value)}
              placeholder="••••••••"
              disabled={user?.id === 'super-admin'}
            />
          </div>

          <div className="space-y-2">
            <label className="text-[12px] font-bold text-text-secondary uppercase px-1 leading-none">
              Nueva Contraseña
            </label>
            <input 
              type="password"
              className="w-full bg-bg-elevated rounded-[8px] px-4 py-2.5 text-[14px] text-text-primary border border-border-subtle focus:border-text-primary outline-none transition-all placeholder:text-white/10"
              value={form.passwordNuevo}
              onChange={e => update('passwordNuevo', e.target.value)}
              placeholder="Min. 8 caracteres"
              disabled={user?.id === 'super-admin'}
            />
          </div>
        </div>
      </div>

      <div className="pt-6 flex justify-end">
        <button
          onClick={handleSave}
          disabled={loading}
          className="bg-white text-black px-10 py-2.5 rounded-[10px] text-[14px] font-bold hover:bg-white/90 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              <Save className="w-4 h-4" />
              Guardar Cambios
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default ProfileSettings;
