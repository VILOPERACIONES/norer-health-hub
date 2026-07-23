import { useEffect, useState } from 'react';
import { Check, Mail, MessageCircle, Send, X } from 'lucide-react';
import type { PlanDeliveryChannels } from '@/lib/planDelivery';

type PlanDeliveryDialogProps = {
  open: boolean;
  patientName: string;
  email?: string | null;
  phone?: string | null;
  sending?: boolean;
  onCancel: () => void;
  onConfirm: (channels: PlanDeliveryChannels) => void;
};

export function PlanDeliveryDialog({
  open,
  patientName,
  email,
  phone,
  sending = false,
  onCancel,
  onConfirm,
}: PlanDeliveryDialogProps) {
  const emailAvailable = Boolean(email?.trim());
  const whatsappAvailable = Boolean(phone?.trim());
  const [channels, setChannels] = useState<PlanDeliveryChannels>({ email: true, whatsapp: true });

  useEffect(() => {
    if (!open) return;
    setChannels({ email: emailAvailable, whatsapp: whatsappAvailable });
  }, [open, emailAvailable, whatsappAvailable]);

  useEffect(() => {
    if (!open) return;
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !sending) onCancel();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open, sending, onCancel]);

  if (!open) return null;

  const hasSelection = channels.email || channels.whatsapp;
  const toggle = (key: keyof PlanDeliveryChannels) => {
    if (sending) return;
    if (key === 'email' && !emailAvailable) return;
    if (key === 'whatsapp' && !whatsappAvailable) return;
    setChannels(current => ({ ...current, [key]: !current[key] }));
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="plan-delivery-title">
      <button className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={sending ? undefined : onCancel} aria-label="Cerrar" />
      <div className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl border border-[#303030] bg-[#111] shadow-2xl animate-scale-in">
        <div className="h-0.5 bg-brand-primary/70" />
        <div className="p-6">
          <button
            type="button"
            onClick={onCancel}
            disabled={sending}
            className="absolute right-4 top-4 rounded-lg p-1.5 text-[#666] hover:bg-[#1d1d1d] hover:text-white disabled:opacity-40"
            aria-label="Cerrar"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="flex items-start gap-4 pr-8">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-primary/10 text-brand-primary">
              <Send className="h-5 w-5" />
            </div>
            <div>
              <h3 id="plan-delivery-title" className="m-0 text-[16px] font-bold text-white">Enviar plan al paciente</h3>
              <p className="mb-0 mt-1 text-[13px] leading-relaxed text-[#8a8a8a]">
                Selecciona por dónde recibirá el PDF <strong className="text-[#cfcfcf]">{patientName || 'el paciente'}</strong>.
              </p>
            </div>
          </div>

          <div className="mt-5 space-y-3">
            <ChannelToggle
              icon={Mail}
              label="Correo electrónico"
              value={email || 'Sin correo registrado'}
              active={channels.email}
              disabled={!emailAvailable || sending}
              onClick={() => toggle('email')}
            />
            <ChannelToggle
              icon={MessageCircle}
              label="WhatsApp"
              value={phone || 'Sin teléfono registrado'}
              active={channels.whatsapp}
              disabled={!whatsappAvailable || sending}
              onClick={() => toggle('whatsapp')}
            />
          </div>

          {!hasSelection && (
            <p className="mb-0 mt-3 rounded-lg border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-[11px] text-amber-300">
              Selecciona al menos un medio de envío.
            </p>
          )}

          <div className="mt-6 flex gap-3">
            <button
              type="button"
              onClick={onCancel}
              disabled={sending}
              className="flex-1 rounded-xl border border-[#2c2c2c] bg-[#1a1a1a] px-4 py-2.5 text-[13px] font-semibold text-[#999] hover:bg-[#222] hover:text-white disabled:opacity-40"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={() => onConfirm(channels)}
              disabled={!hasSelection || sending}
              className="flex-[1.35] rounded-xl bg-brand-primary px-4 py-2.5 text-[13px] font-bold text-black hover:bg-white disabled:cursor-not-allowed disabled:opacity-40 flex items-center justify-center gap-2"
            >
              {sending ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-black/20 border-t-black" /> : <Send className="h-4 w-4" />}
              {sending ? 'Enviando…' : 'Confirmar envío'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ChannelToggle({ icon: Icon, label, value, active, disabled, onClick }: {
  icon: typeof Mail;
  label: string;
  value: string;
  active: boolean;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={active}
      disabled={disabled}
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-colors ${active ? 'border-brand-primary/50 bg-brand-primary/10' : 'border-[#303030] bg-[#171717]'} disabled:cursor-not-allowed disabled:opacity-45`}
    >
      <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${active ? 'bg-brand-primary text-black' : 'bg-[#242424] text-[#777]'}`}>
        <Icon className="h-4 w-4" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[12px] font-bold text-white">{label}</span>
        <span className="block truncate text-[11px] text-[#777]">{value}</span>
      </span>
      <span className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${active ? 'bg-brand-primary' : 'bg-[#333]'}`}>
        <span className={`absolute top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-white text-black shadow transition-transform ${active ? 'translate-x-[22px]' : 'translate-x-0.5'}`}>
          {active && <Check className="h-3 w-3" />}
        </span>
      </span>
    </button>
  );
}
