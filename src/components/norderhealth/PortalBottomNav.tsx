import { Home, MessageCircle, ClipboardList } from 'lucide-react';
import { NavLink } from '@/components/NavLink';
import { getTier, TIER_META } from '@/lib/norderhealth/theme';
import { usePortalMe } from '@/hooks/norderhealth/usePortalMe';

const TABS = [
  { to: '/norder-health', label: 'Inicio', Icon: Home, end: true },
  { to: '/norder-health/plan', label: 'Plan', Icon: ClipboardList, end: false },
  { to: '/norder-health/chat', label: 'Chat', Icon: MessageCircle, end: false },
] as const;

export function PortalBottomNav() {
  const { data: me } = usePortalMe();
  const accent = TIER_META[getTier(me?.nivelMembresia)].accent;

  return (
    <nav
      className="flex-shrink-0 bg-[#0a0a0a] border-t border-[#141414] flex items-stretch"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      {TABS.map(({ to, label, Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className="flex-1 flex flex-col items-center justify-center gap-1 py-2.5 text-[#3a3a3a] transition-colors"
          activeClassName="text-white"
        >
          {({ isActive }: { isActive: boolean }) => (
            <>
              <Icon size={20} strokeWidth={isActive ? 2.3 : 2} color={isActive ? accent : undefined} />
              <span className="text-[10px] font-semibold" style={isActive ? { color: accent } : undefined}>
                {label}
              </span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}
