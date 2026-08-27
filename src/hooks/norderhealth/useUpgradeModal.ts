import { create } from 'zustand';
import type { CheckoutTier } from '@/lib/stripeCheckout';

interface UpgradeModalState {
  isOpen: boolean;
  targetTier: CheckoutTier;
  hasNudged: boolean;
  open: (tier?: CheckoutTier) => void;
  close: () => void;
  markNudged: () => void;
}

export const useUpgradeModal = create<UpgradeModalState>((set) => ({
  isOpen: false,
  targetTier: 'premium',
  hasNudged: false,
  open: (tier = 'premium') => set({ isOpen: true, targetTier: tier }),
  close: () => set({ isOpen: false }),
  markNudged: () => set({ hasNudged: true }),
}));
