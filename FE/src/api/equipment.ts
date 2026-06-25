import { authFetch } from '@/lib/api'
import type { Equipment } from '@/types'

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
