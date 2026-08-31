import axios from 'axios';
import { useAuthStore } from '@/store/auth';
import { shouldClearSessionOnUnauthorized } from '@/lib/unauthorizedHandling';

const MAX_RETRIES = 2;

export const shouldRetryApiRequest = (error: any) => {
  const config = error.config as any;
  if (!config || config.skipRetry) return false;

  const isNetworkError = !error.response;
  const isServerError = error.response?.status >= 500;
  const isConflict = error.response?.status === 409;
  const retryCount = config._retryCount ?? 0;

  return (isNetworkError || isServerError) && !isConflict && retryCount < MAX_RETRIES;
};

// Timeout general. Las operaciones lentas pueden proporcionar uno específico.
const api = axios.create({ timeout: 30_000 });

// ── Request interceptor ───────────────────────────────────────────────────────
api.interceptors.request.use((config) => {
  const { token, apiUrl } = useAuthStore.getState();
  config.baseURL = apiUrl;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ── Response interceptor ─────────────────────────────────────────────────────
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const config = error.config as any;

    // Token expirado → logout y redirigir
    if (shouldClearSessionOnUnauthorized(error.response?.status, config?.url)) {
      useAuthStore.getState().logout();
      window.location.href = '/login';
      return Promise.reject(error);
    }

    // Retry automático con backoff exponencial.
    // Solo reintentamos errores de red o 5xx (no errores 4xx del cliente).
    if (shouldRetryApiRequest(error)) {
      config._retryCount = config._retryCount ?? 0;

      if (config._retryCount < MAX_RETRIES) {
        config._retryCount += 1;
        // Backoff: 800ms, 1600ms
        const delay = 800 * Math.pow(2, config._retryCount - 1);
        await new Promise((r) => setTimeout(r, delay));
        return api(config);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
