import { ChevronRight, Crown, Zap } from 'lucide-react';
import { Drawer, DrawerContent } from '@/components/ui/drawer';
import { UpgradeButton } from './UpgradeButton';
import { useUpgradeModal } from '@/hooks/norderhealth/useUpgradeModal';
import type { Tier } from '@/lib/norderhealth/theme';

const PITCHES: Record<'basica' | 'premium', {
  title: string;
  subtitle: string;
  icon: typeof Crown;
  iconBg: string;
  iconBorder: string;
  iconColor: string;
  bullets: string[];
}> = {
  premium: {
    title: 'Sube a Premium',
    subtitle: 'Plan personalizado · Análisis corporal',
    icon: Crown,
    iconBg: 'bg-[#0f2e1a]',
    iconBorder: 'border-[#22c55e]/20',
    iconColor: 'text-[#22c55e]',
    bullets: [
      'Plan nutricional personalizado visible aquí',
      'El agente responde según tu plan específico',
      'Análisis completo de composición corporal',
    ],
  },
  basica: {
    title: 'Chat ilimitado',
    subtitle: 'Plan Básico · Sin límite diario',
    icon: Zap,
    iconBg: 'bg-[#0f1e35]',
    iconBorder: 'border-[#3b82f6]/20',
    iconColor: 'text-[#60a5fa]',
    bullets: [
      'Chat ilimitado con el agente nutricional',
      'Consultas sobre equivalencias e imágenes',
      'Sin restricción diaria',
    ],
  },
};

function UpgradePitch({ tier, currentTier }: { tier: 'basica' | 'premium'; currentTier: Tier }) {
  const pitch = PITCHES[tier];
  const Icon = pitch.icon;

  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <div className={`w-10 h-10 rounded-[10px] ${pitch.iconBg} border ${pitch.iconBorder} flex items-center justify-center flex-shrink-0`}>
          <Icon size={17} className={pitch.iconColor} strokeWidth={2} />
        </div>
        <div>
          <p className="text-[14px] font-bold text-white leading-none">{pitch.title}</p>
          <p className="text-[11px] text-[#444] mt-1">{pitch.subtitle}</p>
        </div>
      </div>
      <ul className="space-y-2 mb-5">
        {pitch.bullets.map((item) => (
          <li key={item} className="flex items-center gap-2">
            <ChevronRight size={10} className={`${pitch.iconColor} opacity-40 flex-shrink-0`} />
            <span className="text-[12px] text-[#666]">{item}</span>
          </li>
        ))}
      </ul>
      {tier === 'premium' ? (
        <UpgradeButton nivel="premium" label="Subir a Premium" />
      ) : (
        <div className="flex flex-col gap-2">
          <UpgradeButton nivel="basica" label="Activar Plan Básico" color="blue" />
          <UpgradeButton nivel="premium" label="Ver Plan Premium" color="ghost" />
        </div>
      )}
      {currentTier === 'gratis' && tier === 'premium' && (
        <p className="text-[10.5px] text-[#444] text-center mt-3">
          ¿Prefieres empezar más ligero? Activa el Plan Básico primero.
        </p>
      )}
    </div>
  );
}

interface UpgradeModalProps {
  currentTier: Tier;
}

export function UpgradeModal({ currentTier }: UpgradeModalProps) {
  const { isOpen, targetTier, close } = useUpgradeModal();
  const pitchTier: 'basica' | 'premium' = targetTier === 'basica' ? 'basica' : 'premium';

  return (
    <Drawer open={isOpen} onOpenChange={(open) => !open && close()}>
      <DrawerContent className="bg-[#0d0d0d] border-[#1c1c1c] text-white">
        <div className="px-5 pb-8 pt-2">
          <UpgradePitch tier={pitchTier} currentTier={currentTier} />
        </div>
      </DrawerContent>
    </Drawer>
  );
}
