import { afterEach, describe, expect, it, vi } from 'vitest';
import portalApi from './portalApi';
import {
  isCheckoutNotFoundError,
  isLegacyCheckoutApiError,
  requestStripeCheckout,
  resolveCheckoutViewState,
  validateCheckoutStatusResponse,
  type CheckoutStatusResponse,
} from './stripeCheckout';

afterEach(() => {
  vi.restoreAllMocks();
});

const result = (overrides: Partial<CheckoutStatusResponse> = {}): CheckoutStatusResponse => ({
  sessionId: 'cs_123',
  status: 'complete',
  paymentStatus: 'paid',
  nivel: 'premium',
  activated: true,
  continuationUrl: null,
  membership: {
    nivel: 'premium',
    status: 'active',
    validUntil: '2026-08-30T00:00:00.000Z',
  },
  ...overrides,
});

describe('isCheckoutNotFoundError', () => {
  it('solo acepta el 404 explícito del endpoint nuevo', () => {
    expect(isCheckoutNotFoundError({
      response: {
        status: 404,
        data: { code: 'checkout_not_found' },
      },
    })).toBe(true);
  });

  it('no confunde una ruta inexistente de la API anterior con ausencia de pago', () => {
    expect(isCheckoutNotFoundError({
      response: {
        status: 404,
        data: { error: 'Route not found' },
      },
    })).toBe(false);
  });
});

describe('isLegacyCheckoutApiError', () => {
  it('detecta el 404 genérico de una API que todavía no tiene recuperación', () => {
    expect(isLegacyCheckoutApiError({
      response: {
        status: 404,
        data: { error: 'Route not found' },
      },
    })).toBe(true);
  });

  it('no bloquea el 404 explícito que permite crear el primer checkout', () => {
    expect(isLegacyCheckoutApiError({
      response: {
        status: 404,
        data: { code: 'checkout_not_found' },
      },
    })).toBe(false);
  });
});

describe('requestStripeCheckout', () => {
  it('no crea una sesión huérfana contra la API anterior', async () => {
    vi.spyOn(portalApi, 'get').mockRejectedValueOnce({
      response: {
        status: 404,
        data: { error: 'Route not found' },
      },
    });
    const post = vi.spyOn(portalApi, 'post');

    await expect(requestStripeCheckout(
      'premium',
      '12345678-1234-1234-1234-123456789abc',
    )).rejects.toThrow('pendiente de actualización');
    expect(post).not.toHaveBeenCalled();
  });

  it('permite crear el primer Checkout cuando la API nueva confirma que no existe otro', async () => {
    vi.spyOn(portalApi, 'get').mockRejectedValueOnce({
      response: {
        status: 404,
        data: { code: 'checkout_not_found' },
      },
    });
    vi.spyOn(portalApi, 'post').mockResolvedValueOnce({
      data: {
        url: 'https://checkout.stripe.com/c/pay/cs_new',
        sessionId: 'cs_new',
      },
    });

    await expect(requestStripeCheckout(
      'basica',
      '12345678-1234-1234-1234-123456789abc',
    )).resolves.toEqual({
      url: 'https://checkout.stripe.com/c/pay/cs_new',
      sessionId: 'cs_new',
    });
  });
});

describe('resolveCheckoutViewState', () => {
  it('no confirma un pago sin session_id', () => {
    expect(resolveCheckoutViewState({
      sessionId: null,
      isLoading: false,
      isError: false,
    })).toBe('missing');
  });

  it('mantiene estado de revisión mientras consulta Stripe', () => {
    expect(resolveCheckoutViewState({
      sessionId: 'cs_123',
      isLoading: true,
      isError: false,
    })).toBe('checking');
  });

  it('solo muestra confirmado cuando la membresía quedó activada', () => {
    expect(resolveCheckoutViewState({
      sessionId: 'cs_123',
      isLoading: false,
      isError: false,
      result: result(),
    })).toBe('confirmed');
  });

  it('distingue pago recibido de activación todavía en proceso', () => {
    expect(resolveCheckoutViewState({
      sessionId: 'cs_123',
      isLoading: false,
      isError: false,
      result: result({ activated: false }),
    })).toBe('processing');
  });

  it('no presenta una sesión abierta como pagada', () => {
    expect(resolveCheckoutViewState({
      sessionId: 'cs_123',
      isLoading: false,
      isError: false,
      result: result({
        status: 'open',
        paymentStatus: 'unpaid',
        activated: false,
      }),
    })).toBe('not_paid');
  });

  it('muestra error recuperable cuando no hay respuesta del servidor', () => {
    expect(resolveCheckoutViewState({
      sessionId: 'cs_123',
      isLoading: false,
      isError: true,
    })).toBe('error');
  });
});

describe('validateCheckoutStatusResponse', () => {
  it('rechaza HTML o respuestas ajenas a Stripe', () => {
    expect(() => validateCheckoutStatusResponse('<html>login</html>', 'cs_123')).toThrow(
      'estado de Stripe válido',
    );
    expect(() => validateCheckoutStatusResponse(result({ sessionId: 'cs_other' }), 'cs_123')).toThrow(
      'estado de Stripe válido',
    );
    expect(() => validateCheckoutStatusResponse(
      result({ continuationUrl: 'javascript:alert(1)' }),
      'cs_123',
    )).toThrow('estado de Stripe válido');
  });
});
