import axios from 'axios';
import { usePortalAuthStore } from '@/store/portalAuth';
import { shouldClearSessionOnUnauthorized } from '@/lib/unauthorizedHandling';

const isDev = import.meta.env.DEV;
const API_BASE = import.meta.env.VITE_API_URL
  || (isDev ? '' : 'https://norder-crm-api-production-e521.up.railway.app');
console.log('[portalApi] baseURL en uso:', API_BASE || '(proxy local)');

const portalApi = axios.create({
  baseURL: API_BASE,
  timeout: 35_000,
});

portalApi.interceptors.request.use((config) => {
  const { token } = usePortalAuthStore.getState();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

portalApi.interceptors.response.use(
  (res) => res,
  (error) => {
    if (shouldClearSessionOnUnauthorized(error.response?.status, error.config?.url)) {
      usePortalAuthStore.getState().clearPortalAuth();
      window.location.href = '/norder-health/login';
    }
    return Promise.reject(error);
  }
);

export default portalApi;
