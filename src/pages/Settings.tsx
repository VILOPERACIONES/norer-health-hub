import { useState } from 'react';
import { Settings as SettingsIcon, Save } from 'lucide-react';
import { useAuthStore } from '@/store/auth';
import { useToast } from '@/hooks/use-toast';

const SettingsPage = () => {
  const { apiUrl, setApiUrl } = useAuthStore();
  const [url, setUrl] = useState(apiUrl);
  const { toast } = useToast();

  const handleSave = () => {
    setApiUrl(url);
    toast({ title: 'Configuración guardada' });
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <SettingsIcon className="h-6 w-6 text-muted-foreground" /> Configuración
        </h1>
      </div>

      <div className="norder-card">
        <h3 className="font-semibold text-foreground mb-4">Datos del profesional</h3>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-muted-foreground">Nombre</p>
            <p className="text-sm text-foreground">Eyder Méndez</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Email</p>
            <p className="text-sm text-foreground">eyder@norder.com</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Teléfono</p>
            <p className="text-sm text-foreground">+52 555-000-0000</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Certificación</p>
            <p className="text-sm text-foreground">Licenciada en Nutrición — Cédula 12345678</p>
          </div>
        </div>
      </div>

      <div className="norder-card">
        <h3 className="font-semibold text-foreground mb-4">Conexión API</h3>
        <div className="flex gap-2">
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="norder-input flex-1"
            placeholder="http://localhost:3000"
          />
          <button
            onClick={handleSave}
            className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-accent transition-colors"
          >
            <Save className="h-4 w-4" /> Guardar
          </button>
        </div>
      </div>

      <div className="norder-card">
        <h3 className="font-semibold text-foreground mb-2">Sistema</h3>
        <p className="text-sm text-muted-foreground">NORDER Health CRM v1.0</p>
        <p className="text-xs text-muted-foreground mt-1">Desarrollado por Antigravity</p>
      </div>
    </div>
  );
};

export default SettingsPage;
