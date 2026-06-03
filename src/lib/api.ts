import axios from 'axios';
import { useAuthStore } from '@/store/auth';

// Timeout de 30s — agendar citas en Cal.com toma su tiempo porque envía correos y procesa webhooks internamente.
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
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
      window.location.href = '/login';
      return Promise.reject(error);
    }

    // Retry automático con backoff exponencial.
    // Solo reintentamos errores de red o 5xx (no errores 4xx del cliente).
    const isNetworkError = !error.response;
    const isServerError = error.response?.status >= 500;
    
    // Explicitly don't retry 409 Conflicts or any 4xx.
    const isConflict = error.response?.status === 409;
    
    const shouldRetry = (isNetworkError || isServerError) && !isConflict && !config._retryCount;

    if (shouldRetry) {
      config._retryCount = config._retryCount ?? 0;
      const MAX_RETRIES = 2;

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
