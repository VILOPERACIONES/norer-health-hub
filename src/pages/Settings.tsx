import { useState, useEffect } from 'react';
import { ShieldCheck, User as UserIcon, Moon, Sun, Monitor, Save, CheckCircle2, Cog } from 'lucide-react';
import { useAuthStore } from '@/store/auth';
import { useThemeStore } from '@/store/theme';
import { useToast } from '@/hooks/use-toast';

const SettingsPage = () => {
  const { user, updateUser } = useAuthStore();
  const { theme, setTheme } = useThemeStore();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    nombre: user?.nombre || '',
    email: user?.email || '',
    telefono: user?.telefono || '',
    certificacion: user?.certificacion || '',
    profesion: user?.profesion || '',
    universidad: user?.universidad || '',
    cedula: user?.cedula || '',
    firma: user?.firma || '',
    logotipo: user?.logotipo || '',
  });

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');

    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      root.classList.add(systemTheme);
    } else {
      root.classList.add(theme);
    }
  }, [theme]);

  const handleSave = async () => {
    setSaving(true);
    try {
      updateUser(formData);
      toast({
        title: "Perfiles Actualizado",
        description: "Los cambios han sido aplicados con éxito maestro.",
      });
    } catch (err) {
      toast({
        title: "Error",
        description: "No se pudieron guardar los cambios en la infraestructura.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const Section = ({ title, children, icon: Icon }: { title: string; children: React.ReactNode; icon?: any }) => (
    <div className="bg-white border border-black p-6 rounded-none animate-slide-up">
      <div className="flex items-center gap-3 mb-6 border-b border-black pb-4">
        {Icon && <Icon className="h-5 w-5 text-black" />}
        <h3 className="text-xs font-bold text-black uppercase tracking-[-0.02em] leading-none">{title}</h3>
      </div>
      {children}
    </div>
  );

  return (
    <div className="space-y-10 animate-fade-in max-w-7xl mx-auto pb-20 font-sans text-black">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-b border-black pb-6">
        <div className="animate-slide-up space-y-2">
          <h1 className="text-3xl font-bold tracking-[-0.02em] uppercase leading-none whitespace-nowrap">
            Ajustes <span className="text-muted-foreground/30 ml-2">MASTER</span>
          </h1>
          <p className="text-xs font-bold uppercase tracking-[-0.02em] opacity-40 leading-none">
            Perfiles de infraestructura y preferencias del sistema
          </p>
        </div>
        
        <div className="animate-slide-up">
           <button 
             onClick={handleSave}
             disabled={saving}
             className="flex items-center gap-2 border border-black bg-black text-white px-6 py-3 text-sm font-bold uppercase tracking-[-0.02em] hover:bg-white hover:text-black transition-colors"
           >
             {saving ? (
               <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
             ) : (
               <Save className="h-4 w-4" />
             )}
             SINCRONIZAR 
           </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-12 gap-8">
         <div className="lg:col-span-8 space-y-8">
            <Section title="ID DEL ESPECIALISTA" icon={UserIcon}>
              <div className="grid sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-[-0.02em]">Nombre Identitario</label>
                  <input 
                    type="text"
                    value={formData.nombre}
                    onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                    className="w-full bg-white border border-black rounded-none px-4 py-3 text-sm font-bold tracking-[-0.02em] outline-none transition-colors"
                    placeholder="Especialista"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-[-0.02em]">Canal de Comunicación</label>
                  <input 
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="w-full bg-white border border-black rounded-none px-4 py-3 text-sm font-bold tracking-[-0.02em] outline-none transition-colors"
                    placeholder="admin@norder.com"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-[-0.02em]">Enlace Telefónico</label>
                  <input 
                    type="text"
                    value={formData.telefono}
                    onChange={(e) => setFormData({...formData, telefono: e.target.value})}
                    className="w-full bg-white border border-black rounded-none px-4 py-3 text-sm font-bold tracking-[-0.02em] outline-none transition-colors"
                    placeholder="+52 ..."
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-[-0.02em]">Línea Clínica Maestra</label>
                  <input 
                    type="text"
                    value={formData.certificacion}
                    onChange={(e) => setFormData({...formData, certificacion: e.target.value})}
                    className="w-full bg-white border border-black rounded-none px-4 py-3 text-sm font-bold tracking-[-0.02em] outline-none transition-colors"
                    placeholder="Especialista en..."
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-[-0.02em]">Profesión</label>
                  <input 
                    type="text"
                    value={formData.profesion}
                    onChange={(e) => setFormData({...formData, profesion: e.target.value})}
                    className="w-full bg-white border border-black rounded-none px-4 py-3 text-sm font-bold tracking-[-0.02em] outline-none transition-colors"
                    placeholder="Lic. en Nutrición..."
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-[-0.02em]">Universidad / Alma Mater</label>
                  <input 
                    type="text"
                    value={formData.universidad}
                    onChange={(e) => setFormData({...formData, universidad: e.target.value})}
                    className="w-full bg-white border border-black rounded-none px-4 py-3 text-sm font-bold tracking-[-0.02em] outline-none transition-colors"
                    placeholder="Universidad..."
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-[-0.02em]">Cédula Profesional</label>
                  <input 
                    type="text"
                    value={formData.cedula}
                    onChange={(e) => setFormData({...formData, cedula: e.target.value})}
                    className="w-full bg-white border border-black rounded-none px-4 py-3 text-sm font-bold tracking-[-0.02em] outline-none transition-colors"
                    placeholder="12345678"
                  />
                </div>
                <div className="space-y-2 col-span-2">
                  <label className="text-xs font-bold uppercase tracking-[-0.02em]">Firma Digital (URL o Texto)</label>
                  <input 
                    type="text"
                    value={formData.firma}
                    onChange={(e) => setFormData({...formData, firma: e.target.value})}
                    className="w-full bg-white border border-black rounded-none px-4 py-3 text-sm font-bold tracking-[-0.02em] outline-none transition-colors"
                    placeholder="https://..."
                  />
                </div>
                <div className="space-y-2 col-span-2">
                  <label className="text-xs font-bold uppercase tracking-[-0.02em]">Logotipo Corporativo (URL)</label>
                  <input 
                    type="text"
                    value={formData.logotipo}
                    onChange={(e) => setFormData({...formData, logotipo: e.target.value})}
                    className="w-full bg-white border border-black rounded-none px-4 py-3 text-sm font-bold tracking-[-0.02em] outline-none transition-colors"
                    placeholder="https://..."
                  />
                </div>
              </div>
            </Section>

            <Section title="INTERFAZ & EXPERIENCIA" icon={Monitor}>
               <div className="grid grid-cols-3 gap-4">
                  {[
                    { id: 'light', label: 'LUZ', icon: Sun },
                    { id: 'dark', label: 'OSCURO', icon: Moon },
                    { id: 'system', label: 'AUTO', icon: Monitor },
                  ].map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setTheme(t.id as any)}
                      className={`flex flex-col items-center justify-center p-6 rounded-none transition-all gap-4 border ${
                        theme === t.id 
                        ? 'bg-black text-white border-black' 
                        : 'bg-white text-black border-black hover:bg-neutral-100'
                      }`}
                    >
                      <t.icon className={`w-6 h-6 ${theme === t.id ? 'opacity-100' : 'opacity-40'}`} />
                      <span className="text-xs font-bold uppercase tracking-[-0.02em] leading-none">{t.label}</span>
                    </button>
                  ))}
               </div>
            </Section>
         </div>

         <div className="lg:col-span-4 space-y-8">
            <div className="bg-black text-white rounded-none p-8 relative overflow-hidden h-fit border border-black">
               <h3 className="text-xs font-bold uppercase tracking-[-0.02em] mb-8 opacity-70 leading-none">LICENCIA OPERATIVA</h3>
               <div className="space-y-8 relative">
                  <div className="flex items-center gap-6">
                     <div className="w-12 h-12 rounded-none bg-white text-black flex items-center justify-center">
                        <ShieldCheck className="w-6 h-6" />
                     </div>
                     <div className="space-y-1">
                        <p className="text-[10px] font-bold opacity-70 uppercase tracking-[-0.02em] leading-none">Nivel de Acceso</p>
                        <p className="text-xl font-bold uppercase tracking-[-0.02em] leading-none whitespace-nowrap">MASTER ELITE</p>
                     </div>
                  </div>
                  <div className="pt-6 border-t border-white/20 space-y-4">
                     <div className="flex justify-between items-end">
                        <p className="text-[10px] font-bold opacity-70 uppercase tracking-[-0.02em] leading-none">Versión del Núcleo</p>
                        <p className="text-xs font-mono font-bold leading-none">1.4.2-OS</p>
                     </div>
                     <div className="h-1 w-full bg-white/20 rounded-none overflow-hidden">
                        <div className="h-full w-full bg-white" />
                     </div>
                  </div>
               </div>
            </div>
            
            <div className="bg-white flex flex-col items-center text-center p-8 rounded-none border border-black border-dashed hover:bg-neutral-50 transition-all group">
               <div className="w-12 h-12 rounded-none bg-neutral-100 flex items-center justify-center mb-6 border border-black group-hover:bg-black group-hover:text-white transition-all">
                  <Cog className="w-6 h-6 opacity-40 group-hover:opacity-100" />
               </div>
               <p className="text-xs font-bold text-black uppercase tracking-[-0.02em] mb-4 leading-none">AYUDA ESTRATÉGICA</p>
               <p className="text-[10px] font-bold uppercase leading-relaxed mb-6 opacity-60 px-4 tracking-[-0.02em]">SOPORTE MAESTRO Y DOCUMENTACIÓN TÉCNICA.</p>
               <button className="text-black text-xs font-bold uppercase tracking-[-0.02em] underline decoration-black/30 hover:decoration-black transition-all">
                  ABRIR TICKET
               </button>
            </div>
         </div>
      </div>
    </div>
  );
};

export default SettingsPage;
