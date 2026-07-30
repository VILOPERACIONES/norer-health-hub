import portalApi from './portalApi';

export type CheckoutTier = 'basica' | 'premium';

export interface CheckoutSessionResponse {
  url: string;
  sessionId?: string;
  flow?: 'checkout' | 'subscription_update' | 'already_active';
  subscriptionId?: string;
  message?: string;
  nivelActual?: CheckoutTier | null;
}

export interface CheckoutStatusResponse {
  sessionId: string;
  status: 'open' | 'complete' | 'expired';
  paymentStatus: 'paid' | 'unpaid' | 'no_payment_required';
  nivel: CheckoutTier | null;
  activated: boolean;
  continuationUrl: string | null;
  membership: {
    nivel: CheckoutTier | 'gratis';
    status: string | null;
    validUntil: string | null;
  } | null;
}

export const validateCheckoutStatusResponse = (
  value: unknown,
  expectedSessionId: string,
): CheckoutStatusResponse => {
  const result = value as CheckoutStatusResponse | null;
  const validStatus = ['open', 'complete', 'expired'].includes(result?.status as string);
  const validPaymentStatus = ['paid', 'unpaid', 'no_payment_required']
    .includes(result?.paymentStatus as string);
  const validContinuationUrl = result?.continuationUrl == null
    || (
      typeof result.continuationUrl === 'string'
      && result.continuationUrl.startsWith('https://')
    );
  if (
    !result
    || result.sessionId !== expectedSessionId
    || !validStatus
    || !validPaymentStatus
    || !validContinuationUrl
  ) {
    throw new Error('El servidor no devolvió un estado de Stripe válido.');
  }
  return result;
};

const ATTEMPT_STORAGE_KEY = 'norder_checkout_attempt';

export const createCheckoutAttemptId = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

export const rememberCheckoutAttempt = (nivel: CheckoutTier, attemptId: string) => {
  try {
    sessionStorage.setItem(ATTEMPT_STORAGE_KEY, JSON.stringify({
      nivel,
      attemptId,
      createdAt: new Date().toISOString(),
    }));
  } catch {
    // Safari/private mode can block storage. Stripe still receives the attempt ID.
  }
};

export const requestStripeCheckout = async (
  nivel: CheckoutTier,
  attemptId = createCheckoutAttemptId(),
): Promise<CheckoutSessionResponse> => {
  await ensureCheckoutApiReady();
  rememberCheckoutAttempt(nivel, attemptId);
  const response = await portalApi.post<CheckoutSessionResponse>('/api/portal/checkout', {
    nivel,
    attemptId,
  });
  if (
    !response.data?.url
    || (
      !response.data.sessionId
      && !['subscription_update', 'already_active'].includes(response.data.flow || '')
    )
  ) {
    throw new Error('Stripe no devolvió una sesión de pago válida.');
  }
  return response.data;
};

export const fetchCheckoutStatus = async (sessionId: string): Promise<CheckoutStatusResponse> => {
  const response = await portalApi.get<CheckoutStatusResponse>(
    `/api/portal/checkout/session/${encodeURIComponent(sessionId)}`,
  );
  return validateCheckoutStatusResponse(response.data, sessionId);
};

export const fetchLatestCheckoutStatus = async (): Promise<CheckoutStatusResponse> => {
  const response = await portalApi.get<CheckoutStatusResponse>('/api/portal/checkout/latest');
  const sessionId = response.data?.sessionId;
  if (!sessionId) {
    throw new Error('El servidor no devolvió una sesión de Stripe válida.');
  }
  return validateCheckoutStatusResponse(response.data, sessionId);
};

export const isCheckoutNotFoundError = (error: unknown): boolean => {
  const requestError = error as {
    response?: {
      status?: number;
      data?: { code?: string };
    };
  };
  return requestError.response?.status === 404
    && requestError.response?.data?.code === 'checkout_not_found';
};

export const isLegacyCheckoutApiError = (error: unknown): boolean => {
  const requestError = error as {
    response?: {
      status?: number;
      data?: { code?: string };
    };
  };
  return requestError.response?.status === 404
    && requestError.response?.data?.code !== 'checkout_not_found';
};

export const ensureCheckoutApiReady = async (): Promise<void> => {
  try {
    await fetchLatestCheckoutStatus();
  } catch (error) {
    if (isCheckoutNotFoundError(error)) return;
    if (isLegacyCheckoutApiError(error)) {
      throw new Error(
        'El servidor de pagos está pendiente de actualización. No se creó un nuevo checkout.',
      );
    }
    throw error;
  }
};

export type CheckoutViewState =
  | 'missing'
  | 'checking'
  | 'confirmed'
  | 'processing'
  | 'not_paid'
  | 'error';

export const resolveCheckoutViewState = ({
  sessionId,
  isLoading,
  isError,
  result,
}: {
  sessionId: string | null;
  isLoading: boolean;
  isError: boolean;
  result?: CheckoutStatusResponse;
}): CheckoutViewState => {
  if (!sessionId) return 'missing';
  if (isLoading && !result) return 'checking';
  if (isError && !result) return 'error';
  if (result?.activated) return 'confirmed';
  if (result?.status === 'complete' && ['paid', 'no_payment_required'].includes(result.paymentStatus)) {
    return 'processing';
  }
  if (result) return 'not_paid';
  return 'checking';
};
