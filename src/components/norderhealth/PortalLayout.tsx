import { Outlet, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { getTier } from '@/lib/norderhealth/theme';
import { usePortalMe } from '@/hooks/norderhealth/usePortalMe';
import { PortalBottomNav } from './PortalBottomNav';
import { UpgradeModal } from './UpgradeModal';

export default function PortalLayout() {
  const location = useLocation();
  const hideBottomNav = location.pathname.startsWith('/norder-health/chat');

  const { data: me } = usePortalMe();

  return (
    <div className="flex flex-col h-[100dvh] bg-[#0a0a0a]" data-disable-local-spellcheck="true">
      <div className="flex-shrink-0 flex items-center justify-center h-9 bg-[#0a0a0a] border-b border-[#141414]">
        <img src="/logo-nrdr.svg" alt="NORDER" className="h-[11px] w-auto object-contain opacity-90" />
      </div>
      <main className="flex-1 overflow-hidden relative">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, x: 8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -8 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="h-full"
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>
      {!hideBottomNav && <PortalBottomNav />}
      <UpgradeModal currentTier={getTier(me?.nivelMembresia)} />
    </div>
  );
}
