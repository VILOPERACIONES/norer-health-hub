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
    <div className={`flex flex-col h-full bg-bg-surface border-r border-border-subtle transition-all duration-300 ${collapsed ? 'w-24' : 'w-64'} shadow-none relative`}>
      <div className={`pt-8 pb-4 flex ${collapsed ? 'flex-col justify-center items-center gap-6 px-0' : 'justify-start px-6 pl-8'} transition-all`}>
        <Logo size="sm" collapsed={collapsed} />
      </div>

      <nav className={`flex-1 px-4 space-y-1 mt-6 ${collapsed ? 'flex flex-col items-center' : ''}`}>
        {!collapsed && <p className="text-[11px] font-medium text-text-muted uppercase mb-4 px-4 pt-4">Navegación</p>}
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={() => setMobileOpen(false)}
            title={collapsed ? item.label : ''}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-[10px] rounded-[8px] text-[14px] font-medium transition-colors whitespace-nowrap ${
                isActive
                  ? 'bg-nav-active-bg text-nav-active-text border-l-2 border-[#444]'
                  : 'text-nav-inactive-text hover:text-text-primary hover:bg-nav-active-bg'
              } ${collapsed ? 'justify-center w-12 border-l-0 px-0' : ''}`
            }
          >
            <item.icon className="h-[18px] w-[18px] shrink-0" />
            {!collapsed && item.label}
          </NavLink>
        ))}

        <div className={`pt-6 mt-6 ${collapsed ? 'px-0' : ''}`}>
          {!collapsed && <p className="text-[11px] font-medium text-text-muted uppercase mb-4 px-4">Accesos Directos</p>}
          <div className="space-y-1">
            {[
              { label: collapsed ? '' : 'Calendario', icon: Calendar, color: 'text-text-secondary', title: 'Google Calendar' },
              { label: collapsed ? '' : 'Chatwoot', icon: MessageSquare, color: 'text-text-secondary', title: 'Chatwoot Hub' },
              { label: collapsed ? '' : 'Cal.com', icon: Clock, color: 'text-text-secondary', title: 'Cal.com Sync' }
            ].map((ext) => (
              <button
                key={ext.title}
                title={ext.title}
                className={`flex items-center gap-3 px-4 py-[10px] rounded-[8px] text-[14px] font-medium text-nav-inactive-text hover:text-text-primary hover:bg-nav-active-bg transition-colors w-full text-left ${collapsed ? 'justify-center w-12 px-0 mx-auto' : ''}`}
              >
                <ext.icon className={`h-[18px] w-[18px] shrink-0 ${ext.color}`} />
                {!collapsed && ext.label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      <div className={`px-4 pb-6 mt-auto space-y-2 ${collapsed ? 'flex flex-col items-center' : ''}`}>
        <div className={`rounded-[8px] bg-bg-elevated border border-border-subtle transition-all ${collapsed ? 'p-2' : 'px-4 py-3'}`}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 shrink-0 rounded-full bg-[#1a1a1a] text-brand-primary flex items-center justify-center font-bold text-[12px] border border-border-default">
              {userName[0].toUpperCase()}
            </div>
            {!collapsed && (
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-semibold text-text-primary truncate">{userName}</p>
                <p className="text-[11px] font-medium text-text-muted mt-0.5 leading-none">Nutriólogo</p>
              </div>
            )}
          </div>
        </div>
        <button
          onClick={handleLogout}
          title={collapsed ? 'SALIR' : ''}
          className={`flex items-center gap-3 px-4 py-[10px] rounded-[8px] text-[14px] font-medium text-nav-inactive-text hover:text-accent-red hover:bg-[#1a1a1a] transition-colors w-full ${collapsed ? 'justify-center w-12 px-0 mx-auto' : ''}`}
        >
          <LogOut className="h-[18px] w-[18px] shrink-0" />
          {!collapsed && 'Cerrar Sesión'}
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-bg-base overflow-hidden font-sans selection:bg-brand-primary selection:text-bg-base">
      {/* SIDEBAR PC */}
      <aside className={`relative hidden lg:flex h-full flex-col flex-shrink-0 z-40 bg-bg-surface transition-all duration-300 ${collapsed ? 'w-24' : 'w-64'}`}>
        {sidebarContent}
        
        <button 
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3.5 top-8 flex items-center justify-center h-7 w-7 bg-bg-elevated border border-border-subtle rounded-full text-text-secondary hover:text-text-primary hover:border-[#444] z-50 shadow-md transition-colors"
        >
          {collapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}
        </button>
      </aside>

      {/* MOBILE SIDEBAR */}
      {mobileOpen && (
        <div className="fixed inset-0 z-[60] lg:hidden">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md animate-fade-in" onClick={() => setMobileOpen(false)} />
          <aside className="relative w-64 h-full bg-bg-surface shadow-2xl animate-slide-up">
            {sidebarContent}
          </aside>
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0 h-full">
        {/* MOBILE HEADER */}
        <header className="h-[60px] lg:hidden bg-bg-base border-b border-border-subtle flex items-center justify-between px-6 sticky top-0 z-30 shadow-none">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setMobileOpen(true)} 
              className="p-2 hover:bg-bg-elevated rounded-[8px] transition-colors text-text-secondary"
            >
              <Menu className="h-5 w-5" />
            </button>
            <p className="text-[14px] font-semibold text-text-primary">Norder Hub</p>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto overflow-x-hidden px-6 md:px-8 pt-6 pb-12 custom-scrollbar scroll-smooth bg-bg-base text-text-primary">
          <div className="w-full h-full max-w-none mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
