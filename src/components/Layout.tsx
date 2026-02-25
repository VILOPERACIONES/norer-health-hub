import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { BarChart3, Users, Settings, LogOut, Menu, User as UserIcon } from 'lucide-react';
import { useState } from 'react';
import Logo from './Logo';
import { useAuthStore } from '@/store/auth';
import NotificationCenter from './NotificationCenter';

const navItems = [
  { to: '/dashboard', icon: BarChart3, label: 'PANEL' },
  { to: '/pacientes', icon: Users, label: 'PACIENTES' },
  { to: '/configuracion', icon: Settings, label: 'AJUSTES' },
];

const Layout = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const userName = user?.nombre || 'Especialista';

  const sidebarContent = (
    <div className="flex flex-col h-full bg-background border-r border-border/60 shadow-[4px_0_24px_-12px_rgba(0,0,0,0.05)]">
      <div className="p-10 flex justify-start pl-12">
        <Logo size="sm" />
      </div>

      <nav className="flex-1 px-8 space-y-2 mt-8">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-5 px-7 py-5 rounded-[1.25rem] text-[12px] font-black tracking-[0.4em] transition-all duration-500 whitespace-nowrap ${
                isActive
                  ? 'bg-foreground text-background shadow-2xl shadow-black/20 scale-[1.02]'
                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary/30'
              }`
            }
          >
            <item.icon className="h-5 w-5" />
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="p-8 mt-auto space-y-6">
        <div className="px-6 py-6 rounded-none bg-secondary/10 border border-border/40 shadow-inner">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-none bg-foreground text-background flex items-center justify-center font-black text-sm border-2 border-foreground shadow-2xl">
              {userName[0].toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-black text-foreground truncate tracking-[0.1em] leading-none uppercase">{userName}</p>
              <p className="text-[9px] font-black text-muted-foreground/50 uppercase tracking-[0.3em] mt-2 leading-none">Nutriólogo</p>
            </div>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-5 px-7 py-5 rounded-[1.25rem] text-[12px] font-black tracking-[0.4em] text-muted-foreground hover:text-destructive hover:bg-destructive/5 transition-all w-full"
        >
          <LogOut className="h-5 w-5" />
          SALIR
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-background overflow-hidden font-sans selection:bg-foreground selection:text-background">
      <aside className="hidden lg:flex w-80 h-full flex-col flex-shrink-0 z-40 bg-background">
        {sidebarContent}
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-[60] lg:hidden">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md animate-fade-in" onClick={() => setMobileOpen(false)} />
          <aside className="relative w-80 h-full bg-background shadow-2xl animate-slide-up">
            {sidebarContent}
          </aside>
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0 h-full">
        <header className="h-20 bg-background/80 backdrop-blur-2xl border-b border-border/60 flex items-center justify-between px-12 sticky top-0 z-30 shadow-sm">
          <div className="flex items-center gap-6">
            <button 
              onClick={() => setMobileOpen(true)} 
              className="lg:hidden p-4 hover:bg-secondary/50 rounded-2xl transition-all"
            >
              <Menu className="h-6 w-6" />
            </button>
            <div className="hidden lg:block">
               <p className="text-[11px] font-black text-muted-foreground/20 tracking-[0.5em] uppercase leading-none">Sistema de Control / <span className="text-foreground/40">{location.pathname.split('/')[1] || 'Sede Central'}</span></p>
            </div>
          </div>
          
          <div className="flex items-center gap-8">
            <NotificationCenter />
            <div className="h-8 w-px bg-border/40" />
            <div className="flex items-center gap-6">
              <div className="hidden sm:block text-right">
                 <p className="text-[11px] font-black tracking-[0.2em] leading-none text-foreground uppercase">{userName}</p>
                 <p className="text-[10px] font-black text-muted-foreground/30 tracking-[0.2em] mt-2 uppercase leading-none">Sistema Sincronizado</p>
              </div>
              <div className="w-12 h-12 rounded-[1rem] bg-foreground text-background flex items-center justify-center text-[12px] font-black uppercase shadow-2xl border-2 border-foreground hover:scale-[1.05] transition-all cursor-pointer">
                {userName[0].toUpperCase()}
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto overflow-x-hidden px-6 md:px-8 lg:px-10 pt-2 md:pt-2 lg:pt-2 pb-10 custom-scrollbar scroll-smooth bg-white text-black">
          <div className="w-full h-full max-w-none mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
