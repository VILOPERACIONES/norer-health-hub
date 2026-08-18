const LOGIN_ENDPOINTS = [
  '/api/admin/login',
  '/api/auth/login',
  '/api/portal/login',
];

const isLoginRequest = (url?: string) => {
  if (!url) return false;

  const path = url.split(/[?#]/, 1)[0].replace(/\/+$/, '');
  return LOGIN_ENDPOINTS.some((endpoint) => path.endsWith(endpoint));
};

export const shouldClearSessionOnUnauthorized = (status?: number, url?: string) =>
  status === 401 && !isLoginRequest(url);
