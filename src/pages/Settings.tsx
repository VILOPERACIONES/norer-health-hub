import { useAuthStore } from '@/store/auth';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AdminUsers from './AdminUsers';
import ProfileSettings from './ProfileSettings';
import { Settings as SettingsIcon, User, ShieldCheck } from 'lucide-react';
import { Navigate } from 'react-router-dom';

const Settings = () => {
  const { user } = useAuthStore();
  
  if (!user) return <Navigate to="/login" replace />;

  const isAdmin = user.rol === 'admin' || (user as any).role === 'admin';

  return (
    <div className="space-y-8 animate-fade-in max-w-none w-full pb-20 mt-2">
      {/* HEADER */}
      <div className="border-b border-border-subtle pb-6 space-y-1">
        <div className="flex items-center gap-3">
          <SettingsIcon className="w-5 h-5 text-text-muted" />
          <h1 className="text-[26px] font-bold text-text-primary m-0 tracking-tight">Configuración</h1>
        </div>
        <p className="text-[14px] text-text-secondary m-0">Gestiona tu perfil personal y los accesos del equipo</p>
      </div>

      <Tabs defaultValue="perfil" className="w-full">
        <div className="mb-8">
          <TabsList className="bg-bg-elevated border border-border-subtle p-1 h-auto inline-flex">
            <TabsTrigger 
              value="perfil" 
              className="flex items-center gap-2 px-6 py-2 text-[13px] font-medium data-[state=active]:bg-bg-surface data-[state=active]:text-text-primary rounded-[8px]"
            >
              <User className="h-4 w-4" />
              Mi Perfil
            </TabsTrigger>
            
            {isAdmin && (
              <TabsTrigger 
                value="usuarios" 
                className="flex items-center gap-2 px-6 py-2 text-[13px] font-medium data-[state=active]:bg-bg-surface data-[state=active]:text-text-primary rounded-[8px]"
              >
                <ShieldCheck className="h-4 w-4" />
                Gestión de Usuarios
              </TabsTrigger>
            )}
          </TabsList>
        </div>

        <TabsContent value="perfil" className="animate-fade-in focus-visible:outline-none">
          <ProfileSettings />
        </TabsContent>

        {isAdmin && (
          <TabsContent value="usuarios" className="animate-fade-in focus-visible:outline-none">
            <AdminUsers />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
};

export default Settings;
