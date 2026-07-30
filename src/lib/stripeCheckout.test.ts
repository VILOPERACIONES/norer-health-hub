import { describe, expect, it } from 'vitest';
import {
  resolveCheckoutViewState,
  validateCheckoutStatusResponse,
  type CheckoutStatusResponse,
} from './stripeCheckout';

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
