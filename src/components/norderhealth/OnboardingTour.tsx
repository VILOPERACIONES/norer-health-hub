import { useEffect, useState } from 'react';
import { ChevronRight, X } from 'lucide-react';

export interface OnboardingStep {
  title: string;
  body: string;
}

interface OnboardingTourProps {
  storageKey: string;
  steps: OnboardingStep[];
}

// Tour de bienvenida mostrado una sola vez por dispositivo (localStorage, no
// por paciente — evita depender de un endpoint nuevo solo para esto).
export function OnboardingTour({ storageKey, steps }: OnboardingTourProps) {
  const [open, setOpen] = useState(false);
  const [stepIdx, setStepIdx] = useState(0);

  useEffect(() => {
    try {
      if (!localStorage.getItem(storageKey)) setOpen(true);
    } catch {
      // Storage bloqueado (Safari privado, etc.) — no mostrar el tour, no es crítico.
    }
  }, [storageKey]);

  const dismiss = () => {
    setOpen(false);
    try {
      localStorage.setItem(storageKey, '1');
    } catch {
      // ignorar
    }
  };

  if (!open || steps.length === 0) return null;

  const step = steps[stepIdx];
  const isLast = stepIdx === steps.length - 1;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm px-4 pb-8 animate-in fade-in duration-200">
      <div className="w-full max-w-sm bg-[#141414] border border-[#242424] rounded-[20px] p-6 animate-in slide-in-from-bottom-4 duration-250">
        <div className="flex items-start justify-between mb-4">
          <div className="flex gap-1.5">
            {steps.map((_, i) => (
              <span
                key={i}
                className="h-[3px] rounded-full transition-all"
                style={{ width: i === stepIdx ? '20px' : '6px', backgroundColor: i === stepIdx ? '#22c55e' : '#2a2a2a' }}
              />
            ))}
          </div>
          <button onClick={dismiss} className="text-[#444] hover:text-[#888] transition-colors -mt-1 -mr-1 p-1">
            <X size={16} strokeWidth={2.5} />
          </button>
        </div>

        <h2 className="text-[17px] font-bold text-white leading-tight mb-2">{step.title}</h2>
        <p className="text-[13px] text-[#888] leading-relaxed mb-6">{step.body}</p>

        <button
          onClick={() => (isLast ? dismiss() : setStepIdx((i) => i + 1))}
          className="w-full flex items-center justify-center gap-1.5 bg-[#22c55e] text-black font-bold rounded-[12px] py-3 text-[14px] active:scale-[0.98] transition-transform"
        >
          {isLast ? 'Entendido' : 'Siguiente'}
          {!isLast && <ChevronRight size={15} strokeWidth={2.5} />}
        </button>
      </div>
    </div>
  );
}
