import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft,
  CheckCircle2,
  CreditCard,
  LoaderCircle,
  RefreshCw,
  RotateCcw,
  ShieldCheck,
} from 'lucide-react';
import {
  fetchLatestCheckoutStatus,
  isCheckoutNotFoundError,
  requestStripeCheckout,
  type CheckoutTier,
} from '@/lib/stripeCheckout';

type RequestError = {
  response?: {
    status?: number;
    data?: { error?: string };
  };
  message?: string;
};

export default function PaymentError() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const requestedTier = searchParams.get('nivel');
  const fallbackTier: CheckoutTier = requestedTier === 'basica' ? 'basica' : 'premium';
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const latestQuery = useQuery({
    queryKey: ['stripe-checkout-latest'],
    queryFn: fetchLatestCheckoutStatus,
    retry: (attempt, error: RequestError) => !isCheckoutNotFoundError(error) && attempt < 2,
    retryDelay: attempt => Math.min(1000 * 2 ** attempt, 5000),
    refetchOnReconnect: true,
    refetchOnWindowFocus: true,
  });

  const checkout = latestQuery.data;
  const notFound = latestQuery.isError && isCheckoutNotFoundError(latestQuery.error);
  const verificationError = latestQuery.isError && !notFound;
  const paid = checkout?.status === 'complete'
    && ['paid', 'no_payment_required'].includes(checkout.paymentStatus);
  const canContinue = checkout?.status === 'open' && Boolean(checkout.continuationUrl);
  const canRecover = checkout?.status === 'expired' && Boolean(checkout.continuationUrl);
  const canCreateNew = notFound
    || (checkout?.status === 'expired' && !checkout.continuationUrl);
  const tier = checkout?.nivel || fallbackTier;

  useEffect(() => {
    if (!checkout || (!paid && !checkout.activated)) return;
    navigate(
      `/norder-health/activado?session_id=${encodeURIComponent(checkout.sessionId)}`,
      { replace: true },
    );
  }, [checkout, navigate, paid]);

  const createNewCheckout = async () => {
    setCreating(true);
    setCreateError(null);
    try {
      const session = await requestStripeCheckout(tier);
      window.location.assign(session.url);
    } catch (requestError: unknown) {
      const checkoutError = requestError as RequestError;
      setCreateError(
        checkoutError.response?.data?.error
        || checkoutError.message
        || 'No pudimos iniciar un nuevo intento de pago.',
      );
      setCreating(false);
    }
  };

  const continueCheckout = () => {
    if (checkout?.continuationUrl) {
      window.location.assign(checkout.continuationUrl);
    }
  };

  const presentation = (() => {
    if (latestQuery.isPending) {
      return {
        eyebrow: 'Verificación segura',
        title: 'Revisando tu último intento',
        body: 'Antes de ofrecer otro pago, estamos consultando directamente con Stripe.',
        Icon: LoaderCircle,
        iconClass: 'animate-spin',
      };
    }
    if (paid || checkout?.activated) {
      return {
        eyebrow: 'Pago detectado',
        title: 'Confirmando tu acceso',
        body: 'Encontramos el pago en Stripe. Te llevaremos a la confirmación de tu membresía.',
        Icon: CheckCircle2,
        iconClass: '',
      };
    }
    if (canContinue) {
      return {
        eyebrow: 'Pago pausado',
        title: 'Puedes continuar donde te quedaste',
        body: 'La sesión sigue abierta en Stripe. No crearemos otro cobro: volverás al mismo checkout.',
        Icon: ArrowLeft,
        iconClass: '',
      };
    }
    if (checkout?.status === 'expired') {
      return {
        eyebrow: 'Sesión vencida',
        title: canRecover ? 'Stripe preparó una recuperación' : 'Puedes iniciar un intento nuevo',
        body: canRecover
          ? 'La sesión anterior ya no puede cobrar. Stripe abrirá una copia segura para que continúes.'
          : 'Stripe confirmó que la sesión anterior expiró y ya no puede procesar un pago.',
        Icon: ArrowLeft,
        iconClass: '',
      };
    }
    if (checkout?.status === 'complete') {
      return {
        eyebrow: 'Confirmación pendiente',
        title: 'El pago todavía se está procesando',
        body: 'No inicies otro pago. Revisaremos nuevamente con Stripe cuando la confirmación esté disponible.',
        Icon: RefreshCw,
        iconClass: '',
      };
    }
    if (notFound) {
      return {
        eyebrow: 'Sin intento reciente',
        title: 'No encontramos un pago pendiente',
        body: 'Puedes iniciar un checkout nuevo para continuar con tu membresía.',
        Icon: CreditCard,
        iconClass: '',
      };
    }
    return {
      eyebrow: 'Sin conexión de confirmación',
      title: 'No pudimos verificar el pago',
      body: 'Por seguridad no iniciaremos otro cobro hasta poder consultar nuevamente con Stripe.',
      Icon: RefreshCw,
      iconClass: '',
    };
  })();

  const StateIcon = presentation.Icon;
  const primaryLoading = creating || latestQuery.isFetching || Boolean(paid);

  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-[#0a0a0a] px-6 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-7 flex justify-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-[24px] border border-[#3a2a13] bg-[#1b1308]">
            <StateIcon
              size={34}
              className={`text-[#f59e0b] ${presentation.iconClass}`}
              strokeWidth={2}
            />
          </div>
        </div>

        <p className="mb-2 text-center text-[10px] font-bold uppercase tracking-[0.2em] text-[#f59e0b]">
          {presentation.eyebrow}
        </p>
        <h1 className="text-center text-[28px] font-black leading-tight tracking-tight text-white">
          {presentation.title}
        </h1>
        <p className="mt-3 text-center text-[13px] leading-relaxed text-[#666]">
          {presentation.body}
        </p>

        <div className="mt-7 rounded-[18px] border border-[#1c1c1c] bg-[#101010] p-4">
          <div className="flex items-start gap-3">
            <ShieldCheck size={18} className="mt-0.5 flex-shrink-0 text-[#22c55e]" />
            <p className="text-[11px] leading-relaxed text-[#666]">
              Norder Health solo activa tu membresía después de confirmar la sesión directamente con Stripe.
            </p>
          </div>
        </div>

        {createError && (
          <div className="mt-4 rounded-[12px] border border-[#4a1f1f] bg-[#1a0d0d] px-4 py-3">
            <p className="text-center text-[11px] leading-relaxed text-[#f87171]">
              {createError}
            </p>
          </div>
        )}

        <div className="mt-8 flex flex-col gap-3">
          {(canContinue || canRecover) && (
            <button
              type="button"
              onClick={continueCheckout}
              className="flex w-full items-center justify-center gap-2 rounded-[15px] bg-white py-4 text-[14px] font-bold text-black"
            >
              <CreditCard size={16} />
              {canRecover ? 'Recuperar pago' : 'Continuar el mismo pago'}
            </button>
          )}

          {canCreateNew && (
            <button
              type="button"
              onClick={createNewCheckout}
              disabled={creating}
              className="flex w-full items-center justify-center gap-2 rounded-[15px] bg-white py-4 text-[14px] font-bold text-black disabled:opacity-50"
            >
              {creating
                ? <LoaderCircle size={16} className="animate-spin" />
                : <CreditCard size={16} />}
              Iniciar Plan {tier === 'basica' ? 'Básico' : 'Premium'}
            </button>
          )}

          {(verificationError || checkout?.status === 'complete') && (
            <button
              type="button"
              onClick={() => latestQuery.refetch()}
              disabled={primaryLoading}
              className="flex w-full items-center justify-center gap-2 rounded-[15px] bg-white py-4 text-[14px] font-bold text-black disabled:opacity-50"
            >
              <RefreshCw size={16} className={latestQuery.isFetching ? 'animate-spin' : ''} />
              Revisar nuevamente
            </button>
          )}

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
