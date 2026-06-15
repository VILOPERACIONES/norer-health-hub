import axios from 'axios';
import { usePortalAuthStore } from '@/store/portalAuth';

const isDev = import.meta.env.DEV;
const API_BASE = import.meta.env.VITE_API_URL || (isDev ? '' : 'https://norder-crm-api-production-b70d.up.railway.app');
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
    if (error.response?.status === 401) {
      usePortalAuthStore.getState().clearPortalAuth();
      window.location.href = '/norder-health/login';
    }
    return Promise.reject(error);
  }
);

export default portalApi;
