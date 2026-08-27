import { useState } from 'react';
import { Crown, Zap, Star } from 'lucide-react';
import { requestStripeCheckout, type CheckoutTier } from '@/lib/stripeCheckout';

export function UpgradeButton({ nivel, label, color = 'green' }: { nivel: CheckoutTier; label: string; color?: 'green' | 'blue' | 'ghost' }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activePlan, setActivePlan] = useState<{ message: string; url: string } | null>(null);

  const handleUpgrade = async () => {
    setLoading(true);
    setError(null);
    setActivePlan(null);
    try {
      const session = await requestStripeCheckout(nivel);
      if (session.flow === 'already_active') {
        setActivePlan({
          message: session.message || 'Tu suscripción ya está activa. No se generó otro cobro.',
          url: session.url,
        });
        setLoading(false);
        return;
      }
      window.location.assign(session.url);
    } catch (err: unknown) {
      const requestError = err as {
        response?: { data?: { error?: string } };
        message?: string;
      };
      setError(
        requestError.response?.data?.error
        || requestError.message
        || 'Error al generar el pago. Intenta de nuevo.',
      );
      setLoading(false);
    }
  };

  const base = 'w-full font-bold rounded-[12px] py-3 text-[13px] flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50';
  const styles = {
    green: `${base} bg-[#22c55e] hover:bg-[#16a34a] text-black`,
    blue: `${base} bg-[#3b82f6] hover:bg-[#2563eb] text-white`,
    ghost: `${base} border border-[#1e1e1e] text-[#444] hover:text-[#666]`,
  };

  return (
    <div>
      <button onClick={handleUpgrade} disabled={loading} className={styles[color]}>
        {loading ? <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
          : color === 'green' ? <Crown size={14} strokeWidth={2.5} />
          : color === 'blue' ? <Zap size={14} strokeWidth={2.5} />
          : <Star size={14} strokeWidth={2.5} />}
        {label}
      </button>
      {activePlan && (
        <div className="mt-2 rounded-[10px] border border-[#22c55e]/25 bg-[#0f2e1a] p-2.5 text-center">
          <p className="text-[10.5px] leading-relaxed text-[#86efac]">{activePlan.message}</p>
          <button
            type="button"
            onClick={() => window.location.assign(activePlan.url)}
            className="mt-2 text-[11px] font-bold text-[#22c55e] underline underline-offset-2"
          >
            Continuar al sistema
          </button>
        </div>
      )}
      {error && <p className="text-[10px] text-[#f87171] mt-1.5 text-center">{error}</p>}
    </div>
  );
}
