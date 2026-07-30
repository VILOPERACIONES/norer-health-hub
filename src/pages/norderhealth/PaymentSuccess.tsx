import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  Home,
  LoaderCircle,
  RefreshCw,
  ShieldCheck,
  WifiOff,
} from 'lucide-react';
import {
  fetchCheckoutStatus,
  resolveCheckoutViewState,
} from '@/lib/stripeCheckout';

const COPY = {
  missing: {
    eyebrow: 'Regreso incompleto',
    title: 'No pudimos identificar el pago',
    body: 'La dirección de regreso no contiene la sesión de Stripe. No vuelvas a pagar si ya recibiste un cargo; regresa al portal y contacta a tu nutriólogo.',
    Icon: AlertCircle,
    color: '#f59e0b',
  },
  checking: {
    eyebrow: 'Verificación segura',
    title: 'Confirmando tu pago',
    body: 'Estamos consultando la sesión directamente con Stripe. Puedes mantener esta pantalla abierta.',
    Icon: LoaderCircle,
    color: '#60a5fa',
  },
  confirmed: {
    eyebrow: 'Pago confirmado',
    title: 'Tu membresía está activa',
    body: 'Stripe confirmó el pago y tu acceso ya quedó actualizado en Norder Health.',
    Icon: CheckCircle2,
    color: '#22c55e',
  },
  processing: {
    eyebrow: 'Pago recibido',
    title: 'Estamos activando tu acceso',
    body: 'Stripe ya confirmó el pago. La activación puede tardar unos segundos; no necesitas volver a pagar.',
    Icon: Clock3,
    color: '#60a5fa',
  },
  not_paid: {
    eyebrow: 'Pago pendiente',
    title: 'El pago no está confirmado',
    body: 'La sesión no aparece pagada en Stripe. Puedes volver al portal e iniciar un nuevo intento cuando estés listo.',
    Icon: AlertCircle,
    color: '#f59e0b',
  },
  error: {
    eyebrow: 'Sin conexión de confirmación',
    title: 'No pudimos verificarlo todavía',
    body: 'Tu pago no se pierde por cerrar esta pantalla o quedarte sin internet. Reintenta la verificación cuando recuperes conexión.',
    Icon: WifiOff,
    color: '#f59e0b',
  },
} as const;

export default function PaymentSuccess() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');

  const query = useQuery({
    queryKey: ['stripe-checkout-status', sessionId],
    queryFn: () => fetchCheckoutStatus(sessionId as string),
    enabled: Boolean(sessionId),
    retry: 2,
    retryDelay: attempt => Math.min(1000 * 2 ** attempt, 5000),
    refetchOnReconnect: true,
    refetchOnWindowFocus: true,
    refetchInterval: current => {
      const data = current.state.data;
      return data?.status === 'complete' && !data.activated ? 2500 : false;
    },
  });

  const state = resolveCheckoutViewState({
    sessionId,
    isLoading: query.isPending,
    isError: query.isError,
    result: query.data,
  });
  const copy = COPY[state];
  const StateIcon = copy.Icon;

  useEffect(() => {
    if (state !== 'confirmed') return undefined;
    const timer = window.setTimeout(() => {
      navigate('/norder-health', { replace: true });
    }, 8000);
    return () => window.clearTimeout(timer);
  }, [navigate, state]);

  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-[#0a0a0a] px-6 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-7 flex justify-center">
          <div
            className="flex h-20 w-20 items-center justify-center rounded-[24px] border"
            style={{ background: `${copy.color}12`, borderColor: `${copy.color}35` }}
          >
            <StateIcon
              size={34}
              strokeWidth={2}
              style={{ color: copy.color }}
              className={state === 'checking' ? 'animate-spin' : ''}
            />
          </div>
        </div>

        <p
          className="mb-2 text-center text-[10px] font-bold uppercase tracking-[0.2em]"
          style={{ color: copy.color }}
        >
          {copy.eyebrow}
        </p>
        <h1 className="text-center text-[28px] font-black leading-tight tracking-tight text-white">
          {copy.title}
        </h1>
        <p className="mt-3 text-center text-[13px] leading-relaxed text-[#666]">
          {copy.body}
        </p>

        {query.data?.membership && state === 'confirmed' && (
          <div className="mt-7 rounded-[18px] border border-[#1b3523] bg-[#0d1710] p-4">
            <div className="flex items-center gap-3">
              <ShieldCheck size={18} className="text-[#22c55e]" />
              <div>
                <p className="text-[12px] font-bold capitalize text-white">
                  Plan {query.data.membership.nivel}
                </p>
                <p className="mt-0.5 text-[10px] text-[#56705d]">
                  Acceso verificado directamente con Stripe
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="mt-8 flex flex-col gap-3">
          {['processing', 'error'].includes(state) && (
            <button
              type="button"
              onClick={() => query.refetch()}
              disabled={query.isFetching}
              className="flex w-full items-center justify-center gap-2 rounded-[15px] bg-white py-4 text-[14px] font-bold text-black disabled:opacity-50"
            >
              <RefreshCw size={16} className={query.isFetching ? 'animate-spin' : ''} />
              Revisar nuevamente
            </button>
          )}

          <button
            type="button"
            onClick={() => navigate('/norder-health', { replace: true })}
            className={`flex w-full items-center justify-center gap-2 rounded-[15px] py-4 text-[14px] font-bold ${
              state === 'confirmed'
                ? 'bg-[#22c55e] text-black'
                : 'border border-[#222] bg-[#111] text-[#aaa]'
            }`}
          >
            <Home size={16} />
            Ir al portal
          </button>
        </div>

        {state === 'confirmed' && (
          <p className="mt-4 text-center text-[10px] text-[#333]">
            Regresando automáticamente al portal…
          </p>
        )}
      </div>
    </div>
  );
}
