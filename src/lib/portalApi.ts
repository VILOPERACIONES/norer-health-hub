import axios from 'axios';
import { usePortalAuthStore } from '@/store/portalAuth';

const portalApi = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
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
