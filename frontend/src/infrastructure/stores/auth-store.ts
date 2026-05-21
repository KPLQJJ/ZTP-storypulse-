import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { UserOut } from '@/core/api/types'

interface AuthState {
  user: UserOut | null
  setUser: (user: UserOut) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,

      setUser: (user) => set({ user }),

      logout: () => set({ user: null }),
    }),
    {
      name: 'storypulse-auth',
      partialize: (state) => ({ user: state.user }),
    },
  ),
)
