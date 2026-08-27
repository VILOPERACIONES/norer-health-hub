import { Activity, Crown, Zap } from 'lucide-react';

// Paleta fija del portal de pacientes (dark, sin theme switcher).
// Centralizada aquí para que el shell, el modal de upgrade y las páginas
// no reimplementen los mismos hex literales.
export const PORTAL_COLORS = {
  bgBase: '#0a0a0a',
  bgSurface: '#111',
  bgElevated: '#161616',
  borderSubtle: '#1c1c1c',
  borderStrong: '#2a2a2a',
  textPrimary: '#ffffff',
  textMuted: '#444',
  textFaint: '#333',
} as const;

export type Tier = 'gratis' | 'basico' | 'premium';

export function getTier(nivel: string | null | undefined): Tier {
  if (nivel && ['premium', 'norder_health'].includes(nivel)) return 'premium';
  if (nivel === 'basica' || nivel === 'basico') return 'basico';
  return 'gratis';
}

type LucideIcon = React.ComponentType<{ className?: string; size?: number; strokeWidth?: number }>;

interface TierMeta {
  label: string;
  accent: string;
  accentDim: string;
  headerBorder: string;
  badge: string;
  userBubble: string;
  eyderBorder: string;
  Icon: LucideIcon;
}

export const TIER_META: Record<Tier, TierMeta> = {
  gratis: {
    label: 'Gratis',
    accent: '#f59e0b',
    accentDim: '#92400e',
    headerBorder: 'border-[#2a1800]',
    badge: 'bg-[#1c1000] text-[#f59e0b] border-[#f59e0b]/30',
    userBubble: 'bg-[#92400e]',
    eyderBorder: 'border-l-[#f59e0b]/40',
    Icon: Zap,
  },
  basico: {
    label: 'Básico',
    accent: '#60a5fa',
    accentDim: '#1e40af',
    headerBorder: 'border-[#0a1628]',
    badge: 'bg-[#0a1628] text-[#60a5fa] border-[#60a5fa]/30',
    userBubble: 'bg-[#1d4ed8]',
    eyderBorder: 'border-l-[#60a5fa]/40',
    Icon: Activity,
  },
  premium: {
    label: 'Premium',
    accent: '#22c55e',
    accentDim: '#15803d',
    headerBorder: 'border-[#1c1c1c]',
    badge: 'bg-[#0f2e1a] text-[#22c55e] border-[#22c55e]/30',
    userBubble: 'bg-[#15803d]',
    eyderBorder: 'border-l-[#22c55e]/40',
    Icon: Crown,
  },
};
