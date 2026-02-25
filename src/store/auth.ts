import { create } from 'zustand';
import type { AuthState, User } from '@/types';
import Cookies from 'js-cookie';

const getInitialToken = () => Cookies.get('norder_token') || null;

const getInitialUser = (): User | null => {
  try {
    const userStr = Cookies.get('norder_user');
    return userStr ? JSON.parse(userStr) : null;
  } catch {
    return null;
  }
};

export const useAuthStore = create<AuthState>((set) => ({
  token: getInitialToken(),
  user: getInitialUser(),
  apiUrl: import.meta.env.VITE_API_URL || 'http://localhost:3000',
  setAuth: (token, user) => {
    Cookies.set('norder_token', token, { expires: 30 }); // 30 días manteniéndose conectado
    Cookies.set('norder_user', JSON.stringify(user), { expires: 30 });
    set({ token, user });
  },
  updateUser: (newUser) => {
    set((state) => {
      if (state.user) {
        const updated = { ...state.user, ...newUser };
        Cookies.set('norder_user', JSON.stringify(updated), { expires: 30 });
        return { user: updated };
      }
      return state;
    });
  },
  logout: () => {
    Cookies.remove('norder_token');
    Cookies.remove('norder_user');
    set({ token: null, user: null });
  },
  setApiUrl: (apiUrl) => set({ apiUrl }),
}));
