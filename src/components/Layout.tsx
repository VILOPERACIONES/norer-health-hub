import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { BarChart3, Users, Settings, LogOut, Menu, User as UserIcon, ClipboardList, ChevronLeft, ChevronRight, Calendar, MessageSquare, Clock, ShieldCheck, Sun, Moon } from 'lucide-react';
import { useState } from 'react';
import Logo from './Logo';
import { useAuthStore } from '@/store/auth';
import { useThemeStore } from '@/store/theme';

const navItems = [
  { to: '/dashboard', icon: BarChart3, label: 'PANEL' },
  { to: '/pacientes', icon: Users, label: 'PACIENTES' },
  { to: '/planes', icon: ClipboardList, label: 'PLANES' },
];

const Layout = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const { user, logout } = useAuthStore();
  const { theme, setTheme } = useThemeStore();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const userName = user?.nombre || 'Especialista';

  const sidebarContent = (
    <div className={`flex flex-col h-full bg-background border-r border-border/60 transition-all duration-300 ${collapsed ? 'w-24' : 'w-80'} shadow-[4px_0_24px_-12px_rgba(0,0,0,0.05)]`}>
      <div className={`p-10 flex ${collapsed ? 'justify-center p-6' : 'justify-start pl-12'} transition-all`}>
        <Logo size="sm" collapsed={collapsed} />
      </div>

      <nav className={`flex-1 px-4 space-y-1 mt-8 ${collapsed ? 'flex flex-col items-center' : 'px-8'}`}>
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={() => setMobileOpen(false)}
            title={collapsed ? item.label : ''}
            className={({ isActive }) =>
              `flex items-center gap-5 px-7 py-4 rounded-none text-[11px] font-black tracking-[0.4em] transition-all duration-500 whitespace-nowrap ${
                isActive
                  ? 'bg-foreground text-background shadow-2xl shadow-black/20 scale-[1.02]'
                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary/30'
              } ${collapsed ? 'px-4 justify-center w-14' : ''}`
            }
          >
            <item.icon className="h-4 w-4 shrink-0" />
            {!collapsed && item.label}
          </NavLink>
        ))}

        <div className={`pt-8 border-t border-border/10 mt-6 ${collapsed ? 'px-0' : ''}`}>
          {!collapsed && <p className="text-[8px] font-black text-muted-foreground/30 uppercase tracking-[0.4em] mb-4 px-12">Accesos Externos</p>}
          <div className="space-y-1">
            {[
              { label: collapsed ? '' : 'Calendario', icon: Calendar, color: 'text-blue-500', title: 'Google Calendar' },
              { label: collapsed ? '' : 'Chatwoot', icon: MessageSquare, color: 'text-indigo-500', title: 'Chatwoot Hub' },
              { label: collapsed ? '' : 'Cal.com', icon: Clock, color: 'text-emerald-500', title: 'Cal.com Sync' }
            ].map((ext) => (
              <button
                key={ext.title}
                title={ext.title}
                className={`flex items-center gap-5 px-12 py-4 rounded-none text-[11px] font-black tracking-[0.4em] text-muted-foreground hover:text-foreground hover:bg-secondary/30 transition-all w-full text-left uppercase ${collapsed ? 'px-4 justify-center w-14' : ''}`}
              >
                <ext.icon className={`h-4 w-4 shrink-0 ${ext.color}`} />
                {!collapsed && ext.label}
              </button>
            ))}
            
            <button
              onClick={toggleTheme}
              title="Cambiar Tema"
              className={`flex items-center gap-5 px-12 py-4 rounded-none text-[11px] font-black tracking-[0.4em] text-muted-foreground hover:text-foreground hover:bg-secondary/30 transition-all w-full text-left uppercase ${collapsed ? 'px-4 justify-center w-14' : ''}`}
            >
              {theme === 'dark' ? <Sun className="h-4 w-4 shrink-0 text-amber-500" /> : <Moon className="h-4 w-4 shrink-0 text-slate-500" />}
              {!collapsed && 'TEMA'}
            </button>
          </div>
        </div>
      </nav>

      <div className={`px-4 pb-6 mt-auto space-y-2 ${collapsed ? 'flex flex-col items-center' : 'px-6'}`}>
        <div className={`rounded-none bg-secondary/5 border border-border/20 shadow-none transition-all ${collapsed ? 'p-2' : 'px-4 py-3'}`}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 shrink-0 rounded-none bg-foreground text-background flex items-center justify-center font-black text-[10px] border border-foreground shadow-lg">
              {userName[0].toUpperCase()}
            </div>
            {!collapsed && (
              <div className="min-w-0 flex-1">
                <p className="text-[9px] font-black text-foreground truncate tracking-[0.1em] leading-none uppercase">{userName}</p>
                <p className="text-[7px] font-black text-muted-foreground/40 uppercase tracking-[0.2em] mt-1 leading-none">Nutriólogo</p>
              </div>
            )}
          </div>
        </div>
        <button
          onClick={handleLogout}
          title={collapsed ? 'SALIR' : ''}
          className={`flex items-center gap-5 px-6 py-3 rounded-none text-[10px] font-black tracking-[0.4em] text-muted-foreground hover:text-destructive hover:bg-destructive/5 transition-all w-full ${collapsed ? 'px-4 justify-center w-14' : ''}`}
        >
          <LogOut className="h-4 w-4 shrink-0" />
          {!collapsed && 'SALIR'}
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-background overflow-hidden font-sans selection:bg-foreground selection:text-background">
      {/* SIDEBAR PC */}
      <aside className={`hidden lg:flex h-full flex-col flex-shrink-0 z-40 bg-background transition-all duration-300 ${collapsed ? 'w-24' : 'w-80'}`}>
        {sidebarContent}
      </aside>

      {/* MOBILE SIDEBAR */}
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
              className="lg:hidden p-4 hover:bg-secondary/50 rounded-none transition-all"
            >
              <Menu className="h-6 w-6" />
            </button>
            <button 
              onClick={() => setCollapsed(!collapsed)}
              className="hidden lg:flex p-2 hover:bg-secondary/50 rounded-none transition-all border border-border/20 text-muted-foreground hover:text-foreground"
            >
              {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </button>
            <div className="hidden md:block">
               <p className="text-[11px] font-black text-muted-foreground/20 tracking-[0.5em] uppercase leading-none">Sistema de Control / <span className="text-foreground/40">{location.pathname.split('/')[1] || 'Sede Central'}</span></p>
            </div>
          </div>
          
          <div className="flex items-center gap-8">

            <div className="flex items-center gap-6">
              <div className="hidden sm:block text-right">
                 <p className="text-[11px] font-black tracking-[0.2em] leading-none text-foreground uppercase">{userName}</p>
                 <p className="text-[10px] font-black text-muted-foreground/30 tracking-[0.2em] mt-2 uppercase leading-none">Sistema Sincronizado</p>
              </div>
              <div className="w-12 h-12 rounded-none bg-foreground text-background flex items-center justify-center text-[12px] font-black uppercase shadow-2xl border-2 border-foreground hover:scale-[1.05] transition-all cursor-pointer">
                {userName[0].toUpperCase()}
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto overflow-x-hidden px-6 md:px-8 lg:px-10 pt-2 md:pt-2 lg:pt-2 pb-10 custom-scrollbar scroll-smooth bg-background text-foreground">
          <div className="w-full h-full max-w-none mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
