import { useAuthStore } from '@/store/auth';
import AdminUsers from './AdminUsers';
import { Settings as SettingsIcon } from 'lucide-react';
import { Navigate } from 'react-router-dom';

const Settings = () => {
  const { user } = useAuthStore();
  
  if (!user) return <Navigate to="/login" replace />;

  const isAdmin = user.rol === 'admin' || (user as any).role === 'admin';

  if (!isAdmin) {
    return (
      <div className="p-10 flex flex-col items-center justify-center text-center animate-fade-in text-text-muted">
        <SettingsIcon className="w-10 h-10 mb-4 opacity-50" />
        <h2 className="text-[18px] font-semibold text-text-primary">Acceso Restringido</h2>
        <p className="text-[14px]">Solo el administrador puede acceder a la configuración de usuarios.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in max-w-none w-full pb-20 mt-2">
      {/* HEADER */}
      <div className="border-b border-border-subtle pb-6 space-y-1">
        <div className="flex items-center gap-3">
          <SettingsIcon className="w-5 h-5 text-text-muted" />
          <h1 className="text-[26px] font-bold text-text-primary m-0 tracking-tight">Configuración del Equipo</h1>
        </div>
        <p className="text-[14px] text-text-secondary m-0">Gestiona los miembros, roles y permisos de la clínica.</p>
      </div>

      <div className="animate-fade-in">
        <AdminUsers />
      </div>
    </div>
  );
};

export default Settings;
