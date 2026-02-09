import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { UserRole } from '../types';
import { toast } from './toastStore';

interface AuthUser {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: UserRole;
  credits?: number;
  avatar_url?: string;
}

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  setAuth: (user: AuthUser, token: string) => void;
  updateUser: (user: Partial<AuthUser>) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      setAuth: (user, token) => set({ user, token }),
      updateUser: (updates) => set((state) => ({
        user: state.user ? { ...state.user, ...updates } : null
      })),
      logout: () => {
        const currentUser = get().user;
        set({ user: null, token: null });
        if (currentUser) {
          toast.success(`Goodbye, ${currentUser.first_name}!`);
        }
      },
    }),
    {
      name: 'auth-storage',
    }
  )
);

