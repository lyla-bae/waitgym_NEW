import { supabase } from './supabase'
import type { Equipment } from '@/types'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000'

async function authFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const { data: { session } } = await supabase.auth.getSession()
  const res = await fetch(`${BASE_URL}/api${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(session ? { Authorization: `Bearer ${session.access_token}` } : {}),
      ...options?.headers,
    },
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(text || res.statusText)
  }
  return res.json()
}

export const equipmentApi = {
  list: (params?: { category?: string; search?: string; favorites?: boolean }) => {
    const query = new URLSearchParams()
    if (params?.category && params.category !== '전체') query.set('category', params.category)
    if (params?.search) query.set('search', params.search)
    if (params?.favorites) query.set('favorites', 'true')
    const qs = query.toString()
    return authFetch<Equipment[]>(`/equipment${qs ? `?${qs}` : ''}`)
  },
  detail: (id: number) => authFetch<Equipment>(`/equipment/${id}`),
  toggleFavorite: (id: number) =>
    authFetch<{ isFavorite: boolean }>(`/equipment/${id}/favorite`, { method: 'POST' }),
}
