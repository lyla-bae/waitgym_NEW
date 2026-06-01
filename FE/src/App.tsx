import { useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/authStore'
import { authFetch } from '@/lib/api'
import type { User } from '@/types'
import AppRouter from '@/router'

export default function App() {
  const { setSession, setUser } = useAuthStore()

  async function syncUser() {
    try {
      const user = await authFetch<User>('/users/me')
      setUser(user)
    } catch {
      setUser(null)
    }
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session) syncUser()
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (session) syncUser()
      else setUser(null)
    })

    return () => subscription.unsubscribe()
  }, [setSession])

  return <AppRouter />
}
