import { create } from 'zustand';
import type { AuthState } from '@/types';

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  user: null,
  apiUrl: 'http://localhost:3000',
  setAuth: (token, user) => set({ token, user }),
  logout: () => set({ token: null, user: null }),
  setApiUrl: (apiUrl) => set({ apiUrl }),
}));
