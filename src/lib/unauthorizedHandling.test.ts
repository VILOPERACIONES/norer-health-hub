import { describe, expect, it } from 'vitest';
import { shouldClearSessionOnUnauthorized } from './unauthorizedHandling';

describe('shouldClearSessionOnUnauthorized', () => {
  it.each([
    '/api/admin/login',
    '/api/auth/login',
    '/api/portal/login',
    'https://crmnordermx.cloud/api/admin/login?source=web',
  ])('conserva la pantalla para mostrar credenciales inválidas en %s', (url) => {
    expect(shouldClearSessionOnUnauthorized(401, url)).toBe(false);
  });

  it('cierra una sesión existente cuando otro endpoint devuelve 401', () => {
    expect(shouldClearSessionOnUnauthorized(401, '/api/dashboard')).toBe(true);
  });

  it('no interviene en respuestas que no son 401', () => {
    expect(shouldClearSessionOnUnauthorized(500, '/api/dashboard')).toBe(false);
  });
});
