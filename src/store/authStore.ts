import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  memberLevel: string;
  faithPoints: number;
  language: string;
  onboardingCompleted: boolean;
  image?: string;
}

interface AuthStore {
  user: User | null;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  hasRole: (role: string) => boolean;
  isAdmin: () => boolean;
  isLeader: () => boolean;
  isPastor: () => boolean;
  logout: () => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      isLoading: false,
      setUser: (user) => set({ user }),
      setLoading: (isLoading) => set({ isLoading }),
      hasRole: (role) => {
        const user = get().user;
        if (!user) return false;
        const hierarchy = ['user', 'leader', 'pastor', 'admin'];
        return hierarchy.indexOf(user.role) >= hierarchy.indexOf(role);
      },
      isAdmin: () => get().user?.role === 'admin',
      isLeader: () => {
        const role = get().user?.role;
        return role === 'leader' || role === 'pastor' || role === 'admin';
      },
      isPastor: () => {
        const role = get().user?.role;
        return role === 'pastor' || role === 'admin';
      },
      logout: () => set({ user: null }),
    }),
    { name: 'bff-auth' }
  )
);
