import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { BarChart3, Users, Settings, LogOut, Menu, User as UserIcon, ClipboardList, ChevronLeft, ChevronRight, Calendar, MessageSquare, Clock, ShieldCheck, Sun, Moon, BookOpen, ListTodo, Utensils, Scale } from 'lucide-react';
import { useState, useEffect } from 'react';
import Logo from './Logo';
import { useAuthStore } from '@/store/auth';
import { useThemeStore } from '@/store/theme';

const navItems = [
  { to: '/dashboard', icon: BarChart3, label: 'RESUMEN' },
  { to: '/pacientes', icon: Users, label: 'PACIENTES' },
  { to: '/platillos', icon: Utensils, label: 'PLATILLOS' },
  { to: '/pendientes', icon: ListTodo, label: 'PENDIENTES' },
  { to: '/equivalencias', icon: Scale, label: 'EQUIVALENCIAS' },
  { to: '/configuracion', icon: Settings, label: 'AJUSTES' },
];

const Layout = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const { user, logout } = useAuthStore();
  const { theme, setTheme } = useThemeStore();
  const navigate = useNavigate();
  const location = useLocation();

  // Auto-colapsar sidebar al navegar
  useEffect(() => {
    setCollapsed(true);
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const userName = user?.nombre || 'Especialista';
  const isAdmin = user?.rol === 'admin' || (user as any)?.role === 'admin';
  const roleLabel = isAdmin ? 'Administrador' : (user?.rol === 'practicante' ? 'Practicante' : 'Nutriólogo');

  // Filtrar items según permisos
  const filteredNavItems = navItems.filter(item => {
    if (isAdmin) return true;
    if (!user?.permisos) return true; // Si no hay permisos definidos, ver todo (fallback)
    
    // Mapeo simple de rutas a llaves de permisos
    const path = item.to.replace('/', '');
    if (path === 'dashboard') return user.permisos?.dashboard?.read !== false;
    if (path === 'pacientes') return user.permisos?.pacientes?.read !== false;
    if (path === 'planes') return user.permisos?.planes?.read !== false;
    if (path === 'platillos') return user.permisos?.planes?.read !== false;
    if (path === 'pendientes') return user.permisos?.planes?.read !== false;
    if (path === 'equivalencias') return user.permisos?.smae?.read !== false;
    if (path === 'configuracion') return true; // Ajustes siempre visible para perfil
    return true;
  });

  const renderSidebarContent = (isMobileView: boolean) => {
    const isCollapsed = isMobileView ? false : collapsed;
    return (
      <div className={`flex flex-col h-full bg-bg-surface border-r border-border-subtle transition-all duration-300 ${isCollapsed ? 'w-24' : 'w-full'} shadow-none relative`}>
        <div className={`pt-8 pb-4 flex ${isCollapsed ? 'flex-col justify-center items-center gap-6 px-0' : 'justify-start px-6 pl-8'} transition-all`}>
          <Logo size="sm" collapsed={isCollapsed} />
        </div>

        <nav className={`flex-1 px-4 space-y-1 mt-6 overflow-y-auto custom-scrollbar ${isCollapsed ? 'flex flex-col items-center' : ''}`}>
          {!isCollapsed && <p className="text-[11px] font-medium text-text-muted uppercase mb-4 px-4 pt-4">Navegación</p>}
          {filteredNavItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setMobileOpen(false)}
              title={isCollapsed ? item.label : ''}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-[10px] rounded-[8px] text-[14px] font-medium transition-colors whitespace-nowrap ${
                  isActive
                    ? 'bg-nav-active-bg text-nav-active-text border-l-2 border-[#444]'
                    : 'text-nav-inactive-text hover:text-text-primary hover:bg-nav-active-bg'
                } ${isCollapsed ? 'justify-center w-12 border-l-0 px-0' : ''}`
              }
            >
              <item.icon className="h-[18px] w-[18px] shrink-0" />
              {!isCollapsed && item.label}
            </NavLink>
          ))}

          {isAdmin && (
            <div className={`pt-6 mt-6 ${isCollapsed ? 'px-0' : ''}`}>
              {!isCollapsed && <p className="text-[11px] font-medium text-text-muted uppercase mb-4 px-4">Accesos Directos</p>}
              <div className="space-y-1">
                {[
                  { label: isCollapsed ? '' : 'Calendario', icon: Calendar, color: 'text-text-secondary', title: 'Google Calendar' },
                  { label: isCollapsed ? '' : 'Chatwoot', icon: MessageSquare, color: 'text-text-secondary', title: 'Chatwoot Hub' }
                ].map((ext) => (
                  <button
                    key={ext.title}
                    title={ext.title}
                    className={`flex items-center gap-3 px-4 py-[10px] rounded-[8px] text-[14px] font-medium text-nav-inactive-text hover:text-text-primary hover:bg-nav-active-bg transition-colors w-full text-left ${isCollapsed ? 'justify-center w-12 px-0 mx-auto' : ''}`}
                  >
                    <ext.icon className={`h-[18px] w-[18px] shrink-0 ${ext.color}`} />
                    {!isCollapsed && ext.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </nav>

        <div className={`px-4 pb-6 mt-auto shrink-0 space-y-2 pt-4 border-t border-border-subtle/50 ${isCollapsed ? 'flex flex-col items-center' : ''}`}>
          <NavLink 
            to="/configuracion"
            className={({ isActive }) => `block w-full rounded-[12px] transition-all group/profile ${isActive ? 'bg-brand-primary/10 border-brand-primary/20' : 'bg-bg-elevated border-border-subtle'} border ${isCollapsed ? 'p-2' : 'px-4 py-3'}`}
          >
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 shrink-0 rounded-full flex items-center justify-center font-bold text-[12px] border transition-colors ${isCollapsed ? 'mx-auto' : ''} ${user?.rol === 'admin' || (user as any)?.role === 'admin' ? 'bg-brand-primary/20 text-brand-primary border-brand-primary/30' : 'bg-[#1a1a1a] text-[#aaa] border-border-default'}`}>
                {userName[0].toUpperCase()}
              </div>
              {!isCollapsed && (
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-bold text-text-primary truncate transition-colors group-hover/profile:text-brand-primary">{userName}</p>
                  <p className="text-[10px] font-black uppercase tracking-tighter text-text-muted mt-0.5 leading-none">{roleLabel}</p>
                </div>
              )}
            </div>
          </NavLink>
          <button
            onClick={handleLogout}
            title={isCollapsed ? 'SALIR' : ''}
            className={`flex items-center gap-3 px-4 py-[10px] rounded-[8px] text-[14px] font-medium text-nav-inactive-text hover:text-accent-red hover:bg-[#1a1a1a] transition-colors w-full ${isCollapsed ? 'justify-center w-12 px-0 mx-auto' : ''}`}
          >
            <LogOut className="h-[18px] w-[18px] shrink-0" />
            {!isCollapsed && 'Cerrar Sesión'}
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-screen bg-bg-base overflow-hidden font-sans selection:bg-brand-primary selection:text-bg-base">
      {/* SIDEBAR PC */}
      <aside className={`relative hidden lg:flex h-full flex-col flex-shrink-0 z-40 bg-bg-surface transition-all duration-300 ${collapsed ? 'w-24' : 'w-64'}`}>
        {renderSidebarContent(false)}
        
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
          <aside className="relative w-64 h-full bg-bg-surface shadow-2xl animate-slide-up flex">
            {renderSidebarContent(true)}
          </aside>
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0 h-full">
        {/* MOBILE HEADER */}
        <header className="h-[60px] lg:hidden bg-bg-base border-b border-border-subtle flex items-center justify-between px-4 sticky top-0 z-30 shadow-none">
          <div className="flex items-center">
            <button 
              onClick={() => setMobileOpen(true)} 
              className="p-2 hover:bg-bg-elevated rounded-[8px] transition-colors text-text-secondary -ml-2"
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>
          
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            <img src="/logo-nrdr.svg" alt="NORDER" className="h-[18px] w-auto object-contain mt-0.5" />
          </div>
        </header>

        <main className="flex-1 overflow-y-auto overflow-x-hidden px-4 md:px-8 pb-6 custom-scrollbar scroll-smooth bg-bg-base text-text-primary">
          <div className={`w-full ${location.pathname === '/dashboard' ? 'h-full overflow-hidden' : 'min-h-full pt-6'}`}>
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
