import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User as AppUser } from '@/types'
import { supabase } from '@/lib/supabase'
import type { Session } from '@supabase/supabase-js'

interface AuthState {
  user: AppUser | null
  session: Session | null
  isLoading: boolean
  setSession: (session: Session | null) => void
  setUser: (user: AppUser | null) => void
  signInWithGoogle: () => Promise<void>
  signInAnonymously: () => Promise<void>
  signOut: () => Promise<void>
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      session: null,
      isLoading: true,

      setSession: (session) => set({ session, isLoading: false }),

      setUser: (user) => set({ user }),

      signInWithGoogle: async () => {
        await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: `${window.location.origin}/auth/callback`,
          },
        })
      },

      signInAnonymously: async () => {
        await supabase.auth.signInAnonymously()
      },

      signOut: async () => {
        await supabase.auth.signOut()
        set({ user: null, session: null })
      },
    }),
    {
      name: 'waitgym-auth',
      partialize: (state) => ({ user: state.user }),
    }
  )
)

