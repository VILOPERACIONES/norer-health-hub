import { useEffect, useRef } from 'react';
import { AlertTriangle, Trash2, CheckCircle, Info, X } from 'lucide-react';

type ConfirmVariant = 'danger' | 'warning' | 'info' | 'success';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: ConfirmVariant;
  onConfirm: () => void;
  onCancel: () => void;
}

const variantConfig: Record<ConfirmVariant, {
  icon: React.ComponentType<any>;
  iconBg: string;
  iconColor: string;
  confirmBg: string;
  confirmHover: string;
  confirmText: string;
  borderAccent: string;
}> = {
  danger: {
    icon: Trash2,
    iconBg: 'bg-red-500/10',
    iconColor: 'text-red-400',
    confirmBg: 'bg-red-600',
    confirmHover: 'hover:bg-red-500',
    confirmText: 'text-white',
    borderAccent: 'border-red-500/20',
  },
  warning: {
    icon: AlertTriangle,
    iconBg: 'bg-amber-500/10',
    iconColor: 'text-amber-400',
    confirmBg: 'bg-amber-600',
    confirmHover: 'hover:bg-amber-500',
    confirmText: 'text-white',
    borderAccent: 'border-amber-500/20',
  },
  success: {
    icon: CheckCircle,
    iconBg: 'bg-emerald-500/10',
    iconColor: 'text-emerald-400',
    confirmBg: 'bg-emerald-600',
    confirmHover: 'hover:bg-emerald-500',
    confirmText: 'text-white',
    borderAccent: 'border-emerald-500/20',
  },
  info: {
    icon: Info,
    iconBg: 'bg-blue-500/10',
    iconColor: 'text-blue-400',
    confirmBg: 'bg-blue-600',
    confirmHover: 'hover:bg-blue-500',
    confirmText: 'text-white',
    borderAccent: 'border-blue-500/20',
  },
};

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  variant = 'danger',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const cfg = variantConfig[variant];
  const Icon = cfg.icon;
  const confirmRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (open) {
      setTimeout(() => confirmRef.current?.focus(), 50);
      const handleKey = (e: KeyboardEvent) => {
        if (e.key === 'Escape') onCancel();
        if (e.key === 'Enter') onConfirm();
      };
      document.addEventListener('keydown', handleKey);
      return () => document.removeEventListener('keydown', handleKey);
    }
  }, [open, onCancel, onConfirm]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[999] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-title"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-fade-in"
        onClick={onCancel}
      />

      {/* Panel */}
      <div className={`relative z-10 w-full max-w-sm bg-[#111] border ${cfg.borderAccent} rounded-2xl shadow-2xl animate-scale-in overflow-hidden`}>
        {/* Top accent bar */}
        <div className={`h-0.5 w-full ${cfg.confirmBg} opacity-60`} />

        <div className="p-6 space-y-5">
          {/* Close */}
          <button
            onClick={onCancel}
            className="absolute top-4 right-4 p-1.5 rounded-lg text-[#555] hover:text-white hover:bg-[#1a1a1a] transition-colors"
            aria-label="Cerrar"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Icon + Title */}
          <div className="flex items-start gap-4">
            <div className={`flex-shrink-0 w-10 h-10 rounded-xl ${cfg.iconBg} flex items-center justify-center`}>
              <Icon className={`w-5 h-5 ${cfg.iconColor}`} />
            </div>
            <div className="pt-0.5">
              <h3 id="confirm-title" className="text-[15px] font-bold text-white m-0 leading-tight">
                {title}
              </h3>
              {description && (
                <p className="text-[13px] text-[#8a8a8a] mt-1.5 leading-relaxed m-0">
                  {description}
                </p>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button
              onClick={onCancel}
              className="flex-1 py-2.5 px-4 rounded-xl bg-[#1a1a1a] hover:bg-[#222] border border-[#2a2a2a] text-[13px] font-semibold text-[#8a8a8a] hover:text-white transition-all"
            >
              {cancelLabel}
            </button>
            <button
              ref={confirmRef}
              onClick={onConfirm}
              className={`flex-1 py-2.5 px-4 rounded-xl ${cfg.confirmBg} ${cfg.confirmHover} ${cfg.confirmText} text-[13px] font-bold transition-all shadow-lg`}
            >
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Hook para usar confirm de forma imperativa ────────────────────────
import { useState, useCallback } from 'react';

interface ConfirmOptions {
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: ConfirmVariant;
}

export function useConfirm() {
  const [dialogProps, setDialogProps] = useState<(ConfirmOptions & { resolve: (v: boolean) => void }) | null>(null);

  const confirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setDialogProps({ ...options, resolve });
    });
  }, []);

  const handleConfirm = () => {
    dialogProps?.resolve(true);
    setDialogProps(null);
  };

  const handleCancel = () => {
    dialogProps?.resolve(false);
    setDialogProps(null);
  };

  const ConfirmDialogComponent = dialogProps ? (
    <ConfirmDialog
      open={true}
      title={dialogProps.title}
      description={dialogProps.description}
      confirmLabel={dialogProps.confirmLabel}
      cancelLabel={dialogProps.cancelLabel}
      variant={dialogProps.variant}
      onConfirm={handleConfirm}
      onCancel={handleCancel}
    />
  ) : null;

  return { confirm, ConfirmDialogComponent };
}
