import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { ShieldCheck, Plus, Edit2, Trash2, X, Check, Save, Loader2, User, Mail, Shield, AlertTriangle } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

const MODULOS = [
  { key: 'pacientes', label: 'Pacientes', desc: 'Expedientes y datos clínicos' },
  { key: 'planes', label: 'Planes', desc: 'Menús y envío de PDFs' },
  { key: 'smae', label: 'SMAE', desc: 'Consulta de alimentos' },
  { key: 'dashboard', label: 'Dashboard', desc: 'Métricas generales' },
];

export default function AdminUsers() {
  const { toast } = useToast();
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editando, setEditando] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState<any>({
    nombre: '', email: '', telefono: '', password: '', rol: 'practicante',
    permisos: {
      pacientes: { read: true, write: false, delete: false },
      planes: { read: true, write: true, delete: false },
      smae: { read: true, write: false, delete: false },
      dashboard: { read: true, write: false, delete: false },
    }
  });

  const fetchUsuarios = async () => {
    try {
      const { data } = await api.get('/api/admin/usuarios');
      setUsuarios(data?.data || data);
    } catch {
      toast({ title: 'Error de carga', description: 'No se pudieron recuperar los usuarios', variant: 'destructive' });
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchUsuarios(); }, []);

  const abrirNuevo = () => {
    setEditando(null);  
    setForm({
      nombre: '', email: '', telefono: '', password: '', rol: 'practicante',
      permisos: {
        pacientes: { read: true, write: false, delete: false },
        planes: { read: true, write: true, delete: false },
        smae: { read: true, write: false, delete: false },
        dashboard: { read: true, write: false, delete: false },
      }
    });
    setModalOpen(true);
  };

  const abrirEditar = (usr: any) => {
    setEditando(usr.id);
    setForm({
      nombre: usr.nombre, 
      email: usr.email, 
      telefono: usr.telefono || '', 
      password: '', 
      rol: usr.rol || 'practicante',
      permisos: usr.permisos || {
        pacientes: { read: true, write: false, delete: false },
        planes: { read: true, write: true, delete: false },
        smae: { read: true, write: false, delete: false },
        dashboard: { read: true, write: false, delete: false },
      }
    });
    setModalOpen(true);
  };

  const handlePerm = (modulo: string, accion: string, val: boolean) => {
    setForm((f: any) => ({
      ...f,
      permisos: {
        ...f.permisos,
        [modulo]: { ...(f.permisos[modulo] || {}), [accion]: val }
      }
    }));
  };

  const guardar = async () => {
    if (!form.nombre || !form.email) return toast({ title: 'Aviso', description: 'Nombre e email requeridos.' });
    if (!editando && !form.password) return toast({ title: 'Aviso', description: 'Contraseña requerida.' });

    setSaving(true);
    try {
      const payload = { ...form };
      if (!payload.password) delete payload.password;

      if (editando) {
        await api.put(`/api/admin/usuarios/${editando}`, payload);
        toast({ title: 'Usuario actualizado', description: 'Los cambios se aplicaron correctamente.' });
      } else {
        await api.post('/api/admin/usuarios', payload);
        toast({ title: 'Nuevo usuario creado', description: `Se ha generado el acceso para ${form.nombre}.` });
      }
      setModalOpen(false);
      fetchUsuarios();
    } catch (e: any) {
      toast({ title: 'Error', description: e.response?.data?.message || 'Error al procesar la solicitud', variant: 'destructive' });
    } finally { setSaving(false); }
  };

  const inactivar = async (id: string) => {
    if (!confirm('¿Seguro que deseas desactivar este usuario?')) return;
    try {
      await api.put(`/api/admin/usuarios/${id}`, { activo: false });
      toast({ title: 'Acceso desactivado' });
      fetchUsuarios();
    } catch { toast({ title: 'Error al cambiar estado' }); }
  };

  if (loading) return (
    <div className="h-[40vh] flex flex-col items-center justify-center gap-4">
      <div className="w-6 h-6 rounded-full border-2 border-black/20 border-t-black dark:border-white/20 dark:border-t-white animate-spin" />
      <p className="text-[13px] font-medium text-text-muted">Leyendo base de usuarios...</p>
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* HEADER GESTIÓN */}
      <div className="bg-bg-surface border border-border-subtle rounded-[12px] p-6 flex items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-[17px] font-bold text-text-primary m-0">Especialistas del Equipo</h2>
          <p className="text-[13px] text-text-muted m-0">Gestiona los roles y permisos de acceso para tu personal</p>
        </div>
        <button 
          onClick={abrirNuevo}
          className="bg-white text-black px-5 py-2.5 rounded-[10px] text-[13px] font-bold flex items-center gap-2 hover:bg-white/90 transition-all shadow-lg shadow-white/10 active:scale-95 whitespace-nowrap uppercase italic"
        >
          <Plus className="h-4 w-4" /> AGREGAR USUARIO
        </button>
      </div>

      {/* LISTA DE USUARIOS */}
      <div className="bg-bg-surface border border-border-subtle rounded-[12px] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-bg-elevated/40 border-b border-border-subtle">
                <th className="p-4 text-[11px] font-bold text-text-muted uppercase tracking-widest pl-8">Especialista</th>
                <th className="p-4 text-[11px] font-bold text-text-muted uppercase tracking-widest">Cargo / Rol</th>
                <th className="p-4 text-[11px] font-bold text-text-muted uppercase tracking-widest">Estado de Acceso</th>
                <th className="p-4 text-[11px] font-bold text-text-muted uppercase tracking-widest text-right pr-8">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {/* FILA SUPER ADMIN */}
              <tr className="hover:bg-bg-elevated/20 transition-colors">
                <td className="p-4 pl-8">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-brand-primary/10 text-brand-primary flex items-center justify-center font-bold text-[12px] border border-brand-primary/20">
                      EY
                    </div>
                    <div>
                      <div className="font-bold text-[14px] text-text-primary">Eyder Méndez (Tú)</div>
                      <div className="text-[11px] text-text-muted">Administrador de Sistema</div>
                    </div>
                  </div>
                </td>
                <td className="p-4">
                  <span className="px-2 py-0.5 rounded-full bg-brand-primary/10 text-brand-primary text-[10px] font-bold uppercase tracking-wider border border-brand-primary/20">
                    Súper Admin
                  </span>
                </td>
                <td className="p-4">
                  <div className="flex items-center gap-2 text-green-400 text-[12px] font-bold font-mono">
                    <Shield className="w-3 h-3" /> ACTIVO
                  </div>
                </td>
                <td className="p-4 text-right pr-8">
                  <span className="text-[11px] text-text-muted italic">No editable</span>
                </td>
              </tr>

              {/* OTROS USUARIOS */}
              {usuarios.filter(u => u.rol !== 'admin' || !u.isSuperAdmin).map(u => (
                <tr key={u.id} className="hover:bg-bg-elevated/20 transition-colors">
                  <td className="p-4 pl-8">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-bg-elevated text-text-muted flex items-center justify-center font-bold text-[12px] border border-border-subtle">
                        {u.nombre[0].toUpperCase()}
                      </div>
                      <div>
                        <div className="font-bold text-[14px] text-text-primary">{u.nombre}</div>
                        <div className="text-[11px] text-text-muted">{u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${u.rol === 'admin' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' : 'bg-bg-elevated text-text-muted border-border-subtle'}`}>
                      {u.rol === 'admin' ? 'Admin' : 'Practicante'}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className={`flex items-center gap-1.5 text-[11px] font-bold font-mono ${u.activo ? 'text-green-400' : 'text-red-400 opacity-60'}`}>
                      {u.activo ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                      {u.activo ? 'ACTIVO' : 'SUSPENDIDO'}
                    </div>
                  </td>
                  <td className="p-4 pr-8 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => abrirEditar(u)}
                        className="p-2 rounded-lg bg-bg-elevated hover:bg-[#222] text-text-secondary hover:text-white transition-all border border-border-subtle"
                        title="Configurar"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      {u.activo && (
                        <button 
                          onClick={() => inactivar(u.id)}
                          className="p-2 rounded-lg bg-red-400/5 hover:bg-red-400 text-red-400 hover:text-white transition-all border border-red-400/20"
                          title="Desactivar"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              
              {usuarios.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-12 text-center">
                    <p className="text-text-muted text-[13px] m-0">No se encontraron especialistas adicionales.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL CONFIGURACIÓN */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-2xl bg-bg-base border-border-subtle p-0 overflow-hidden">
          <DialogHeader className="p-6 bg-bg-surface border-b border-border-subtle">
            <DialogTitle className="text-xl font-bold text-text-primary flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-brand-primary" />
              {editando ? 'Modificar Usuario' : 'AGREGAR NUEVO USUARIO'}
            </DialogTitle>
          </DialogHeader>

          <div className="p-8 space-y-8 overflow-y-auto max-h-[80vh] custom-scrollbar">
            {/* CAMPOS BASE */}
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[12px] font-bold text-text-secondary uppercase">Nombre</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                  <input 
                    className="w-full bg-bg-elevated border border-border-subtle rounded-[8px] pl-10 pr-4 py-2.5 text-[14px] text-text-primary focus:border-text-primary outline-none transition-all"
                    value={form.nombre}
                    onChange={e => setForm({...form, nombre: e.target.value})}
                    placeholder="Nombre Completo"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[12px] font-bold text-text-secondary uppercase">Email de Acceso</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                  <input 
                    className="w-full bg-bg-elevated border border-border-subtle rounded-[8px] pl-10 pr-4 py-2.5 text-[14px] text-text-primary focus:border-text-primary outline-none disabled:opacity-50"
                    value={form.email}
                    onChange={e => setForm({...form, email: e.target.value})}
                    placeholder="email@ejemplo.com"
                    disabled={!!editando}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[12px] font-bold text-text-secondary uppercase">Rol Operativo</label>
                <select 
                  className="w-full bg-bg-elevated border border-border-subtle rounded-[8px] px-3 py-2.5 text-[14px] text-text-primary focus:border-text-primary outline-none"
                  value={form.rol}
                  onChange={e => setForm({...form, rol: e.target.value})}
                >
                  <option value="practicante">Practicante (Limitado)</option>
                  <option value="admin">Admin (Acceso Total)</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[12px] font-bold text-text-secondary uppercase font-mono tracking-tighter">Contraseña</label>
                <input 
                  type="password"
                  className="w-full bg-bg-elevated border border-border-subtle rounded-[8px] px-4 py-2.5 text-[14px] text-text-primary focus:border-text-primary outline-none transition-all"
                  value={form.password}
                  onChange={e => setForm({...form, password: e.target.value})}
                  placeholder={editando ? "Dejar vacío si no cambia" : "••••••••"}
                />
              </div>
            </div>

            {/* MATRIZ PERMISOS */}
            <div className="space-y-4">
              <h4 className="text-[13px] font-bold text-text-primary flex items-center gap-2 border-b border-border-subtle pb-2">
                <Shield className="w-4 h-4 text-brand-primary" />
                Matriz de Permisos
              </h4>

              <div className="bg-bg-surface border border-border-subtle rounded-[12px] overflow-hidden">
                <div className="grid grid-cols-4 bg-bg-elevated/50 p-3 text-[10px] font-bold text-text-muted uppercase tracking-widest text-center">
                  <div className="text-left pl-3">Módulo</div>
                  <div>Ver</div>
                  <div>Editar</div>
                  <div>Borrar</div>
                </div>

                <div className="divide-y divide-border-subtle">
                  {MODULOS.map((m) => (
                    <div key={m.key} className="grid grid-cols-4 p-4 text-[13px] items-center text-center">
                      <div className="text-left">
                        <div className="font-bold text-text-primary leading-none mb-1">{m.label}</div>
                        <div className="text-[11px] text-text-muted">{m.desc}</div>
                      </div>
                      <div>
                        <Switch 
                          checked={form.permisos?.[m.key]?.read} 
                          onCheckedChange={v => handlePerm(m.key, 'read', v)} 
                          className="data-[state=checked]:bg-green-500 scale-90" 
                        />
                      </div>
                      <div>
                        <Switch 
                          checked={form.permisos?.[m.key]?.write} 
                          onCheckedChange={v => handlePerm(m.key, 'write', v)} 
                          className="data-[state=checked]:bg-brand-primary scale-90" 
                        />
                      </div>
                      <div>
                        <Switch 
                          checked={form.permisos?.[m.key]?.delete} 
                          onCheckedChange={v => handlePerm(m.key, 'delete', v)} 
                          className="data-[state=checked]:bg-red-500 scale-90" 
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="flex items-start gap-2 bg-yellow-400/5 p-3 rounded-lg border border-yellow-400/10">
                <AlertTriangle className="w-4 h-4 text-yellow-500 shrink-0 mt-0.5" />
                <p className="text-[11px] text-text-secondary m-0 italic">
                  * Los cambios de permisos se aplican al instante para las nuevas operaciones.
                </p>
              </div>
            </div>
          </div>

          <DialogFooter className="p-6 bg-bg-surface border-t border-border-subtle flex gap-3">
            <button 
              onClick={() => setModalOpen(false)}
              className="px-6 py-2.5 text-[14px] font-medium text-text-secondary hover:text-text-primary transition-all"
            >
              Cancelar
            </button>
            <button 
              onClick={guardar}
              disabled={saving}
              className="bg-white text-black px-8 py-2.5 rounded-[10px] text-[14px] font-bold hover:bg-white/90 transition-all flex items-center gap-2 disabled:opacity-50 uppercase shadow-lg shadow-white/5"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {editando ? 'ACTUALIZAR' : 'GUARDAR USUARIO'}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
