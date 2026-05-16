import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  uid?: string;
  name: string;
  role: 'admin' | 'analyst' | 'user';
  email: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  setLoading: (loading: boolean) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      loading: true,
      setUser: (user) => set({ user, loading: false }),
      setToken: (token) => set({ token }),
      setLoading: (loading) => set({ loading }),
      logout: () => set({ user: null, token: null }),
    }),
    { name: 'unidas-auth' }
  )
);
