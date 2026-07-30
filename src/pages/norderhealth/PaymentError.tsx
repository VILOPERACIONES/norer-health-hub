import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, CreditCard, LoaderCircle, RotateCcw, ShieldCheck } from 'lucide-react';
import {
  requestStripeCheckout,
  type CheckoutTier,
} from '@/lib/stripeCheckout';

export default function PaymentError() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const requestedTier = searchParams.get('nivel');
  const nivel: CheckoutTier = requestedTier === 'basica' ? 'basica' : 'premium';
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const retryPayment = async () => {
    setLoading(true);
    setError(null);
    try {
      const session = await requestStripeCheckout(nivel);
      window.location.assign(session.url);
    } catch (requestError: unknown) {
      const checkoutError = requestError as {
        response?: { data?: { error?: string } };
        message?: string;
      };
      setError(
        checkoutError.response?.data?.error
        || checkoutError.message
        || 'No pudimos iniciar un nuevo intento de pago.',
      );
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-[#0a0a0a] px-6 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-7 flex justify-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-[24px] border border-[#3a2a13] bg-[#1b1308]">
            <ArrowLeft size={34} className="text-[#f59e0b]" strokeWidth={2} />
          </div>
        </div>

        <p className="mb-2 text-center text-[10px] font-bold uppercase tracking-[0.2em] text-[#f59e0b]">
          Regresaste de Stripe
        </p>
        <h1 className="text-center text-[28px] font-black leading-tight tracking-tight text-white">
          El proceso quedó sin confirmar
        </h1>
        <p className="mt-3 text-center text-[13px] leading-relaxed text-[#666]">
          Esta pantalla no confirma ni descarta un cobro. Tu acceso solo se actualiza después de recibir la confirmación directa de Stripe.
        </p>

        <div className="mt-7 rounded-[18px] border border-[#1c1c1c] bg-[#101010] p-4">
          <div className="flex items-start gap-3">
            <ShieldCheck size={18} className="mt-0.5 flex-shrink-0 text-[#22c55e]" />
            <p className="text-[11px] leading-relaxed text-[#666]">
              Si viste un cargo o recibiste confirmación de Stripe, no repitas el pago. Vuelve al portal y contacta a tu nutriólogo para revisarlo.
            </p>
          </div>
        </div>

        {error && (
          <div className="mt-4 rounded-[12px] border border-[#4a1f1f] bg-[#1a0d0d] px-4 py-3">
            <p className="text-center text-[11px] leading-relaxed text-[#f87171]">{error}</p>
          </div>
        )}

        <div className="mt-8 flex flex-col gap-3">
          <button
            type="button"
            onClick={retryPayment}
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-[15px] bg-white py-4 text-[14px] font-bold text-black disabled:opacity-50"
          >
            {loading
              ? <LoaderCircle size={16} className="animate-spin" />
              : <CreditCard size={16} />}
            Reintentar Plan {nivel === 'basica' ? 'Básico' : 'Premium'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/norder-health', { replace: true })}
            className="flex w-full items-center justify-center gap-2 rounded-[15px] border border-[#222] bg-[#111] py-4 text-[14px] font-bold text-[#aaa]"
          >
            <RotateCcw size={16} />
            Volver al portal
          </button>
        </div>
      </div>
    </div>
  );
}
