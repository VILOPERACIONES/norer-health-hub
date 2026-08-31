import { describe, expect, it } from 'vitest';
import { shouldRetryApiRequest } from './api';

describe('shouldRetryApiRequest', () => {
  it('no reintenta operaciones que desactivan retry', () => {
    expect(shouldRetryApiRequest({
      config: { skipRetry: true },
      code: 'ECONNABORTED'
    })).toBe(false);
  });

  it('mantiene el retry para un error de red común', () => {
    expect(shouldRetryApiRequest({
      config: {},
      code: 'ERR_NETWORK'
    })).toBe(true);
  });

  it('detiene el retry al alcanzar el máximo', () => {
    expect(shouldRetryApiRequest({
      config: { _retryCount: 2 },
      code: 'ERR_NETWORK'
    })).toBe(false);
  });
});
